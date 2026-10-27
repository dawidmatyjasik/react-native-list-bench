import { Image } from "expo-image";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { MediumItem } from "@/bench/data/items";
import { colors } from "@/theme/colors";

import { Avatar } from "./Avatar";
import { IndexBadge } from "./IndexBadge";
import { RowProps } from "./types";

export const MEDIUM_ROW_CHROME_HEIGHT = 52 + 44 + 28;

export const MediumRow = memo(({ item, onLayout }: RowProps<MediumItem>) => (
  <View style={styles.row} onLayout={onLayout}>
    <View style={styles.header}>
      <Avatar source={item.author.avatar} size={32} recyclingKey={`${item.id}-avatar`} />
      <Text style={styles.name} numberOfLines={1}>
        {item.author.name}
      </Text>
      <IndexBadge index={item.index} />
    </View>
    <Image source={item.photo} recyclingKey={item.id} style={styles.photo} />
    <Text style={styles.caption} numberOfLines={2}>
      {item.caption}
    </Text>
    <Text style={styles.likes}>{item.likes.toLocaleString("en-US")} likes</Text>
  </View>
));

MediumRow.displayName = "MediumRow";

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.navy20,
  },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.navy,
  },
  photo: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: colors.navy20,
  },
  caption: {
    height: 44,
    paddingHorizontal: 12,
    paddingTop: 6,
    fontSize: 14,
    lineHeight: 19,
    color: colors.navy,
  },
  likes: {
    height: 28,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: "600",
    color: colors.navy80,
  },
});
