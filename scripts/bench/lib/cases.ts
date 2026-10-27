export type CaseKind = "cold" | "gesture" | "inapp" | "blank";

type CaseSpec = {
  name: string;
  kind: CaseKind;
  scenario: string;
  flow?: string;
  mode?: string;
  count?: number;
  hints?: boolean;
};

export type TestCase = CaseSpec & {
  count: number;
  mode: string;
  hints: boolean;
  id: string;
};

export const LISTS = ["flatlist", "flashlist", "legend", "legend-recycle"];

export const SCENARIOS = ["tiny", "medium", "heavy", "variable", "mixed", "grid", "shelves", "chat"];

const DEFAULT_COUNT = 10000;

// Chat opens at the newest message, so "scrolling through it" means going up.
const forward = (scenario: string) => (scenario === "chat" ? "up" : "down");

// A 70-second session costs as much as five other tests, so it runs where memory over time is the
// question: rows with photos, nested lists and chat.
const LONG_SCENARIOS = ["medium", "heavy", "grid", "shelves", "chat"];

// kind: "cold"    - kill the app, measure the launch straight into the list
//       "gesture" - land on the list, measure an Argent flow
//       "inapp"   - land on the list, measure what the screen does on its own (mode)
//       "blank"   - record the screen during a flow and count unrendered pixels (no Flashlight)
const coreCases = (scenario: string): CaseSpec[] => [
  { name: "cold", kind: "cold", scenario },
  { name: "scroll", kind: "gesture", scenario, flow: `scroll-${forward(scenario)}` },
  { name: "fling", kind: "gesture", scenario, flow: `fling-${forward(scenario)}` },
  { name: "updown", kind: "gesture", scenario, flow: scenario === "chat" ? "downup" : "updown" },
  ...(LONG_SCENARIOS.includes(scenario)
    ? ([{ name: "long", kind: "gesture", scenario, flow: `long-${forward(scenario)}` }] satisfies CaseSpec[])
    : []),
  { name: "mount", kind: "inapp", scenario, mode: "mount" },
  { name: "jump", kind: "inapp", scenario, mode: "jump" },
  { name: "ticker", kind: "inapp", scenario, mode: "ticker" },
  { name: "blank", kind: "blank", scenario, flow: `fling-${forward(scenario)}` },
  ...(scenario === "chat" ? ([{ name: "stream", kind: "inapp", scenario, mode: "stream" }] satisfies CaseSpec[]) : []),
  ...(["medium", "heavy"].includes(scenario)
    ? ([{ name: "infinite", kind: "gesture", scenario, mode: "infinite", count: 50, flow: "long-down" }] satisfies CaseSpec[])
    : []),
];

const sizeCases = (scenario: string): CaseSpec[] =>
  [100, 1000].flatMap(count => [
    { name: "cold", kind: "cold", scenario, count },
    { name: "mount", kind: "inapp", scenario, mode: "mount", count },
  ]);

const hintCases = (scenario: string): CaseSpec[] => [
  { name: "cold", kind: "cold", scenario, hints: true },
  { name: "jump", kind: "inapp", scenario, mode: "jump", hints: true },
];

const tuningCases = (scenario: string): CaseSpec[] => [
  { name: "cold", kind: "cold", scenario },
  { name: "fling", kind: "gesture", scenario, flow: `fling-${forward(scenario)}` },
  { name: "long", kind: "gesture", scenario, flow: `long-${forward(scenario)}` },
  { name: "mount", kind: "inapp", scenario, mode: "mount" },
];

const withDefaults = (testCase: CaseSpec): Omit<TestCase, "id"> => ({
  count: DEFAULT_COUNT,
  mode: "idle",
  hints: false,
  ...testCase,
});

export const caseId = (testCase: Omit<TestCase, "id">): string =>
  [testCase.scenario, testCase.name, testCase.count, testCase.hints ? "hints" : null].filter(Boolean).join("-");

export const SUITES: Record<string, CaseSpec[]> = {
  core: SCENARIOS.flatMap(coreCases),
  sizes: ["medium", "heavy"].flatMap(sizeCases),
  hints: ["tiny", "medium", "grid", "heavy"].flatMap(hintCases),
  tuning: ["medium", "heavy", "grid"].flatMap(tuningCases),
  // The cases where FlashList's unbounded recycle pool ran out of memory, plus the long sessions
  // where a smaller pool could cost smoothness.
  pool: [
    { name: "jump", kind: "inapp", scenario: "shelves", mode: "jump" },
    { name: "long", kind: "gesture", scenario: "shelves", flow: "long-down" },
    { name: "long", kind: "gesture", scenario: "heavy", flow: "long-down" },
    { name: "fling", kind: "gesture", scenario: "mixed", flow: "fling-down" },
  ],
  // A short pass for comparing devices: a light, a heavy and an image-heavy list, plus the carousel
  // jump that crashes FlashList.
  quick: [
    ...["tiny", "heavy", "grid"].flatMap((scenario): CaseSpec[] => [
      { name: "cold", kind: "cold", scenario },
      { name: "fling", kind: "gesture", scenario, flow: "fling-down" },
      { name: "jump", kind: "inapp", scenario, mode: "jump" },
    ]),
    { name: "jump", kind: "inapp", scenario: "shelves", mode: "jump" },
  ],
  smoke: [
    { name: "cold", kind: "cold", scenario: "medium" },
    { name: "fling", kind: "gesture", scenario: "medium", flow: "fling-down" },
    { name: "mount", kind: "inapp", scenario: "medium", mode: "mount" },
    { name: "jump", kind: "inapp", scenario: "medium", mode: "jump" },
    { name: "blank", kind: "blank", scenario: "medium", flow: "fling-down" },
  ],
};

// Suites that do not need all four contenders. Tuning compares against the core suite's FlatList,
// and FlashList v2 takes no size hints, so measuring it again would only repeat the core suite.
export const SUITE_LISTS: Record<string, string[]> = {
  tuning: ["flatlist-tuned"],
  pool: ["flashlist-pool"],
  hints: ["flatlist", "legend", "legend-recycle"],
};

export const casesFor = (suite: string): TestCase[] => {
  const cases = SUITES[suite];
  if (!cases) {
    throw new Error(`Unknown suite "${suite}". Known: ${Object.keys(SUITES).join(", ")}`);
  }
  return cases.map(withDefaults).map(testCase => ({ ...testCase, id: caseId(testCase) }));
};

export const benchUrl = (testCase: Pick<TestCase, "scenario" | "count" | "mode" | "hints">, list: string): string => {
  const params = new URLSearchParams({
    list,
    scenario: testCase.scenario,
    count: String(testCase.count),
    mode: testCase.mode,
    hints: testCase.hints ? "1" : "0",
  });
  return `listbench://bench?${params}`;
};
