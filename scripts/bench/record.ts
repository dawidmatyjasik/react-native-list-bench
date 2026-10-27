// Records one video per list for a single case, as a demo for the article. Each list starts the same
// way a measured run does (cold app, deep link, first screen, settle), then the screen is recorded
// while the flow plays. Nothing is measured. Videos land in bench-results/videos, one file per list.
//
//   node scripts/bench/record.ts --device s25 --scenario heavy --flow fling-down
//   node scripts/bench/record.ts --device s25 --scenario grid --flow fling-down --lists flatlist,flashlist

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { clearLogcat, deviceNowMs, forceStop, openUrl, sleep, waitForEvent, wakeScreen } from "./lib/adb.ts";
import { startRecording, stopRecording } from "./lib/blank.ts";
import { benchUrl, LISTS } from "./lib/cases.ts";
import { deviceFor } from "./lib/devices.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const VIDEOS = join(ROOT, "bench-results", "videos");

const { values } = parseArgs({
  options: {
    device: { type: "string" },
    scenario: { type: "string", default: "heavy" },
    flow: { type: "string", default: "fling-down" },
    count: { type: "string", default: "10000" },
    lists: { type: "string" },
  },
});

const device = deviceFor(values.device);
const lists = values.lists?.split(",") ?? LISTS;
const testCase = { scenario: values.scenario, count: Number(values.count), mode: "idle", hints: false };

const runFlow = (flow: string) =>
  new Promise<void>((resolve, reject) => {
    const child = spawn("argent", ["e2e", "run", flow, "--device", device.serial], { stdio: "ignore" });
    child.on("exit", code => (code === 0 ? resolve() : reject(new Error(`argent e2e ${flow} exited with ${code}`))));
  });

mkdirSync(VIDEOS, { recursive: true });

for (const list of lists) {
  const videoPath = join(VIDEOS, `${values.scenario}-${values.flow}-${list}.mp4`);
  await wakeScreen(device.serial);
  await forceStop(device.serial);
  await clearLogcat(device.serial);
  const since = await deviceNowMs(device.serial);
  await openUrl(device.serial, benchUrl(testCase, list));
  await waitForEvent(device.serial, "ready", 60_000, since);
  await sleep(2000);
  const recorder = await startRecording(device.serial, { isFullSize: true });
  await runFlow(values.flow);
  await sleep(1000);
  await stopRecording(device.serial, recorder, videoPath);
  await forceStop(device.serial);
  console.log(`wrote ${videoPath}`);
}
