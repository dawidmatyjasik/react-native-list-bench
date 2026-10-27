import { StyleSheet, Text } from "react-native";

import { colors } from "@/theme/colors";

type IndexBadgeProps = {
  index: number;
  isInverse?: boolean;
};

export const IndexBadge = ({ index, isInverse = false }: IndexBadgeProps) => (
  <Text style={[styles.badge, isInverse && styles.inverse]}>#{index}</Text>
);

const styles = StyleSheet.create({
  badge: {
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    color: colors.navy60,
  },
  inverse: {
    color: colors.navy20,
  },
});
