"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";

export default function NewsletterForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    event.currentTarget.reset();
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
              className="w-full p-3 rounded-xl border border-slate-300 bg-white text-sm focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20 outline-none"
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
              className="w-full p-3 rounded-xl border border-slate-300 bg-white text-sm focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20 outline-none"
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
            className="w-full p-3 rounded-xl border border-slate-300 bg-white text-sm focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20 outline-none"
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
            className="w-full p-3 rounded-xl border border-slate-300 bg-white text-sm focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20 outline-none"
            placeholder="09xx xxx xxxx"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#0E79B2] hover:bg-[#0b5e8b] text-white text-base sm:text-lg py-3 rounded-2xl font-bold shadow-lg shadow-[#0E79B2]/25 transition-all hover:-translate-y-0.5"
        >
          Subscribe to Updates
        </button>

        <p className="text-xs text-slate-500 text-center">
          We respect your privacy and will never share your contact details.
        </p>

        {submitted && (
          <div className="flex items-center justify-center gap-2 text-sm text-[#2E8B57] font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Thanks! You are on the list.
          </div>
        )}
      </form>
    </div>
  );
}
