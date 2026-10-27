import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { MessageItem } from "@/bench/data/items";
import { colors } from "@/theme/colors";

import { Avatar } from "./Avatar";
import { RowProps } from "./types";

export const MessageRow = memo(({ item, onLayout }: RowProps<MessageItem>) => (
  <View style={[styles.row, item.isMine && styles.rowMine]} onLayout={onLayout}>
    {!item.isMine && <Avatar source={item.author.avatar} size={28} recyclingKey={`${item.id}-avatar`} />}
    <View style={[styles.bubble, item.isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
      <Text style={[styles.text, item.isMine && styles.textMine]} numberOfLines={item.lines}>
        {item.text}
      </Text>
      <Text style={[styles.meta, item.isMine && styles.metaMine]}>
        #{item.index} · {item.sentAt}
      </Text>
    </View>
  </View>
));

MessageRow.displayName = "MessageRow";

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: colors.white,
  },
  rowMine: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bubbleMine: {
    borderBottomRightRadius: 4,
    backgroundColor: colors.navy,
  },
  bubbleTheirs: {
    borderBottomLeftRadius: 4,
    backgroundColor: colors.surface,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.navy,
  },
  textMine: {
    color: colors.white,
  },
  meta: {
    paddingTop: 2,
    fontSize: 10,
    color: colors.navy60,
    alignSelf: "flex-end",
  },
  metaMine: {
    color: colors.navy20,
  },
});
