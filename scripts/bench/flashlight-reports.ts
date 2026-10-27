// Builds Flashlight's own web reports from the raw runs: one report per device and case, one line
// per list, with the list's rounds as Flashlight iterations. Tuning, pool and hints cases also
// show the core lists they change. Blank-area runs have no Flashlight data and are skipped.
// Writes bench-results/reports/<device>/<suite>/<case>/report.html and an index next to them.
//
//   node scripts/bench/flashlight-reports.ts

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { isCompleteRun, validMeasures, type FlashlightIteration, type Measure, type RunRecord } from "./lib/runs.ts";

type Baseline = {
  lists: string[];
  caseId: (id: string) => string;
};

type Report = {
  device: string;
  suite: string;
  caseId: string;
  names: string[];
};

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const RAW = join(ROOT, "bench-results", "raw");
const OUT = join(ROOT, "bench-results", "reports");

const POLLING_INTERVAL_MS = 500;

const LIST_LABELS: Record<string, string> = {
  flatlist: "FlatList",
  "flatlist-tuned": "FlatList tuned",
  flashlist: "FlashList",
  "flashlist-pool": "FlashList pool 10",
  legend: "LegendList",
  "legend-recycle": "LegendList recycle",
};

const DEVICE_LABELS: Record<string, string> = {
  s25: "Galaxy S25",
  a21s: "Galaxy A21s",
  "emu-high": "Pixel 9 Pro emulator",
  "emu-low": "Low-end emulator",
};

const BASELINES: Record<string, Baseline> = {
  tuning: { lists: ["flatlist", "flashlist"], caseId: id => id },
  pool: { lists: ["flashlist"], caseId: id => id },
  hints: { lists: ["flatlist", "legend", "legend-recycle"], caseId: id => id.replace(/-hints$/, "") },
};

const subdirs = (dir: string) =>
  existsSync(dir) ? readdirSync(dir).filter(name => statSync(join(dir, name)).isDirectory()).sort() : [];

// Flashlight's charts put sample i at i × 500 ms and average a list's rounds sample by sample, so a
// round with a sampling gap would be squeezed in time and averaged against the wrong moments of the
// other rounds. Each round is put on that grid: a slot takes the sample whose interval covers it.
const onGrid = (measures: Measure[]) => {
  const slots = Math.floor((measures[measures.length - 1].time + POLLING_INTERVAL_MS / 2) / POLLING_INTERVAL_MS);
  return Array.from({ length: slots }, (_, index) => {
    const time = (index + 1) * POLLING_INTERVAL_MS;
    return { ...measures.find(measure => measure.time >= time - POLLING_INTERVAL_MS / 2), time };
  });
};

const iterations = (dir: string) =>
  existsSync(dir)
    ? readdirSync(dir)
        .filter(name => /^r\d+\.json$/.test(name))
        .sort()
        .map((name): RunRecord => JSON.parse(readFileSync(join(dir, name), "utf8")))
        .filter(isCompleteRun)
        .map(record => record.flashlight)
        .filter((iteration): iteration is FlashlightIteration => iteration?.status === "SUCCESS" && iteration.measures.length > 0)
        .map(iteration => ({ ...iteration, measures: onGrid(validMeasures(iteration.measures)) }))
    : [];

const listOrder = (list: string) => Object.keys(LIST_LABELS).indexOf(list);

const caseResults = (device: string, suite: string, caseId: string) => {
  const baseline = BASELINES[suite];
  const base = (baseline?.lists ?? []).map(list => ({
    list,
    isVariant: false,
    name: LIST_LABELS[list],
    iterations: iterations(join(RAW, device, "core", baseline.caseId(caseId), list)),
  }));
  const own = subdirs(join(RAW, device, suite, caseId)).map(list => ({
    list,
    isVariant: true,
    name: suite === "hints" ? `${LIST_LABELS[list]} + hints` : LIST_LABELS[list],
    iterations: iterations(join(RAW, device, suite, caseId, list)),
  }));
  return [...base, ...own]
    .filter(result => result.iterations.length > 0)
    .sort((a, b) => listOrder(a.list) - listOrder(b.list) || Number(a.isVariant) - Number(b.isVariant));
};

// Flashlight opens every report in the browser; a no-op `open` first on PATH stops that.
const scratch = mkdtempSync(join(tmpdir(), "flashlight-reports-"));
writeFileSync(join(scratch, "open"), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
const env = { ...process.env, PATH: `${scratch}:${process.env.PATH}` };

const written: Report[] = [];
for (const device of subdirs(RAW)) {
  for (const suite of subdirs(join(RAW, device))) {
    for (const caseId of subdirs(join(RAW, device, suite))) {
      const results = caseResults(device, suite, caseId);
      if (results.length === 0) {
        continue;
      }
      const inputs = results.map((result, index) => {
        const path = join(scratch, `${device}-${suite}-${caseId}-${index}.json`);
        writeFileSync(path, JSON.stringify({ name: result.name, status: "SUCCESS", iterations: result.iterations }));
        return path;
      });
      const outDir = join(OUT, device, suite, caseId);
      mkdirSync(outDir, { recursive: true });
      execFileSync("flashlight", ["report", ...inputs, "-o", outDir], { env, stdio: "ignore" });
      written.push({ device, suite, caseId, names: results.map(result => result.name) });
    }
  }
}
rmSync(scratch, { recursive: true, force: true });

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const sections = Object.keys(DEVICE_LABELS)
  .filter(device => written.some(report => report.device === device))
  .map(device => {
    const suites = [...new Set(written.filter(report => report.device === device).map(report => report.suite))];
    const lists = suites.map(suite => {
      const items = written
        .filter(report => report.device === device && report.suite === suite)
        .map(
          report =>
            `<li><a href="${device}/${suite}/${report.caseId}/report.html">${report.caseId}</a> <span>${escapeHtml(report.names.join(" · "))}</span></li>`,
        );
      return `<h3>${suite}</h3><ul>${items.join("")}</ul>`;
    });
    return `<h2>${DEVICE_LABELS[device]}</h2>${lists.join("")}`;
  });

writeFileSync(
  join(OUT, "index.html"),
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>List Bench Flashlight reports</title>
<style>
body { font: 15px/1.5 system-ui, sans-serif; max-width: 60rem; margin: 2rem auto; padding: 0 16px; color: #10163a; }
h2 { margin-top: 2rem; } h3 { margin-bottom: 0.3rem; }
ul { list-style: none; padding: 0; margin: 0; columns: 2 22rem; }
li { break-inside: avoid; padding: 0.15rem 0; } span { color: #535a78; font-size: 0.8rem; }
</style>
<h1>List Bench Flashlight reports</h1>
<p>One report per device and case. Case ids are scenario-test-itemCount.</p>
${sections.join("\n")}
`,
);

console.log(`${written.length} reports in ${OUT}`);
