import { BenchItem, ShelfCard } from "@/bench/data/items";

export const keyExtractor = (item: BenchItem) => item.id;

export const getItemType = (item: BenchItem) => item.kind;

export const cardKeyExtractor = (card: ShelfCard) => card.id;
