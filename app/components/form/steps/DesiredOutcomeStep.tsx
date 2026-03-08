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
    <div className="space-y-4 sm:space-y-5">
      <h3 className="text-center text-2xl font-black tracking-tight text-[#1F2937] sm:text-3xl">
        If you could achieve this next week {firstName}, what would be your top priority?
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
              className={`group flex h-full min-h-[184px] w-full flex-col items-center justify-center gap-2.5 rounded-2xl border p-3 text-center transition-all sm:min-h-[236px] sm:gap-3.5 sm:p-4 ${isSelected ? "border-[#0E79B2] bg-[#F2FAFF] ring-1 ring-[#0E79B2]/30 shadow-sm" : "border-[#E2E8F0] bg-white hover:border-[#0E79B2]/60 hover:bg-slate-50"}`}
              aria-pressed={isSelected}
            >
              <div
                className={`mx-auto mb-0 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-colors sm:h-16 sm:w-16 ${isSelected ? "bg-[#0E79B2] text-white" : "bg-slate-100 text-slate-600 group-hover:bg-[#0E79B2]/15 group-hover:text-[#0E79B2]"}`}
                aria-hidden="true"
              >
                <Icon className="h-7 w-7 sm:h-8 sm:w-8" />
              </div>
              <p
                className={`mx-auto flex max-w-[18ch] min-h-[2.4rem] items-center justify-center text-sm font-semibold leading-tight sm:min-h-[3.2rem] sm:text-base ${isSelected ? "text-[#0E79B2]" : "text-slate-800"}`}
              >
                {option.title}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
