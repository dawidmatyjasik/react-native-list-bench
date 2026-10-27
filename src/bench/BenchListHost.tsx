import { Ref, useCallback, useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";

import { BenchConfig } from "./config";
import { BenchItem } from "./data/items";
import { BenchList } from "./lists/BenchList";
import { ListIdContext } from "./lists/ListIdContext";
import { BenchListHandle } from "./lists/types";
import { createFirstScreenTracker } from "./measure/firstScreenTracker";
import { BenchRow } from "./rows/BenchRow";
import { WatchedBenchRow } from "./rows/WatchedBenchRow";
import { SCENARIOS } from "./scenarios";

type BenchListHostProps = {
  config: BenchConfig;
  data: BenchItem[];
  listRef: Ref<BenchListHandle>;
  onPainted: (elapsedMs: number) => void;
  onEndReached?: () => void;
};

// One mount of the list under test. The mount loop remounts this with a new key, so the tracker
// and its clock start fresh every time.
export const BenchListHost = ({ config, data, listRef, onPainted, onEndReached }: BenchListHostProps) => {
  const scenario = SCENARIOS[config.scenario];
  const { width } = useWindowDimensions();
  const [tracker] = useState(() =>
    createFirstScreenTracker({
      count: data.length,
      numColumns: scenario.numColumns,
      fromEnd: scenario.isChat,
      onPainted,
    }),
  );
  const [hints] = useState(() => (config.hints ? scenario.hints(width) : null));
  const isWatched = config.mode === "jump";

  const renderRow = useCallback(
    (item: BenchItem) =>
      isWatched ? (
        <WatchedBenchRow item={item} onLayout={tracker.rowLayoutHandler(item.index)} />
      ) : (
        <BenchRow item={item} onLayout={tracker.rowLayoutHandler(item.index)} />
      ),
    [tracker, isWatched],
  );

  return (
    <ListIdContext.Provider value={config.list}>
      <View style={styles.host} onLayout={tracker.onListLayout} testID="bench-list">
        <BenchList
          list={config.list}
          data={data}
          renderRow={renderRow}
          numColumns={scenario.numColumns}
          isChat={scenario.isChat}
          hints={hints}
          onEndReached={onEndReached}
          ref={listRef}
        />
      </View>
    </ListIdContext.Provider>
  );
};

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
