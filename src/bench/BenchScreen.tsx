import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { colors } from "@/theme/colors";

import { BenchHeader } from "./BenchHeader";
import { BenchListHost } from "./BenchListHost";
import { BenchConfig } from "./config";
import { createItemSource } from "./data/generate";
import { BenchListHandle } from "./lists/types";
import { benchLog } from "./measure/benchLog";
import { resetMountedRows } from "./measure/mountedRows";
import { useBenchMode } from "./modes/useBenchMode";
import { SCENARIOS } from "./scenarios";

type BenchScreenProps = {
  config: BenchConfig;
};

const createInitialData = (config: BenchConfig) => {
  // Reset before the first render, not in an effect: rows report themselves from their own
  // effects, which React runs before this screen's, and a later reset would forget them.
  resetMountedRows();
  const startedAt = performance.now();
  const nextItems = createItemSource(config.scenario);
  const items = nextItems(config.count);
  return { nextItems, items, generatedInMs: performance.now() - startedAt };
};

export const BenchScreen = ({ config }: BenchScreenProps) => {
  const [initial] = useState(() => createInitialData(config));
  const [data, setData] = useState(initial.items);
  const listRef = useRef<BenchListHandle>(null);

  const { hostKey, isHostMounted, handlePainted, handleEndReached } = useBenchMode({
    config,
    isChat: SCENARIOS[config.scenario].isChat,
    listRef,
    dataLength: initial.items.length,
    setData,
    nextItems: initial.nextItems,
  });

  useEffect(() => {
    benchLog("screen", { ...config, generatedInMs: Math.round(initial.generatedInMs) });
  }, [config, initial]);

  return (
    <View style={styles.screen}>
      <BenchHeader config={config} />
      {isHostMounted ? (
        <BenchListHost
          key={hostKey}
          config={config}
          data={data}
          listRef={listRef}
          onPainted={handlePainted}
          onEndReached={handleEndReached}
        />
      ) : (
        <View style={styles.gap} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.blank,
  },
  gap: {
    flex: 1,
  },
});
