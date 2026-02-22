import { deriveDiySecurityPlan } from "../../../lib/diySecurityPlan";
import { TIMELINE_OPTIONS } from "../../../lib/formOptions";
import type { TimelineStepProps } from "../types";

export default function TimelineStep({
  formData,
  onNext,
  onUpdateField,
}: TimelineStepProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-center text-[#2D3748]">
        When do you need this?
      </h3>
      <div className="space-y-3">
        {TIMELINE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              onUpdateField("timeline", option.value);
              onUpdateField("diy_security_plan", deriveDiySecurityPlan(option.value));
              onNext();
            }}
            className={`w-full p-4 rounded-xl border text-left hover:border-[#0E79B2] transition-all ${formData.timeline === option.value ? "border-[#0E79B2] bg-[#0E79B2]/5 ring-1 ring-[#0E79B2]" : "border-slate-200"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
