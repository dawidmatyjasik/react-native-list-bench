import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

const ACTIONS = ["♡", "◯", "➤"] as const;

type FeedActionsProps = {
  likes: number;
};

export const FeedActions = ({ likes }: FeedActionsProps) => (
  <View>
    <View style={styles.bar}>
      {ACTIONS.map(glyph => (
        <View key={glyph} style={styles.action}>
          <Text style={styles.glyph}>{glyph}</Text>
        </View>
      ))}
      <View style={styles.spacer} />
      <View style={styles.action}>
        <Text style={styles.glyph}>⌑</Text>
      </View>
    </View>
    <Text style={styles.likes}>{likes.toLocaleString("en-US")} likes</Text>
  </View>
);

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  action: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  glyph: {
    fontSize: 22,
    color: colors.navy,
  },
  spacer: {
    flex: 1,
  },
  likes: {
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: "700",
    color: colors.navy,
  },
});
