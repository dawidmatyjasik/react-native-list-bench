import { ListId } from "@/bench/config";

import { BenchFlashList, FLASHLIST_POOL_LIMIT } from "./BenchFlashList";
import { BenchFlatList } from "./BenchFlatList";
import { BenchLegendList } from "./BenchLegendList";
import { BenchListProps } from "./types";

type BenchListSwitchProps = BenchListProps & {
  list: ListId;
};

export const BenchList = ({ list, ...props }: BenchListSwitchProps) => {
  switch (list) {
    case "flatlist":
      return <BenchFlatList {...props} isTuned={false} />;
    case "flatlist-tuned":
      return <BenchFlatList {...props} isTuned />;
    case "flashlist":
      return <BenchFlashList {...props} maxItemsInRecyclePool={undefined} />;
    case "flashlist-pool":
      return <BenchFlashList {...props} maxItemsInRecyclePool={FLASHLIST_POOL_LIMIT} />;
    case "legend":
      return <BenchLegendList {...props} recycleItems={false} />;
    case "legend-recycle":
      return <BenchLegendList {...props} recycleItems />;
  }
};
