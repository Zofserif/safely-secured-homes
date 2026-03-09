import { animate, useReducedMotion } from "framer-motion";
import { House, ShieldCheck, Siren } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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

type PanatagTierTone = "critical" | "caution" | "strong";

const getPanatagTierCopy = (
  score100: number,
): {
  label: string;
  headline: string;
  description: string;
  tone: PanatagTierTone;
} => {
  if (score100 <= 50) {
    return {
      label: "Needs Attention",
      headline: "Your home needs focused upgrades.",
      description:
        "Address your highest-risk areas first to quickly lift your Panatag score.",
      tone: "critical",
    };
  }

  if (score100 <= 80) {
    return {
      label: "Improving",
      headline: "Your home is improving and gaining protection.",
      description:
        "Keep building consistency across prevention and emergency readiness to move up.",
      tone: "caution",
    };
  }

  return {
    label: "Panatag Strong",
    headline: "Your home is operating at a strong Panatag level.",
    description:
      "Maintain your current habits and continue refining remaining weak spots.",
    tone: "strong",
  };
};

const TIER_ACCENT_STYLES: Record<
  PanatagTierTone,
  { badge: string; heading: string; body: string }
> = {
  critical: {
    badge: "border-[#D14343]/40 bg-[#FCEBEC] text-[#B72F2F]",
    heading: "text-[#A22626]",
    body: "text-[#7A2C2C]",
  },
  caution: {
    badge: "border-[#F29E1F]/40 bg-[#FFF3E0] text-[#A76400]",
    heading: "text-[#8A5400]",
    body: "text-[#7A5D24]",
  },
  strong: {
    badge: "border-[#2E8B57]/40 bg-[#E9F7EF] text-[#1E6F44]",
    heading: "text-[#1B5B37]",
    body: "text-[#2A5C3E]",
  },
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

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[#D1E4F2] bg-linear-to-br from-[#F8FCFF] via-white to-[#EEF8FF] p-5 sm:p-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-[#0E79B2]/12 blur-3xl" />
        <div className="absolute -right-12 bottom-0 h-52 w-52 rounded-full bg-[#2E8B57]/10 blur-3xl" />
      </div>

      <div className="relative space-y-5">
        <div className="grid gap-8 lg:grid-cols-[1.06fr_0.94fr] lg:items-center">
          <div>
            <span className="inline-flex items-center rounded-full border border-[#0E79B2]/25 bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0E79B2]">
              Panatag Home Rating
            </span>

            <h1 className="mt-3 text-3xl font-extrabold leading-tight text-[#0C2A3A] sm:text-4xl">
              <span className="block">{greeting}</span>
              <span className="mt-1 block">Your latest Panatag score is in.</span>
            </h1>

            <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/85 p-4 sm:p-5">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] ${tierStyles.badge}`}
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

          <div className="mx-auto w-full max-w-[25rem]">
            <div className="relative mx-auto aspect-square w-full max-w-[21rem]">
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
              {segmentedSlices.map((slice) => {
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
                      <p className="text-[10px] leading-tight text-slate-500 sm:text-[11px]">
                        {slice.statusLabel}
                      </p>
                    </div>

                    <p className="mt-auto pt-2 text-right text-xs font-bold leading-none text-[#153A53] sm:text-sm">
                      {Math.round(slice.weightedValue)}/{slice.weightedMax}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
