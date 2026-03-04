import type { FormEvent, KeyboardEvent } from "react";
import type { IntroStepProps } from "../types";

const FIRST_NAME_MAX_LENGTH = 50;

export default function IntroStep({
  formData,
  onNext,
  onUpdateField,
}: IntroStepProps) {
  const trimmedFirstName = formData.first_name.trim();
  const canContinue = trimmedFirstName.length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canContinue) return;
    onUpdateField("first_name", trimmedFirstName.slice(0, FIRST_NAME_MAX_LENGTH));
    onNext();
  };

  const handleNameInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    if (event.nativeEvent.isComposing) {
      event.preventDefault();
    }
  };

  return (
    <div className="space-y-4 py-10">
      <h3 className="text-xl font-bold text-center text-[#2D3748]">
        What should we call you?
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="First Name"
          maxLength={FIRST_NAME_MAX_LENGTH}
          className="w-full p-3 rounded-xl border border-slate-300"
          value={formData.first_name}
          onChange={(event) => onUpdateField("first_name", event.target.value)}
          onKeyDown={handleNameInputKeyDown}
        />

        <button
          type="submit"
          disabled={!canContinue}
          className="w-full bg-[#0E79B2] text-white py-3 rounded-xl font-bold disabled:opacity-50"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
