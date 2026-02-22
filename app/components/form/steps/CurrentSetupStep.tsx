import { Check } from "lucide-react";
import { CURRENT_SETUP_VALUES } from "../../../lib/formOptions";
import type { CurrentSetupStepProps } from "../types";

export default function CurrentSetupStep({
  formData,
  onNext,
  onUpdateField,
}: CurrentSetupStepProps) {
  return (
    <div key="setup" className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-semibold text-[#2D3748]">
            Do you currently have a security system?
          </label>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
            Choose one
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Select one option that best matches your current setup.
        </p>
        <div className="space-y-2">
          {CURRENT_SETUP_VALUES.map((option) => {
            const isSelected = formData.current_setup === option;
            return (
              <label
                key={option}
                className={`group flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all ${isSelected ? "border-[#0E79B2] bg-[#0E79B2]/10 ring-1 ring-[#0E79B2]/30 shadow-sm" : "border-slate-200 bg-white hover:border-[#0E79B2]/60 hover:bg-slate-50"}`}
              >
                <input
                  type="radio"
                  name="current_setup"
                  value={option}
                  checked={isSelected}
                  onChange={(event) =>
                    onUpdateField("current_setup", event.target.value)
                  }
                  className="sr-only"
                />
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${isSelected ? "border-[#0E79B2] bg-[#0E79B2] text-white" : "border-slate-300 bg-white text-transparent group-hover:border-[#0E79B2]/60"}`}
                  aria-hidden="true"
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span
                  className={`text-sm font-medium leading-snug ${isSelected ? "text-[#0E79B2]" : "text-slate-700 group-hover:text-slate-900"}`}
                >
                  {option}
                </span>
              </label>
            );
          })}
        </div>
      </div>
      <button
        onClick={onNext}
        disabled={!formData.current_setup}
        className="w-full bg-[#0E79B2] text-white py-3 rounded-xl font-bold disabled:opacity-50 mt-4"
      >
        Next
      </button>
    </div>
  );
}
