import { Image } from "expo-image";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ShelfCard } from "@/bench/data/items";
import { colors } from "@/theme/colors";

export const SHELF_CARD_WIDTH = 140;

type ShelfCardViewProps = {
  card: ShelfCard;
};

export const ShelfCardView = memo(({ card }: ShelfCardViewProps) => (
  <View style={styles.card}>
    <Image source={card.photo} recyclingKey={card.id} style={styles.photo} />
    <Text style={styles.title} numberOfLines={1}>
      {card.title}
    </Text>
    <Text style={styles.subtitle} numberOfLines={1}>
      {card.subtitle}
    </Text>
  </View>
));

ShelfCardView.displayName = "ShelfCardView";

const styles = StyleSheet.create({
  // Spacing lives inside the card so the shelf never shows the blank colour between cards.
  card: {
    width: SHELF_CARD_WIDTH,
    height: "100%",
    paddingLeft: 12,
    backgroundColor: colors.white,
  },
  photo: {
    width: SHELF_CARD_WIDTH - 12,
    height: 168,
    borderRadius: 8,
    backgroundColor: colors.navy20,
  },
  title: {
    paddingTop: 6,
    fontSize: 13,
    fontWeight: "700",
    color: colors.navy,
  },
  subtitle: {
    fontSize: 12,
    color: colors.navy60,
  },
});
