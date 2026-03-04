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
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-center text-[#2D3748]">Almost done!</h3>
      <p className="text-center text-sm text-slate-500">
        Where should we send your free Panatag Home Checklist?
      </p>

      <div>
        <input
          type="email"
          placeholder="Email Address"
          className={`w-full p-3 rounded-xl border ${errors.email ? "border-red-500" : "border-slate-300"}`}
          value={formData.email}
          onChange={(event) => onUpdateField("email", event.target.value)}
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>

      <div>
        <input
          type="tel"
          placeholder="Mobile Number (09xxxxxxxxx)"
          className={`w-full p-3 rounded-xl border ${errors.mobile ? "border-red-500" : "border-slate-300"}`}
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
        className="w-full bg-[#0E79B2] text-white py-3 rounded-xl font-bold disabled:opacity-50 shadow-lg shadow-[#0E79B2]/30 flex justify-center items-center gap-2"
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

      <p className="text-center text-xs text-slate-500">
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
