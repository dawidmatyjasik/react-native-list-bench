import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { TextPostItem } from "@/bench/data/items";
import { colors } from "@/theme/colors";

import { Avatar } from "./Avatar";
import { IndexBadge } from "./IndexBadge";
import { RowProps } from "./types";

export const TextPostRow = memo(({ item, onLayout }: RowProps<TextPostItem>) => (
  <View style={styles.row} onLayout={onLayout}>
    <Avatar source={item.author.avatar} size={40} recyclingKey={`${item.id}-avatar`} />
    <View style={styles.content}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {item.author.name}
        </Text>
        <IndexBadge index={item.index} />
      </View>
      <Text style={styles.text} numberOfLines={6}>
        {item.text}
      </Text>
    </View>
  </View>
));

TextPostRow.displayName = "TextPostRow";

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.navy20,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.navy,
  },
  text: {
    paddingTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: colors.navy80,
  },
});
