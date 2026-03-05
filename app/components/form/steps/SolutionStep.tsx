import { Check } from "lucide-react";
import { resolveFirstName } from "../../../lib/contactName";
import {
  SOLUTION_OPTIONS,
  SOLUTION_OPTION_CARDS,
  type SolutionOptionValue,
} from "../../../lib/formOptions";
import type { SolutionStepProps } from "../types";

const solutionCardOrderClasses: Record<SolutionOptionValue, string> = {
  [SOLUTION_OPTIONS.DONE_FOR_YOU_SETUP]: "order-1 md:order-3",
  [SOLUTION_OPTIONS.ONE_ON_ONE_HOME_SECURITY_CONSULTATION]: "order-2 md:order-2",
  [SOLUTION_OPTIONS.DIY_HOME_SAFETY_PLAN]: "order-3 md:order-1",
};

export default function SolutionStep({
  formData,
  onNext,
  onUpdateField,
}: SolutionStepProps) {
  const firstName = resolveFirstName(formData.first_name);
  const hasSelection = Boolean(formData.solution);

  return (
    <div className="space-y-6">
      <h3 className="text-center text-2xl font-black tracking-tight text-[#1F2937] sm:text-3xl">
        Hi {firstName}, what kind of help would you need for your home?
      </h3>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-1">
        {SOLUTION_OPTION_CARDS.map((option) => {
          const isSelected = formData.solution === option.value;
          const isMobileDefaultOption =
            !hasSelection && option.value === SOLUTION_OPTIONS.DONE_FOR_YOU_SETUP;
          const isDesktopDefaultOption =
            !hasSelection &&
            option.value === SOLUTION_OPTIONS.ONE_ON_ONE_HOME_SECURITY_CONSULTATION;
          const cardOrderClassName = solutionCardOrderClasses[option.value];
          const highlightedButtonClass =
            "border-[#0E79B2] bg-[#0E79B2] text-white group-hover:bg-[#0C6798]";
          const neutralButtonClass =
            "border-slate-300 bg-white text-slate-900 group-hover:border-slate-400 group-hover:bg-slate-50";

          let buttonToneClassName = neutralButtonClass;

          if (isSelected) {
            buttonToneClassName = highlightedButtonClass;
          } else if (isMobileDefaultOption) {
            buttonToneClassName = `${highlightedButtonClass} md:border-slate-300 md:bg-white md:text-slate-900 md:group-hover:border-slate-400 md:group-hover:bg-slate-50`;
          } else if (isDesktopDefaultOption) {
            buttonToneClassName = `${neutralButtonClass} md:border-[#0E79B2] md:bg-[#0E79B2] md:text-white md:group-hover:border-[#0E79B2] md:group-hover:bg-[#0C6798]`;
          }

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onUpdateField("solution", option.value);
                onNext();
              }}
              className={`group relative flex h-full min-h-80 cursor-pointer select-none flex-col rounded-2xl border border-[#E2E8F0] bg-white p-5 text-left shadow-sm transition-[transform,box-shadow,border-color,background-color] duration-200 active:scale-[0.99] hover:-translate-y-0.5 hover:border-[#0E79B2]/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0E79B2]/30 ${cardOrderClassName}`}
              aria-pressed={isSelected}
            >
              <div className="flex w-full justify-center md:min-h-8 md:items-start">
                <p className="pb-2 text-center text-3xl font-extrabold leading-snug text-[#1F2937] sm:text-4xl">
                  {option.title}
                </p>
              </div>

              <div className="mt-2 md:flex md:min-h-8 md:items-start">
                <p className="w-full text-center text-xs leading-relaxed text-slate-600">
                  {option.subtitle}
                </p>
              </div>

              <ul className="mt-3 flex-1 space-y-1 md:grid md:grid-rows-3 md:gap-1 md:space-y-0">
                {option.benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-2.5 text-sm leading-5 text-slate-700 md:h-full md:min-h-12"
                  >
                    <span
                      className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EAF4FB] text-[#0E79B2]"
                      aria-hidden="true"
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 pt-4">
                <div className="mx-auto mb-4 h-px w-2/3 bg-slate-200" />
                <div className="flex justify-center">
                  <span
                    className={`inline-flex min-h-10 items-center justify-center rounded-xl border px-5 py-2 text-sm font-semibold transition-colors ${buttonToneClassName}`}
                  >
                    {isSelected ? "Selected" : "This is for me"}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
