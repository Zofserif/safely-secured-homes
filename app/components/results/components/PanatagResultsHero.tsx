import { animate, useReducedMotion } from "framer-motion";
import { House, ShieldCheck, Siren } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SeverityLevel } from "../../../lib/types";

const CHART_SIZE = 320;
const RING_STROKE_WIDTH = 34;
const SCORE_ANIMATION_DURATION_SECONDS = 1.45;
const SLICE_GAP_DEGREES = 0;

const clampScore100 = (value: number): number => Math.max(0, Math.min(100, value));

const toRadians = (angleInDegrees: number): number =>
  ((angleInDegrees - 90) * Math.PI) / 180;

const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
): { x: number; y: number } => {
  const radians = toRadians(angleInDegrees);

  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY + radius * Math.sin(radians),
  };
};

const createArcPath = (
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string => {
  const startPoint = polarToCartesian(centerX, centerY, radius, startAngle);
  const endPoint = polarToCartesian(centerX, centerY, radius, endAngle);
  const sweepAngle = Math.max(0, endAngle - startAngle);
  const largeArcFlag = sweepAngle > 180 ? 1 : 0;

  return [
    `M ${startPoint.x} ${startPoint.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endPoint.x} ${endPoint.y}`,
  ].join(" ");
};

type PanatagTierTone =
  | "needs_immediate_attention"
  | "needs_strengthening"
  | "on_the_right_track"
  | "nearly_there"
  | "strong_foundation";

const getPanatagTierCopy = (
  score100: number,
): {
  label: string;
  headline: string;
  description: string;
  tone: PanatagTierTone;
} => {
  if (score100 <= 20) {
    return {
      label: "Needs Immediate Attention",
      headline: "Your home has urgent safety gaps.",
      description:
        "Open your Insights and prioritize the highest-impact fixes to quickly improve your Panatag Home Rating.",
      tone: "needs_immediate_attention",
    };
  }

  if (score100 <= 40) {
    return {
      label: "Needs Strengthening",
      headline: "Your home needs stronger protection.",
      description:
        "Check your Insights and complete the recommended actions to strengthen your Panatag Home Rating.",
      tone: "needs_strengthening",
    };
  }

  if (score100 <= 60) {
    return {
      label: "On the Right Track",
      headline: "Your home has a good start.",
      description:
        "Review your Insights and follow the next recommended steps to steadily improve your Panatag Home Rating.",
      tone: "on_the_right_track",
    };
  }

  if (score100 <= 80) {
    return {
      label: "Nearly There",
      headline: "Your home is close to fully protected.",
      description:
        "Open your Insights and complete the remaining high-value actions to improve your Panatag Home Rating.",
      tone: "nearly_there",
    };
  }

  return {
    label: "Strong Foundation",
    headline: "Your home has a strong safety base.",
    description:
      "Check your Insights for refinement actions to maintain and further improve your Panatag Home Rating.",
    tone: "strong_foundation",
  };
};

const TIER_ACCENT_STYLES: Record<
  PanatagTierTone,
  { badge: string; heading: string; body: string }
> = {
  needs_immediate_attention: {
    badge: "border-[#D14343]/40 bg-[#FCEBEC] text-[#B72F2F]",
    heading: "text-[#A22626]",
    body: "text-[#7A2C2C]",
  },
  needs_strengthening: {
    badge: "border-[#E4572E]/40 bg-[#FFF1EC] text-[#B44826]",
    heading: "text-[#983A1E]",
    body: "text-[#7F3D28]",
  },
  on_the_right_track: {
    badge: "border-[#D4A017]/40 bg-[#FFF8DE] text-[#9A6A00]",
    heading: "text-[#815600]",
    body: "text-[#745B21]",
  },
  nearly_there: {
    badge: "border-[#0E79B2]/35 bg-[#EAF4FB] text-[#0A5C88]",
    heading: "text-[#0B4B70]",
    body: "text-[#1D4F6E]",
  },
  strong_foundation: {
    badge: "border-[#2E8B57]/40 bg-[#E9F7EF] text-[#1E6F44]",
    heading: "text-[#1B5B37]",
    body: "text-[#2A5C3E]",
  },
};

const STATUS_PILL_STYLES: Record<SeverityLevel, string> = {
  low: "border-[#2E8B57]/35 bg-[#E9F7EF] text-[#1F6A42]",
  medium: "border-[#F29E1F]/40 bg-[#FFF3E0] text-[#A76400]",
  high: "border-[#D14343]/40 bg-[#FCEBEC] text-[#B72F2F]",
};

const SEVERITY_PRIORITY_RANK: Record<SeverityLevel, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export type PanatagHeroSliceId = "safety" | "emergency" | "home_readiness";

export type PanatagHeroSlice = {
  id: PanatagHeroSliceId;
  label: string;
  rawScore100: number;
  baseContribution: number;
  shareRatio: number;
  weightedValue: number;
  weightedMax: number;
  statusLabel: string;
  severity: SeverityLevel;
  color: string;
  trackColor: string;
};

type PanatagResultsHeroProps = {
  greeting: string;
  projectedPanatagRating100: number;
  baselinePanatagRating100: number;
  slices: readonly PanatagHeroSlice[];
};

const ICON_BY_SLICE_ID = {
  safety: ShieldCheck,
  emergency: Siren,
  home_readiness: House,
} as const;

export default function PanatagResultsHero({
  greeting,
  projectedPanatagRating100,
  baselinePanatagRating100,
  slices,
}: PanatagResultsHeroProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [animatedScore100, setAnimatedScore100] = useState(0);
  const animatedScoreRef = useRef(0);

  const clampedProjectedScore100 = clampScore100(projectedPanatagRating100);
  const clampedBaselineScore100 = clampScore100(baselinePanatagRating100);
  const baselineGain = Math.max(
    0,
    Math.round(clampedProjectedScore100 - clampedBaselineScore100),
  );

  useEffect(() => {
    const controls = animate(animatedScoreRef.current, clampedProjectedScore100, {
      duration: shouldReduceMotion ? 0 : SCORE_ANIMATION_DURATION_SECONDS,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        const normalized = clampScore100(latest);
        animatedScoreRef.current = normalized;
        setAnimatedScore100(normalized);
      },
      onComplete: () => {
        animatedScoreRef.current = clampedProjectedScore100;
        setAnimatedScore100(clampedProjectedScore100);
      },
    });

    return () => {
      controls.stop();
    };
  }, [clampedProjectedScore100, shouldReduceMotion]);

  const normalizedSlices = useMemo(() => {
    const safeSlices = slices.map((slice) => ({
      ...slice,
      rawScore100: clampScore100(slice.rawScore100),
      baseContribution: Math.max(0, slice.baseContribution),
      shareRatio: Number.isFinite(slice.shareRatio)
        ? Math.max(0, slice.shareRatio)
        : 0,
    }));

    const shareTotal = safeSlices.reduce(
      (sum, slice) => sum + slice.shareRatio,
      0,
    );
    if (shareTotal <= 0) {
      const fallbackShare = 1 / Math.max(1, safeSlices.length);
      return safeSlices.map((slice) => ({
        ...slice,
        shareRatio: fallbackShare,
      }));
    }

    return safeSlices.map((slice) => ({
      ...slice,
      shareRatio: slice.shareRatio / shareTotal,
    }));
  }, [slices]);

  const tier = useMemo(
    () => getPanatagTierCopy(Math.round(clampedProjectedScore100)),
    [clampedProjectedScore100],
  );
  const tierStyles = TIER_ACCENT_STYLES[tier.tone];
  const displayedScore100 = Math.round(animatedScore100);

  const visibleSweepDegrees = (animatedScore100 / 100) * 360;
  const gapDegrees = SLICE_GAP_DEGREES;
  const totalGapDegrees = gapDegrees * Math.max(0, normalizedSlices.length - 1);
  const drawableSweepDegrees = Math.max(0, visibleSweepDegrees - totalGapDegrees);

  const segmentedSlices = useMemo(() => {
    return normalizedSlices.map((slice, index) => {
      const cumulativeShareBeforeSlice = normalizedSlices
        .slice(0, index)
        .reduce((sum, currentSlice) => sum + currentSlice.shareRatio, 0);
      const startAngle =
        cumulativeShareBeforeSlice * drawableSweepDegrees + index * gapDegrees;
      const sweepDegrees =
        index === normalizedSlices.length - 1
          ? Math.max(0, visibleSweepDegrees - startAngle)
          : Math.max(0, drawableSweepDegrees * slice.shareRatio);
      const endAngle = startAngle + sweepDegrees;

      return {
        ...slice,
        path:
          sweepDegrees <= 0.15
            ? null
            : createArcPath(
                CHART_SIZE / 2,
                CHART_SIZE / 2,
                (CHART_SIZE - RING_STROKE_WIDTH) / 2,
                startAngle,
                endAngle,
              ),
      };
    });
  }, [drawableSweepDegrees, gapDegrees, normalizedSlices, visibleSweepDegrees]);

  const orderedCardSlices = useMemo(
    () =>
      segmentedSlices
        .map((slice, index) => ({ index, slice }))
        .sort((a, b) => {
          const severityDiff =
            SEVERITY_PRIORITY_RANK[a.slice.severity] -
            SEVERITY_PRIORITY_RANK[b.slice.severity];
          if (severityDiff !== 0) return severityDiff;

          if (a.slice.rawScore100 !== b.slice.rawScore100) {
            return a.slice.rawScore100 - b.slice.rawScore100;
          }

          return a.index - b.index;
        })
        .map(({ slice }) => slice),
    [segmentedSlices],
  );

  return (
    <section className="relative overflow-hidden rounded-4xl border border-[#D1E4F2] bg-linear-to-br from-[#F8FCFF] via-white to-[#EEF8FF] p-5 sm:p-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-[#0E79B2]/12 blur-3xl" />
        <div className="absolute -right-12 bottom-0 h-52 w-52 rounded-full bg-[#2E8B57]/10 blur-3xl" />
      </div>

      <div className="relative space-y-5">
        <div className="grid gap-6 lg:grid-cols-[1.06fr_0.94fr] lg:grid-rows-[1fr_auto_auto_1fr] lg:gap-x-8 lg:gap-y-3">
          <div className="order-1 px-4 sm:px-5 lg:col-start-1 lg:row-start-2">
            <h1 className="leading-tight text-[#0C2A3A]">
              <span className="block text-5xl font-black tracking-[-0.01em] sm:text-6xl">
                {greeting}
              </span>
              <span className="mt-2 block text-3xl font-extrabold sm:text-4xl">
                Your Panatag score is...
              </span>
            </h1>
          </div>

          <div className="order-2 mx-auto w-full max-w-100 lg:col-start-2 lg:row-start-1 lg:row-span-4 lg:self-center">
            <div className="relative mx-auto aspect-square w-full max-w-84">
              <svg
                width={CHART_SIZE}
                height={CHART_SIZE}
                viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
                aria-hidden="true"
                className="h-full w-full"
              >
                <circle
                  cx={CHART_SIZE / 2}
                  cy={CHART_SIZE / 2}
                  r={(CHART_SIZE - RING_STROKE_WIDTH) / 2}
                  fill="none"
                  stroke="#D9E6F1"
                  strokeWidth={RING_STROKE_WIDTH}
                />
                {segmentedSlices.map((slice) =>
                  slice.path ? (
                    <path
                      key={slice.id}
                      d={slice.path}
                      fill="none"
                      stroke={slice.color}
                      strokeWidth={RING_STROKE_WIDTH}
                      strokeLinecap="butt"
                    />
                  ) : null,
                )}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Panatag Home Rating
                </p>
                <p className="mt-1 text-5xl font-black leading-none text-[#102A3D] sm:text-6xl">
                  {displayedScore100}
                </p>
                {baselineGain > 0 && (
                  <span className="mt-2 inline-flex items-center rounded-full border border-[#2E8B57]/35 bg-[#E9F7EF] px-2.5 py-1 text-[10px] font-bold leading-none text-[#1F6A42] sm:text-xs">
                    +{baselineGain} unlocked
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2">
              {orderedCardSlices.map((slice) => {
                const Icon = ICON_BY_SLICE_ID[slice.id];

                return (
                  <div
                    key={slice.id}
                    className="flex min-h-[92px] min-w-0 flex-col rounded-lg border border-slate-200/85 bg-white/95 px-2 py-2 sm:min-h-[104px] sm:px-2.5 sm:py-2.5"
                  >
                    <span
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full sm:h-8 sm:w-8"
                      style={{ backgroundColor: slice.trackColor, color: slice.color }}
                    >
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </span>

                    <div className="mt-2 min-w-0 space-y-0.5">
                      <p className="text-[11px] font-bold leading-tight text-[#1A3244] sm:text-xs">
                        {slice.label}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] sm:text-[10px] ${STATUS_PILL_STYLES[slice.severity]}`}
                      >
                        {slice.statusLabel}
                      </span>
                    </div>

                    <p className="mt-auto pt-2 text-right text-xs font-bold leading-none text-[#153A53] sm:text-sm">
                      {Math.round(slice.weightedValue)}/{slice.weightedMax}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="order-3 rounded-2xl bg-white/75 p-4 sm:p-5 lg:col-start-1 lg:row-start-3">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest ${tierStyles.badge}`}
            >
              {tier.label}
            </span>
            <p className={`mt-2 text-xl font-bold sm:text-2xl ${tierStyles.heading}`}>
              {tier.headline}
            </p>
            <p className={`mt-2 text-sm leading-relaxed sm:text-base ${tierStyles.body}`}>
              {tier.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
