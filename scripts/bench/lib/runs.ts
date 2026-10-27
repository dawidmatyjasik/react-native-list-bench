import type { BenchEvent, DeviceState, GfxInfo } from "./adb.ts";
import type { BlankResult } from "./blank.ts";
import type { TestCase } from "./cases.ts";

export type Measure = {
  time: number;
  fps?: number;
  ram?: number;
  cpu: { perName: Record<string, number> };
};

export type FlashlightIteration = {
  status: string;
  measures: Measure[];
};

// One file under bench-results/raw, as run.ts writes it.
export type RunRecord = {
  device: string;
  serial: string;
  suite: string;
  case: TestCase;
  list: string;
  round: number;
  startedAt: string;
  deviceState: DeviceState;
  events: BenchEvent[];
  deviceStateAfter: DeviceState;
  durationMs: number;
} & (
  | { blank: BlankResult; flashlight?: undefined; gfx?: undefined }
  | { blank?: undefined; flashlight: FlashlightIteration; gfx: GfxInfo }
);

export type Stat = {
  median: number;
  p25: number;
  p75: number;
  cv: number | null;
  n: number;
};

// One cell of results/summary.json, as aggregate.ts writes it.
export type SummaryCell = {
  device: string;
  suite: string;
  caseId: string;
  scenario: string;
  test: string;
  count: number;
  hints: boolean;
  list: string;
  runs: number;
  endedThrottled: number;
  stats: Record<string, Stat>;
};

// When Flashlight's sampler stalls (seen on the S25 with heavy rows), it catches up with samples
// 0–1 ms apart. CPU over such a sliver reads 100% for every thread, so those samples are dropped.
const MIN_SAMPLE_GAP_MS = 250;

export const validMeasures = (measures: Measure[]): Measure[] =>
  measures.filter((measure, index) => index === 0 || measure.time - measures[index - 1].time >= MIN_SAMPLE_GAP_MS);

// On the low-end emulator `logcat -c` sometimes kept the previous run's "done" marker, so the wait
// for an in-app mode ended at once and the run measured nothing. Those runs have no "done" after
// "ready".
export const isCompleteRun = (record: RunRecord): boolean => {
  if (record.case.kind !== "inapp") {
    return true;
  }
  const ready = record.events.findIndex(event => event.event === "ready");
  return ready >= 0 && record.events.some((event, index) => event.event === "done" && index > ready);
};
