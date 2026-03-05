import { Check, ChevronRight } from "lucide-react";
import { resolveFirstName } from "../../../lib/contactName";
import { SOLUTION_OPTION_CARDS } from "../../../lib/formOptions";
import type { SolutionStepProps } from "../types";

export default function SolutionStep({
  formData,
  onNext,
  onUpdateField,
}: SolutionStepProps) {
  const firstName = resolveFirstName(formData.first_name);

  return (
    <div className="space-y-6">
      <h3 className="text-center text-2xl font-black tracking-tight text-[#1F2937] sm:text-3xl">
        Hi {firstName}, what kind of help would you need for this?
      </h3>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {SOLUTION_OPTION_CARDS.map((option) => {
          const isSelected = formData.solution === option.value;
          const isFeatured = Boolean(option.isFeatured);

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onUpdateField("solution", option.value);
                onNext();
              }}
              className={`group relative flex min-h-[280px] h-full cursor-pointer select-none flex-col rounded-2xl border p-5 text-left transition-[transform,box-shadow,border-color,background-color] duration-200 active:scale-[0.99] focus-visible:border-[#0E79B2]/55 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0E79B2]/20 ${isSelected ? "border-[#0E79B2]/45 bg-[#F7FCFF] ring-1 ring-[#0E79B2]/20 shadow-sm" : isFeatured ? "border-[#0E79B2]/35 bg-[#FBFDFF] shadow-sm hover:-translate-y-0.5 hover:border-[#0E79B2]/50 hover:shadow-md" : "border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-[#0E79B2]/35 hover:shadow-md"}`}
              aria-pressed={isSelected}
            >
              <div className="flex items-start justify-between gap-3">
                <p
                  className={`text-base font-semibold leading-snug sm:text-lg ${isSelected ? "text-[#0E79B2]" : "text-slate-800"}`}
                >
                  {option.title}
                </p>
                {option.badge ? (
                  <span className="shrink-0 rounded-full border border-[#D6E8F6] bg-[#F7FBFF] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#0E79B2]">
                    {option.badge}
                  </span>
                ) : null}
              </div>

              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Best for: {option.subtitle}
              </p>

              <ul className="mt-4 flex-1 space-y-2.5">
                {option.benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700"
                  >
                    <span
                      className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${isSelected ? "bg-[#0E79B2]/15 text-[#0E79B2]" : "bg-slate-100 text-slate-500"}`}
                      aria-hidden="true"
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <div
                className={`mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-sm ${isSelected ? "text-[#0E79B2]" : "text-slate-500 group-hover:text-[#0E79B2]"}`}
              >
                <span>{isSelected ? "Selected" : "Choose option"}</span>
                {isSelected ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
