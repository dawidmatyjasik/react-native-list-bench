import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { VariableItem } from "@/bench/data/items";
import { colors } from "@/theme/colors";

import { IndexBadge } from "./IndexBadge";
import { RowProps } from "./types";

// The height comes from the data, so it is deterministic, but no list is told about it.
export const VariableRow = memo(({ item, onLayout }: RowProps<VariableItem>) => (
  <View style={[styles.row, { height: item.height }]} onLayout={onLayout}>
    <View style={styles.titleRow}>
      <Text style={styles.title} numberOfLines={1}>
        {item.title}
      </Text>
      <IndexBadge index={item.index} />
    </View>
    <Text style={styles.body}>{item.body}</Text>
  </View>
));

VariableRow.displayName = "VariableRow";

const styles = StyleSheet.create({
  row: {
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.navy20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.navy,
  },
  body: {
    paddingTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: colors.navy80,
  },
});
