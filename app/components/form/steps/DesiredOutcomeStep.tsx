import { DESIRED_OUTCOME_OPTIONS } from "../../../lib/formOptions";
import type { DesiredOutcomeStepProps } from "../types";

const resolveFirstName = (value: string): string => {
  const trimmed = value.trim();
  return trimmed || "there";
};

export default function DesiredOutcomeStep({
  formData,
  onNext,
  onUpdateField,
}: DesiredOutcomeStepProps) {
  const firstName = resolveFirstName(formData.first_name);

  return (
    <div className="space-y-5">
      <h3 className="text-center text-2xl font-black tracking-tight text-[#1F2937] sm:text-3xl">
        If you could achieve this in the next week, {firstName}, what would be your
        main goal?
      </h3>
      <p className="text-center text-sm text-slate-600 sm:text-base">
        Pick one top outcome so we can focus on what matters most.
      </p>

      <div className="space-y-3">
        {DESIRED_OUTCOME_OPTIONS.map((option) => {
          const isSelected = formData.desired_outcome === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => {
                onUpdateField("desired_outcome", option);
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
