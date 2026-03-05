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
              className={`group flex h-full min-h-[168px] w-full flex-col items-center justify-center gap-3 rounded-2xl border p-3 text-center transition-all sm:min-h-[180px] sm:gap-3.5 sm:p-4 lg:min-h-[188px] ${isSelected ? "border-[#0E79B2] bg-[#F2FAFF] ring-1 ring-[#0E79B2]/30 shadow-sm" : "border-[#E2E8F0] bg-white hover:border-[#0E79B2]/60 hover:bg-slate-50"}`}
              aria-pressed={isSelected}
            >
              <div
                className={`mx-auto mb-0 inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors sm:h-12 sm:w-12 ${isSelected ? "bg-[#0E79B2] text-white" : "bg-slate-100 text-slate-600 group-hover:bg-[#0E79B2]/15 group-hover:text-[#0E79B2]"}`}
                aria-hidden="true"
              >
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <p
                className={`mx-auto flex max-w-[14ch] min-h-[3.1rem] items-center justify-center text-[12px] font-semibold leading-snug sm:min-h-[3.4rem] sm:text-sm lg:text-[15px] ${isSelected ? "text-[#0E79B2]" : "text-slate-800"}`}
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
