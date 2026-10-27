import { useLocalSearchParams } from "expo-router";

import { BenchScreen } from "@/bench/BenchScreen";
import { parseBenchConfig } from "@/bench/config";

// listbench://bench?list=flashlist&scenario=heavy&count=10000&mode=idle&hints=0
const BenchRoute = () => {
  const config = parseBenchConfig(useLocalSearchParams());

  return <BenchScreen key={JSON.stringify(config)} config={config} />;
};

export default BenchRoute;
