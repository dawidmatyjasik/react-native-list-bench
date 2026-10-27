// Turns every raw run under bench-results/raw into one row of metrics, then summarises each
// (device, suite, case, list) cell as a median with its spread. Writes:
//
//   results/runs.csv     one row per run, for anyone who wants to recompute anything
//   results/summary.csv  one row per cell: median, p25, p75 and coefficient of variation
//   results/summary.json the same, grouped for the charts
//
//   node scripts/bench/aggregate.ts

import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { isCompleteRun, validMeasures, type Measure, type RunRecord } from "./lib/runs.ts";

type RunRow = {
  device: string;
  suite: string;
  caseId: string;
  scenario: string;
  test: string;
  count: number;
  hints: boolean;
  list: string;
  round: number;
  startedAt: string;
  batteryTempC: number | null;
  thermalStatus: number | null;
  endedThrottled: boolean;
  [metric: string]: string | number | boolean | null;
};

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const RAW = join(ROOT, "bench-results", "raw");
const OUT = join(ROOT, "results");

const POLLING_INTERVAL_MS = 500;
const BLANK_BASELINE_FRAMES = 20;

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : name.endsWith(".json") ? [path] : [];
  });

const mean = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null);

const quantile = (values: number[], q: number) => {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
};

const round = (value: number | null | undefined, digits = 1) => (value === null || value === undefined ? null : Number(value.toFixed(digits)));

const threadCpu = (measure: Measure, prefix: string) =>
  Object.entries(measure.cpu.perName)
    .filter(([name]) => name === prefix || name.startsWith(`${prefix} (`))
    .reduce((sum, [, value]) => sum + value, 0);

const totalCpu = (measure: Measure) => Object.values(measure.cpu.perName).reduce((sum, value) => sum + value, 0);

// Flashlight's own score, as its web report computes it.
const flashlightScore = (measures: Measure[]) => {
  const fps = mean(measures.map(m => m.fps ?? 0)) ?? 0;
  const cpu = mean(measures.map(totalCpu)) ?? 0;
  const cpuScore = Math.min(Math.max(0, -0.31666666666667 * cpu + 116), 100);
  const highCpuMs = measures.reduce(
    (sum, m) => sum + Object.values(m.cpu.perName).filter(value => value > 90).length * POLLING_INTERVAL_MS,
    0,
  );
  const penalty = highCpuMs / (measures.length * POLLING_INTERVAL_MS);
  return Math.max(0, ((cpuScore + (100 * fps) / 60) / 2) * (1 - penalty));
};

const eventsOf = (record: RunRecord, name: string) => record.events.filter(event => event.event === name);

const metricsOf = (record: RunRecord) => {
  const metrics: Record<string, number | null> = {};
  const ready = eventsOf(record, "ready")[0];
  const procStart = eventsOf(record, "procStart")[0];
  const displayed = eventsOf(record, "displayed")[0];

  metrics.firstPaintMs = ready?.ms ?? null;
  if (record.case.kind === "cold" && ready && procStart) {
    metrics.coldTtiMs = ready.t - procStart.t;
    metrics.displayedMs = displayed?.ms ?? null;
  }

  const mounts = eventsOf(record, "mount").flatMap(event => event.ms ?? []);
  if (mounts.length) {
    metrics.mountMedianMs = quantile(mounts, 0.5);
    metrics.mountMaxMs = Math.max(...mounts);
  }

  // Jumps back to row 0 are left out for every list: FlatList never unmounts its first rows, so
  // the app had no way to see that jump land (a bug in the benchmark, fixed after these runs).
  const jumps = eventsOf(record, "jump").filter(event => event.target !== 0);
  if (jumps.length) {
    const landed = jumps.filter(event => !event.timedOut).flatMap(event => event.ms ?? []);
    metrics.jumpMedianMs = landed.length ? quantile(landed, 0.5) : null;
    metrics.jumpMaxMs = landed.length ? Math.max(...landed) : null;
    metrics.jumpTimeouts = jumps.length - landed.length;
  }

  const pages = eventsOf(record, "page");
  if (record.case.mode === "infinite") {
    metrics.pagesLoaded = pages.length;
  }

  if (record.flashlight) {
    const measures = validMeasures(record.flashlight.measures);
    const rams = measures.map(m => m.ram ?? 0);
    metrics.fps = mean(measures.map(m => m.fps ?? 0));
    metrics.fpsMin = Math.min(...measures.map(m => m.fps ?? 0));
    metrics.jsCpu = mean(measures.map(m => threadCpu(m, "mqt_v_js")));
    metrics.jsCpuMax = Math.max(...measures.map(m => threadCpu(m, "mqt_v_js")));
    metrics.uiCpu = mean(measures.map(m => threadCpu(m, "UI Thread")));
    metrics.renderThreadCpu = mean(measures.map(m => threadCpu(m, "RenderThread")));
    metrics.totalCpu = mean(measures.map(totalCpu));
    metrics.ramAvg = mean(rams);
    metrics.ramMax = Math.max(...rams);
    metrics.ramGrowth = rams[rams.length - 1] - rams[0];
    metrics.flashlightScore = flashlightScore(measures);
    metrics.samples = measures.length;
  }

  if (record.gfx) {
    metrics.jankyPct = record.gfx.jankyPercent;
    metrics.frameP50 = record.gfx.p50;
    metrics.frameP90 = record.gfx.p90;
    metrics.frameP99 = record.gfx.p99;
    metrics.frames = record.gfx.totalFrames;
  }

  if (record.blank) {
    // The recording starts a second before the flow, with the list at rest and fully drawn. Whatever
    // background shows then is layout (LegendList's carousel rows leave a 6 dp strip under the
    // cards), not unrendered rows, so only blank area above that baseline counts.
    const series = record.blank.series;
    const baseline = quantile(series.slice(0, BLANK_BASELINE_FRAMES), 0.5) ?? 0;
    const excess = series.map(value => Math.max(0, value - baseline));
    metrics.blankMeanPct = (mean(excess) ?? 0) * 100;
    metrics.blankP95Pct = (quantile(excess, 0.95) ?? 0) * 100;
    metrics.blankMaxPct = Math.max(0, ...excess) * 100;
    metrics.blankFramesOver1Pct = (excess.filter(value => value > 0.01).length / Math.max(1, excess.length)) * 100;
    metrics.blankBaselinePct = baseline * 100;
  }

  return metrics;
};

const allRecords = walk(RAW).map((path): RunRecord => JSON.parse(readFileSync(path, "utf8")));
const records = allRecords.filter(isCompleteRun);

const runs = records.map((record): RunRow => ({
  device: record.device,
  suite: record.suite,
  caseId: record.case.id,
  scenario: record.case.scenario,
  test: record.case.name,
  count: record.case.count,
  hints: record.case.hints,
  list: record.list,
  round: record.round,
  startedAt: record.startedAt,
  batteryTempC: record.deviceState?.batteryTempC ?? null,
  thermalStatus: record.deviceState?.thermalStatus ?? null,
  // Every run starts unthrottled; a long or heavy run can still heat the phone into CPU caps.
  endedThrottled: Boolean(
    record.deviceStateAfter &&
      (record.deviceStateAfter.thermalStatus >= 2 || (record.deviceStateAfter.cpuCaps ?? []).length > 0),
  ),
  ...metricsOf(record),
}));

const METRICS = [...new Set(runs.flatMap(run => Object.keys(run)))].filter(
  key =>
    ![
      "device",
      "suite",
      "caseId",
      "scenario",
      "test",
      "count",
      "hints",
      "list",
      "round",
      "startedAt",
      "batteryTempC",
      "thermalStatus",
      "endedThrottled",
    ].includes(key),
);

const cells = new Map<string, RunRow[]>();
for (const run of runs) {
  const key = [run.device, run.suite, run.caseId, run.list].join("|");
  const cellRuns = cells.get(key) ?? [];
  cells.set(key, cellRuns);
  cellRuns.push(run);
}

const summary = [...cells.values()].map(cellRuns => {
  const [first] = cellRuns;
  const stats: Record<string, { median: number | null; p25: number | null; p75: number | null; cv: number | null; n: number }> = {};
  for (const metric of METRICS) {
    const values = cellRuns.map(run => run[metric]).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    if (values.length === 0) {
      continue;
    }
    const average = mean(values) ?? 0;
    const sd = Math.sqrt(mean(values.map(value => (value - average) ** 2)) ?? 0);
    stats[metric] = {
      median: round(quantile(values, 0.5), 2),
      p25: round(quantile(values, 0.25), 2),
      p75: round(quantile(values, 0.75), 2),
      cv: average ? round(sd / Math.abs(average), 3) : null,
      n: values.length,
    };
  }
  return {
    device: first.device,
    suite: first.suite,
    caseId: first.caseId,
    scenario: first.scenario,
    test: first.test,
    count: first.count,
    hints: first.hints,
    list: first.list,
    runs: cellRuns.length,
    endedThrottled: cellRuns.filter(run => run.endedThrottled).length,
    stats,
  };
});

const toCsv = (rows: Record<string, unknown>[], columns: string[]) =>
  [columns.join(","), ...rows.map(row => columns.map(column => row[column] ?? "").join(","))].join("\n") + "\n";

mkdirSync(OUT, { recursive: true });

const RUN_COLUMNS = [
  "device",
  "suite",
  "caseId",
  "scenario",
  "test",
  "count",
  "hints",
  "list",
  "round",
  "startedAt",
  "batteryTempC",
  "thermalStatus",
  "endedThrottled",
  ...METRICS,
];
writeFileSync(
  join(OUT, "runs.csv"),
  toCsv(
    runs.map(run => Object.fromEntries(Object.entries(run).map(([key, value]) => [key, typeof value === "number" ? round(value, 2) : value]))),
    RUN_COLUMNS,
  ),
);

const summaryRows = summary.map(cell => {
  const { stats, ...rest } = cell;
  const row: Record<string, unknown> = { ...rest };
  for (const [metric, stat] of Object.entries(stats)) {
    row[`${metric}_median`] = stat.median;
    row[`${metric}_p25`] = stat.p25;
    row[`${metric}_p75`] = stat.p75;
    row[`${metric}_cv`] = stat.cv;
  }
  return row;
});
const SUMMARY_COLUMNS = [
  "device",
  "suite",
  "caseId",
  "scenario",
  "test",
  "count",
  "hints",
  "list",
  "runs",
  "endedThrottled",
  ...METRICS.flatMap(metric => ["median", "p25", "p75", "cv"].map(stat => `${metric}_${stat}`)),
];
writeFileSync(join(OUT, "summary.csv"), toCsv(summaryRows, SUMMARY_COLUMNS));
writeFileSync(join(OUT, "summary.json"), JSON.stringify(summary, null, 1));

console.log(
  `${runs.length} runs (${allRecords.length - records.length} incomplete left out) → ${summary.length} cells → results/`,
);
