import { NA_ENABLED_SAFETY_FIELD_SET, SAFETY_SECTIONS } from "../constants";
import type { SafetyCheckStepProps, SafetyRangeStyle } from "../types";

export default function SafetyCheckStep({
  formData,
  safetySliderDrafts,
  naSafetySelections,
  onToggleNaSafetySelection,
  onCommitSafetySliderValue,
  isSafetyComplete,
  ratedSafetyCount,
  safetyCompletionPct,
  onNext,
}: SafetyCheckStepProps) {
  const safetyFields = SAFETY_SECTIONS.map((section) => section.id);

  return (
    <div className="space-y-3 sm:space-y-4">
      <h3 className="text-lg sm:text-xl font-bold text-center text-[#2D3748]">
        Home Safety Check
      </h3>
      <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4 space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs sm:text-sm font-semibold text-[#2D3748]">
            How this works
          </p>
          <span className="text-[11px] sm:text-xs text-slate-600 font-medium">
            <span>
              {ratedSafetyCount}/{safetyFields.length} rated
            </span>
          </span>
        </div>
        <p className="text-[11px] sm:text-sm leading-snug text-slate-600">
          Rate each area by dragging the slider. Left means higher risk. Right
          means safer.
        </p>
        <div className="space-y-1">
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

      <div className="space-y-3 sm:space-y-5">
        {SAFETY_SECTIONS.map((section) => {
          const allowsNa = NA_ENABLED_SAFETY_FIELD_SET.has(section.id);
          const isNaSelected = allowsNa && Boolean(naSafetySelections[section.id]);
          const hasScore = typeof formData[section.id] === "number";
          const storedValue = hasScore ? (formData[section.id] as number) : null;
          const draftSliderValue = safetySliderDrafts[section.id];
          const hasDraft = typeof draftSliderValue === "number";
          const sliderValue = hasDraft
            ? draftSliderValue
            : storedValue === null
              ? 2.5
              : 5 - storedValue;
          const hasVisibleSliderValue = hasScore || hasDraft;
          const safetyState = isNaSelected
            ? {
                label: "N/A",
                className: "border-sky-200 bg-sky-50 text-sky-700",
              }
            : !hasVisibleSliderValue
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
          const ratingWhole = hasVisibleSliderValue ? Math.round(sliderValue) : null;
          const ratingLabel = hasVisibleSliderValue ? `${ratingWhole}/5` : "--/5";
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
              key={section.id}
              className={`rounded-xl sm:rounded-2xl border p-3.5 sm:p-5 space-y-3 sm:space-y-4 transition-all ${hasScore ? "border-[#0E79B2]/40 bg-[#F8FBFF] shadow-sm" : "border-slate-200 bg-white"}`}
            >
              <div className="flex items-start sm:items-center justify-between gap-2">
                <h4 className="flex-1 pr-2 font-semibold text-[#2D3748] text-sm sm:text-base leading-tight">
                  {section.title}
                </h4>
                <div className="shrink-0 flex items-center gap-2 sm:gap-3">
                  {allowsNa && (
                    <label
                      className={`inline-flex cursor-pointer items-center gap-1 text-[10px] sm:text-[11px] font-semibold transition-colors whitespace-nowrap ${isNaSelected ? "text-sky-700" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      <input
                        type="checkbox"
                        checked={isNaSelected}
                        onChange={() => onToggleNaSafetySelection(section.id)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        aria-label={`Mark ${section.title} as not applicable`}
                      />
                      <span>No such space</span>
                    </label>
                  )}
                  <span
                    className={`rounded-full border px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap ${safetyState.className}`}
                  >
                    {safetyState.label}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {isNaSelected ? (
                  <p className="text-[11px] sm:text-xs leading-snug text-sky-700">
                    Marked as N/A because this space does not exist in your home.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-[11px] sm:text-xs">
                      <span className="font-medium text-slate-500">Your rating</span>
                      <span className="font-semibold text-[#2D3748]">
                        {ratingLabel}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step={0.1}
                      value={sliderValue}
                      onInput={(event) => {
                        onCommitSafetySliderValue(
                          section.id,
                          parseFloat(event.currentTarget.value),
                        );
                      }}
                      onChange={(event) => {
                        onCommitSafetySliderValue(
                          section.id,
                          parseFloat(event.target.value),
                        );
                      }}
                      onBlur={(event) => {
                        onCommitSafetySliderValue(
                          section.id,
                          parseFloat(event.target.value),
                        );
                      }}
                      style={sliderStyle}
                      className="safety-range w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E79B2]/40"
                      aria-label={`${section.title} safety rating`}
                    />
                    <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
                      <span>Riskier</span>
                      <span>Safer</span>
                    </div>
                  </>
                )}
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
