import { Image } from "expo-image";
import { StyleSheet } from "react-native";

import { colors } from "@/theme/colors";

type AvatarProps = {
  source: number;
  size: number;
  recyclingKey: string;
};

export const Avatar = ({ source, size, recyclingKey }: AvatarProps) => (
  <Image
    source={source}
    recyclingKey={recyclingKey}
    style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
  />
);

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.navy20,
  },
});
