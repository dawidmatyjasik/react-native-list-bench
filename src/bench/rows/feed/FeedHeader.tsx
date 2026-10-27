import { StyleSheet, Text, View } from "react-native";

import { FeedItem } from "@/bench/data/items";
import { colors } from "@/theme/colors";

import { Avatar } from "../Avatar";
import { IndexBadge } from "../IndexBadge";

type FeedHeaderProps = {
  item: FeedItem;
};

export const FeedHeader = ({ item }: FeedHeaderProps) => (
  <View style={styles.header}>
    <View style={styles.ring}>
      <Avatar source={item.author.avatar} size={34} recyclingKey={`${item.id}-avatar`} />
    </View>
    <View style={styles.text}>
      <View style={styles.nameRow}>
        <Text style={styles.name} numberOfLines={1}>
          {item.author.name}
        </Text>
        <View style={styles.verified}>
          <Text style={styles.verifiedMark}>✓</Text>
        </View>
      </View>
      <Text style={styles.location} numberOfLines={1}>
        {item.location}
      </Text>
    </View>
    <IndexBadge index={item.index} />
    <Text style={styles.more}>•••</Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  ring: {
    padding: 2,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.purple,
  },
  text: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.navy,
  },
  verified: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.blue,
  },
  verifiedMark: {
    fontSize: 9,
    fontWeight: "900",
    color: colors.white,
  },
  location: {
    fontSize: 12,
    color: colors.navy60,
  },
  more: {
    fontSize: 14,
    color: colors.navy,
  },
});
