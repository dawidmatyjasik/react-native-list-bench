import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

type FeedTagsProps = {
  tags: string[];
};

export const FeedTags = ({ tags }: FeedTagsProps) => (
  <View style={styles.tags}>
    {tags.map((tag, position) => (
      <View key={position} style={styles.tag}>
        <Text style={styles.text}>#{tag}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  text: {
    fontSize: 12,
    color: colors.purple,
  },
});
