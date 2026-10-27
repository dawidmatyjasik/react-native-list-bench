import { ScenarioId } from "../config";

import { AVATARS, PHOTOS } from "./assets";
import { BenchItem, Person, ShelfCard } from "./items";
import { createRandom, Random } from "./random";
import { paragraph, place, sentence, userName, word } from "./words";

const SEED = 2026;

const person = (random: Random): Person => ({
  name: userName(random),
  avatar: random.pick(AVATARS),
});

const clock = (index: number) => {
  const minutes = (8 * 60 + index) % (24 * 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
};

const tiny = (random: Random, index: number): BenchItem => ({
  kind: "tiny",
  id: `tiny-${index}`,
  index,
  title: `${word(random)} ${word(random)}`,
  subtitle: sentence(random, 3, 6),
});

const medium = (random: Random, index: number): BenchItem => ({
  kind: "medium",
  id: `medium-${index}`,
  index,
  author: person(random),
  photo: random.pick(PHOTOS),
  caption: sentence(random, 8, 20),
  likes: random.int(0, 25000),
});

const feed = (random: Random, index: number): BenchItem => ({
  kind: "feed",
  id: `feed-${index}`,
  index,
  author: person(random),
  location: place(random),
  photos: Array.from({ length: random.int(1, 4) }, () => random.pick(PHOTOS)),
  caption: paragraph(random, random.int(1, 3)),
  tags: Array.from({ length: random.int(0, 6) }, () => word(random)),
  likes: random.int(0, 250000),
  comments: Array.from({ length: random.int(0, 2) }, () => ({
    author: person(random),
    text: sentence(random, 4, 16),
  })),
  postedAt: `${random.int(1, 23)}h`,
});

// Skewed towards short rows with a long tail, like comments or notifications.
const variable = (random: Random, index: number): BenchItem => {
  const height = Math.round(48 + Math.pow(random.next(), 2.5) * 560);
  return {
    kind: "variable",
    id: `variable-${index}`,
    index,
    height,
    title: sentence(random, 2, 5),
    body: paragraph(random, Math.max(1, Math.round(height / 60))),
  };
};

const mixed = (random: Random, index: number): BenchItem => {
  if (index % 25 === 0) {
    return { kind: "section", id: `section-${index}`, index, title: sentence(random, 2, 4) };
  }
  const roll = random.next();
  if (roll < 0.4) {
    return { kind: "text-post", id: `text-${index}`, index, author: person(random), text: paragraph(random, random.int(1, 3)) };
  }
  if (roll < 0.75) {
    return { ...medium(random, index), id: `photo-${index}` };
  }
  if (roll < 0.88) {
    return {
      kind: "promo",
      id: `promo-${index}`,
      index,
      title: sentence(random, 3, 6),
      chips: Array.from({ length: random.int(3, 8) }, () => word(random)),
    };
  }
  return {
    kind: "poll",
    id: `poll-${index}`,
    index,
    question: sentence(random, 5, 10),
    options: Array.from({ length: random.int(2, 4) }, () => ({ label: sentence(random, 1, 3), share: random.next() })),
  };
};

const grid = (random: Random, index: number): BenchItem => ({
  kind: "grid",
  id: `grid-${index}`,
  index,
  photo: random.pick(PHOTOS),
});

const shelfCard = (random: Random, shelfIndex: number, index: number): ShelfCard => ({
  id: `card-${shelfIndex}-${index}`,
  title: `${word(random)} ${word(random)}`,
  subtitle: sentence(random, 2, 4),
  photo: random.pick(PHOTOS),
});

const shelves = (random: Random, index: number): BenchItem => ({
  kind: "shelf",
  id: `shelf-${index}`,
  index,
  title: sentence(random, 2, 4),
  cards: Array.from({ length: 20 }, (_, card) => shelfCard(random, index, card)),
});

const chat = (random: Random, index: number): BenchItem => {
  const isMine = random.chance(0.45);
  const lines = Math.min(8, 1 + Math.floor(Math.pow(random.next(), 2) * 8));
  return {
    kind: "message",
    id: `message-${index}`,
    index,
    isMine,
    author: person(random),
    text: sentence(random, lines * 4, lines * 7),
    lines,
    sentAt: clock(index),
  };
};

const FACTORIES: Record<ScenarioId, (random: Random, index: number) => BenchItem> = {
  tiny,
  medium,
  heavy: feed,
  variable,
  mixed,
  grid,
  shelves,
  chat,
};

// Keeps drawing from one seeded stream, so the first N items are the same whatever the count, and
// modes that add items later (stream, infinite) continue the same sequence.
export const createItemSource = (scenario: ScenarioId) => {
  const random = createRandom(SEED);
  const factory = FACTORIES[scenario];
  let produced = 0;

  return (count: number) =>
    Array.from({ length: count }, () => {
      const item = factory(random, produced);
      produced += 1;
      return item;
    });
};

export const generateItems = (scenario: ScenarioId, count: number) => createItemSource(scenario)(count);
