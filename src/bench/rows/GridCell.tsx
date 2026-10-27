import { Image } from "expo-image";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { GridItem } from "@/bench/data/items";
import { colors } from "@/theme/colors";

import { RowProps } from "./types";

export const GRID_COLUMNS = 3;

export const GridCell = memo(({ item, onLayout }: RowProps<GridItem>) => (
  <View style={styles.cell} onLayout={onLayout}>
    <Image source={item.photo} recyclingKey={item.id} style={styles.photo} />
    <Text style={styles.index}>#{item.index}</Text>
  </View>
));

GridCell.displayName = "GridCell";

const styles = StyleSheet.create({
  // A white frame instead of a gap: anything between cells would read as blank in a recording.
  cell: {
    flex: 1,
    aspectRatio: 1,
    padding: 1,
    backgroundColor: colors.white,
  },
  photo: {
    flex: 1,
    backgroundColor: colors.navy20,
  },
  index: {
    position: "absolute",
    left: 6,
    bottom: 4,
    fontSize: 11,
    fontWeight: "700",
    color: colors.white,
  },
});
