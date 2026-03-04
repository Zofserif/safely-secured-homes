import { deriveDiySecurityPlan } from "../../../lib/diySecurityPlan";
import { TIMELINE_OPTIONS } from "../../../lib/formOptions";
import type { TimelineStepProps } from "../types";

export default function TimelineStep({
  formData,
  onNext,
  onUpdateField,
}: TimelineStepProps) {
  return (
    <div className="space-y-5">
      <h3 className="text-center text-2xl font-black tracking-tight text-[#1F2937] sm:text-3xl">
        When do you need this?
      </h3>
      <p className="text-center text-sm text-slate-600 sm:text-base">
        Pick the timeline that best describes your plan.
      </p>
      <div className="space-y-3">
        {TIMELINE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onUpdateField("timeline", option.value);
              onUpdateField("diy_security_plan", deriveDiySecurityPlan(option.value));
              onNext();
            }}
            className={`w-full rounded-xl border p-4 text-left transition-all ${formData.timeline === option.value ? "border-[#0E79B2] bg-[#F2FAFF] ring-1 ring-[#0E79B2]/35 shadow-sm" : "border-[#E2E8F0] bg-white hover:border-[#0E79B2]/60 hover:bg-slate-50"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
