import type { FormEvent, KeyboardEvent } from "react";
import { normalizeFirstName } from "../../../lib/contactName";
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
    const normalizedFirstName = normalizeFirstName(trimmedFirstName).slice(
      0,
      FIRST_NAME_MAX_LENGTH
    );
    onUpdateField("first_name", normalizedFirstName);
    onNext();
  };

  const handleNameInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    if (event.nativeEvent.isComposing) {
      event.preventDefault();
    }
  };

  return (
    <div className="space-y-5 py-6 sm:py-10">
      <h3 className="text-center text-2xl font-black tracking-tight text-[#1F2937] sm:text-3xl">
        What should we call you?
      </h3>

      <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-4">
        <input
          type="text"
          placeholder="First Name"
          maxLength={FIRST_NAME_MAX_LENGTH}
          className="w-full rounded-2xl border border-[#D8DDE3] bg-white px-4 py-3.5 text-slate-800 shadow-sm outline-none transition focus-visible:border-[#0E79B2] focus-visible:ring-4 focus-visible:ring-[#0E79B2]/15"
          value={formData.first_name}
          onChange={(event) => onUpdateField("first_name", event.target.value)}
          onKeyDown={handleNameInputKeyDown}
        />

        <button
          type="submit"
          disabled={!canContinue}
          className="w-full rounded-2xl bg-[#0E79B2] py-3.5 text-base font-bold text-white shadow-lg shadow-[#0E79B2]/30 transition hover:bg-[#0C6798] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
