// Draws the article's charts from results/summary.json as static SVG dot plots: one row per
// scenario, one dot per list at the median, a line from p25 to p75 so the spread is visible.
//
//   node scripts/bench/charts.ts            # every chart in CHARTS
//   node scripts/bench/charts.ts cold-tti   # one chart

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { SummaryCell } from "./lib/runs.ts";

type ListStyle = {
  id: string;
  label: string;
  color: string;
};

type Cell = {
  list: ListStyle;
  median: number;
  p25: number;
  p75: number;
  n: number;
  reason?: string;
};

type Row = {
  label: string;
  cells: Cell[];
};

type Chart = {
  id: string;
  test: string;
  metric: string;
  unit: string;
  title: string;
  note: string;
  log?: boolean;
  missedMetric?: string;
};

type DotPlot = {
  title: string;
  note: string;
  unit: string;
  device: string;
  rows: Row[];
  lists: ListStyle[];
  log?: boolean;
};

type RowsQuery = {
  device: string;
  suite?: string;
  test: string;
  metric: string;
  missedMetric?: string;
  count?: number;
  hints?: boolean;
  lists?: ListStyle[];
  scenarios?: string[];
};

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "article", "charts");

// Validated with the dataviz palette checker (lightness, chroma, CVD, contrast on white): a
// Software Mansion flavoured set — navy, blue, purple, red, green.
const LISTS: ListStyle[] = [
  { id: "flatlist", label: "FlatList", color: "#3A4FA0" },
  { id: "flashlist", label: "FlashList", color: "#2E9BCB" },
  { id: "legend", label: "LegendList", color: "#8A44F0" },
  { id: "legend-recycle", label: "LegendList ♻︎", color: "#F2554C" },
  { id: "flatlist-tuned", label: "FlatList tuned", color: "#3FA383" },
];

const SCENARIO_LABELS: Record<string, string> = {
  tiny: "Tiny text rows",
  medium: "Photo rows",
  heavy: "Heavy feed cards",
  variable: "Variable height",
  mixed: "Mixed item types",
  grid: "Photo grid",
  shelves: "Nested carousels",
  chat: "Chat",
};

const DEVICE_LABELS: Record<string, string> = {
  s25: "Galaxy S25",
  "emu-high": "Pixel 9 Pro emulator",
  "emu-low": "Low-end emulator",
};

const INK = "#1b1b1f";
const INK_MUTED = "#5d5d66";
const GRID = "#e4e4ea";
const SURFACE = "#ffffff";

export const CHARTS: Chart[] = [
  { id: "cold-tti", test: "cold", metric: "coldTtiMs", unit: "ms", title: "Cold start to first full screen", note: "process start → rows covering the viewport are laid out" },
  { id: "first-paint", test: "cold", metric: "firstPaintMs", unit: "ms", title: "List mount to first full screen", note: "measured in JS, from the list's first render" },
  { id: "mount", test: "mount", metric: "mountMedianMs", unit: "ms", title: "Warm remount of the list screen", note: "median of 10 remounts per run" },
  { id: "fling-js", test: "fling", metric: "jsCpu", unit: "%", title: "JS thread CPU while flinging", note: "15 fast flicks, average of the window" },
  { id: "fling-ui", test: "fling", metric: "uiCpu", unit: "%", title: "UI thread CPU while flinging", note: "15 fast flicks, average of the window" },
  { id: "fling-jank", test: "fling", metric: "jankyPct", unit: "%", title: "Janky frames while flinging", note: "Android gfxinfo, frames that missed the display deadline" },
  { id: "fling-render", test: "fling", metric: "renderThreadCpu", unit: "%", title: "RenderThread CPU while flinging", note: "15 fast flicks, average of the window" },
  { id: "scroll-jank", test: "scroll", metric: "jankyPct", unit: "%", title: "Janky frames at reading speed", note: "20 momentum-free swipes" },
  { id: "updown-js", test: "updown", metric: "jsCpu", unit: "%", title: "JS thread CPU scrolling down and back up", note: "15 flicks down, 15 back over the same rows" },
  { id: "long-ram", test: "long", metric: "ramMax", unit: "MB", title: "Peak memory in a 70-second session", note: "120 flicks" },
  { id: "long-ram-growth", test: "long", metric: "ramGrowth", unit: "MB", title: "Memory growth over a 70-second session", note: "last sample minus first" },
  { id: "long-js", test: "long", metric: "jsCpu", unit: "%", title: "JS thread CPU over a 70-second session", note: "120 flicks" },
  { id: "jump", test: "jump", metric: "jumpMedianMs", unit: "ms", title: "scrollToIndex to a far row", note: "four far jumps, rows 2,500 to 9,999", log: true, missedMetric: "jumpTimeouts" },
  { id: "ticker-js", test: "ticker", metric: "jsCpu", unit: "%", title: "JS thread CPU with live updates", note: "one visible row changes every 100 ms" },
  { id: "blank", test: "blank", metric: "blankMeanPct", unit: "%", title: "Unrendered area while flinging", note: "share of list pixels still showing the background" },
];

const readSummary = (): SummaryCell[] => JSON.parse(readFileSync(join(ROOT, "results", "summary.json"), "utf8"));

const escapeXml = (text: string) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const niceStep = (range: number) => {
  const rough = range / 5;
  const power = 10 ** Math.floor(Math.log10(rough));
  return [1, 2, 2.5, 5, 10].map(f => f * power).find(step => step >= rough) ?? 10 * power;
};

const formatValue = (value: number, unit: string) => {
  const digits = Number.isInteger(value) || Math.abs(value) >= 10 ? 0 : 1;
  return `${value.toFixed(digits)}${unit === "%" ? "%" : ` ${unit}`}`;
};

export const drawDotPlot = ({ title, note, unit, device, rows, lists, log = false }: DotPlot): string => {
  const width = 760;
  const labelWidth = 150;
  const valueWidth = 120;
  const plotLeft = labelWidth + 8;
  const plotRight = width - valueWidth;
  const top = 92;
  const hasNotes = rows.some(row => row.cells.some(cell => !Number.isFinite(cell.median)));
  const noteSpace = hasNotes ? 14 : 0;
  const rowHeight = 22 + lists.length * 7 + noteSpace;
  const height = top + rows.length * rowHeight + 44;

  const values = rows.flatMap(row => row.cells.flatMap(cell => [cell.p25, cell.p75, cell.median])).filter(Number.isFinite);
  const rawMax = Math.max(...values);
  const rawMin = Math.min(...values);

  let scale: (value: number) => number;
  let ticks: number[];
  if (log) {
    const min = 10 ** Math.floor(Math.log10(Math.max(rawMin, 1)));
    const max = 10 ** Math.ceil(Math.log10(rawMax));
    scale = value => plotLeft + ((Math.log10(Math.max(value, min)) - Math.log10(min)) / (Math.log10(max) - Math.log10(min))) * (plotRight - plotLeft);
    ticks = [];
    for (let tick = min; tick <= max; tick *= 10) {
      ticks.push(tick);
    }
  } else {
    const step = niceStep(rawMax || 1);
    const max = Math.ceil(rawMax / step) * step || step;
    scale = value => plotLeft + (value / max) * (plotRight - plotLeft);
    ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step);
  }

  const parts = [];
  parts.push(`<rect width="${width}" height="${height}" fill="${SURFACE}"/>`);
  parts.push(`<text x="16" y="28" font-size="18" font-weight="700" fill="${INK}">${escapeXml(title)}</text>`);
  parts.push(`<text x="16" y="48" font-size="12.5" fill="${INK_MUTED}">${escapeXml(`${DEVICE_LABELS[device] ?? device} · ${note} · dot = median, line = p25–p75 · lower is better`)}</text>`);

  let legendX = 16;
  for (const list of lists) {
    parts.push(`<circle cx="${legendX + 5}" cy="70" r="5" fill="${list.color}"/>`);
    parts.push(`<text x="${legendX + 15}" y="74" font-size="12.5" fill="${INK}">${escapeXml(list.label)}</text>`);
    legendX += 30 + list.label.length * 7;
  }

  for (const tick of ticks) {
    const x = scale(tick);
    parts.push(`<line x1="${x}" x2="${x}" y1="${top - 6}" y2="${top + rows.length * rowHeight}" stroke="${GRID}" stroke-width="1"/>`);
    parts.push(`<text x="${x}" y="${top + rows.length * rowHeight + 18}" font-size="11.5" text-anchor="middle" fill="${INK_MUTED}">${escapeXml(formatValue(tick, unit))}</text>`);
  }

  rows.forEach((row, rowIndex) => {
    const rowTop = top + rowIndex * rowHeight;
    const centre = rowTop + (rowHeight - noteSpace) / 2;
    if (rowIndex > 0) {
      parts.push(`<line x1="16" x2="${width - 16}" y1="${rowTop}" y2="${rowTop}" stroke="${GRID}" stroke-width="1"/>`);
    }
    parts.push(`<text x="16" y="${centre + 4}" font-size="13" fill="${INK}">${escapeXml(row.label)}</text>`);

    const present = row.cells.filter(cell => Number.isFinite(cell.median));
    const best = present.reduce<Cell | null>((winner, cell) => (winner === null || cell.median < winner.median ? cell : winner), null);
    if (best) {
      parts.push(`<text x="${width - 16}" y="${centre + 4}" font-size="12" text-anchor="end" fill="${INK_MUTED}">${escapeXml(`best ${formatValue(best.median, unit)}`)}</text>`);
    }

    const missing = row.cells.filter(cell => !Number.isFinite(cell.median));
    if (missing.length) {
      const reasons = missing.map(cell => `${cell.list.label} ${cell.reason ?? "no run finished"}`).join(" · ");
      parts.push(`<text x="${plotLeft}" y="${rowTop + rowHeight - 5}" font-size="10.5" fill="${INK_MUTED}">${escapeXml(reasons)}</text>`);
    }
    row.cells.forEach((cell, listIndex) => {
      const y = centre + (listIndex - (lists.length - 1) / 2) * 7;
      if (!Number.isFinite(cell.median)) {
        return;
      }
      if (Number.isFinite(cell.p25) && Number.isFinite(cell.p75)) {
        parts.push(`<line x1="${scale(cell.p25)}" x2="${scale(cell.p75)}" y1="${y}" y2="${y}" stroke="${cell.list.color}" stroke-width="2" stroke-linecap="round"/>`);
      }
      parts.push(`<circle cx="${scale(cell.median)}" cy="${y}" r="4.5" fill="${cell.list.color}" stroke="${SURFACE}" stroke-width="2"><title>${escapeXml(`${row.label} · ${cell.list.label}: ${formatValue(cell.median, unit)} (p25 ${formatValue(cell.p25, unit)}, p75 ${formatValue(cell.p75, unit)}, n=${cell.n})`)}</title></circle>`);
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">${parts.join("")}</svg>\n`;
};

export const rowsFor = (summary: SummaryCell[], { device, suite = "core", test, metric, missedMetric, count = 10000, hints = false, lists = LISTS.slice(0, 4), scenarios = Object.keys(SCENARIO_LABELS) }: RowsQuery): Row[] =>
  scenarios
    .map(scenario => ({
      label: SCENARIO_LABELS[scenario],
      cells: lists.map((list): Cell => {
        const cell = summary.find(
          entry =>
            entry.device === device &&
            entry.suite === suite &&
            entry.test === test &&
            entry.scenario === scenario &&
            entry.count === count &&
            entry.hints === hints &&
            entry.list === list.id,
        );
        const stat = cell?.stats[metric];
        const missed = missedMetric ? cell?.stats[missedMetric]?.median ?? 0 : 0;
        if (missed > 0) {
          return { list, median: NaN, p25: NaN, p75: NaN, n: 0, reason: `missed ${missed} of 4` };
        }
        return { list, median: stat?.median ?? NaN, p25: stat?.p25 ?? NaN, p75: stat?.p75 ?? NaN, n: stat?.n ?? 0 };
      }),
    }))
    .filter(row => row.cells.some(cell => Number.isFinite(cell.median)));

const main = () => {
  const summary = readSummary();
  const only = process.argv[2];
  mkdirSync(OUT, { recursive: true });
  const devices = [...new Set(summary.map(entry => entry.device))];
  for (const chart of CHARTS.filter(entry => !only || entry.id === only)) {
    for (const device of devices) {
      const lists = LISTS.slice(0, 4);
      const rows = rowsFor(summary, { device, test: chart.test, metric: chart.metric, missedMetric: chart.missedMetric, lists });
      if (rows.length === 0) {
        continue;
      }
      const file = join(OUT, `${chart.id}-${device}.svg`);
      writeFileSync(file, drawDotPlot({ ...chart, device, rows, lists }));
      console.log(`wrote ${file.slice(ROOT.length + 1)} (${rows.length} scenarios)`);
    }
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
