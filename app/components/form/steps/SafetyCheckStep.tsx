import { ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { SAFETY_CATEGORIES } from "../constants";
import type { SafetyCheckStepProps, SafetyRangeStyle } from "../types";
import {
  SAFETY_SCORE_MAX,
  SAFETY_SCORE_MIN,
  SAFETY_SCORE_STEP,
} from "../../../lib/safetyScale.js";

const getInitialAreaIndex = (
  categories: typeof SAFETY_CATEGORIES,
  formData: SafetyCheckStepProps["formData"]
): number => {
  const firstUnratedIndex = categories.findIndex((category) =>
    category.legacyFields.some((field) => typeof formData[field] !== "number")
  );

  return firstUnratedIndex === -1 ? 0 : firstUnratedIndex;
};

export default function SafetyCheckStep({
  formData,
  safetySliderDrafts,
  onCommitSafetyCategorySliderValue,
  isSafetyComplete,
  onNext,
}: SafetyCheckStepProps) {
  const safetyCategories = SAFETY_CATEGORIES;
  const [activeAreaIndex, setActiveAreaIndex] = useState(() =>
    getInitialAreaIndex(safetyCategories, formData)
  );

  const boundedActiveAreaIndex = Math.min(
    safetyCategories.length - 1,
    Math.max(0, activeAreaIndex)
  );
  const activeCategory = safetyCategories[boundedActiveAreaIndex];

  const storedValues = useMemo(
    () =>
      activeCategory.legacyFields
        .map((field) => formData[field])
        .filter((value): value is number => typeof value === "number"),
    [activeCategory, formData]
  );

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
      ? 25
      : storedValue;

  const isCurrentAreaRated = activeCategory.legacyFields.every(
    (field) => typeof formData[field] === "number"
  );
  const isSliderUnrated = !isCurrentAreaRated;
  const isLastArea = boundedActiveAreaIndex === safetyCategories.length - 1;

  const safetyState = !isCurrentAreaRated
    ? {
        label: "Not rated",
        className: "border-slate-200 bg-slate-100 text-slate-600",
      }
    : sliderValue <= 19
      ? {
          label: "High risk",
          className: "border-rose-200 bg-rose-50 text-rose-700",
        }
      : sliderValue <= 39
        ? {
            label: "Needs work",
            className: "border-amber-200 bg-amber-50 text-amber-700",
          }
        : {
            label: "Safer",
            className: "border-emerald-200 bg-emerald-50 text-emerald-700",
          };

  const fillPercent =
    ((sliderValue - SAFETY_SCORE_MIN) / (SAFETY_SCORE_MAX - SAFETY_SCORE_MIN)) *
    100;

  const fillColor =
    sliderValue <= 19
      ? "#ef4444"
      : sliderValue <= 39
        ? "#f59e0b"
        : "#22c55e";

  const sliderStyle = {
    "--slider-track": "#e2e8f0",
    "--slider-fill": isSliderUnrated
      ? "none"
      : `linear-gradient(to right, ${fillColor}, ${fillColor})`,
    "--slider-fill-size": isSliderUnrated ? "0% 100%" : `${fillPercent}% 100%`,
    "--slider-thumb": isSliderUnrated ? "#cbd5e1" : fillColor,
  } as SafetyRangeStyle;

  return (
    <div className="space-y-8 py-4 sm:py-8">
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#B8D7EB] bg-[#EEF7FD] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0E79B2]">
          <ShieldCheck className="h-3.5 w-3.5" />
          Home Safety Check
        </span>
      </div>

      <div className="space-y-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-5">
        <div className="space-y-2">
          <h3 className="text-center text-2xl font-black tracking-tight text-[#1F2937] sm:text-4xl">
            {activeCategory.title}
          </h3>
          <div className="flex justify-center">
            <span
              className={`inline-flex min-w-[7.25rem] justify-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap sm:px-3 sm:text-[11px] ${safetyState.className}`}
            >
              {safetyState.label}
            </span>
          </div>
        </div>

        <p className="text-center text-xs leading-snug text-slate-600 sm:text-sm">
          {activeCategory.subtitle}
        </p>

        <div className="space-y-2">
          <input
            type="range"
            min={SAFETY_SCORE_MIN}
            max={SAFETY_SCORE_MAX}
            step={SAFETY_SCORE_STEP}
            value={sliderValue}
            onInput={(event) => {
              onCommitSafetyCategorySliderValue(
                activeCategory.id,
                Number(event.currentTarget.value)
              );
            }}
            onChange={(event) => {
              onCommitSafetyCategorySliderValue(
                activeCategory.id,
                Number(event.currentTarget.value)
              );
            }}
            onBlur={(event) => {
              onCommitSafetyCategorySliderValue(
                activeCategory.id,
                Number(event.currentTarget.value)
              );
            }}
            style={sliderStyle}
            className="safety-range w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E79B2]/40"
            aria-label={`${activeCategory.title} safety rating`}
          />
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            <span>Riskiest</span>
            <span>Safest</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setActiveAreaIndex((current) => Math.max(0, current - 1))}
          disabled={boundedActiveAreaIndex === 0}
          className="w-full rounded-2xl border border-slate-300 bg-white py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous area
        </button>

        <button
          type="button"
          onClick={() => {
            if (isLastArea) {
              onNext();
              return;
            }

            setActiveAreaIndex((current) =>
              Math.min(safetyCategories.length - 1, current + 1)
            );
          }}
          disabled={isLastArea ? !isSafetyComplete : !isCurrentAreaRated}
          className="w-full rounded-2xl bg-[#0E79B2] py-3 font-bold text-white shadow-lg shadow-[#0E79B2]/30 transition hover:bg-[#0C6798] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLastArea ? "Continue" : "Next area"}
        </button>
      </div>
    </div>
  );
}
