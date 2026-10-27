import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { PollItem } from "@/bench/data/items";
import { colors } from "@/theme/colors";

import { IndexBadge } from "./IndexBadge";
import { RowProps } from "./types";

export const PollRow = memo(({ item, onLayout }: RowProps<PollItem>) => (
  <View style={styles.row} onLayout={onLayout}>
    <View style={styles.header}>
      <Text style={styles.question} numberOfLines={2}>
        {item.question}
      </Text>
      <IndexBadge index={item.index} />
    </View>
    {item.options.map((option, position) => (
      <View key={position} style={styles.option}>
        <View style={[styles.fill, { width: `${Math.round(option.share * 100)}%` }]} />
        <Text style={styles.label} numberOfLines={1}>
          {option.label}
        </Text>
        <Text style={styles.share}>{Math.round(option.share * 100)}%</Text>
      </View>
    ))}
  </View>
));

PollRow.displayName = "PollRow";

const styles = StyleSheet.create({
  row: {
    gap: 8,
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.navy20,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  question: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.navy,
  },
  option: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  fill: {
    ...StyleSheet.absoluteFill,
    right: undefined,
    backgroundColor: colors.yellow,
  },
  label: {
    flex: 1,
    fontSize: 13,
    color: colors.navy,
  },
  share: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.navy,
  },
});
