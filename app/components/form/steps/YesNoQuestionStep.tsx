import { ShieldCheck } from "lucide-react";
import type { YesNoQuestionStepProps } from "../types";

export default function YesNoQuestionStep({
  formData,
  field,
  question,
  subtitle,
  badgeLabel,
  onNext,
  onUpdateField,
}: YesNoQuestionStepProps) {
  const selectedValue = formData[field];

  const handleSelect = (value: boolean) => {
    onUpdateField(field, value);
    onNext();
  };

  return (
    <div className="space-y-8 py-4 sm:py-8">
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#B8D7EB] bg-[#EEF7FD] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0E79B2]">
          <ShieldCheck className="h-3.5 w-3.5" />
          {badgeLabel ?? "Quick Safety Check"}
        </span>
      </div>

      <div className="space-y-3 text-center">
        <h3 className="text-2xl font-black tracking-tight text-[#1F2937] sm:text-4xl">
          {question}
        </h3>
        {subtitle ? (
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="mx-auto grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <button
          type="button"
          onClick={() => handleSelect(true)}
          aria-pressed={selectedValue === true}
          className={`rounded-2xl px-6 py-4 text-lg font-bold text-white transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2747E4]/30 ${selectedValue === true ? "bg-[#2A45E2] ring-2 ring-[#1E35B8]/35 shadow-lg shadow-[#2A45E2]/35" : "bg-[#3C57EE] hover:-translate-y-0.5 hover:bg-[#2A45E2] hover:shadow-lg hover:shadow-[#2A45E2]/30"}`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => handleSelect(false)}
          aria-pressed={selectedValue === false}
          className={`rounded-2xl px-6 py-4 text-lg font-bold text-white transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D8223A]/30 ${selectedValue === false ? "bg-[#CB2538] ring-2 ring-[#A91C2F]/35 shadow-lg shadow-[#CB2538]/35" : "bg-[#DC2D41] hover:-translate-y-0.5 hover:bg-[#CB2538] hover:shadow-lg hover:shadow-[#CB2538]/30"}`}
        >
          No
        </button>
      </div>
    </div>
  );
}
