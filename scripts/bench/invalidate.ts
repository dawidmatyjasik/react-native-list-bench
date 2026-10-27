// Deletes raw runs of one device that started inside a time window, so the next run.ts invocation
// measures them again. For windows where something else loaded the machine (a build, a second
// emulator) and the numbers cannot be trusted.
//
//   node scripts/bench/invalidate.ts --device emu-high --from 2026-10-14T17:54:30Z --to 2026-10-14T17:57:30Z [--dry-run]

import { readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import type { RunRecord } from "./lib/runs.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const { values } = parseArgs({
  options: {
    device: { type: "string" },
    from: { type: "string" },
    to: { type: "string" },
    "dry-run": { type: "boolean", default: false },
  },
});

if (values.device === undefined) {
  throw new Error("--device is required");
}

const from = Date.parse(values.from ?? "");
const to = Date.parse(values.to ?? "");
const root = join(ROOT, "bench-results", "raw", values.device);

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : name.endsWith(".json") ? [path] : [];
  });

const doomed = walk(root).filter(path => {
  const record: Pick<RunRecord, "startedAt"> = JSON.parse(readFileSync(path, "utf8"));
  const startedAt = Date.parse(record.startedAt);
  return startedAt >= from && startedAt <= to;
});

for (const path of doomed) {
  console.log(`${values["dry-run"] ? "would delete" : "deleting"} ${path.slice(root.length + 1)}`);
  if (!values["dry-run"]) {
    rmSync(path);
    rmSync(path.replace(/\.json$/, ".worst.jpg"), { force: true });
  }
}
console.log(`${doomed.length} runs ${values["dry-run"] ? "would be" : ""} invalidated`);
