import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

import { BenchConfig, benchConfigLabel, SCENARIO_LABELS } from "./config";

type BenchHeaderProps = {
  config: BenchConfig;
};

export const BenchHeader = ({ config }: BenchHeaderProps) => {
  const { top } = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: top }]}>
      <Image source={require("../../assets/brand/swm-logo-filled.png")} style={styles.logo} contentFit="contain" />
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {SCENARIO_LABELS[config.scenario]}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1} testID="bench-label">
          {benchConfigLabel(config)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.navy20,
  },
  logo: {
    width: 60,
    height: 32,
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.navy,
  },
  subtitle: {
    fontSize: 12,
    color: colors.navy60,
  },
});
