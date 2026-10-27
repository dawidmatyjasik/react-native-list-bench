import { BenchItem } from "@/bench/data/items";

import { FeedRow } from "./feed/FeedRow";
import { GridCell } from "./GridCell";
import { MediumRow } from "./MediumRow";
import { MessageRow } from "./MessageRow";
import { PollRow } from "./PollRow";
import { PromoRow } from "./PromoRow";
import { SectionRow } from "./SectionRow";
import { ShelfRow } from "./ShelfRow";
import { TextPostRow } from "./TextPostRow";
import { TinyRow } from "./TinyRow";
import { RowProps } from "./types";
import { VariableRow } from "./VariableRow";

export const BenchRow = ({ item, onLayout }: RowProps<BenchItem>) => {
  switch (item.kind) {
    case "tiny":
      return <TinyRow item={item} onLayout={onLayout} />;
    case "medium":
      return <MediumRow item={item} onLayout={onLayout} />;
    case "feed":
      return <FeedRow item={item} onLayout={onLayout} />;
    case "variable":
      return <VariableRow item={item} onLayout={onLayout} />;
    case "section":
      return <SectionRow item={item} onLayout={onLayout} />;
    case "text-post":
      return <TextPostRow item={item} onLayout={onLayout} />;
    case "promo":
      return <PromoRow item={item} onLayout={onLayout} />;
    case "poll":
      return <PollRow item={item} onLayout={onLayout} />;
    case "grid":
      return <GridCell item={item} onLayout={onLayout} />;
    case "shelf":
      return <ShelfRow item={item} onLayout={onLayout} />;
    case "message":
      return <MessageRow item={item} onLayout={onLayout} />;
  }
};
