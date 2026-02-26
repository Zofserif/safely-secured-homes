import type { HomeCtaState, HomeScarcityState } from "../types";

type UseHomeCtaAndScarcityArgs = {
  reportsRemaining: number | null;
  reportsLoading: boolean;
  reportsError: boolean;
  hasExistingPlan: boolean;
  nowMs: number;
  bonusEndsAt: number | null;
};

const formatCountdown = (targetMs: number, currentMs: number) => {
  const diffMs = Math.max(0, targetMs - currentMs);
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
};

const getNextFridayMidnightGmt8 = (currentMs: number) => {
  const offsetMs = 8 * 60 * 60 * 1000;
  const gmt8Date = new Date(currentMs + offsetMs);
  const day = gmt8Date.getUTCDay();
  let daysUntilFriday = (5 - day + 7) % 7;

  if (daysUntilFriday === 0) daysUntilFriday = 7;

  return (
    Date.UTC(
      gmt8Date.getUTCFullYear(),
      gmt8Date.getUTCMonth(),
      gmt8Date.getUTCDate() + daysUntilFriday,
      0,
      0,
      0,
      0,
    ) - offsetMs
  );
};

export const useHomeCtaAndScarcity = ({
  reportsRemaining,
  reportsLoading,
  reportsError,
  hasExistingPlan,
  nowMs,
  bonusEndsAt,
}: UseHomeCtaAndScarcityArgs): { cta: HomeCtaState; scarcity: HomeScarcityState } => {
  const reportsSoldOut = reportsRemaining !== null && reportsRemaining <= 0;
  const hasClock = nowMs > 0;

  const ctaTarget =
    reportsSoldOut && !hasExistingPlan
      ? "newsletter"
      : hasExistingPlan
        ? "results"
        : "form";
  const ctaLabel =
    reportsSoldOut && !hasExistingPlan
      ? "JOIN THE PRIORITY WAITLIST"
      : hasExistingPlan
        ? "SEE MY PLAN"
        : "GET MY FREE PLAN";
  const ctaDisabled = ctaTarget === "form" && reportsSoldOut && !hasExistingPlan;

  const refreshEndsAt = hasClock ? getNextFridayMidnightGmt8(nowMs) : null;
  const countdown = refreshEndsAt ? formatCountdown(refreshEndsAt, nowMs) : "";
  const countdownLabel = countdown ? ` (${countdown} left)` : "";
  const bonusCountdown =
    hasClock && bonusEndsAt !== null ? formatCountdown(bonusEndsAt, nowMs) : "";
  const bonusExpired = hasClock && bonusEndsAt !== null && nowMs >= bonusEndsAt;

  return {
    cta: {
      target: ctaTarget,
      label: ctaLabel,
      disabled: ctaDisabled,
    },
    scarcity: {
      show: !hasExistingPlan,
      loading: reportsLoading,
      error: reportsError,
      reportsRemaining,
      soldOut: reportsSoldOut,
      countdownLabel,
      bonusEndsAt,
      bonusCountdown,
      bonusExpired,
    },
  };
};
