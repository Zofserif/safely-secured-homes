"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { trackNewsletterLeadGenerated } from "../../lib/analytics";
import { deriveNameFromEmail, normalizeEmail } from "../../lib/contactName";
import { sendEmail } from "../../lib/email";
import { panatagChecklistUrl } from "../../lib/site";

export default function NewsletterForm() {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [checklistEmailSent, setChecklistEmailSent] = useState<boolean | null>(
    null
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;
    setSubmitError(null);
    setChecklistEmailSent(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = normalizeEmail(String(formData.get("email") || ""));
    const name = deriveNameFromEmail(email);
    const payload = {
      email,
      source: "newsletter",
    };

    setStatus("submitting");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (response.status === 409 && errorData?.code === "email_exists") {
          setSubmitError("That email is already subscribed.");
          setStatus("error");
          return;
        }
        if (response.status === 400 && errorData?.code === "23502") {
          setSubmitError("Please fill in all required fields.");
          setStatus("error");
          return;
        }
        setSubmitError(errorData?.error || "Newsletter signup failed.");
        setStatus("error");
        return;
      }

      let checklistSent = false;
      try {
        await sendEmail("checklist", {
          to_email: payload.email,
          name,
          checklist_name: "Panatag Home Checklist",
          checklist_url: panatagChecklistUrl,
        });
        checklistSent = true;
      } catch (emailError) {
        console.error("Checklist email send failed:", emailError);
      }

      setChecklistEmailSent(checklistSent);
      trackNewsletterLeadGenerated(
        { flow_source: "newsletter", flow_mode: "newsletter" },
        {
          source: "newsletter_form",
          method: checklistSent ? "emailjs" : "fallback",
          destination: "newsletter_thank_you",
        }
      );
      form.reset();
      setStatus("success");
    } catch (error) {
      console.error(error);
      setSubmitError("Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="w-full max-w-lg bg-white/95 border border-[#BEE9E8]/70 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-[#0E79B2]/10">
      <h2 className="text-2xl font-bold text-[#2D3748]">Join the Newsletter</h2>
      <p className="text-slate-600 mt-2 text-sm sm:text-base">
        Receive security tips, maintenance reminders, and smart home updates
        designed for Filipino households.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="newsletter-email"
            className="block text-sm font-semibold text-[#2D3748] mb-2"
          >
            Email address
          </label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full p-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20 outline-none"
            placeholder="you@email.com"
          />
        </div>

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full bg-[#0E79B2] hover:bg-[#0b5e8b] text-white text-base sm:text-lg py-3 rounded-2xl font-bold shadow-lg shadow-[#0E79B2]/25 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "Submitting..." : "GET THE CHECKLIST"}
        </button>

        <p className="text-xs text-slate-500 text-center">
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

        {status === "success" && (
          <div className="flex flex-col items-center justify-center gap-2 text-sm text-[#2E8B57] font-semibold text-center">
            <CheckCircle2 className="w-4 h-4" />
            <span>Thanks! You are on the list.</span>
            <span className="text-xs font-medium text-slate-600">
              {checklistEmailSent
                ? "Your Panatag Home Checklist is on its way to your inbox."
                : "If email delivery is delayed, use the direct download on the thank-you page."}
            </span>
          </div>
        )}
        {status === "error" && submitError && (
          <div className="text-center text-sm text-red-600 font-semibold">
            {submitError}
          </div>
        )}
      </form>
    </div>
  );
}
