import { FlatList, ListRenderItemInfo, StyleSheet } from "react-native";

import { ShelfCard } from "@/bench/data/items";
import { ShelfCardView } from "@/bench/rows/ShelfCardView";
import { colors } from "@/theme/colors";

import { cardKeyExtractor } from "../itemKeys";

import { ShelfListProps } from "./types";

const renderCard = ({ item }: ListRenderItemInfo<ShelfCard>) => <ShelfCardView card={item} />;

export const ShelfFlatList = ({ cards }: ShelfListProps) => (
  <FlatList
    horizontal
    data={cards}
    renderItem={renderCard}
    keyExtractor={cardKeyExtractor}
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
