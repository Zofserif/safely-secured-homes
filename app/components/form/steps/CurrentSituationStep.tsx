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

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
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
              className={`group grid aspect-square w-full grid-rows-[7fr_3fr] items-stretch rounded-lg border p-2.5 text-center transition-all sm:p-3 ${isSelected ? "border-[#0E79B2] bg-[#F2FAFF] ring-1 ring-[#0E79B2]/30 shadow-sm" : "border-[#E2E8F0] bg-white hover:border-[#0E79B2]/60 hover:bg-slate-50"}`}
              aria-pressed={isSelected}
            >
              <div className="flex items-center justify-center">
                <div
                  className={`inline-flex h-14 w-14 items-center justify-center rounded-lg transition-colors sm:h-16 sm:w-16 ${isSelected ? "bg-[#0E79B2] text-white" : "bg-slate-100 text-slate-600 group-hover:bg-[#0E79B2]/15 group-hover:text-[#0E79B2]"}`}
                  aria-hidden="true"
                >
                  <Icon className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
              </div>
              <div className="flex w-full items-center justify-center px-1 text-center">
                <p
                  className={`text-[13px] font-semibold leading-snug sm:text-[14px] lg:text-[14px] ${isSelected ? "text-[#0E79B2]" : "text-slate-800"}`}
                >
                  {option.title}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
