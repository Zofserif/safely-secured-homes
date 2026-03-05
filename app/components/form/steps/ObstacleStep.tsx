import { resolveFirstName } from "../../../lib/contactName";
import { GOAL_OBSTACLE_CARD_OPTIONS } from "../constants";
import type { ObstacleStepProps } from "../types";

export default function ObstacleStep({
  formData,
  onNext,
  onUpdateField,
}: ObstacleStepProps) {
  const firstName = resolveFirstName(formData.first_name);

  return (
    <div className="space-y-5">
      <h3 className="text-center text-2xl font-black tracking-tight text-[#1F2937] sm:text-3xl">
        Hi {firstName}, what is the main reason you have not achieved your goal
        yet?
      </h3>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        {GOAL_OBSTACLE_CARD_OPTIONS.map((option) => {
          const isSelected = formData.goal_obstacle === option.value;
          const Icon = option.Icon;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onUpdateField("goal_obstacle", option.value);
                onNext();
              }}
              className={`group flex h-full min-h-[140px] w-full flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all sm:min-h-[150px] sm:p-3.5 ${isSelected ? "border-[#0E79B2] bg-[#F2FAFF] ring-1 ring-[#0E79B2]/30 shadow-sm" : "border-[#E2E8F0] bg-white hover:border-[#0E79B2]/60 hover:bg-slate-50"}`}
              aria-pressed={isSelected}
            >
              <div
                className={`mx-auto mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl transition-colors sm:mb-3 sm:h-9 sm:w-9 ${isSelected ? "bg-[#0E79B2] text-white" : "bg-slate-100 text-slate-600 group-hover:bg-[#0E79B2]/15 group-hover:text-[#0E79B2]"}`}
                aria-hidden="true"
              >
                <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              </div>
              <p
                className={`mx-auto max-w-[16ch] text-sm font-semibold leading-snug sm:text-[15px] ${isSelected ? "text-[#0E79B2]" : "text-slate-800"}`}
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
