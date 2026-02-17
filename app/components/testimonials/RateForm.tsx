"use client";

import { Star, CheckCircle2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

type FormStatus = "idle" | "submitting" | "success" | "error";

const DEFAULT_ERROR = "We could not submit your review right now. Please try again.";

const getErrorMessage = (code?: string) => {
  if (code === "honeypot_triggered") return "Spam detection triggered. Please retry.";
  if (code === "missing_required_fields") return "Please complete all required fields.";
  if (code === "invalid_email") return "Please enter a valid email address.";
  if (code === "invalid_rating") return "Please choose a rating from 1 to 5.";
  if (code === "review_length_invalid") {
    return "Review must be between 10 and 1200 characters.";
  }
  if (code === "duplicate_submission") {
    return "Duplicate review detected. Please try again later.";
  }
  if (code === "ip_cooldown") {
    return "Please wait a few seconds before submitting again.";
  }
  if (code === "invalid_data") {
    return "Submitted data was invalid. Please review your inputs.";
  }
  return DEFAULT_ERROR;
};

export default function RateForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [rating, setRating] = useState(5);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const ratingLabel = useMemo(() => {
    if (rating <= 0) return "Select a rating";
    if (rating === 1) return "1 star";
    return `${rating} stars`;
  }, [rating]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;

    setErrorMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      first_name: String(formData.get("first_name") || "").trim(),
      last_name: String(formData.get("last_name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      location: String(formData.get("location") || "").trim(),
      review: String(formData.get("review") || "").trim(),
      website: String(formData.get("website") || "").trim(),
      rating,
    };

    if (!payload.first_name || !payload.last_name || !payload.email) {
      setStatus("error");
      setErrorMessage("Please complete all required fields.");
      return;
    }

    if (!payload.location || !payload.review || rating < 1 || rating > 5) {
      setStatus("error");
      setErrorMessage("Please complete all required fields and choose a rating.");
      return;
    }

    setStatus("submitting");

    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = await response
          .json()
          .catch(() => ({ error: DEFAULT_ERROR, code: undefined as string | undefined }));
        setStatus("error");
        setErrorMessage(
          typeof errorPayload?.error === "string"
            ? getErrorMessage(errorPayload.code)
            : DEFAULT_ERROR
        );
        return;
      }

      form.reset();
      setRating(5);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage(DEFAULT_ERROR);
    }
  };

  return (
    <div className="rounded-3xl border border-[#DCE6F1] bg-white/95 p-6 shadow-[0_18px_40px_rgba(14,121,178,0.08)] sm:p-8">
      <h2 className="text-2xl font-bold text-[#1F2937]">Share Your Feedback</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
        Tell us about your experience. Reviews are manually approved before they appear publicly.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rate-first-name" className="mb-2 block text-sm font-semibold text-[#2D3748]">
              First name
            </label>
            <input
              id="rate-first-name"
              name="first_name"
              type="text"
              required
              autoComplete="given-name"
              maxLength={80}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
              placeholder="Juan"
            />
          </div>
          <div>
            <label htmlFor="rate-last-name" className="mb-2 block text-sm font-semibold text-[#2D3748]">
              Last name
            </label>
            <input
              id="rate-last-name"
              name="last_name"
              type="text"
              required
              autoComplete="family-name"
              maxLength={80}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
              placeholder="Dela Cruz"
            />
          </div>
        </div>

        <div>
          <label htmlFor="rate-email" className="mb-2 block text-sm font-semibold text-[#2D3748]">
            Email address
          </label>
          <input
            id="rate-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
            placeholder="you@email.com"
          />
        </div>

        <div>
          <label htmlFor="rate-location" className="mb-2 block text-sm font-semibold text-[#2D3748]">
            Location
          </label>
          <input
            id="rate-location"
            name="location"
            type="text"
            required
            maxLength={120}
            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
            placeholder="Quezon City"
          />
        </div>

        <div>
          <span className="mb-2 block text-sm font-semibold text-[#2D3748]">Rating</span>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }, (_, index) => {
              const value = index + 1;
              const active = value <= rating;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  aria-label={`Rate ${value} out of 5`}
                  className="rounded-full p-1.5 outline-none transition hover:scale-105 focus:ring-2 focus:ring-[#0E79B2]/25"
                >
                  <Star
                    className="h-7 w-7"
                    fill={active ? "#0E79B2" : "none"}
                    stroke={active ? "#0E79B2" : "#CBD5E1"}
                  />
                </button>
              );
            })}
            <span className="ml-2 text-sm text-slate-600">{ratingLabel}</span>
          </div>
        </div>

        <div>
          <label htmlFor="rate-review" className="mb-2 block text-sm font-semibold text-[#2D3748]">
            Review
          </label>
          <textarea
            id="rate-review"
            name="review"
            required
            minLength={10}
            maxLength={1200}
            rows={5}
            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
            placeholder="Share your experience with Safely Secured Homes."
          />
        </div>

        <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor="rate-website">Website</label>
          <input id="rate-website" name="website" type="text" autoComplete="off" tabIndex={-1} />
        </div>

        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-[#0E79B2] px-6 py-3 text-base font-bold text-white shadow-lg shadow-[#0E79B2]/25 transition-all hover:-translate-y-0.5 hover:bg-[#0b5e8b] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "submitting" ? "Submitting..." : "Submit Review"}
        </button>

        <p className="text-xs leading-relaxed text-slate-500">
          We use your email only for verification and follow-up if needed. It will not be shown publicly.
        </p>

        {status === "success" && (
          <div className="flex items-center gap-2 text-sm font-semibold text-[#2E8B57]">
            <CheckCircle2 className="h-4 w-4" />
            Review submitted. It is now pending approval.
          </div>
        )}

        {status === "error" && errorMessage && (
          <p className="text-sm font-semibold text-red-600">{errorMessage}</p>
        )}
      </form>
    </div>
  );
}
