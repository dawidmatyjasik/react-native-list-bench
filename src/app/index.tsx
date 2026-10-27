import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COUNTS, LIST_IDS, LIST_LABELS, MODES, SCENARIO_IDS, SCENARIO_LABELS } from "@/bench/config";
import { OptionGroup } from "@/launcher/OptionGroup";
import { useLaunchOptions } from "@/launcher/useLaunchOptions";
import { colors } from "@/theme/colors";

const LIST_OPTIONS = LIST_IDS.map(value => ({ value, label: LIST_LABELS[value] }));
const SCENARIO_OPTIONS = SCENARIO_IDS.map(value => ({ value, label: SCENARIO_LABELS[value] }));
const COUNT_OPTIONS = COUNTS.map(value => ({ value, label: value.toLocaleString("en-US") }));
const MODE_OPTIONS = MODES.map(value => ({ value, label: value }));
const HINT_OPTIONS = [
  { value: "0", label: "none" },
  { value: "1", label: "size hints" },
] as const;

const Launcher = () => {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const options = useLaunchOptions();

  const handleRun = () => router.push({ pathname: "/bench", params: options.params });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: top + 16, paddingBottom: bottom + 24 }]}>
      <View style={styles.hero}>
        <Image source={require("../../assets/brand/swm-logo-filled.png")} style={styles.logo} contentFit="contain" />
        <Text style={styles.title}>List Bench</Text>
        <Text style={styles.subtitle}>FlatList · FlashList · LegendList, measured the same way.</Text>
      </View>
      <OptionGroup title="List" testIdPrefix="list" options={LIST_OPTIONS} value={options.list} onChange={options.setList} />
      <OptionGroup
        title="Scenario"
        testIdPrefix="scenario"
        options={SCENARIO_OPTIONS}
        value={options.scenario}
        onChange={options.setScenario}
      />
      <OptionGroup title="Items" testIdPrefix="count" options={COUNT_OPTIONS} value={options.count} onChange={options.setCount} />
      <OptionGroup title="Mode" testIdPrefix="mode" options={MODE_OPTIONS} value={options.mode} onChange={options.setMode} />
      <OptionGroup title="Hints" testIdPrefix="hints" options={HINT_OPTIONS} value={options.hints} onChange={options.setHints} />
      <Pressable testID="run" accessibilityRole="button" onPress={handleRun} style={styles.run}>
        <Text style={styles.runLabel}>Run benchmark</Text>
      </Pressable>
    </ScrollView>
  );
};

export default Launcher;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    gap: 22,
    paddingHorizontal: 20,
  },
  hero: {
    gap: 6,
  },
  logo: {
    width: 120,
    height: 64,
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.navy,
  },
  subtitle: {
    fontSize: 15,
    color: colors.navy60,
  },
  run: {
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: colors.navy,
  },
  runLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.white,
  },
});
