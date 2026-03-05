import { resolveFirstName } from "../../../lib/contactName";
import { HOUSEHOLD_STAGE_CARD_OPTIONS } from "../constants";
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
        What best describes your household right now, {firstName}?
      </h3>
      {/* <p className="text-center text-sm text-slate-600 sm:text-base">
        Choose the option that best describes your home right now.
      </p> */}

      <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-5">
        {HOUSEHOLD_STAGE_CARD_OPTIONS.map((option) => {
          const isSelected = formData.household_stage === option.value;
          const Icon = option.Icon;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onUpdateField("household_stage", option.value);
                onNext();
              }}
              className={`group w-full rounded-2xl border p-3 text-center transition-all sm:p-4 ${isSelected ? "border-[#0E79B2] bg-[#F2FAFF] ring-1 ring-[#0E79B2]/30 shadow-sm" : "border-[#E2E8F0] bg-white hover:border-[#0E79B2]/60 hover:bg-slate-50"}`}
              aria-pressed={isSelected}
            >
              <div
                className={`mx-auto mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl transition-colors sm:mb-3 sm:h-10 sm:w-10 ${isSelected ? "bg-[#0E79B2] text-white" : "bg-slate-100 text-slate-600 group-hover:bg-[#0E79B2]/15 group-hover:text-[#0E79B2]"}`}
                aria-hidden="true"
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <p
                className={`text-[12px] font-semibold leading-snug sm:text-sm lg:text-[15px] ${isSelected ? "text-[#0E79B2]" : "text-slate-800"}`}
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
