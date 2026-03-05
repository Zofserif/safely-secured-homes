import type { GoalObstacleOtherStepProps } from "../types";

export default function GoalObstacleOtherStep({
  formData,
  onNext,
  onUpdateField,
}: GoalObstacleOtherStepProps) {
  const trimmedOtherText = formData.goal_obstacle_other.trim();
  const hasAdditionalNotes = formData.has_additional_notes;
  const showNotesInput = hasAdditionalNotes === true;
  const hasTypedNotes = trimmedOtherText.length > 0;

  const handleSkipForNow = () => {
    onUpdateField("has_additional_notes", false);
    onUpdateField("goal_obstacle_other", "");
    onNext();
  };

  const handleContinue = () => {
    if (hasTypedNotes) {
      onUpdateField("goal_obstacle_other", trimmedOtherText);
      onUpdateField("has_additional_notes", true);
      onNext();
      return;
    }

    onUpdateField("goal_obstacle_other", "");
    onUpdateField("has_additional_notes", false);
    onNext();
  };

  return (
    <div className="space-y-5">
      <h3 className="text-center text-2xl font-black tracking-tight text-[#1F2937] sm:text-3xl">
        Anything else you&apos;d like us to know?
      </h3>

      <div className="mx-auto grid w-full max-w-164 grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5">
        <button
          type="button"
          onClick={() => onUpdateField("has_additional_notes", true)}
          aria-pressed={hasAdditionalNotes === true}
          className={`group mx-auto w-full max-w-[20rem] rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0E79B2]/20 ${hasAdditionalNotes === true ? "border-[#0E79B2] bg-[#F2FAFF] ring-1 ring-[#0E79B2]/30 shadow-sm" : "border-[#E2E8F0] bg-white hover:border-[#0E79B2]/60 hover:bg-slate-50"}`}
        >
          <p
            className={`text-sm font-semibold leading-tight sm:text-base ${hasAdditionalNotes === true ? "text-[#0E79B2]" : "text-slate-800"}`}
          >
            Add notes or a question
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Share extra details we should keep in mind.
          </p>
        </button>
        <button
          type="button"
          onClick={handleSkipForNow}
          aria-pressed={hasAdditionalNotes === false}
          className={`group mx-auto w-full max-w-[20rem] rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0E79B2]/20 ${hasAdditionalNotes === false ? "border-[#0E79B2] bg-[#F2FAFF] ring-1 ring-[#0E79B2]/30 shadow-sm" : "border-[#E2E8F0] bg-white hover:border-[#0E79B2]/60 hover:bg-slate-50"}`}
        >
          <p
            className={`text-sm font-semibold leading-tight sm:text-base ${hasAdditionalNotes === false ? "text-[#0E79B2]" : "text-slate-800"}`}
          >
            Skip for now
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Continue without adding extra notes.
          </p>
        </button>
      </div>

      {showNotesInput ? (
        <div className="space-y-3 rounded-2xl border border-[#D7E8F4] bg-[#F8FCFF] p-4">
          <label
            htmlFor="goal-obstacle-other"
            className="block text-sm font-semibold text-[#2D3748]"
          >
            Additional notes or questions (optional)
          </label>
          <textarea
            id="goal-obstacle-other"
            rows={4}
            value={formData.goal_obstacle_other}
            onChange={(event) => onUpdateField("goal_obstacle_other", event.target.value)}
            placeholder="Type your answer here"
            className="w-full resize-y rounded-xl border border-[#D8DDE3] bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus-visible:border-[#0E79B2] focus-visible:ring-4 focus-visible:ring-[#0E79B2]/15"
          />
          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-2xl bg-[#0E79B2] py-3 font-bold text-white shadow-lg shadow-[#0E79B2]/30 transition hover:bg-[#0C6798]"
          >
            Continue
          </button>
        </div>
      ) : null}
    </div>
  );
}
