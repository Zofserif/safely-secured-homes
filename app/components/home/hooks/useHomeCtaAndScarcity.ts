import type { HomeCtaState, HomeScarcityState, HomeUrgencyTier } from "../types";

type UseHomeCtaAndScarcityArgs = {
  reportsRemaining: number | null;
  reportsLimit: number | null;
  reportsWindowEndsAt: number | null;
  reportsLoading: boolean;
  reportsError: boolean;
  hasExistingPlan: boolean;
  nowMs: number;
  bonusEnabled: boolean;
  bonusEndsAt: number | null;
};

const DEFAULT_REPORT_LIMIT = 15;

const formatCountdown = (targetMs: number, currentMs: number) => {
  const diffMs = Math.max(0, targetMs - currentMs);
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
};

const formatPhtDeadline = (targetMs: number) => {
  const formatter = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${formatter.format(targetMs)} PHT`;
};

const resolveUrgencyTier = (reportsRemaining: number | null): HomeUrgencyTier => {
  if (reportsRemaining !== null && reportsRemaining <= 0) return "sold_out";
  if (reportsRemaining !== null && reportsRemaining <= 3) return "critical";
  if (reportsRemaining !== null && reportsRemaining <= 6) return "low";
  return "normal";
};

export const useHomeCtaAndScarcity = ({
  reportsRemaining,
  reportsLimit,
  reportsWindowEndsAt,
  reportsLoading,
  reportsError,
  hasExistingPlan,
  nowMs,
  bonusEnabled,
  bonusEndsAt,
}: UseHomeCtaAndScarcityArgs): { cta: HomeCtaState; scarcity: HomeScarcityState } => {
  const hasClock = nowMs > 0;
  const urgencyTier = resolveUrgencyTier(reportsRemaining);
  const reportsSoldOut = urgencyTier === "sold_out";
  const resolvedReportsLimit =
    typeof reportsLimit === "number" && reportsLimit > 0
      ? reportsLimit
      : DEFAULT_REPORT_LIMIT;
  const reportsClaimed =
    reportsRemaining === null
      ? 0
      : Math.max(0, Math.min(resolvedReportsLimit, resolvedReportsLimit - reportsRemaining));

  const ctaTarget =
    reportsSoldOut && !hasExistingPlan
      ? "newsletter"
      : hasExistingPlan
        ? "results"
        : "form";
  const ctaLabel =
    reportsSoldOut && !hasExistingPlan
      ? "JOIN THE NEWSLETTER"
      : hasExistingPlan
        ? "SEE MY PLAN"
        : urgencyTier === "critical"
          ? "SECURE MY SLOT NOW"
          : "GET MY PANATAG RATING NOW";
  const ctaDisabled = ctaTarget === "form" && reportsSoldOut && !hasExistingPlan;

  const windowCountdown =
    hasClock && reportsWindowEndsAt !== null
      ? formatCountdown(reportsWindowEndsAt, nowMs)
      : "";
  const windowDeadlinePht =
    reportsWindowEndsAt !== null ? formatPhtDeadline(reportsWindowEndsAt) : "";
  const resolvedBonusEndsAt = bonusEnabled ? bonusEndsAt : null;
  const bonusCountdown =
    hasClock && resolvedBonusEndsAt !== null
      ? formatCountdown(resolvedBonusEndsAt, nowMs)
      : "";
  const bonusExpired =
    !bonusEnabled ||
    (hasClock &&
      resolvedBonusEndsAt !== null &&
      nowMs >= resolvedBonusEndsAt);

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
      reportsLimit: resolvedReportsLimit,
      reportsClaimed,
      urgencyTier,
      soldOut: reportsSoldOut,
      windowEndsAt: reportsWindowEndsAt,
      windowCountdown,
      windowDeadlinePht,
      bonusEnabled,
      bonusEndsAt: resolvedBonusEndsAt,
      bonusCountdown,
      bonusExpired,
    },
  };
};
