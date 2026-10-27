import { useContext } from "react";

import { FLASHLIST_POOL_LIMIT } from "../BenchFlashList";
import { ListIdContext } from "../ListIdContext";

import { ShelfFlashList } from "./ShelfFlashList";
import { ShelfFlatList } from "./ShelfFlatList";
import { ShelfLegendList } from "./ShelfLegendList";
import { ShelfListProps } from "./types";

export const ShelfList = ({ cards }: ShelfListProps) => {
  const list = useContext(ListIdContext);

  switch (list) {
    case "flatlist":
    case "flatlist-tuned":
      return <ShelfFlatList cards={cards} />;
    case "flashlist":
      return <ShelfFlashList cards={cards} maxItemsInRecyclePool={undefined} />;
    case "flashlist-pool":
      return <ShelfFlashList cards={cards} maxItemsInRecyclePool={FLASHLIST_POOL_LIMIT} />;
    case "legend":
      return <ShelfLegendList cards={cards} recycleItems={false} />;
    case "legend-recycle":
      return <ShelfLegendList cards={cards} recycleItems />;
  }
};
