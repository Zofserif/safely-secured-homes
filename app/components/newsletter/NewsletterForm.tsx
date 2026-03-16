"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import {
  trackNewsletterLeadGenerated,
  type FunnelContext,
  type FunnelPage,
} from "../../lib/analytics";
import { deriveNameFromEmail, normalizeEmail } from "../../lib/contactName";
import { sendEmail } from "../../lib/email";
import { readCurrentMarketingAttribution } from "../../lib/marketingAttribution";
import { panatagChecklistUrl } from "../../lib/site";

type NewsletterFormProps = {
  title?: string;
  description?: string;
  submitLabel?: string;
  defaultSource?: string;
  trackingPage?: FunnelPage;
  trackingContext?: FunnelContext;
  trackingDestination?: string;
  successTitle?: string;
  successEmailSentCopy?: string;
  successFallbackCopy?: string;
  successEmailDisabledCopy?: string;
};

type ChecklistDeliveryState = "sent" | "disabled" | "fallback";

export default function NewsletterForm({
  title = "Join the Newsletter",
  description = "Receive security tips, maintenance reminders, and smart home updates designed for Filipino households.",
  submitLabel = "GET THE CHECKLIST",
  defaultSource = "newsletter_form",
  trackingPage = "newsletter",
  trackingContext = {
    flow_source: "newsletter",
    flow_mode: "newsletter",
  },
  trackingDestination = "newsletter_thank_you",
  successTitle = "Thanks! You are on the list.",
  successEmailSentCopy = "Your Panatag Home Checklist is on its way to your inbox.",
  successFallbackCopy = "If email delivery is delayed, use the direct download on the thank-you page.",
  successEmailDisabledCopy =
    "Your signup is complete, but email delivery is currently turned off.",
}: NewsletterFormProps) {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [checklistDeliveryState, setChecklistDeliveryState] =
    useState<ChecklistDeliveryState | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;
    setSubmitError(null);
    setChecklistDeliveryState(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = normalizeEmail(String(formData.get("email") || ""));
    const name = deriveNameFromEmail(email);
    const attribution = readCurrentMarketingAttribution();
    const payload = {
      email,
      source: attribution.source || defaultSource,
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
    };

    setStatus("submitting");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 400 && responseData?.code === "23502") {
          setSubmitError("Please fill in all required fields.");
          setStatus("error");
          return;
        }
        setSubmitError(responseData?.error || "Newsletter signup failed.");
        setStatus("error");
        return;
      }

      let checklistDeliveryState: ChecklistDeliveryState = "fallback";
      const emailSendingEnabled = responseData?.emailSendingEnabled !== false;
      const unsubscribeUrl =
        typeof responseData?.unsubscribeUrl === "string"
          ? responseData.unsubscribeUrl.trim()
          : "";
      if (!emailSendingEnabled) {
        checklistDeliveryState = "disabled";
      } else {
        try {
          if (!unsubscribeUrl) {
            throw new Error(
              "Newsletter signup response did not include an unsubscribe URL.",
            );
          }

          const sendResult = await sendEmail("checklist", {
            to_email: payload.email,
            name,
            checklist_name: "Panatag Home Checklist",
            checklist_url: panatagChecklistUrl,
            unsubscribe_url: unsubscribeUrl,
          });
          checklistDeliveryState = sendResult ? "sent" : "fallback";
        } catch (emailError) {
          console.error("Checklist email send failed:", emailError);
        }
      }

      setChecklistDeliveryState(checklistDeliveryState);
      trackNewsletterLeadGenerated(
        trackingContext,
        {
          page: trackingPage,
          source: payload.source,
          method:
            checklistDeliveryState === "sent"
              ? "emailjs"
              : checklistDeliveryState,
          destination: trackingDestination,
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
      <h2 className="text-2xl font-bold text-[#2D3748]">{title}</h2>
      <p className="text-slate-600 mt-2 text-sm sm:text-base">
        {description}
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
          {status === "submitting" ? "Submitting..." : submitLabel}
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
            <span>{successTitle}</span>
            <span className="text-xs font-medium text-slate-600">
              {checklistDeliveryState === "sent"
                ? successEmailSentCopy
                : checklistDeliveryState === "disabled"
                  ? successEmailDisabledCopy
                  : successFallbackCopy}
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
