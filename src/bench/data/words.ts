import { Random } from "./random";

const WORDS = [
  "react", "native", "list", "scroll", "render", "frame", "layout", "measure", "recycle", "cell",
  "view", "thread", "bridge", "fabric", "hermes", "worklet", "gesture", "screen", "metro", "bundle",
  "image", "cache", "memory", "pixel", "density", "viewport", "window", "batch", "commit", "mount",
  "update", "state", "props", "context", "effect", "callback", "memo", "key", "index", "item",
  "header", "footer", "section", "sticky", "column", "grid", "carousel", "message", "chat", "feed",
  "profile", "comment", "like", "share", "story", "photo", "video", "caption", "tag", "mention",
  "fast", "smooth", "steady", "jank", "blank", "space", "drop", "budget", "millisecond", "second",
  "android", "ios", "device", "emulator", "release", "build", "profile", "trace", "flame", "sample",
  "krakow", "warsaw", "wroclaw", "gdansk", "poznan", "lodz", "vistula", "tatra", "baltic", "mazury",
  "coffee", "pierogi", "sunset", "mountain", "river", "forest", "bridge", "market", "garden", "harbor",
  "morning", "evening", "weekend", "summer", "winter", "spring", "autumn", "today", "tomorrow", "always",
  "quick", "quiet", "bright", "gentle", "bold", "simple", "honest", "tiny", "heavy", "light",
];

const NAMES = [
  "ania", "bartek", "celina", "damian", "ewa", "filip", "gosia", "henryk", "iga", "jakub",
  "kasia", "lukasz", "marta", "norbert", "ola", "piotr", "renata", "szymon", "tomek", "ula",
  "wiktor", "zosia", "adam", "beata", "cezary", "dorota", "emil", "franek", "grazyna", "hubert",
];

const PLACES = ["Kraków", "Warszawa", "Wrocław", "Gdańsk", "Poznań", "Łódź", "Zakopane", "Sopot"];

export const word = (random: Random) => random.pick(WORDS);

export const userName = (random: Random) => `${random.pick(NAMES)}_${random.pick(WORDS)}`;

export const place = (random: Random) => random.pick(PLACES);

export const sentence = (random: Random, minWords: number, maxWords: number) => {
  const length = random.int(minWords, maxWords);
  const words = Array.from({ length }, () => word(random));
  const text = words.join(" ");
  return text.charAt(0).toUpperCase() + text.slice(1) + ".";
};

export const paragraph = (random: Random, sentences: number) =>
  Array.from({ length: sentences }, () => sentence(random, 6, 14)).join(" ");
