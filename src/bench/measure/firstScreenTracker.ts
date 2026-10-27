import { LayoutChangeEvent } from "react-native";

import { afterNextPaint } from "./benchLog";

const TRACKED_ROWS = 80;

type FirstScreenTrackerOptions = {
  count: number;
  numColumns: number;
  fromEnd: boolean;
  onPainted: (elapsedMs: number) => void;
};

type LayoutHandler = (event: LayoutChangeEvent) => void;

export type FirstScreenTracker = {
  onListLayout: LayoutHandler;
  rowLayoutHandler: (index: number) => LayoutHandler | undefined;
};

// "Painted" means every row from the visible edge has been laid out until together they cover the
// viewport, then two frames pass. The same rule applies to every list, whatever it renders
// off-screen, so lists that render more up front pay for it here.
export const createFirstScreenTracker = ({
  count,
  numColumns,
  fromEnd,
  onPainted,
}: FirstScreenTrackerOptions): FirstScreenTracker => {
  const startedAt = performance.now();
  const heights = new Map<number, number>();
  const handlers = new Map<number, LayoutHandler>();
  let viewport = 0;
  let isDone = false;

  const indexAt = (row: number, column: number) =>
    fromEnd ? count - 1 - (row * numColumns + column) : row * numColumns + column;

  const check = () => {
    if (isDone || viewport === 0) {
      return;
    }
    const rows = Math.min(Math.ceil(count / numColumns), TRACKED_ROWS);
    let filled = 0;
    for (let row = 0; row < rows && filled < viewport; row++) {
      let rowHeight = 0;
      for (let column = 0; column < numColumns; column++) {
        const index = indexAt(row, column);
        if (index < 0 || index >= count) {
          continue;
        }
        const height = heights.get(index);
        if (height === undefined) {
          return;
        }
        rowHeight = Math.max(rowHeight, height);
      }
      filled += rowHeight;
    }
    isDone = true;
    afterNextPaint(() => onPainted(performance.now() - startedAt));
  };

  const isTracked = (index: number) => {
    const fromEdge = fromEnd ? count - 1 - index : index;
    return fromEdge >= 0 && fromEdge < TRACKED_ROWS * numColumns;
  };

  return {
    onListLayout: event => {
      viewport = event.nativeEvent.layout.height;
      check();
    },
    // Stable per index, so handing it to a memoised row does not make the row re-render.
    rowLayoutHandler: index => {
      if (!isTracked(index)) {
        return undefined;
      }
      let handler = handlers.get(index);
      if (handler === undefined) {
        handler = event => {
          heights.set(index, event.nativeEvent.layout.height);
          check();
        };
        handlers.set(index, handler);
      }
      return handler;
    },
  };
};
