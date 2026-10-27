import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { colors } from "@/theme/colors";

// No transition animation: a pushed benchmark screen should start measuring on a still screen.
const RootLayout = () => (
  <>
    <Stack screenOptions={{ headerShown: false, animation: "none", contentStyle: { backgroundColor: colors.white } }} />
    <StatusBar style="dark" />
  </>
);

export default RootLayout;
