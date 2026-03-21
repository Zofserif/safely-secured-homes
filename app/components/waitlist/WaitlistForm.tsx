"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import {
  trackWaitlistLeadGenerated,
  type FunnelContext,
} from "../../lib/analytics";
import { normalizeEmail } from "../../lib/contactName";
import { readCurrentMarketingAttribution } from "../../lib/marketingAttribution";

type WaitlistFormProps = {
  title?: string;
  description?: string;
  submitLabel?: string;
  defaultSource?: string;
  trackingContext?: FunnelContext;
  successTitle?: string;
  successCopy?: string;
};

export default function WaitlistForm({
  title = "Join the Waitlist",
  description = "Enter your name and email to hear when the next Panatag Rating opening becomes available.",
  submitLabel = "JOIN THE WAITLIST",
  defaultSource = "reports_sold_out",
  trackingContext = {
    flow_source: "direct",
    flow_mode: "default",
  },
  successTitle = "You’re on the waitlist.",
  successCopy = "We’ll email you when the next Panatag Rating opening becomes available.",
}: WaitlistFormProps) {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;
    setSubmitError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").replace(/\s+/g, " ").trim();
    const email = normalizeEmail(String(formData.get("email") || ""));
    if (!name || !email) {
      setStatus("error");
      setSubmitError("Please enter your name and email address.");
      return;
    }

    const attribution = readCurrentMarketingAttribution();
    const payload = {
      name,
      email,
      source: attribution.source || defaultSource,
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
    };

    setStatus("submitting");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        setSubmitError(responseData?.error || "Waitlist signup failed.");
        setStatus("error");
        return;
      }

      trackWaitlistLeadGenerated(trackingContext, {
        page: "waitlist",
        source: payload.source,
        method: "waitlist_api",
        destination: "waitlist",
      });
      form.reset();
      setStatus("success");
    } catch (error) {
      console.error(error);
      setSubmitError("Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="w-full max-w-lg rounded-3xl border border-[#BEE9E8]/70 bg-white/95 p-6 shadow-2xl shadow-[#0E79B2]/10 sm:p-8">
      <h2 className="text-2xl font-bold text-[#2D3748]">{title}</h2>
      <p className="mt-2 text-sm text-slate-600 sm:text-base">{description}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="waitlist-name"
            className="mb-2 block text-sm font-semibold text-[#2D3748]"
          >
            Full name
          </label>
          <input
            id="waitlist-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
            placeholder="Your name"
          />
        </div>

        <div>
          <label
            htmlFor="waitlist-email"
            className="mb-2 block text-sm font-semibold text-[#2D3748]"
          >
            Email address
          </label>
          <input
            id="waitlist-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
            placeholder="you@email.com"
          />
        </div>

        <button
          type="submit"
          disabled={status === "submitting"}
          className="flex w-full items-center justify-center rounded-2xl bg-[#0E79B2] py-3 text-base font-bold text-white shadow-lg shadow-[#0E79B2]/25 transition-all hover:-translate-y-0.5 hover:bg-[#0b5e8b] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "submitting" ? "Submitting..." : submitLabel}
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

        {status === "success" && (
          <div className="flex flex-col items-center justify-center gap-2 text-center text-sm font-semibold text-[#2E8B57]">
            <CheckCircle2 className="h-4 w-4" />
            <span>{successTitle}</span>
            <span className="text-xs font-medium text-slate-600">
              {successCopy}
            </span>
          </div>
        )}

        {status === "error" && submitError && (
          <div className="text-center text-sm font-semibold text-red-600">
            {submitError}
          </div>
        )}
      </form>
    </div>
  );
}
