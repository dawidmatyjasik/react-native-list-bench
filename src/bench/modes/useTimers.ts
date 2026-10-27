import { useEffect, useRef } from "react";

// Timers started from callbacks rather than effects, all cleared when the screen goes away.
export const useTimers = () => {
  const timeouts = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timeouts.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const later = (callback: () => void, ms: number) => {
    const id = setTimeout(() => {
      timeouts.current.delete(id);
      callback();
    }, ms);
    timeouts.current.add(id);
  };

  const wait = (ms: number) => new Promise<void>(resolve => later(resolve, ms));

  return { later, wait };
};
