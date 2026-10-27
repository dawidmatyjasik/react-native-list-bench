import { LayoutChangeEvent } from "react-native";

export type RowProps<T> = {
  item: T;
  onLayout?: (event: LayoutChangeEvent) => void;
};
