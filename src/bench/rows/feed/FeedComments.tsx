import { StyleSheet, Text, View } from "react-native";

import { FeedComment } from "@/bench/data/items";
import { colors } from "@/theme/colors";

import { Avatar } from "../Avatar";

type FeedCommentsProps = {
  id: string;
  comments: FeedComment[];
};

export const FeedComments = ({ id, comments }: FeedCommentsProps) => (
  <View style={styles.comments}>
    {comments.map((comment, position) => (
      <View key={position} style={styles.comment}>
        <Avatar source={comment.author.avatar} size={22} recyclingKey={`${id}-comment-${position}`} />
        <Text style={styles.text} numberOfLines={2}>
          <Text style={styles.author}>{comment.author.name} </Text>
          {comment.text}
        </Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  comments: {
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  comment: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.navy,
  },
  author: {
    fontWeight: "700",
  },
});
