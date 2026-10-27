// Release builds still forward console.log to logcat (tag ReactNativeJS); the runner greps for the
// BENCH prefix, so every line it needs must go through here.
export const benchLog = (event: string, payload: Record<string, unknown> = {}) => {
  console.log(`BENCH ${JSON.stringify({ event, ...payload })}`);
};

export const afterNextPaint = (callback: () => void) => {
  requestAnimationFrame(() => requestAnimationFrame(callback));
};
