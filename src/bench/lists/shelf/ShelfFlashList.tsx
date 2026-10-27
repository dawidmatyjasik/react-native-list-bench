import { FlashList, ListRenderItemInfo } from "@shopify/flash-list";
import { StyleSheet } from "react-native";

import { ShelfCard } from "@/bench/data/items";
import { ShelfCardView } from "@/bench/rows/ShelfCardView";
import { colors } from "@/theme/colors";

import { cardKeyExtractor } from "../itemKeys";

import { ShelfListProps } from "./types";

type ShelfFlashListProps = ShelfListProps & {
  maxItemsInRecyclePool: number | undefined;
};

const renderCard = ({ item }: ListRenderItemInfo<ShelfCard>) => <ShelfCardView card={item} />;

export const ShelfFlashList = ({ cards, maxItemsInRecyclePool }: ShelfFlashListProps) => (
  <FlashList
    horizontal
    data={cards}
    renderItem={renderCard}
    keyExtractor={cardKeyExtractor}
    maxItemsInRecyclePool={maxItemsInRecyclePool}
    showsHorizontalScrollIndicator={false}
    style={styles.shelf}
  />
);

const styles = StyleSheet.create({
  shelf: {
    height: 212,
    backgroundColor: colors.blank,
  },
});
