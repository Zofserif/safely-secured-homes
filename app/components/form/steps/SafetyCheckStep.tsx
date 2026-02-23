import { SAFETY_CATEGORIES } from "../constants";
import type { SafetyCheckStepProps, SafetyRangeStyle } from "../types";

export default function SafetyCheckStep({
  formData,
  safetySliderDrafts,
  onCommitSafetyCategorySliderValue,
  isSafetyComplete,
  ratedSafetyCount,
  safetyCompletionPct,
  onNext,
}: SafetyCheckStepProps) {
  const safetyCategories = SAFETY_CATEGORIES;

  return (
    <div className="space-y-2.5 sm:space-y-3">
      <h3 className="text-base sm:text-lg font-bold text-center text-[#2D3748]">
        Home Safety Rating
      </h3>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3 space-y-1.5 sm:space-y-2">
        <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs">
          <p className="font-medium text-slate-600 leading-snug">
            Rate each area from 0 (high risk) to 5 (safer).
          </p>
          <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-0.5 font-semibold text-slate-600 whitespace-nowrap">
            {ratedSafetyCount}/{safetyCategories.length} rated
          </span>
        </div>
        <div className="space-y-1 sm:space-y-1.5">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-600">
            <span>Progress</span>
            <span>{safetyCompletionPct}% complete</span>
          </div>
          <div className="h-1.5 sm:h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-[#0E79B2] transition-all duration-300"
              style={{ width: `${safetyCompletionPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {safetyCategories.map((category) => {
          const storedValues = category.legacyFields
            .map((field) => formData[field])
            .filter((value): value is number => typeof value === "number");
          const hasStoredValue = storedValues.length > 0;
          const storedValue = hasStoredValue
            ? storedValues.reduce<number>(
                (sum, value) => sum + value,
                0,
              ) / storedValues.length
            : null;
          const hasCompletedCategory = category.legacyFields.every(
            (field) => typeof formData[field] === "number",
          );
          const draftSliderValue = safetySliderDrafts[category.id];
          const hasDraft = typeof draftSliderValue === "number";
          const sliderValue = hasDraft
            ? draftSliderValue
            : storedValue === null
              ? 2.5
              : 5 - storedValue;
          const hasVisibleSliderValue = hasStoredValue || hasDraft;
          const safetyState = !hasVisibleSliderValue
            ? {
                label: "Not rated",
                className: "border-slate-200 bg-slate-100 text-slate-600",
              }
            : sliderValue <= 1
              ? {
                  label: "High risk",
                  className: "border-rose-200 bg-rose-50 text-rose-700",
                }
              : sliderValue <= 3
                ? {
                    label: "Needs work",
                    className: "border-amber-200 bg-amber-50 text-amber-700",
                  }
                : {
                    label: "Safer",
                    className:
                      "border-emerald-200 bg-emerald-50 text-emerald-700",
                  };
          const fillPercent = hasVisibleSliderValue ? (sliderValue / 5) * 100 : 0;
          const fillPalette = [
            "#ef4444",
            "#f97316",
            "#fb923c",
            "#facc15",
            "#a3e635",
            "#22c55e",
          ];
          const fillColor = fillPalette[Math.round(sliderValue)] ?? "#22c55e";
          const sliderStyle = {
            "--slider-track": "#e2e8f0",
            "--slider-fill": hasVisibleSliderValue
              ? `linear-gradient(to right, ${fillColor}, ${fillColor})`
              : "none",
            "--slider-fill-size": `${fillPercent}% 100%`,
            "--slider-thumb": hasVisibleSliderValue ? fillColor : "#cbd5e1",
          } as SafetyRangeStyle;

          return (
            <div
              key={category.id}
              className={`rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 space-y-2.5 sm:space-y-3 transition-all ${hasCompletedCategory ? "border-[#0E79B2]/40 bg-[#F8FBFF] shadow-sm" : "border-slate-200 bg-white"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h4 className="min-w-0 flex-1 font-semibold text-[#2D3748] text-sm sm:text-base leading-tight">
                  {category.title}
                </h4>
                <span
                  className={`shrink-0 inline-flex min-w-29 justify-center rounded-full border px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap ${safetyState.className}`}
                >
                  {safetyState.label}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 leading-snug">
                {category.subtitle}
              </p>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="5"
                  step={0.1}
                  value={sliderValue}
                  onInput={(event) => {
                    onCommitSafetyCategorySliderValue(
                      category.id,
                      parseFloat(event.currentTarget.value),
                    );
                  }}
                  onChange={(event) => {
                    onCommitSafetyCategorySliderValue(
                      category.id,
                      parseFloat(event.target.value),
                    );
                  }}
                  onBlur={(event) => {
                    onCommitSafetyCategorySliderValue(
                      category.id,
                      parseFloat(event.target.value),
                    );
                  }}
                  style={sliderStyle}
                  className="safety-range w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E79B2]/40"
                  aria-label={`${category.title} safety rating`}
                />
                <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
                  <span>0 = High risk</span>
                  <span>5 = Safer</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onNext}
        disabled={!isSafetyComplete}
        className="w-full bg-[#0E79B2] text-white py-3 rounded-xl font-bold disabled:opacity-50 mt-2"
      >
        Next
      </button>
    </div>
  );
}
