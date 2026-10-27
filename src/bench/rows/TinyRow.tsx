import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { TinyItem } from "@/bench/data/items";
import { colors } from "@/theme/colors";

import { IndexBadge } from "./IndexBadge";
import { RowProps } from "./types";

export const TINY_ROW_HEIGHT = 64;

const INITIAL_COLORS = [colors.navy, colors.purple, colors.red, colors.green, colors.blue];

export const TinyRow = memo(({ item, onLayout }: RowProps<TinyItem>) => (
  <View style={styles.row} onLayout={onLayout}>
    <View style={[styles.initial, { backgroundColor: INITIAL_COLORS[item.index % INITIAL_COLORS.length] }]}>
      <Text style={styles.initialText}>{item.title.charAt(0).toUpperCase()}</Text>
    </View>
    <View style={styles.text}>
      <Text style={styles.title} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {item.subtitle}
      </Text>
    </View>
    <IndexBadge index={item.index} />
  </View>
));

TinyRow.displayName = "TinyRow";

const styles = StyleSheet.create({
  row: {
    height: TINY_ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.navy20,
  },
  initial: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  initialText: {
    color: colors.white,
    fontWeight: "700",
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.navy,
  },
  subtitle: {
    fontSize: 13,
    color: colors.navy60,
  },
});
