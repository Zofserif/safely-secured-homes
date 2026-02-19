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
      <h3 className="text-xl font-bold text-center text-[#2D3748]">
        Budget & DIY Plan
      </h3>
      <div className="rounded-2xl border-2 border-[#0E79B2]/30 bg-[#0E79B2]/5 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0E79B2]">
            Optional Upgrade
          </span>
          <span className="text-[11px] font-medium text-slate-500">DIY Security</span>
        </div>
        <label className="mt-4 flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 rounded text-[#0E79B2]"
            checked={formData.diy_security_plan}
            onChange={(event) =>
              onUpdateField("diy_security_plan", event.target.checked)
            }
          />
          <div>
            <span className="text-sm font-semibold text-[#2D3748]">
              DIY Security Plan
            </span>
            <p className="text-xs text-slate-500">
              I want a self-install guide and plan.
            </p>
          </div>
        </label>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-semibold text-[#2D3748]">Budget Zone</label>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
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
                className={`group flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${isSelected ? "border-[#0E79B2] bg-[#0E79B2]/10 ring-1 ring-[#0E79B2]/30 shadow-sm" : "border-slate-200 bg-white hover:border-[#0E79B2]/60 hover:bg-slate-50"}`}
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
        className="w-full bg-[#0E79B2] text-white py-3 rounded-xl font-bold disabled:opacity-50 mt-4"
      >
        Next
      </button>
    </div>
  );
}
