// The commands Flashlight runs around each measured window. Kept in one small CLI so that
// everything before the window (killing the app, landing on the list, letting it settle) and the
// window itself are spelled out in one place.
//
//   node scripts/bench/step.ts prepare --serial X --url 'listbench://bench?...' [--settle 2000]
//   node scripts/bench/step.ts kill    --serial X
//   node scripts/bench/step.ts launch  --serial X --url '...' [--hold 2000]
//   node scripts/bench/step.ts flow    --serial X --flow fling-down
//   node scripts/bench/step.ts wait    --serial X --event done [--timeout 180000]

import { spawn } from "node:child_process";
import { parseArgs } from "node:util";

import {
  clearLogcat,
  deviceNowMs,
  forceStop,
  openUrl,
  resetGfxInfo,
  sleep,
  waitForEvent,
  wakeScreen,
} from "./lib/adb.ts";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    serial: { type: "string" },
    url: { type: "string" },
    flow: { type: "string" },
    event: { type: "string" },
    settle: { type: "string", default: "2000" },
    hold: { type: "string", default: "2000" },
    timeout: { type: "string", default: "180000" },
  },
});

const [command = ""] = positionals;
const serial = values.serial ?? "";

const required = (name: "url" | "flow" | "event"): string => {
  const value = values[name];
  if (value === undefined) {
    throw new Error(`--${name} is required`);
  }
  return value;
};

const runFlow = (flow: string, deviceSerial: string) =>
  new Promise<void>((resolve, reject) => {
    const child = spawn("argent", ["e2e", "run", flow, "--device", deviceSerial], { stdio: "ignore" });
    child.on("exit", code => (code === 0 ? resolve() : reject(new Error(`argent e2e ${flow} exited with ${code}`))));
  });

const commands: Record<string, () => Promise<unknown>> = {
  // Cold app, deep link straight into the list, wait until it reports its first screen, settle.
  prepare: async () => {
    await wakeScreen(serial);
    await forceStop(serial);
    await clearLogcat(serial);
    const since = await deviceNowMs(serial);
    await openUrl(serial, required("url"));
    await waitForEvent(serial, "ready", 60_000, since);
    await sleep(Number(values.settle));
    await resetGfxInfo(serial);
  },
  kill: async () => {
    await wakeScreen(serial);
    await forceStop(serial);
    await clearLogcat(serial);
    await sleep(1000);
  },
  launch: async () => {
    const since = await deviceNowMs(serial);
    await openUrl(serial, required("url"));
    await waitForEvent(serial, "ready", 60_000, since);
    await sleep(Number(values.hold));
  },
  flow: async () => runFlow(required("flow"), serial),
  wait: async () => waitForEvent(serial, required("event"), Number(values.timeout), await deviceNowMs(serial)),
};

if (!serial || !(command in commands)) {
  console.error(`usage: step.ts <${Object.keys(commands).join("|")}> --serial <adb serial> ...`);
  process.exit(2);
}

commands[command]().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  },
);
