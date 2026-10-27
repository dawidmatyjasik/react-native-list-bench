import { StyleSheet, View } from "react-native";

import { colors } from "@/theme/colors";

import { HEAVY_GRID_CELLS } from "./heavyCost";

const CELLS = Array.from({ length: HEAVY_GRID_CELLS }, (_, i) => i);

export const StressGrid = () => (
  <View style={styles.grid}>
    {CELLS.map(cell => (
      <View key={cell} style={styles.cell}>
        <View style={styles.inner}>
          <View style={styles.dot} />
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  cell: {
    width: 8,
    height: 8,
    borderWidth: 0.5,
    borderRadius: 2,
    borderColor: colors.navy20,
    padding: 1,
  },
  inner: {
    flex: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.navy40,
  },
});
