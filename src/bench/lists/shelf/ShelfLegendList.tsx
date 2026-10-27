import { LegendList, LegendListRenderItemProps } from "@legendapp/list/react-native";
import { StyleSheet } from "react-native";

import { ShelfCard } from "@/bench/data/items";
import { ShelfCardView } from "@/bench/rows/ShelfCardView";
import { colors } from "@/theme/colors";

import { cardKeyExtractor } from "../itemKeys";

import { ShelfListProps } from "./types";

type ShelfLegendListProps = ShelfListProps & {
  recycleItems: boolean;
};

const renderCard = ({ item }: LegendListRenderItemProps<ShelfCard>) => <ShelfCardView card={item} />;

export const ShelfLegendList = ({ cards, recycleItems }: ShelfLegendListProps) => (
  <LegendList
    horizontal
    data={cards}
    renderItem={renderCard}
    keyExtractor={cardKeyExtractor}
    recycleItems={recycleItems}
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
