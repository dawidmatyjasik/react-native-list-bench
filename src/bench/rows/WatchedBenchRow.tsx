import { useEffect } from "react";

import { BenchItem } from "@/bench/data/items";
import { rowHidden, rowShown } from "@/bench/measure/mountedRows";

import { BenchRow } from "./BenchRow";
import { RowProps } from "./types";

// Only the jump mode uses this, so the extra effect per row never touches the other measurements.
export const WatchedBenchRow = ({ item, onLayout }: RowProps<BenchItem>) => {
  useEffect(() => {
    rowShown(item.index);
    return () => rowHidden(item.index);
  }, [item.index]);

  return <BenchRow item={item} onLayout={onLayout} />;
};
