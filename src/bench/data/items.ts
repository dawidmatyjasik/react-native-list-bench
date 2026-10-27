type ItemBase = {
  id: string;
  index: number;
};

export type Person = {
  name: string;
  avatar: number;
};

export type TinyItem = ItemBase & {
  kind: "tiny";
  title: string;
  subtitle: string;
};

export type MediumItem = ItemBase & {
  kind: "medium";
  author: Person;
  photo: number;
  caption: string;
  likes: number;
};

export type FeedComment = {
  author: Person;
  text: string;
};

export type FeedItem = ItemBase & {
  kind: "feed";
  author: Person;
  location: string;
  photos: number[];
  caption: string;
  tags: string[];
  likes: number;
  comments: FeedComment[];
  postedAt: string;
};

export type VariableItem = ItemBase & {
  kind: "variable";
  height: number;
  title: string;
  body: string;
};

export type SectionItem = ItemBase & {
  kind: "section";
  title: string;
};

export type TextPostItem = ItemBase & {
  kind: "text-post";
  author: Person;
  text: string;
};

export type PromoItem = ItemBase & {
  kind: "promo";
  title: string;
  chips: string[];
};

export type PollOption = {
  label: string;
  share: number;
};

export type PollItem = ItemBase & {
  kind: "poll";
  question: string;
  options: PollOption[];
};

export type GridItem = ItemBase & {
  kind: "grid";
  photo: number;
};

export type ShelfCard = {
  id: string;
  title: string;
  subtitle: string;
  photo: number;
};

export type ShelfItem = ItemBase & {
  kind: "shelf";
  title: string;
  cards: ShelfCard[];
};

export type MessageItem = ItemBase & {
  kind: "message";
  isMine: boolean;
  author: Person;
  text: string;
  lines: number;
  sentAt: string;
};

export type BenchItem =
  | TinyItem
  | MediumItem
  | FeedItem
  | VariableItem
  | SectionItem
  | TextPostItem
  | PromoItem
  | PollItem
  | GridItem
  | ShelfItem
  | MessageItem;

export type BenchItemKind = BenchItem["kind"];
