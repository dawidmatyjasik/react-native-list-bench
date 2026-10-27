import { FlashList, FlashListRef, ListRenderItemInfo } from "@shopify/flash-list";
import { useCallback, useImperativeHandle, useRef } from "react";
import { StyleSheet } from "react-native";

import { BenchItem } from "@/bench/data/items";
import { colors } from "@/theme/colors";

import { getItemType, keyExtractor } from "./itemKeys";
import { BenchListProps } from "./types";

// FlashList keeps every cell it has ever needed at once mounted for reuse, with no limit by default.
// The capped variant tests whether bounding that pool bounds memory.
export const FLASHLIST_POOL_LIMIT = 10;

type BenchFlashListProps = BenchListProps & {
  maxItemsInRecyclePool: number | undefined;
};

// FlashList v2 takes no size hints, so `hints` has nothing to tell it. Chat follows the v2 docs:
// normal order, start from the bottom, keep the position as messages arrive.
const CHAT_POSITION = {
  startRenderingFromBottom: true,
  autoscrollToBottomThreshold: 0.2,
};

export const BenchFlashList = ({
  data,
  renderRow,
  numColumns,
  isChat,
  onEndReached,
  maxItemsInRecyclePool,
  ref,
}: BenchFlashListProps) => {
  const listRef = useRef<FlashListRef<BenchItem>>(null);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<BenchItem>) => renderRow(item), [renderRow]);

  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex: index => {
        listRef.current?.scrollToIndex({ index, animated: false });
      },
    }),
    [],
  );

  return (
    <FlashList
      ref={listRef}
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemType={getItemType}
      numColumns={numColumns}
      onEndReached={onEndReached}
      maintainVisibleContentPosition={isChat ? CHAT_POSITION : undefined}
      maxItemsInRecyclePool={maxItemsInRecyclePool}
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
