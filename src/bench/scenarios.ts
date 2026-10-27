import { StyleSheet } from "react-native";

import { ScenarioId } from "./config";
import { SizeHints } from "./lists/types";
import { GRID_COLUMNS } from "./rows/GridCell";
import { MEDIUM_ROW_CHROME_HEIGHT } from "./rows/MediumRow";
import { SHELF_ROW_HEIGHT } from "./rows/ShelfRow";
import { TINY_ROW_HEIGHT } from "./rows/TinyRow";

type Scenario = {
  numColumns: number;
  isChat: boolean;
  // Only used when a run asks for hints; by default no list is told anything about sizes.
  hints: (windowWidth: number) => SizeHints;
};

const estimateOnly = (estimatedItemSize: number) => () => ({ estimatedItemSize, fixedItemSize: null });

const fixed = (size: number) => ({ estimatedItemSize: size, fixedItemSize: size });

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  tiny: { numColumns: 1, isChat: false, hints: () => fixed(TINY_ROW_HEIGHT) },
  medium: {
    numColumns: 1,
    isChat: false,
    hints: width => fixed(MEDIUM_ROW_CHROME_HEIGHT + width + StyleSheet.hairlineWidth),
  },
  heavy: { numColumns: 1, isChat: false, hints: width => ({ estimatedItemSize: width + 420, fixedItemSize: null }) },
  variable: { numColumns: 1, isChat: false, hints: estimateOnly(208) },
  mixed: { numColumns: 1, isChat: false, hints: estimateOnly(300) },
  grid: { numColumns: GRID_COLUMNS, isChat: false, hints: width => fixed(width / GRID_COLUMNS) },
  shelves: { numColumns: 1, isChat: false, hints: () => fixed(SHELF_ROW_HEIGHT) },
  chat: { numColumns: 1, isChat: true, hints: estimateOnly(64) },
};
