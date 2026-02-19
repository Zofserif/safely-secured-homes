import { MAIN_GOAL_OPTIONS } from "../../../lib/formOptions";
import type { MainGoalStepProps } from "../types";

export default function MainGoalStep({
  formData,
  onNext,
  onUpdateField,
}: MainGoalStepProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-center text-[#2D3748]">
        What is your main goal?
      </h3>
      <p className="text-center text-sm text-slate-500 mb-4">
        Select the most important one
      </p>
      <div className="space-y-3">
        {MAIN_GOAL_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              onUpdateField("main_goal", option.value);
              onNext();
            }}
            className={`w-full p-4 rounded-xl border text-left hover:border-[#0E79B2] transition-all ${formData.main_goal === option.value ? "border-[#0E79B2] bg-[#0E79B2]/5 ring-1 ring-[#0E79B2]" : "border-slate-200"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
