import type { HomeScarcityState } from "./types";

export type HomeScarcityCopy = {
  tone: "normal" | "low" | "critical" | "sold_out" | "system";
  statusPill: string;
  timerPill: string;
};

const pluralizeRating = (value: number) => (value === 1 ? "rating" : "ratings");

type HomeScarcityPillSurface = "light" | "dark";

const STATUS_PILL_TONE_CLASSES: Record<
  HomeScarcityPillSurface,
  Record<HomeScarcityCopy["tone"], string>
> = {
  light: {
    normal: "border-[#0E79B2]/25 bg-[#E6F4FB] text-[#0E79B2]",
    low: "border-[#0E79B2]/30 bg-[#D9F0FB] text-[#0B5E8B]",
    critical: "border-[#DD6B20]/35 bg-[#FFF4E8] text-[#9C4221]",
    sold_out: "border-[#E53E3E]/35 bg-[#FFF1F1] text-[#9B2C2C]",
    system: "border-slate-300 bg-slate-100 text-slate-700",
  },
  dark: {
    normal: "border-[#63B3ED]/35 bg-[#1F2937] text-[#BEE9E8]",
    low: "border-[#63B3ED]/40 bg-[#1A2533] text-[#BEE9E8]",
    critical: "border-[#F6AD55]/45 bg-[#3A2A1D] text-[#FBD38D]",
    sold_out: "border-[#FC8181]/45 bg-[#3B1F24] text-[#FEB2B2]",
    system: "border-slate-500/50 bg-[#1A2230] text-slate-200",
  },
};

const TIMER_PILL_CLASSES: Record<HomeScarcityPillSurface, string> = {
  light: "border-slate-200 bg-slate-50 text-slate-700",
  dark: "border-slate-500/40 bg-[#1A2230] text-slate-200",
};

export const getHomeScarcityStatusPillClasses = (
  tone: HomeScarcityCopy["tone"],
  surface: HomeScarcityPillSurface,
) => STATUS_PILL_TONE_CLASSES[surface][tone];

export const getHomeScarcityTimerPillClasses = (
  surface: HomeScarcityPillSurface,
) => TIMER_PILL_CLASSES[surface];

export const buildHomeScarcityCopy = (
  scarcity: HomeScarcityState,
): HomeScarcityCopy => {
  if (scarcity.loading) {
    return {
      tone: "system",
      statusPill: "Checking availability",
      timerPill: "Syncing cycle timer",
    };
  }

  if (scarcity.error) {
    return {
      tone: "system",
      statusPill: "Live availability unavailable",
      timerPill: "Cycle timer unavailable",
    };
  }

  if (scarcity.soldOut) {
    return {
      tone: "sold_out",
      statusPill: "Current cycle is full",
      timerPill: scarcity.windowCountdown
        ? `Panatag Home Rating opens in ${scarcity.windowCountdown} (PHT)`
        : "Panatag Home Rating is opening soon",
    };
  }

  const remainingValue = Math.max(0, scarcity.reportsRemaining ?? 0);
  const limitValue = Math.max(1, scarcity.reportsLimit ?? 1);
  const isCritical = scarcity.urgencyTier === "critical";
  const tone = isCritical
    ? "critical"
    : scarcity.urgencyTier === "low"
      ? "low"
      : "normal";
  const timerPill = scarcity.windowCountdown
    ? `Cycle refreshes in ${scarcity.windowCountdown}`
    : "Cycle timer loading";

  return {
    tone,
    statusPill: isCritical
      ? `Only ${remainingValue} ${pluralizeRating(remainingValue)} left`
      : `${remainingValue} of ${limitValue} Free Home Panatag Rating`,
    timerPill,
  };
};
