import { useCallback, useImperativeHandle, useMemo, useRef } from "react";
import { FlatList, ListRenderItemInfo, StyleSheet } from "react-native";

import { BenchItem } from "@/bench/data/items";
import { colors } from "@/theme/colors";

import { keyExtractor } from "./itemKeys";
import { BenchListProps } from "./types";

type BenchFlatListProps = BenchListProps & {
  isTuned: boolean;
};

type ScrollToIndexFailure = {
  index: number;
  averageItemLength: number;
};

// Untuned, FlatList runs as shipped. Tuned, it gets the two memory knobs most guides start with:
// a 5-screen window instead of 21, and detaching off-screen rows from the native hierarchy.
// Chat uses the documented `inverted` pattern, which wants the newest message first.
export const BenchFlatList = ({
  data,
  renderRow,
  numColumns,
  isChat,
  hints,
  onEndReached,
  isTuned,
  ref,
}: BenchFlatListProps) => {
  const listRef = useRef<FlatList<BenchItem>>(null);
  const items = useMemo(() => (isChat ? [...data].reverse() : data), [data, isChat]);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<BenchItem>) => renderRow(item), [renderRow]);

  const getItemLayout = useMemo(() => {
    const size = hints?.fixedItemSize;
    if (!size) {
      return undefined;
    }
    return (_data: ArrayLike<BenchItem> | null | undefined, index: number) => ({
      length: size,
      offset: size * index,
      index,
    });
  }, [hints]);

  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex: index => {
        const position = isChat ? items.length - 1 - index : index;
        listRef.current?.scrollToIndex({ index: Math.floor(position / numColumns), animated: false });
      },
    }),
    [isChat, items.length, numColumns],
  );

  // The workaround from the FlatList docs for jumping without getItemLayout: land near the target
  // using the average row length, then retry once the rows around it exist.
  const handleScrollToIndexFailed = ({ index, averageItemLength }: ScrollToIndexFailure) => {
    listRef.current?.scrollToOffset({ offset: index * averageItemLength, animated: false });
    setTimeout(() => listRef.current?.scrollToIndex({ index, animated: false }), 50);
  };

  return (
    <FlatList
      ref={listRef}
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      inverted={isChat}
      getItemLayout={getItemLayout}
      onEndReached={onEndReached}
      onScrollToIndexFailed={handleScrollToIndexFailed}
      windowSize={isTuned ? 5 : undefined}
      removeClippedSubviews={isTuned ? true : undefined}
      showsVerticalScrollIndicator={false}
      style={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: colors.blank,
  },
});
