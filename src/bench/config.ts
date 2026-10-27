export const LIST_IDS = [
  "flatlist",
  "flatlist-tuned",
  "flashlist",
  "flashlist-pool",
  "legend",
  "legend-recycle",
] as const;
export type ListId = (typeof LIST_IDS)[number];

export const LIST_LABELS: Record<ListId, string> = {
  flatlist: "FlatList",
  "flatlist-tuned": "FlatList (tuned)",
  flashlist: "FlashList",
  "flashlist-pool": "FlashList (pool of 10)",
  legend: "LegendList",
  "legend-recycle": "LegendList ♻︎",
};

export const SCENARIO_IDS = [
  "tiny",
  "medium",
  "heavy",
  "variable",
  "mixed",
  "grid",
  "shelves",
  "chat",
] as const;
export type ScenarioId = (typeof SCENARIO_IDS)[number];

export const SCENARIO_LABELS: Record<ScenarioId, string> = {
  tiny: "Tiny text rows",
  medium: "Photo rows",
  heavy: "Heavy feed cards",
  variable: "Variable height",
  mixed: "Mixed item types",
  grid: "Photo grid",
  shelves: "Nested carousels",
  chat: "Chat",
};

// What the screen does on its own once the list is up. Gesture-driven runs use "idle" and let an
// Argent flow do the scrolling; the other modes are things a gesture cannot express precisely.
export const MODES = ["idle", "mount", "jump", "ticker", "stream", "infinite"] as const;
export type Mode = (typeof MODES)[number];

export const COUNTS = [100, 1000, 10000] as const;
export const DEFAULT_COUNT = 10000;

export type BenchConfig = {
  list: ListId;
  scenario: ScenarioId;
  count: number;
  mode: Mode;
  hints: boolean;
  repeat: number;
};

const isOneOf = <T extends string>(values: readonly T[], value: unknown): value is T =>
  typeof value === "string" && (values as readonly string[]).includes(value);

const toPositiveInt = (value: unknown, fallback: number) => {
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const parseBenchConfig = (params: Record<string, string | string[] | undefined>): BenchConfig => ({
  list: isOneOf(LIST_IDS, params.list) ? params.list : "flatlist",
  scenario: isOneOf(SCENARIO_IDS, params.scenario) ? params.scenario : "tiny",
  count: toPositiveInt(params.count, DEFAULT_COUNT),
  mode: isOneOf(MODES, params.mode) ? params.mode : "idle",
  hints: params.hints === "1",
  repeat: toPositiveInt(params.repeat, 10),
});

export const benchConfigLabel = (config: BenchConfig) =>
  [
    LIST_LABELS[config.list],
    config.scenario,
    config.count.toLocaleString("en-US"),
    config.mode === "idle" ? null : config.mode,
    config.hints ? "hints" : null,
  ]
    .filter(Boolean)
    .join(" · ");
