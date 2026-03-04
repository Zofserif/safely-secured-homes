import { Check } from "lucide-react";
import { BUDGET_BAND_OPTIONS } from "../../../lib/formOptions";
import type { BudgetDiyStepProps } from "../types";

export default function BudgetDiyStep({
  formData,
  onNext,
  onUpdateField,
}: BudgetDiyStepProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-center text-2xl font-black tracking-tight text-[#1F2937] sm:text-3xl">
        Budget Range
      </h3>
      <div className="space-y-3 rounded-2xl border border-[#E4E7EC] bg-[#FBFCFF] p-4">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-semibold text-[#2D3748]">My Budget Zone</label>
          <span className="rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
            Choose one
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Select one budget range that best matches your current plan.
        </p>
        <div className="space-y-2">
          {BUDGET_BAND_OPTIONS.map((option) => {
            const isSelected = formData.budget_band === option;
            const trimmedOption = option.trim();
            const budgetParts = trimmedOption.match(/^(.*)\((.*)\)$/);
            const budgetTitle = budgetParts
              ? budgetParts[1].trim()
              : trimmedOption;
            const budgetRange = budgetParts ? `(${budgetParts[2].trim()})` : "";

            return (
              <label
                key={option}
                className={`group flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${isSelected ? "border-[#0E79B2] bg-[#0E79B2]/10 ring-1 ring-[#0E79B2]/30 shadow-sm" : "border-[#E2E8F0] bg-white hover:border-[#0E79B2]/60 hover:bg-slate-50"}`}
              >
                <input
                  type="radio"
                  name="budget_band"
                  value={option}
                  checked={isSelected}
                  onChange={(event) =>
                    onUpdateField("budget_band", event.target.value)
                  }
                  className="sr-only"
                />
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${isSelected ? "border-[#0E79B2] bg-[#0E79B2] text-white" : "border-slate-300 bg-white text-transparent group-hover:border-[#0E79B2]/60"}`}
                  aria-hidden="true"
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-sm font-semibold leading-tight ${isSelected ? "text-[#0E79B2]" : "text-slate-800"}`}
                  >
                    {budgetTitle}
                  </span>
                  {budgetRange ? (
                    <span className="block text-xs text-slate-500">{budgetRange}</span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
      </div>
      <button
        onClick={onNext}
        disabled={!formData.budget_band}
        className="mt-4 w-full rounded-2xl bg-[#0E79B2] py-3.5 font-bold text-white shadow-lg shadow-[#0E79B2]/30 transition hover:bg-[#0C6798] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
