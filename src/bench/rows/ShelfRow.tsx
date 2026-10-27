import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ShelfItem } from "@/bench/data/items";
import { ShelfList } from "@/bench/lists/shelf/ShelfList";
import { colors } from "@/theme/colors";

import { IndexBadge } from "./IndexBadge";
import { RowProps } from "./types";

export const SHELF_ROW_HEIGHT = 44 + 212 + 12;

export const ShelfRow = memo(({ item, onLayout }: RowProps<ShelfItem>) => (
  <View style={styles.row} onLayout={onLayout}>
    <View style={styles.header}>
      <Text style={styles.title} numberOfLines={1}>
        {item.title}
      </Text>
      <IndexBadge index={item.index} />
    </View>
    <ShelfList cards={item.cards} />
  </View>
));

ShelfRow.displayName = "ShelfRow";

const styles = StyleSheet.create({
  row: {
    height: SHELF_ROW_HEIGHT,
    paddingBottom: 12,
    backgroundColor: colors.white,
  },
  header: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: colors.navy,
  },
});
