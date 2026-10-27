import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { SectionItem } from "@/bench/data/items";
import { colors } from "@/theme/colors";

import { IndexBadge } from "./IndexBadge";
import { RowProps } from "./types";

export const SECTION_ROW_HEIGHT = 44;

export const SectionRow = memo(({ item, onLayout }: RowProps<SectionItem>) => (
  <View style={styles.row} onLayout={onLayout}>
    <Text style={styles.title} numberOfLines={1}>
      {item.title}
    </Text>
    <IndexBadge index={item.index} isInverse />
  </View>
));

SectionRow.displayName = "SectionRow";

const styles = StyleSheet.create({
  row: {
    height: SECTION_ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: colors.navy,
  },
  title: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.white,
  },
});
