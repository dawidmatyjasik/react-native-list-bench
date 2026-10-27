// Follows the app's Java heap, native heap and live Android View count while a bench screen runs,
// to see where memory goes in the cases that crash. Not part of the timed suites: dumpsys itself
// costs CPU, so these numbers are for comparison between lists, not for performance.
//
//   node scripts/bench/heap-probe.ts --device emu-high --list flashlist --scenario shelves --mode jump --seconds 40
//   node scripts/bench/heap-probe.ts --device s25 --list flashlist --scenario heavy --flow long-down

import { spawn } from "node:child_process";
import { parseArgs } from "node:util";

import { forceStop, openUrl, PACKAGE, shell, sleep, waitForEvent } from "./lib/adb.ts";
import { benchUrl } from "./lib/cases.ts";
import { deviceFor } from "./lib/devices.ts";

const { values } = parseArgs({
  options: {
    device: { type: "string" },
    list: { type: "string" },
    scenario: { type: "string" },
    mode: { type: "string", default: "idle" },
    flow: { type: "string" },
    count: { type: "string", default: "10000" },
    seconds: { type: "string", default: "40" },
  },
});

const device = deviceFor(values.device);
const { list, scenario } = values;
if (list === undefined || scenario === undefined) {
  throw new Error("--list and --scenario are required");
}

const FIELDS = {
  javaHeapKb: /Java Heap:\s+(\d+)/,
  nativeHeapKb: /Native Heap:\s+(\d+)/,
  graphicsKb: /Graphics:\s+(\d+)/,
  totalPssKb: /TOTAL PSS:\s+(\d+)/,
  views: /Views:\s+(\d+)/,
};

const sample = async () => {
  const output = await shell(device.serial, `dumpsys meminfo ${PACKAGE}`).catch(() => "");
  return Object.fromEntries(Object.entries(FIELDS).map(([key, pattern]) => [key, Number(pattern.exec(output)?.[1] ?? NaN)]));
};

const isAlive = async () => (await shell(device.serial, `pidof ${PACKAGE}`).catch(() => "")).trim() !== "";

const testCase = { scenario, count: Number(values.count), mode: values.mode, hints: false };

await forceStop(device.serial);
await openUrl(device.serial, benchUrl(testCase, list));
await waitForEvent(device.serial, "ready", 60_000);

const driver = values.flow
  ? spawn("argent", ["e2e", "run", values.flow, "--device", device.serial], { stdio: "ignore" })
  : null;

const startedAt = Date.now();
console.log("s\tjavaMB\tnativeMB\tgraphicsMB\tpssMB\tviews");
while (Date.now() - startedAt < Number(values.seconds) * 1000) {
  if (!(await isAlive())) {
    console.log(`${((Date.now() - startedAt) / 1000).toFixed(0)}\tprocess died`);
    break;
  }
  const s = await sample();
  const mb = (kb: number) => (Number.isFinite(kb) ? (kb / 1024).toFixed(0) : "?");
  console.log(
    [((Date.now() - startedAt) / 1000).toFixed(0), mb(s.javaHeapKb), mb(s.nativeHeapKb), mb(s.graphicsKb), mb(s.totalPssKb), s.views].join("\t"),
  );
  await sleep(2000);
}

driver?.kill();
await forceStop(device.serial);
