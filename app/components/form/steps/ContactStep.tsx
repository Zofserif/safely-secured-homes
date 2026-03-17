import Link from "next/link";
import { Loader2 } from "lucide-react";
import { normalizeFirstName } from "../../../lib/contactName";
import type { ContactStepProps } from "../types";

export default function ContactStep({
  formData,
  errors,
  isSubmitting,
  submitLabel,
  submittingLabel,
  onSubmit,
  onUpdateField,
}: ContactStepProps) {
  const firstName = normalizeFirstName(formData.name);
  const heading = firstName
    ? `Your results are ready ${firstName}!`
    : "Your results are ready!";

  return (
    <div className="space-y-5">
      <h3 className="text-center text-2xl font-black tracking-tight text-[#1F2937] sm:text-3xl">
        {heading}
      </h3>

      <p className="text-center text-sm font-medium text-slate-600 sm:text-base">
        Where should we send your results link?
      </p>

      <div className="mx-auto w-full space-y-4 md:max-w-xl">
        <div>
          <input
            type="email"
            placeholder="Email Address"
            className={`w-full rounded-2xl border px-5 py-3.5 shadow-sm outline-none transition focus-visible:ring-4 ${errors.email ? "border-red-500 focus-visible:ring-red-100" : "border-[#D8DDE3] focus-visible:border-[#0E79B2] focus-visible:ring-[#0E79B2]/15"}`}
            value={formData.email}
            onChange={(event) => onUpdateField("email", event.target.value)}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>

        <div>
          <input
            type="tel"
            placeholder="Mobile Number (optional, 09xxxxxxxxx)"
            className={`w-full rounded-2xl border px-5 py-3.5 shadow-sm outline-none transition focus-visible:ring-4 ${errors.mobile ? "border-red-500 focus-visible:ring-red-100" : "border-[#D8DDE3] focus-visible:border-[#0E79B2] focus-visible:ring-[#0E79B2]/15"}`}
            value={formData.mobile}
            onChange={(event) => onUpdateField("mobile", event.target.value)}
          />
          {errors.mobile && <p className="mt-1 text-xs text-red-500">{errors.mobile}</p>}
        </div>

        <button
          onClick={onSubmit}
          disabled={!formData.email || isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0E79B2] py-3.5 font-bold text-white shadow-lg shadow-[#0E79B2]/30 transition hover:bg-[#0C6798] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />{" "}
              {submittingLabel ?? "Sending your Panatag Rating..."}
            </>
          ) : (
            submitLabel ?? "SEND MY PANATAG RATING NOW!"
          )}
        </button>
      </div>

      <p className="mx-auto text-center text-xs text-slate-500 sm:text-sm md:max-w-xl">
        By submitting, you agree to our{" "}
        <Link
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#0E79B2] underline"
        >
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#0E79B2] underline"
        >
          Terms of Service
        </Link>
        .
      </p>
    </div>
  );
}
