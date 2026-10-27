// The heavy row is a realistic feed card plus two explicit costs, so "heavy" means the same thing
// on every list and in every write-up: this much synchronous JS per render, this many extra views.
export const HEAVY_RENDER_MS = 0.3;
export const HEAVY_GRID_CELLS = 100;

export const burnJs = (ms: number) => {
  const end = performance.now() + ms;
  let acc = 0;
  while (performance.now() < end) {
    acc += Math.sqrt(acc + 1) * Math.sin(acc);
  }
  return acc;
};
