// Prints the article's tables from results/summary.json: one Markdown table per question,
// scenarios down, lists across, median with the p25–p75 spread.
//
//   node scripts/bench/report.ts              # S25
//   node scripts/bench/report.ts emu-low

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { SummaryCell } from "./lib/runs.ts";

type Table = {
  title: string;
  test: string;
  metric: string;
  count?: number;
  suite?: string;
  hints?: boolean;
};

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const summary: SummaryCell[] = JSON.parse(readFileSync(join(ROOT, "results", "summary.json"), "utf8"));
const device = process.argv[2] ?? "s25";

const LISTS = [
  ["flatlist", "FlatList"],
  ["flashlist", "FlashList"],
  ["legend", "LegendList"],
  ["legend-recycle", "LegendList ♻︎"],
];
const SCENARIOS = ["tiny", "medium", "heavy", "variable", "mixed", "grid", "shelves", "chat"];

const TABLES: Table[] = [
  { title: "Cold start to first full screen (ms)", test: "cold", metric: "coldTtiMs" },
  { title: "List mount to first full screen, in JS (ms)", test: "cold", metric: "firstPaintMs" },
  { title: "Warm remount (ms)", test: "mount", metric: "mountMedianMs" },
  { title: "Fling: janky frames (%)", test: "fling", metric: "jankyPct" },
  { title: "Fling: JS thread CPU (%)", test: "fling", metric: "jsCpu" },
  { title: "Fling: UI thread CPU (%)", test: "fling", metric: "uiCpu" },
  { title: "Fling: RenderThread CPU (%)", test: "fling", metric: "renderThreadCpu" },
  { title: "Fling: peak memory (MB)", test: "fling", metric: "ramMax" },
  { title: "70 s session: janky frames (%)", test: "long", metric: "jankyPct" },
  { title: "70 s session: JS thread CPU (%)", test: "long", metric: "jsCpu" },
  { title: "70 s session: peak memory (MB)", test: "long", metric: "ramMax" },
  { title: "scrollToIndex, landed jumps (ms)", test: "jump", metric: "jumpMedianMs" },
  { title: "scrollToIndex, far jumps that missed 5 s (of 4)", test: "jump", metric: "jumpTimeouts" },
  { title: "Live updates: JS thread CPU (%)", test: "ticker", metric: "jsCpu" },
  { title: "Live updates: janky frames (%)", test: "ticker", metric: "jankyPct" },
  { title: "Chat stream: janky frames (%)", test: "stream", metric: "jankyPct" },
  { title: "Infinite feed: peak memory (MB)", test: "infinite", metric: "ramMax", count: 50 },
  { title: "Infinite feed: janky frames (%)", test: "infinite", metric: "jankyPct", count: 50 },
  { title: "Unrendered area while flinging (%)", test: "blank", metric: "blankMeanPct" },
];

const cell = (scenario: string, list: string, { test, count = 10000, suite = "core", hints = false }: Table) =>
  summary.find(
    entry =>
      entry.device === device &&
      entry.suite === suite &&
      entry.test === test &&
      entry.scenario === scenario &&
      entry.count === count &&
      entry.hints === hints &&
      entry.list === list,
  );

const format = (entry: SummaryCell | undefined, metric: string) => {
  const stat = entry?.stats[metric];
  if (!stat) {
    return "–";
  }
  const digits = Math.abs(stat.median) >= 100 ? 0 : 1;
  const spread = stat.n > 1 ? ` (${stat.p25.toFixed(digits)}–${stat.p75.toFixed(digits)})` : "";
  const throttled = entry.endedThrottled ? ` ¹${entry.endedThrottled}/${entry.runs}` : "";
  return `${stat.median.toFixed(digits)}${spread}${throttled}`;
};

for (const table of TABLES) {
  const rows = SCENARIOS.map(scenario => [scenario, ...LISTS.map(([list]) => format(cell(scenario, list, table), table.metric))]).filter(
    row => row.slice(1).some(value => value !== "–"),
  );
  if (rows.length === 0) {
    continue;
  }
  console.log(`\n### ${table.title}\n`);
  console.log(`| Scenario | ${LISTS.map(([, label]) => label).join(" | ")} |`);
  console.log(`| --- | ${LISTS.map(() => "---").join(" | ")} |`);
  rows.forEach(row => console.log(`| ${row.join(" | ")} |`));
}
console.log("\n¹ runs that ended with the CPU capped or at thermal status ≥ 2, out of all runs in the cell");
