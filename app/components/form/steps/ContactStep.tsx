import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { ContactStepProps } from "../types";

export default function ContactStep({
  formData,
  errors,
  isSubmitting,
  isNewsletterFlow,
  submitLabel,
  submittingLabel,
  onSubmit,
  onUpdateField,
}: ContactStepProps) {
  return (
    <div className="space-y-5">
      <h3 className="text-center text-2xl font-black tracking-tight text-[#1F2937] sm:text-3xl">
        Almost done!
      </h3>

      <div>
        <input
          type="email"
          placeholder="Email Address"
          className={`w-full rounded-2xl border px-4 py-3.5 shadow-sm outline-none transition focus-visible:ring-4 ${errors.email ? "border-red-500 focus-visible:ring-red-100" : "border-[#D8DDE3] focus-visible:border-[#0E79B2] focus-visible:ring-[#0E79B2]/15"}`}
          value={formData.email}
          onChange={(event) => onUpdateField("email", event.target.value)}
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>

      <div>
        <input
          type="tel"
          placeholder="Mobile Number (optional, 09xxxxxxxxx)"
          className={`w-full rounded-2xl border px-4 py-3.5 shadow-sm outline-none transition focus-visible:ring-4 ${errors.mobile ? "border-red-500 focus-visible:ring-red-100" : "border-[#D8DDE3] focus-visible:border-[#0E79B2] focus-visible:ring-[#0E79B2]/15"}`}
          value={formData.mobile}
          onChange={(event) => onUpdateField("mobile", event.target.value)}
        />
        {errors.mobile && (
          <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>
        )}
      </div>

      <button
        onClick={onSubmit}
        disabled={!formData.email || isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0E79B2] py-3.5 font-bold text-white shadow-lg shadow-[#0E79B2]/30 transition hover:bg-[#0C6798] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />{" "}
            {submittingLabel ??
              (isNewsletterFlow
                ? "Sending your answer..."
                : "Generating Plan...")}
          </>
        ) : (
          submitLabel ??
          (isNewsletterFlow ? "SEND MY ANSWER NOW" : "Generate My FREE PLAN")
        )}
      </button>

      <p className="text-center text-xs text-slate-500 sm:text-sm">
        By submitting, you agree to our{" "}
        <Link href="/privacy" className="font-semibold text-[#0E79B2] underline">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/terms" className="font-semibold text-[#0E79B2] underline">
          Terms of Service
        </Link>
        .
      </p>
    </div>
  );
}
