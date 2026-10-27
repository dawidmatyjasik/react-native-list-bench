import { memo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { PromoItem } from "@/bench/data/items";
import { colors } from "@/theme/colors";

import { IndexBadge } from "./IndexBadge";
import { RowProps } from "./types";

export const PROMO_ROW_HEIGHT = 132;

export const PromoRow = memo(({ item, onLayout }: RowProps<PromoItem>) => (
  <View style={styles.row} onLayout={onLayout}>
    <View style={styles.header}>
      <Text style={styles.title} numberOfLines={1}>
        {item.title}
      </Text>
      <IndexBadge index={item.index} isInverse />
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {item.chips.map((chip, position) => (
        <View key={position} style={styles.chip}>
          <Text style={styles.chipText}>{chip}</Text>
        </View>
      ))}
    </ScrollView>
  </View>
));

PromoRow.displayName = "PromoRow";

const styles = StyleSheet.create({
  row: {
    height: PROMO_ROW_HEIGHT,
    justifyContent: "center",
    gap: 14,
    backgroundColor: colors.purple,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: colors.white,
  },
  chips: {
    gap: 8,
    paddingHorizontal: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.purple,
  },
});
