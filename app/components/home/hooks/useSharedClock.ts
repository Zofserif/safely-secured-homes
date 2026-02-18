import { useSyncExternalStore } from "react";

let clockValue = 0;
let clockTimer: ReturnType<typeof setInterval> | null = null;
const clockListeners = new Set<() => void>();

const startClock = () => {
  if (clockTimer) return;

  const tick = () => {
    clockValue = Date.now();
    clockListeners.forEach((listener) => listener());
  };

  tick();
  clockTimer = setInterval(tick, 1000);
};

const subscribeToClock = (callback: () => void) => {
  clockListeners.add(callback);
  startClock();

  return () => {
    clockListeners.delete(callback);
    if (clockListeners.size === 0 && clockTimer) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  };
};

const getClockSnapshot = () => clockValue;
const getClockServerSnapshot = () => 0;

export const useSharedClockNowMs = () =>
  useSyncExternalStore(subscribeToClock, getClockSnapshot, getClockServerSnapshot);
