import { ShieldCheck } from "lucide-react";
import { SAFETY_CATEGORIES } from "../constants";
import type { SafetyCheckStepProps, SafetyRangeStyle } from "../types";
import {
  SAFETY_SCORE_MAX,
  SAFETY_SCORE_MIN,
  SAFETY_SCORE_STEP,
} from "../../../lib/safetyScale.js";

type RatedSafetyState = {
  min: number;
  max: number;
  label: string;
  className: string;
  fillColor: string;
};

const UNRATED_SAFETY_STATE = {
  label: "Not rated",
  className: "border-slate-200 bg-slate-100 text-slate-600",
} as const;

const RATED_SAFETY_STATES: readonly RatedSafetyState[] = [
  {
    min: 0,
    max: 10,
    label: "Not safe at all",
    className: "border-rose-300 bg-rose-100 text-rose-800",
    fillColor: "#dc2626",
  },
  {
    min: 11,
    max: 20,
    label: "Very unsafe",
    className: "border-red-200 bg-red-50 text-red-700",
    fillColor: "#ef4444",
  },
  {
    min: 21,
    max: 40,
    label: "Somewhat unsafe",
    className: "border-orange-200 bg-orange-50 text-orange-700",
    fillColor: "#f97316",
  },
  {
    min: 41,
    max: 60,
    label: "Fairly safe",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    fillColor: "#f59e0b",
  },
  {
    min: 61,
    max: 80,
    label: "Safe",
    className: "border-lime-200 bg-lime-50 text-lime-700",
    fillColor: "#84cc16",
  },
  {
    min: 81,
    max: 90,
    label: "Very safe",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    fillColor: "#22c55e",
  },
  {
    min: 91,
    max: 100,
    label: "As safe as possible",
    className: "border-green-300 bg-green-100 text-green-800",
    fillColor: "#16a34a",
  },
];

const getRatedSafetyState = (value: number): RatedSafetyState => {
  const boundedValue = Math.min(SAFETY_SCORE_MAX, Math.max(SAFETY_SCORE_MIN, value));
  const matchedState = RATED_SAFETY_STATES.find(
    (state) => boundedValue >= state.min && boundedValue <= state.max
  );

  return matchedState ?? RATED_SAFETY_STATES[0];
};

export default function SafetyCheckStep({
  categoryId,
  isLastSafetyAreaStep,
  formData,
  safetySliderDrafts,
  onCommitSafetyCategorySliderValue,
  onNavigateToSafetyArea,
  isSafetyComplete,
  onNext,
}: SafetyCheckStepProps) {
  const activeCategory = SAFETY_CATEGORIES.find((category) => category.id === categoryId);
  if (!activeCategory) return null;
  const activeCategoryIndex = SAFETY_CATEGORIES.findIndex(
    (category) => category.id === categoryId
  );
  const areaCount = SAFETY_CATEGORIES.length;

  const storedValues = activeCategory.legacyFields
    .map((field) => formData[field])
    .filter((value): value is number => typeof value === "number");

  const hasStoredValue = storedValues.length > 0;
  const storedValue = hasStoredValue
    ? Math.round(
        storedValues.reduce<number>((sum, value) => sum + value, 0) /
          storedValues.length
      )
    : null;

  const draftSliderValue = safetySliderDrafts[activeCategory.id];
  const hasDraft = typeof draftSliderValue === "number";
  const sliderValue = hasDraft
    ? draftSliderValue
    : storedValue === null
      ? 50
      : storedValue;

  const isCurrentAreaRated = activeCategory.legacyFields.every(
    (field) => typeof formData[field] === "number"
  );
  const isSliderUnrated = !isCurrentAreaRated;
  const ratedSafetyState = getRatedSafetyState(sliderValue);

  const safetyState = isSliderUnrated ? UNRATED_SAFETY_STATE : ratedSafetyState;

  const fillPercent =
    ((sliderValue - SAFETY_SCORE_MIN) / (SAFETY_SCORE_MAX - SAFETY_SCORE_MIN)) *
    100;

  const fillColor = ratedSafetyState.fillColor;

  const sliderStyle = {
    "--slider-track": "#e2e8f0",
    "--slider-fill": isSliderUnrated
      ? "none"
      : `linear-gradient(to right, ${fillColor}, ${fillColor})`,
    "--slider-fill-size": isSliderUnrated ? "0% 100%" : `${fillPercent}% 100%`,
    "--slider-thumb": isSliderUnrated ? "#cbd5e1" : fillColor,
  } as SafetyRangeStyle;

  return (
    <div className="space-y-5 py-1 sm:py-2">
      <div className="space-y-3">
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#B8D7EB] bg-[#EEF7FD] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0E79B2]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Home Safety Check
          </span>
        </div>
        <div className="space-y-1 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Area {Math.max(0, activeCategoryIndex) + 1} of {areaCount}
          </p>
          <div className="flex items-center justify-center gap-1.5">
            {SAFETY_CATEGORIES.map((category, categoryIndex) => {
              const isActive = category.id === activeCategory.id;
              const isRated = category.legacyFields.every(
                (field) => typeof formData[field] === "number"
              );
              const isFuture = categoryIndex > activeCategoryIndex;
              const isCompletedPast = categoryIndex < activeCategoryIndex && isRated;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onNavigateToSafetyArea(category.id)}
                  disabled={isFuture}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`Go to area ${categoryIndex + 1}: ${category.title}`}
                  className={`h-1.5 w-8 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E79B2]/40 ${isActive ? "bg-[#0E79B2]" : isCompletedPast ? "bg-emerald-400/80" : "bg-slate-200"} ${isFuture ? "cursor-not-allowed opacity-85" : "cursor-pointer hover:opacity-90"}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-2.5 rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-5">
        <div className="space-y-1.5">
          <h3 className="mx-auto max-w-2xl text-center text-2xl font-black tracking-tight text-[#1F2937] sm:text-3xl">
            {activeCategory.title}
          </h3>
          <div className="flex justify-center">
            <span
              className={`inline-flex min-w-29 justify-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap sm:px-3 sm:text-[11px] ${safetyState.className}`}
            >
              {safetyState.label}
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          <input
            type="range"
            min={SAFETY_SCORE_MIN}
            max={SAFETY_SCORE_MAX}
            step={SAFETY_SCORE_STEP}
            value={sliderValue}
            onInput={(event) => {
              onCommitSafetyCategorySliderValue(
                categoryId,
                Number(event.currentTarget.value)
              );
            }}
            onChange={(event) => {
              onCommitSafetyCategorySliderValue(
                categoryId,
                Number(event.currentTarget.value)
              );
            }}
            onBlur={(event) => {
              onCommitSafetyCategorySliderValue(
                categoryId,
                Number(event.currentTarget.value)
              );
            }}
            style={sliderStyle}
            className="safety-range w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E79B2]/40"
            aria-label={`${activeCategory.title} safety rating`}
          />
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            <span>I feel Unsafe</span>
            <span>I feel Safe</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={isLastSafetyAreaStep ? !isSafetyComplete : !isCurrentAreaRated}
        className="w-full rounded-2xl bg-[#0E79B2] py-3 font-bold text-white shadow-lg shadow-[#0E79B2]/30 transition hover:bg-[#0C6798] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLastSafetyAreaStep ? "Continue" : "Next area"}
      </button>
    </div>
  );
}
