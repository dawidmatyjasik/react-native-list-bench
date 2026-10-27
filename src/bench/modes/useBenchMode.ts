import { Dispatch, RefObject, SetStateAction, useRef, useState } from "react";

import { BenchConfig } from "../config";
import { BenchItem } from "../data/items";
import { BenchListHandle } from "../lists/types";
import { afterNextPaint, benchLog } from "../measure/benchLog";
import { waitForRow } from "../measure/mountedRows";

import { useTimers } from "./useTimers";

// Long enough for the runner to finish preparing and for Flashlight to start sampling.
const MODE_START_DELAY_MS = 4000;
const SETTLE_MS = 1000;
const MOUNT_HOLD_MS = 500;
const MOUNT_GAP_MS = 300;
const JUMP_TIMEOUT_MS = 5000;
const JUMP_PAUSE_MS = 800;
const TICKER_INTERVAL_MS = 100;
const TICKER_TICKS = 100;
const TICKER_ROWS = 6;
const STREAM_INTERVAL_MS = 300;
const STREAM_MESSAGES = 50;
const PAGE_SIZE = 50;
const PAGE_DELAY_MS = 150;

type BenchModeOptions = {
  config: BenchConfig;
  isChat: boolean;
  listRef: RefObject<BenchListHandle | null>;
  dataLength: number;
  setData: Dispatch<SetStateAction<BenchItem[]>>;
  nextItems: (count: number) => BenchItem[];
};

const roundMs = (ms: number) => Math.round(ms * 10) / 10;

const nextPaint = () => new Promise<void>(resolve => afterNextPaint(resolve));

const jumpTargets = (count: number) =>
  [Math.floor(count / 2), count - 1, Math.floor(count / 4), 0, Math.floor((count * 3) / 4)].filter(
    (target, position, all) => all.indexOf(target) === position,
  );

const bumpItem = (item: BenchItem): BenchItem => ("likes" in item ? { ...item, likes: item.likes + 1 } : { ...item });

export const useBenchMode = ({ config, isChat, listRef, dataLength, setData, nextItems }: BenchModeOptions) => {
  const { later, wait } = useTimers();
  const [mount, setMount] = useState({ iteration: 0, isMounted: true });
  const isLoadingPage = useRef(false);

  const runJumps = async () => {
    for (const target of jumpTargets(dataLength)) {
      const startedAt = performance.now();
      const shown = waitForRow(target).then(() => "shown" as const);
      listRef.current?.scrollToIndex(target);
      const outcome = await Promise.race([shown, wait(JUMP_TIMEOUT_MS).then(() => "timeout" as const)]);
      if (outcome === "shown") {
        await nextPaint();
        benchLog("jump", { target, ms: roundMs(performance.now() - startedAt) });
      } else {
        benchLog("jump", { target, ms: null, timedOut: true });
      }
      await wait(JUMP_PAUSE_MS);
    }
    benchLog("done");
  };

  const runTicker = () => {
    let tick = 0;
    const step = () => {
      const offset = tick % TICKER_ROWS;
      setData(previous => {
        const index = isChat ? previous.length - 1 - offset : offset;
        const next = previous.slice();
        next[index] = bumpItem(previous[index]);
        return next;
      });
      tick += 1;
      if (tick < TICKER_TICKS) {
        later(step, TICKER_INTERVAL_MS);
      } else {
        later(() => benchLog("done"), SETTLE_MS);
      }
    };
    step();
  };

  const runStream = () => {
    let sent = 0;
    const step = () => {
      const message = nextItems(1);
      setData(previous => [...previous, ...message]);
      sent += 1;
      if (sent < STREAM_MESSAGES) {
        later(step, STREAM_INTERVAL_MS);
      } else {
        later(() => benchLog("done"), SETTLE_MS);
      }
    };
    step();
  };

  const remount = (iteration: number) => {
    setMount({ iteration: iteration - 1, isMounted: false });
    later(() => setMount({ iteration, isMounted: true }), MOUNT_GAP_MS);
  };

  const startMode = () => {
    switch (config.mode) {
      case "mount":
        later(() => remount(1), MODE_START_DELAY_MS);
        break;
      case "jump":
        later(runJumps, MODE_START_DELAY_MS);
        break;
      case "ticker":
        later(runTicker, MODE_START_DELAY_MS);
        break;
      case "stream":
        later(runStream, MODE_START_DELAY_MS);
        break;
    }
  };

  // The first paint is the screen's own mount; in the mount mode every later paint is a remount.
  const handlePainted = (elapsedMs: number) => {
    const { iteration } = mount;
    if (iteration === 0) {
      benchLog("ready", { ms: roundMs(elapsedMs) });
      startMode();
      return;
    }
    benchLog("mount", { iteration, ms: roundMs(elapsedMs) });
    if (iteration >= config.repeat) {
      later(() => benchLog("done"), SETTLE_MS);
      return;
    }
    later(() => remount(iteration + 1), MOUNT_HOLD_MS);
  };

  const loadNextPage = () => {
    if (isLoadingPage.current) {
      return;
    }
    isLoadingPage.current = true;
    later(() => {
      const page = nextItems(PAGE_SIZE);
      setData(previous => [...previous, ...page]);
      isLoadingPage.current = false;
      benchLog("page", { size: page.length });
    }, PAGE_DELAY_MS);
  };

  return {
    hostKey: mount.iteration,
    isHostMounted: mount.isMounted,
    handlePainted,
    handleEndReached: config.mode === "infinite" ? loadNextPage : undefined,
  };
};
