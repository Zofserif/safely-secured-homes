import { useSyncExternalStore } from "react";

let bonusEndsAtValue: number | null = null;
let bonusInitialized = false;
const bonusListeners = new Set<() => void>();

const initBonusTimer = () => {
  if (bonusInitialized) return;

  bonusInitialized = true;
  if (typeof window === "undefined") return;

  const storageKey = "ssh_bonus_started_at";
  const storedStart = localStorage.getItem(storageKey);
  let startAt = storedStart ? Date.parse(storedStart) : Number.NaN;

  if (Number.isNaN(startAt)) {
    startAt = Date.now();
    localStorage.setItem(storageKey, new Date(startAt).toISOString());
  }

  bonusEndsAtValue = startAt + 24 * 60 * 60 * 1000;
  bonusListeners.forEach((listener) => listener());
};

const subscribeToBonusTimer = (callback: () => void) => {
  bonusListeners.add(callback);
  initBonusTimer();

  return () => {
    bonusListeners.delete(callback);
  };
};

const getBonusSnapshot = () => bonusEndsAtValue;
const getBonusServerSnapshot = () => null;

export const resetBonusTimerForDebug = () => {
  bonusInitialized = false;
  bonusEndsAtValue = null;

  if (typeof window !== "undefined") {
    localStorage.removeItem("ssh_bonus_started_at");
  }

  initBonusTimer();
};

export const refreshBonusTimerFromStorage = () => {
  bonusInitialized = false;
  bonusEndsAtValue = null;
  initBonusTimer();
};

export const useBonusEndsAt = () =>
  useSyncExternalStore(
    subscribeToBonusTimer,
    getBonusSnapshot,
    getBonusServerSnapshot,
  );
