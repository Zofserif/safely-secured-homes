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
        Where should we send your free Checklist?
      </p>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="First Name"
          className="w-1/2 p-3 rounded-xl border border-slate-300"
          value={formData.first_name}
          onChange={(event) => onUpdateField("first_name", event.target.value)}
        />
        <input
          type="text"
          placeholder="Last Name"
          className="w-1/2 p-3 rounded-xl border border-slate-300"
          value={formData.last_name}
          onChange={(event) => onUpdateField("last_name", event.target.value)}
        />
      </div>

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
        disabled={
          !formData.email ||
          !formData.first_name ||
          !formData.last_name ||
          isSubmitting
        }
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
    </div>
  );
}
