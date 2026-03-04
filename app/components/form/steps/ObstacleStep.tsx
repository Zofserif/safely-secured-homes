import { useState } from "react";
import { resolveFirstName } from "../../../lib/contactName";
import { GOAL_OBSTACLE_OPTIONS } from "../../../lib/formOptions";
import type { ObstacleStepProps } from "../types";

const GOAL_OBSTACLE_OTHER_VALUE = "Other";

export default function ObstacleStep({
  formData,
  onNext,
  onUpdateField,
}: ObstacleStepProps) {
  const firstName = resolveFirstName(formData.first_name);
  const hasSavedOtherText = formData.goal_obstacle_other.trim().length > 0;
  const [showOtherInput, setShowOtherInput] = useState(
    formData.goal_obstacle === GOAL_OBSTACLE_OTHER_VALUE || hasSavedOtherText,
  );
  const trimmedOtherText = formData.goal_obstacle_other.trim();

  return (
    <div className="space-y-5">
      <h3 className="text-center text-2xl font-black tracking-tight text-[#1F2937] sm:text-3xl">
        Hi {firstName}, what is the main reason you have not achieved your goal
        yet?
      </h3>
      <p className="text-center text-sm text-slate-600 sm:text-base">
        Choose what feels closest to your current situation.
      </p>

      <div className="space-y-3">
        {GOAL_OBSTACLE_OPTIONS.map((option) => {
          const isSelected = formData.goal_obstacle === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => {
                onUpdateField("goal_obstacle", option);
                onUpdateField("goal_obstacle_other", "");
                onNext();
              }}
              className={`w-full rounded-xl border p-4 text-left transition-all ${isSelected ? "border-[#0E79B2] bg-[#F2FAFF] ring-1 ring-[#0E79B2]/35 shadow-sm" : "border-[#E2E8F0] bg-white hover:border-[#0E79B2]/60 hover:bg-slate-50"}`}
              aria-pressed={isSelected}
            >
              <span
                className={`text-sm font-semibold leading-snug sm:text-base ${isSelected ? "text-[#0E79B2]" : "text-slate-800"}`}
              >
                {option}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {!showOtherInput ? (
          <button
            type="button"
            onClick={() => {
              setShowOtherInput(true);
              onUpdateField("goal_obstacle", "");
            }}
            className="text-sm font-semibold text-[#0E79B2] underline underline-offset-4 transition hover:text-[#0C6798]"
          >
            Anything else you would like to share?
          </button>
        ) : (
          <div className="space-y-3 rounded-2xl border border-[#D7E8F4] bg-[#F8FCFF] p-4">
            <label
              htmlFor="goal-obstacle-other"
              className="block text-sm font-semibold text-[#2D3748]"
            >
              Tell us your main reason
            </label>
            <textarea
              id="goal-obstacle-other"
              rows={4}
              value={formData.goal_obstacle_other}
              onChange={(event) =>
                onUpdateField("goal_obstacle_other", event.target.value)
              }
              placeholder="Type your answer here"
              className="w-full resize-y rounded-xl border border-[#D8DDE3] bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus-visible:border-[#0E79B2] focus-visible:ring-4 focus-visible:ring-[#0E79B2]/15"
            />
            <button
              type="button"
              onClick={() => {
                onUpdateField("goal_obstacle", GOAL_OBSTACLE_OTHER_VALUE);
                onUpdateField("goal_obstacle_other", trimmedOtherText);
                onNext();
              }}
              disabled={trimmedOtherText.length === 0}
              className="w-full rounded-2xl bg-[#0E79B2] py-3 font-bold text-white shadow-lg shadow-[#0E79B2]/30 transition hover:bg-[#0C6798] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
