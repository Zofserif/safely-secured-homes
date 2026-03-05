import { resolveFirstName } from "../../../lib/contactName";
import { DESIRED_OUTCOME_CARD_OPTIONS } from "../constants";
import type { DesiredOutcomeStepProps } from "../types";

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

      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3">
        {DESIRED_OUTCOME_CARD_OPTIONS.map((option) => {
          const isSelected = formData.desired_outcome === option.value;
          const Icon = option.Icon;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onUpdateField("desired_outcome", option.value);
                onNext();
              }}
              className={`group flex h-full min-h-[180px] w-full flex-col rounded-2xl border p-4 text-center transition-all ${isSelected ? "border-[#0E79B2] bg-[#F2FAFF] ring-1 ring-[#0E79B2]/30 shadow-sm" : "border-[#E2E8F0] bg-white hover:border-[#0E79B2]/60 hover:bg-slate-50"}`}
              aria-pressed={isSelected}
            >
              <div
                className={`mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${isSelected ? "bg-[#0E79B2] text-white" : "bg-slate-100 text-slate-600 group-hover:bg-[#0E79B2]/15 group-hover:text-[#0E79B2]"}`}
                aria-hidden="true"
              >
                <Icon className="h-5 w-5" />
              </div>
              <p
                className={`text-sm font-semibold leading-tight sm:text-base ${isSelected ? "text-[#0E79B2]" : "text-slate-800"}`}
              >
                {option.title}
              </p>
              <p className="mt-1 text-center text-xs leading-relaxed text-slate-600">
                {option.helper}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
