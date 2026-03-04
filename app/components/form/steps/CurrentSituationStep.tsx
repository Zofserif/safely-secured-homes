import { resolveFirstName } from "../../../lib/contactName";
import { HOUSEHOLD_STAGE_OPTIONS } from "../../../lib/formOptions";
import type { CurrentSituationStepProps } from "../types";

export default function CurrentSituationStep({
  formData,
  onNext,
  onUpdateField,
}: CurrentSituationStepProps) {
  const firstName = resolveFirstName(formData.first_name);

  return (
    <div className="space-y-5">
      <h3 className="text-center text-2xl font-black tracking-tight text-[#1F2937] sm:text-3xl">
        What would be your household stage currently, {firstName}?
      </h3>
      <p className="text-center text-sm text-slate-600 sm:text-base">
        Choose the option that best describes your home right now.
      </p>

      <div className="space-y-3">
        {HOUSEHOLD_STAGE_OPTIONS.map((option) => {
          const isSelected = formData.household_stage === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => {
                onUpdateField("household_stage", option);
                onNext();
              }}
              className={`w-full rounded-xl border p-4 text-left transition-all ${isSelected ? "border-[#0E79B2] bg-[#F2FAFF] ring-1 ring-[#0E79B2]/35 shadow-sm" : "border-[#E2E8F0] bg-white hover:border-[#0E79B2]/60 hover:bg-slate-50"}`}
              aria-pressed={isSelected}
            >
              <span
                className={`text-sm font-semibold leading-snug sm:text-base ${isSelected ? "text-[#0E79B2]" : "text-slate-800"}`}
              >
                {option}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
