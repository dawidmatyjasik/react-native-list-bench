import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// A BENCH line the app logs, plus the procStart and displayed lines from ActivityManager.
type BenchMarker = {
  event: string;
  ms?: number | null;
  target?: number;
  timedOut?: boolean;
  [field: string]: unknown;
};

export type BenchEvent = BenchMarker & { t: number };

export type GfxInfo = Record<keyof typeof GFX_FIELDS, number | null>;

export type DeviceState = {
  batteryLevel: number;
  batteryTempC: number;
  acPowered: boolean;
  usbPowered: boolean;
  thermalStatus: number;
  activeCooling: string[];
  cpuCaps: string[];
};

export const PACKAGE = "com.swmansion.listbench";

export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export const adb = async (serial: string, args: string[], { timeout = 60_000 }: { timeout?: number } = {}): Promise<string> => {
  const { stdout } = await execFileAsync("adb", ["-s", serial, ...args], {
    timeout,
    maxBuffer: 256 * 1024 * 1024,
  });
  return stdout;
};

export const shell = (serial: string, command: string, options?: { timeout?: number }): Promise<string> =>
  adb(serial, ["shell", command], options);

export const forceStop = (serial: string): Promise<string> => shell(serial, `am force-stop ${PACKAGE}`);

export const clearLogcat = (serial: string): Promise<string> => adb(serial, ["logcat", "-c"]);

// Single quotes keep the device shell from treating ? and & in the URL as globs and job control.
export const openUrl = (serial: string, url: string): Promise<string> =>
  shell(serial, `am start -W -a android.intent.action.VIEW -d '${url}' ${PACKAGE}`);

export const resetGfxInfo = (serial: string): Promise<string> => shell(serial, `dumpsys gfxinfo ${PACKAGE} reset`);

const LOG_FILTER = ["-v", "epoch", "-s", "ReactNativeJS:V", "ActivityManager:I", "ActivityTaskManager:I"];

const BENCH_LINE = /^\s*(\d+\.\d+)\s+\d+\s+\d+\s+\w\s+ReactNativeJS:\s+BENCH (\{.*\})\s*$/;
const PROC_START_LINE = new RegExp(`^\\s*(\\d+\\.\\d+).*Start proc \\d+:${PACKAGE.replace(/\./g, "\\.")}/`);
const DISPLAYED_LINE = new RegExp(
  `^\\s*(\\d+\\.\\d+).*Displayed ${PACKAGE.replace(/\./g, "\\.")}/\\S+.*: \\+(?:(\\d+)s)?(\\d+)ms`,
);

export const parseLogLine = (line: string): BenchEvent | null => {
  const bench = BENCH_LINE.exec(line);
  if (bench) {
    try {
      const marker: BenchMarker = JSON.parse(bench[2]);
      return { t: Math.round(Number(bench[1]) * 1000), ...marker };
    } catch {
      return null;
    }
  }
  const proc = PROC_START_LINE.exec(line);
  if (proc) {
    return { t: Math.round(Number(proc[1]) * 1000), event: "procStart" };
  }
  const displayed = DISPLAYED_LINE.exec(line);
  if (displayed) {
    const ms = Number(displayed[2] ?? 0) * 1000 + Number(displayed[3]);
    return { t: Math.round(Number(displayed[1]) * 1000), event: "displayed", ms };
  }
  return null;
};

export const dumpEvents = async (serial: string): Promise<BenchEvent[]> => {
  const output = await adb(serial, ["logcat", "-d", ...LOG_FILTER]);
  return output
    .split("\n")
    .map(parseLogLine)
    .filter(event => event !== null);
};

// One long-lived logcat reader instead of polling: polling would add device load to the very
// window being measured.
export const deviceNowMs = async (serial: string): Promise<number> => Math.round(Number((await shell(serial, "date +%s.%N")).trim()) * 1000);

// `logcat -c` does not always empty the buffer (seen on the API 30 emulator), so a marker from the
// previous run can still be there. Only markers logged at or after sinceMs (device clock) count.
export const waitForEvent = (serial: string, event: string, timeoutMs: number, sinceMs = 0): Promise<BenchEvent> =>
  new Promise((resolve, reject) => {
    const reader = spawn("adb", ["-s", serial, "logcat", ...LOG_FILTER]);
    let buffer = "";
    const timer = setTimeout(() => {
      reader.kill();
      reject(new Error(`Timed out after ${timeoutMs} ms waiting for "${event}" on ${serial}`));
    }, timeoutMs);
    reader.stdout.on("data", (chunk: Buffer) => {
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const parsed = parseLogLine(line);
        if (parsed?.event === event && parsed.t >= sinceMs) {
          clearTimeout(timer);
          reader.kill();
          resolve(parsed);
          return;
        }
      }
    });
  });

const GFX_FIELDS = {
  totalFrames: /Total frames rendered: (\d+)/,
  jankyFrames: /Janky frames: (\d+)/,
  jankyPercent: /Janky frames: \d+ \(([\d.]+)%\)/,
  p50: /50th percentile: (\d+)ms/,
  p90: /90th percentile: (\d+)ms/,
  p95: /95th percentile: (\d+)ms/,
  p99: /99th percentile: (\d+)ms/,
  missedVsync: /Number Missed Vsync: (\d+)/,
  slowUiThread: /Number Slow UI thread: (\d+)/,
  slowBitmapUploads: /Number Slow bitmap uploads: (\d+)/,
  slowDrawCommands: /Number Slow issue draw commands: (\d+)/,
  deadlineMissed: /Number Frame deadline missed: (\d+)/,
};

export const readGfxInfo = async (serial: string): Promise<GfxInfo> => {
  const output = await shell(serial, `dumpsys gfxinfo ${PACKAGE}`);
  // The first block is the app-wide summary; later blocks repeat per window.
  const summary = output.split("Profile data in ms")[0];
  return Object.fromEntries(
    Object.entries(GFX_FIELDS).map(([key, pattern]) => {
      const match = pattern.exec(summary);
      return [key, match ? Number(match[1]) : null];
    }),
  ) as GfxInfo;
};

// Kernel cooling devices that slow the app down when active: CPU frequency caps, paused or
// unplugged cores, GPU and display-rate limits. Android's thermal status alone is not enough:
// on the S25, status 1 is raised by skin temperature while none of these are engaged.
const THROTTLING_DEVICES = /^(cpufreq|pause-cpu|thermal-pause|cpu-hotplug|cpu-cluster|gpu|kgsl|display-fps|ddr)/;

const readActiveCooling = async (serial: string) => {
  const output = await shell(
    serial,
    'for d in /sys/class/thermal/cooling_device*; do echo "$(cat $d/type 2>/dev/null) $(cat $d/cur_state 2>/dev/null)"; done',
  ).catch(() => "");
  return output
    .split("\n")
    .map(line => line.trim().split(" "))
    .filter(([type, state]) => type && THROTTLING_DEVICES.test(type) && Number(state) > 0)
    .map(([type, state]) => `${type}=${state}`);
};

// Samsung caps CPU clocks from user space at thermal status 2 and above, which no cooling device
// shows, so compare every core's current limit with its hardware maximum.
const readCpuCaps = async (serial: string) => {
  const output = await shell(
    serial,
    'for c in /sys/devices/system/cpu/cpu[0-9]*; do echo "$(basename $c) $(cat $c/cpufreq/scaling_max_freq 2>/dev/null) $(cat $c/cpufreq/cpuinfo_max_freq 2>/dev/null)"; done',
  ).catch(() => "");
  return output
    .split("\n")
    .map(line => line.trim().split(" "))
    .filter(([cpu, limit, max]) => cpu && Number(limit) > 0 && Number(limit) < Number(max))
    .map(([cpu, limit, max]) => `${cpu}=${Math.round(Number(limit) / 1000)}/${Math.round(Number(max) / 1000)}MHz`);
};

// Android Studio's screen-sharing agent, which its device mirroring and Argent's physical-device
// driver both use. Left streaming, it can take a whole core. Argent starts a fresh one for each
// flow, so stopping a leftover one before a run is always safe.
export const stopStudioMirroring = async (serial: string): Promise<number> => {
  const output = await shell(serial, "ps -A -o PID,ARGS").catch(() => "");
  const pids = output
    .split("\n")
    .filter(line => line.includes("com.android.tools.screensharing"))
    .map(line => line.trim().split(/\s+/)[0]);
  for (const pid of pids) {
    await shell(serial, `kill ${pid}`).catch(() => {});
  }
  return pids.length;
};

export const readDeviceState = async (serial: string): Promise<DeviceState> => {
  const [battery, thermal, activeCooling, cpuCaps] = await Promise.all([
    shell(serial, "dumpsys battery"),
    shell(serial, "dumpsys thermalservice").catch(() => ""),
    readActiveCooling(serial),
    readCpuCaps(serial),
  ]);
  const field = (text: string, name: string) => {
    const match = new RegExp(`^\\s*${name}: (.+)$`, "m").exec(text);
    return match ? match[1].trim() : null;
  };
  return {
    batteryLevel: Number(field(battery, "level")),
    batteryTempC: Number(field(battery, "temperature")) / 10,
    acPowered: field(battery, "AC powered") === "true",
    usbPowered: field(battery, "USB powered") === "true",
    thermalStatus: Number(/Thermal Status: (\d+)/.exec(thermal)?.[1] ?? 0),
    activeCooling,
    cpuCaps,
  };
};

export const wakeScreen = async (serial: string): Promise<void> => {
  const power = await shell(serial, "dumpsys power");
  if (!/mWakefulness=Awake/.test(power)) {
    await shell(serial, "input keyevent KEYCODE_WAKEUP");
    await sleep(500);
  }
};
