import { useState } from "react";

import { DEFAULT_COUNT, ListId, Mode, ScenarioId } from "@/bench/config";

export const useLaunchOptions = () => {
  const [list, setList] = useState<ListId>("flashlist");
  const [scenario, setScenario] = useState<ScenarioId>("medium");
  const [count, setCount] = useState<number>(DEFAULT_COUNT);
  const [mode, setMode] = useState<Mode>("idle");
  const [hints, setHints] = useState<"0" | "1">("0");

  return {
    list,
    setList,
    scenario,
    setScenario,
    count,
    setCount,
    mode,
    setMode,
    hints,
    setHints,
    params: { list, scenario, count: String(count), mode, hints },
  };
};
