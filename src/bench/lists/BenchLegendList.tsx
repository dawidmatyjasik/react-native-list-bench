import { LegendList, LegendListRef, LegendListRenderItemProps } from "@legendapp/list/react-native";
import { useCallback, useImperativeHandle, useMemo, useRef } from "react";
import { StyleSheet } from "react-native";

import { BenchItem } from "@/bench/data/items";
import { colors } from "@/theme/colors";

import { getItemType, keyExtractor } from "./itemKeys";
import { BenchListProps } from "./types";

type BenchLegendListProps = BenchListProps & {
  recycleItems: boolean;
};

// Chat follows the LegendList chat guide: normal order, aligned to the end, opened at the end and
// kept there as messages arrive.
export const BenchLegendList = ({
  data,
  renderRow,
  numColumns,
  isChat,
  hints,
  onEndReached,
  recycleItems,
  ref,
}: BenchLegendListProps) => {
  const listRef = useRef<LegendListRef>(null);

  const renderItem = useCallback(({ item }: LegendListRenderItemProps<BenchItem>) => renderRow(item), [renderRow]);

  const getFixedItemSize = useMemo(() => {
    const size = hints?.fixedItemSize;
    return size ? () => size : undefined;
  }, [hints]);

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
    <LegendList
      ref={listRef}
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemType={getItemType}
      numColumns={numColumns}
      recycleItems={recycleItems}
      estimatedItemSize={hints?.estimatedItemSize}
      getFixedItemSize={getFixedItemSize}
      onEndReached={onEndReached}
      alignItemsAtEnd={isChat}
      initialScrollAtEnd={isChat}
      maintainScrollAtEnd={isChat}
      maintainVisibleContentPosition={isChat ? true : undefined}
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
