// Runs a benchmark suite on one device, one Flashlight iteration per run, and keeps every run as a
// JSON file under bench-results/raw. Re-running the same command skips runs that already have a
// file, so a suite can be stopped and resumed at any point.
//
//   node scripts/bench/run.ts --device s25 --suite core --rounds 5
//   node scripts/bench/run.ts --device emu-low --suite core --rounds 3 --scenarios tiny,heavy
//   node scripts/bench/run.ts --device s25 --suite smoke --rounds 1 --dry-run
//
// Lists are interleaved: every round walks every case, and the order of the four lists rotates per
// case and per round, so drift over time (heat, charging, background work) lands on all of them.

import { spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import {
  clearLogcat,
  dumpEvents,
  forceStop,
  openUrl,
  readDeviceState,
  readGfxInfo,
  resetGfxInfo,
  sleep,
  stopStudioMirroring,
  waitForEvent,
  wakeScreen,
  PACKAGE,
} from "./lib/adb.ts";
import { analyzeBlank, saveWorstFrame, startRecording, stopRecording } from "./lib/blank.ts";
import { benchUrl, casesFor, LISTS, SUITE_LISTS, type TestCase } from "./lib/cases.ts";
import { deviceFor } from "./lib/devices.ts";
import type { FlashlightIteration, Measure, RunRecord } from "./lib/runs.ts";

type PlanEntry = {
  round: number;
  testCase: TestCase;
  list: string;
};

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const STEP = join(ROOT, "scripts", "bench", "step.ts");

const { values } = parseArgs({
  options: {
    device: { type: "string" },
    suite: { type: "string", default: "core" },
    rounds: { type: "string", default: "5" },
    lists: { type: "string" },
    scenarios: { type: "string" },
    cases: { type: "string" },
    "skip-cases": { type: "string" },
    "max-temp": { type: "string", default: "39" },
    "dry-run": { type: "boolean", default: false },
  },
});

const device = deviceFor(values.device);
const rounds = Number(values.rounds);
const lists = values.lists?.split(",") ?? SUITE_LISTS[values.suite] ?? LISTS;
const scenarioFilter = values.scenarios?.split(",");
const nameFilter = values.cases?.split(",");
const skippedNames = values["skip-cases"]?.split(",") ?? [];
const cases = casesFor(values.suite).filter(
  testCase =>
    (!scenarioFilter || scenarioFilter.includes(testCase.scenario)) &&
    (!nameFilter || nameFilter.includes(testCase.name)) &&
    !skippedNames.includes(testCase.name),
);

const RESULTS = join(ROOT, "bench-results", "raw", device.alias, values.suite);
const TMP = join(ROOT, "bench-results", "tmp", device.alias);
const LOG = join(RESULTS, "run.log");

const rotate = <T>(items: T[], by: number) => items.map((_, i) => items[(i + by) % items.length]);

const outPath = ({ round, testCase, list }: PlanEntry) => join(RESULTS, testCase.id, list, `r${round}.json`);

const log = (message: string) => {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  mkdirSync(RESULTS, { recursive: true });
  appendFileSync(LOG, `${line}\n`);
};

const quote = (value: string) => `'${value.replace(/'/g, "'\\''")}'`;

const step = (...args: string[]) => `node ${quote(STEP)} ${args.join(" ")}`;

type FlashlightRun = {
  before: string;
  test: string;
  resultsPath: string;
  timeoutMs?: number;
};

type FlashlightResults = {
  status: string;
  iterations?: FlashlightIteration[];
};

const runFlashlight = ({ before, test, resultsPath, timeoutMs = 15 * 60_000 }: FlashlightRun) =>
  new Promise<FlashlightIteration>((resolve, reject) => {
    const child = spawn(
      "flashlight",
      [
        "test",
        "--bundleId",
        PACKAGE,
        "--skipRestart",
        "--iterationCount",
        "1",
        "--maxRetries",
        "0",
        "--beforeEachCommand",
        before,
        "--testCommand",
        test,
        "--resultsFilePath",
        resultsPath,
        "--logLevel",
        "error",
      ],
      { env: { ...process.env, ANDROID_SERIAL: device.serial }, stdio: ["ignore", "pipe", "pipe"] },
    );
    let output = "";
    child.stdout.on("data", (chunk: Buffer) => (output += chunk));
    child.stderr.on("data", (chunk: Buffer) => (output += chunk));
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
    child.on("exit", code => {
      clearTimeout(timer);
      if (code !== 0 || !existsSync(resultsPath)) {
        reject(new Error(`flashlight exited with ${code}: ${output.trim()}`));
        return;
      }
      const results: FlashlightResults = JSON.parse(readFileSync(resultsPath, "utf8"));
      const iteration = results.iterations?.[0];
      if (results.status !== "SUCCESS" || iteration?.status !== "SUCCESS") {
        reject(new Error(`flashlight status ${results.status}/${iteration?.status}`));
        return;
      }
      resolve(iteration);
    });
  });

const waitUntilCool = async () => {
  const maxTemp = Number(values["max-temp"]);
  const deadline = Date.now() + 20 * 60_000;
  for (;;) {
    let state;
    try {
      const stopped = await stopStudioMirroring(device.serial);
      if (stopped > 0) {
        log(`stopped a screen-sharing agent left running on the device (${stopped} process)`);
      }
      state = await readDeviceState(device.serial);
    } catch (error) {
      // A dropped USB connection would otherwise fail every remaining run within seconds.
      const message = error instanceof Error ? error.message : String(error);
      log(`device not reachable (${message.split("\n")[0]}), retrying in 15 s`);
      await sleep(15_000);
      continue;
    }
    const isCool =
      !device.isPhysical ||
      (state.thermalStatus <= 1 &&
        state.activeCooling.length === 0 &&
        state.cpuCaps.length === 0 &&
        state.batteryTempC < maxTemp);
    if (isCool || Date.now() > deadline) {
      if (!isCool) {
        log(`still warm after 20 min (${state.batteryTempC}°C, thermal ${state.thermalStatus}), continuing`);
      }
      return state;
    }
    log(
      `cooling down: battery ${state.batteryTempC}°C, thermal status ${state.thermalStatus}, active cooling [${state.activeCooling.join(" ")}], cpu caps [${state.cpuCaps.join(" ")}]`,
    );
    await sleep(30_000);
  }
};

const prepareCommand = (url: string, settleMs: string) => step("prepare", "--serial", device.serial, "--url", quote(url), "--settle", settleMs);

const measure = async (testCase: TestCase, list: string, resultsPath: string) => {
  const url = benchUrl(testCase, list);
  switch (testCase.kind) {
    case "cold":
      return runFlashlight({
        before: step("kill", "--serial", device.serial),
        test: step("launch", "--serial", device.serial, "--url", quote(url), "--hold", "2000"),
        resultsPath,
      });
    case "gesture":
      return runFlashlight({
        before: prepareCommand(url, "2000"),
        test: step("flow", "--serial", device.serial, "--flow", String(testCase.flow)),
        resultsPath,
      });
    case "inapp":
      return runFlashlight({
        before: prepareCommand(url, "500"),
        test: step("wait", "--serial", device.serial, "--event", "done", "--timeout", "240000"),
        resultsPath,
      });
    default:
      throw new Error(`measure() does not handle ${testCase.kind}`);
  }
};

const runFlow = (flow: string) =>
  new Promise<void>((resolve, reject) => {
    const child = spawn("argent", ["e2e", "run", flow, "--device", device.serial], { stdio: "ignore" });
    child.on("exit", code => (code === 0 ? resolve() : reject(new Error(`argent e2e ${flow} exited with ${code}`))));
  });

const recordBlank = async (testCase: TestCase, list: string, videoPath: string) => {
  await wakeScreen(device.serial);
  await forceStop(device.serial);
  await clearLogcat(device.serial);
  await openUrl(device.serial, benchUrl(testCase, list));
  await waitForEvent(device.serial, "ready", 60_000);
  await sleep(2000);
  const recorder = await startRecording(device.serial);
  await runFlow(String(testCase.flow));
  await sleep(500);
  await stopRecording(device.serial, recorder, videoPath);
  return analyzeBlank(videoPath);
};

const measureBlank = async (entry: PlanEntry) => {
  const videoPath = join(TMP, "blank.mp4");
  const blank = await recordBlank(entry.testCase, entry.list, videoPath);
  mkdirSync(dirname(outPath(entry)), { recursive: true });
  await saveWorstFrame(videoPath, blank.worstFrameSeconds, outPath(entry).replace(/\.json$/, ".worst.jpg"));
  rmSync(videoPath, { force: true });
  return { blank };
};

const measureFlashlight = async ({ testCase, list }: PlanEntry) => {
  const resultsPath = join(TMP, "flashlight.json");
  rmSync(resultsPath, { force: true });
  const flashlight = await measure(testCase, list, resultsPath);
  const gfx = await readGfxInfo(device.serial);
  return { flashlight, gfx };
};

const runOne = async (entry: PlanEntry) => {
  const { round, testCase, list } = entry;
  mkdirSync(TMP, { recursive: true });
  const deviceState = await waitUntilCool();
  const startedAt = new Date().toISOString();
  const started = Date.now();
  // One literal, evaluated in order, so the JSON keys stay in the order earlier runs were saved in.
  const record: RunRecord = {
    device: device.alias,
    serial: device.serial,
    suite: values.suite,
    case: testCase,
    list,
    round,
    startedAt,
    deviceState,
    ...(testCase.kind === "blank" ? await measureBlank(entry) : await measureFlashlight(entry)),
    events: await dumpEvents(device.serial),
    deviceStateAfter: await readDeviceState(device.serial),
    durationMs: Date.now() - started,
  };
  await forceStop(device.serial);
  await resetGfxInfo(device.serial).catch(() => {});
  return record;
};

const summary = (record: RunRecord) => {
  if (record.blank) {
    return `blank mean ${record.blank.meanPct}% p95 ${record.blank.p95Pct}%`;
  }
  const measures = record.flashlight.measures;
  const average = (pick: (measure: Measure) => number) => Math.round(measures.reduce((sum, m) => sum + pick(m), 0) / measures.length);
  const ready = record.events.find(event => event.event === "ready");
  return [
    `fps ${average(m => m.fps ?? 0)}`,
    `js ${average(m => m.cpu.perName.mqt_v_js ?? 0)}%`,
    `ui ${average(m => m.cpu.perName["UI Thread"] ?? 0)}%`,
    `ram ${average(m => m.ram ?? 0)}MB`,
    `jank ${record.gfx?.jankyPercent ?? "?"}%`,
    ready ? `ready ${ready.ms}ms` : null,
  ]
    .filter(Boolean)
    .join("  ");
};

const plan: PlanEntry[] = [];
for (let round = 1; round <= rounds; round++) {
  cases.forEach((testCase, caseIndex) => {
    rotate(lists, round - 1 + caseIndex).forEach(list => plan.push({ round, testCase, list }));
  });
}
const pending = plan.filter(entry => !existsSync(outPath(entry)));

log(
  `${device.label} (${device.serial}) · suite ${values.suite} · ${cases.length} cases × ${lists.length} lists × ${rounds} rounds = ${plan.length} runs, ${pending.length} pending`,
);

if (values["dry-run"]) {
  pending.slice(0, 20).forEach(entry => console.log(`  r${entry.round} ${entry.testCase.id} ${entry.list}`));
  process.exit(0);
}

let finished = 0;
let failed = 0;
const startedAt = Date.now();
for (const entry of pending) {
  const label = `r${entry.round} ${entry.testCase.id} ${entry.list}`;
  try {
    const record = await runOne(entry);
    mkdirSync(dirname(outPath(entry)), { recursive: true });
    writeFileSync(outPath(entry), JSON.stringify(record));
    finished += 1;
    const perRun = (Date.now() - startedAt) / (finished + failed);
    const etaMin = Math.round((perRun * (pending.length - finished - failed)) / 60_000);
    log(`[${finished + failed}/${pending.length}] ${label}  ${(record.durationMs / 1000).toFixed(1)}s  ${summary(record)}  · ETA ${etaMin} min`);
  } catch (error) {
    failed += 1;
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : String(error);
    log(`[${finished + failed}/${pending.length}] ${label}  FAILED: ${message.slice(0, 200)}`);
    mkdirSync(dirname(outPath(entry)), { recursive: true });
    writeFileSync(outPath(entry).replace(/\.json$/, ".failed.txt"), `${new Date().toISOString()}\n${stack}\n`);
    await forceStop(device.serial).catch(() => {});
  }
}

log(`done: ${finished} measured, ${failed} failed`);
