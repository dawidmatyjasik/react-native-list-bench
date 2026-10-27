import { ReactElement, Ref } from "react";

import { BenchItem } from "@/bench/data/items";

export type BenchListHandle = {
  scrollToIndex: (index: number) => void;
};

export type SizeHints = {
  estimatedItemSize: number;
  fixedItemSize: number | null;
};

export type BenchListProps = {
  data: BenchItem[];
  renderRow: (item: BenchItem) => ReactElement;
  numColumns: number;
  isChat: boolean;
  hints: SizeHints | null;
  onEndReached?: () => void;
  ref: Ref<BenchListHandle>;
};
