"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";

export default function NewsletterForm() {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;
    setPhoneError(null);
    setSubmitError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const rawContact = String(formData.get("contactNumber") || "").trim();
    const digitsOnly = rawContact.replace(/\D/g, "");
    let normalizedContact = digitsOnly;
    if (digitsOnly.startsWith("63") && digitsOnly.length === 12) {
      normalizedContact = `0${digitsOnly.slice(2)}`;
    } else if (digitsOnly.startsWith("9") && digitsOnly.length === 10) {
      normalizedContact = `0${digitsOnly}`;
    }
    const payload = {
      first_name: String(formData.get("firstName") || "").trim(),
      last_name: String(formData.get("lastName") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      contact_number: normalizedContact,
      source: "newsletter",
    };

    const phPhoneRegex = /^09\d{9}$/;
    if (!phPhoneRegex.test(normalizedContact)) {
      setPhoneError(
        "Use 09XXXXXXXXX, +639XXXXXXXXX, or +63 9xx-xxx-xxxx."
      );
      return;
    }

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
        if (response.status === 400 && errorData?.code === "23514") {
          setSubmitError("Please use a valid PH phone number.");
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
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="newsletter-first-name"
              className="block text-sm font-semibold text-[#2D3748] mb-2"
            >
              First name
            </label>
            <input
              id="newsletter-first-name"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              className="w-full p-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20 outline-none"
              placeholder="Juan"
            />
          </div>
          <div>
            <label
              htmlFor="newsletter-last-name"
              className="block text-sm font-semibold text-[#2D3748] mb-2"
            >
              Last name
            </label>
            <input
              id="newsletter-last-name"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              className="w-full p-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20 outline-none"
              placeholder="Dela Cruz"
            />
          </div>
        </div>

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

        <div>
          <label
            htmlFor="newsletter-contact"
            className="block text-sm font-semibold text-[#2D3748] mb-2"
          >
            Contact number
          </label>
          <input
            id="newsletter-contact"
            name="contactNumber"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            className={`w-full p-3 rounded-xl border bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20 outline-none ${phoneError ? "border-red-500" : "border-slate-300"}`}
            placeholder="09xx xxx xxxx"
          />
          {phoneError && (
            <p className="text-xs text-red-600 mt-1">{phoneError}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full bg-[#0E79B2] hover:bg-[#0b5e8b] text-white text-base sm:text-lg py-3 rounded-2xl font-bold shadow-lg shadow-[#0E79B2]/25 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "Submitting..." : "GET THE CHECKLIST"}
        </button>

        <p className="text-xs text-slate-500 text-center">
          We respect your privacy and will never share your contact details.
        </p>

        {status === "success" && (
          <div className="flex items-center justify-center gap-2 text-sm text-[#2E8B57] font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Thanks! You are on the list.
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
