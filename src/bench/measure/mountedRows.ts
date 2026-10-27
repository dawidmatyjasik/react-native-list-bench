// Which item indices currently have a row on screen, kept outside React so rows can report
// without re-rendering anything. A recycled row reports again when it switches to a new item.
const mounted = new Set<number>();
let waiting: { index: number; resolve: () => void } | null = null;

export const rowShown = (index: number) => {
  mounted.add(index);
  if (waiting?.index === index) {
    const { resolve } = waiting;
    waiting = null;
    resolve();
  }
};

export const rowHidden = (index: number) => {
  mounted.delete(index);
};

export const waitForRow = (index: number) =>
  new Promise<void>(resolve => {
    if (mounted.has(index)) {
      resolve();
      return;
    }
    waiting = { index, resolve };
  });

export const resetMountedRows = () => {
  mounted.clear();
  waiting = null;
};
