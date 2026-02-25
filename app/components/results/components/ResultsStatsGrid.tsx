import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Gauge, HouseHeart, ShieldCheck, Siren, Video } from "lucide-react";
import type { ResultsSummary } from "../../../lib/types";

type ResultsStatsGridProps = {
  safetyLevel: ResultsSummary["safetyLevel"];
  priority: ResultsSummary["priority"];
  emergency: ResultsSummary["emergency"];
  panatagRating100: number;
  cameraCount: number;
};

const severityColors = {
  low: "text-[#2E8B57]",
  medium: "text-[#FFB300]",
  high: "text-[#E53E3E]",
} as const;

const INITIAL_PANATAG_START_100 = 0;
const INITIAL_ANIMATION_DURATION_SECONDS = 5.8;
const UPDATE_ANIMATION_DURATION_SECONDS = 1.9;
const INITIAL_SUSPENSE_PROGRESS_RATIO = 0.18;
const INITIAL_SUSPENSE_TIME_RATIO = 0.42;
const clampPanatag100 = (value: number): number => Math.max(0, Math.min(100, value));

export default function ResultsStatsGrid({
  safetyLevel,
  priority,
  emergency,
  panatagRating100,
  cameraCount,
}: ResultsStatsGridProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const clampedTargetPanatag100 = clampPanatag100(panatagRating100);
  const [animatedPanatag100, setAnimatedPanatag100] = useState<number>(
    INITIAL_PANATAG_START_100,
  );
  const animatedPanatagRef = useRef<number>(INITIAL_PANATAG_START_100);
  const hasPlayedInitialAnimationRef = useRef(false);

  useEffect(() => {
    const isInitialAnimation = !hasPlayedInitialAnimationRef.current;
    const fromValue = hasPlayedInitialAnimationRef.current
      ? animatedPanatagRef.current
      : INITIAL_PANATAG_START_100;
    const suspenseValue =
      fromValue +
      (clampedTargetPanatag100 - fromValue) * INITIAL_SUSPENSE_PROGRESS_RATIO;
    hasPlayedInitialAnimationRef.current = true;

    const updateAnimatedValue = (latest: number) => {
      const clampedLatest = clampPanatag100(latest);
      animatedPanatagRef.current = clampedLatest;
      setAnimatedPanatag100(clampedLatest);
    };

    const syncAnimationCompletion = () => {
      animatedPanatagRef.current = clampedTargetPanatag100;
      setAnimatedPanatag100(clampedTargetPanatag100);
    };

    const controls = shouldReduceMotion
      ? animate(fromValue, clampedTargetPanatag100, {
          duration: 0,
          ease: [0.22, 1, 0.36, 1],
          onUpdate: updateAnimatedValue,
          onComplete: syncAnimationCompletion,
        })
      : isInitialAnimation
        ? animate(
            fromValue,
            [fromValue, suspenseValue, clampedTargetPanatag100],
            {
              duration: INITIAL_ANIMATION_DURATION_SECONDS,
              times: [0, INITIAL_SUSPENSE_TIME_RATIO, 1],
              ease: [
                [0.55, 0.02, 0.75, 0.35],
                [0.18, 1, 0.3, 1],
              ],
              onUpdate: updateAnimatedValue,
              onComplete: syncAnimationCompletion,
            },
          )
        : animate(fromValue, clampedTargetPanatag100, {
            duration: UPDATE_ANIMATION_DURATION_SECONDS,
            ease: [0.22, 1, 0.36, 1],
            onUpdate: updateAnimatedValue,
            onComplete: syncAnimationCompletion,
          });

    return () => {
      controls.stop();
    };
  }, [clampedTargetPanatag100, shouldReduceMotion]);

  const clampedPanatag100 = clampPanatag100(animatedPanatag100);
  const displayedPanatag100 = Math.round(clampedPanatag100);
  // The colors are defined here to ensure the gauge and icon colors stay consistent, even though the HouseHeart icon is currently commented out. This way, if we decide to add the icon back in the future, the color logic is already in place.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const panatagIconColor =
    clampedPanatag100 <= 50
      ? "text-[#E53E3E]"
      : clampedPanatag100 <= 80
        ? "text-[#F6C445]"
        : "text-[#2E8B57]";
  const panatagGaugeStroke =
    clampedPanatag100 <= 50
      ? "#E53E3E"
      : clampedPanatag100 <= 80
        ? "#F6C445"
        : "#2E8B57";
  const gaugeSize = 96;
  const strokeWidth = 7;
  const radius = (gaugeSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcRatio = 0.75;
  const arcLength = circumference * arcRatio;
  const progressLength = arcLength * (clampedPanatag100 / 100);
  const gaugeRotation = 135;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="order-2 md:order-1 bg-[#F7FAFC] p-4 rounded-xl border border-slate-100 text-center flex flex-col items-center gap-2">
        <Gauge className={`h-9 w-9 ${severityColors[priority.severity]}`} />
        <div className="text-xl font-bold leading-tight min-h-2.25rem text-[#2D3748]">
          {priority.label}
        </div>
        <div className="text-[0.7rem] leading-snug text-slate-500 uppercase tracking-wider min-h-[1.9rem]">
          Priority Action
        </div>
      </div>

      <div className="order-3 md:order-2 bg-[#F7FAFC] p-4 rounded-xl border border-slate-100 text-center flex flex-col items-center gap-2">
        <ShieldCheck
          className={`h-9 w-9 ${severityColors[safetyLevel.severity]}`}
        />
        <div className="text-xl font-bold leading-tight min-h-2.25rem text-[#2D3748]">
          {safetyLevel.label}
        </div>
        <div className="text-[0.7rem] leading-snug text-slate-500 uppercase tracking-wider min-h-[1.9rem]">
          Safety Score
        </div>
      </div>

      <div className="order-1 md:order-3 col-span-2 md:col-span-1 bg-[#F7FAFC] p-4 rounded-xl border border-slate-100 text-center flex flex-col items-center gap-2">
        {/* <HouseHeart className={`h-9 w-9 ${panatagIconColor}`} /> */}
        <div className="relative h-24 w-24">
          <svg
            width={gaugeSize}
            height={gaugeSize}
            viewBox={`0 0 ${gaugeSize} ${gaugeSize}`}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full"
          >
            <g transform={`rotate(${gaugeRotation} ${gaugeSize / 2} ${gaugeSize / 2})`}>
              <circle
                cx={gaugeSize / 2}
                cy={gaugeSize / 2}
                r={radius}
                fill="none"
                stroke="#334155"
                strokeOpacity="0.18"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${arcLength} ${circumference}`}
              />
              <circle
                cx={gaugeSize / 2}
                cy={gaugeSize / 2}
                r={radius}
                fill="none"
                stroke={panatagGaugeStroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${progressLength} ${circumference}`}
              />
            </g>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[2rem] font-bold leading-none text-[#2D3748]">
            {displayedPanatag100}
          </div>
        </div>
        <div className="text-[0.7rem] leading-snug text-slate-500 uppercase tracking-wider min-h-[1.9rem]">
          Panatag Rating
        </div>
      </div>

      <div className="order-4 md:order-4 bg-[#F7FAFC] p-4 rounded-xl border border-slate-100 text-center flex flex-col items-center gap-2">
        <Siren className={`h-9 w-9 ${severityColors[emergency.severity]}`} />
        <div className="text-xl font-bold leading-tight min-h-2.25rem text-[#2D3748]">
          {emergency.label}
        </div>
        <div className="text-[0.7rem] leading-snug text-slate-500 uppercase tracking-wider min-h-[1.9rem]">
          Emergency Readiness
        </div>
      </div>

      <div className="order-5 md:order-5 bg-[#F7FAFC] p-4 rounded-xl border border-slate-100 text-center flex flex-col items-center gap-2">
        <Video className="h-9 w-9 text-[#0E79B2]" />
        <div className="text-xl font-bold leading-tight min-h-2.25rem text-[#2D3748]">
          {cameraCount}
        </div>
        <div className="text-[0.7rem] leading-snug text-slate-500 uppercase tracking-wider min-h-[1.9rem]">
          Security Cameras Needed
        </div>
      </div>
    </div>
  );
}
