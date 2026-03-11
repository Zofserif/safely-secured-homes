"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import { trackNewsletterLeadGenerated } from "../../lib/analytics";
import { deriveNameFromEmail, normalizeEmail } from "../../lib/contactName";
import { sendEmail } from "../../lib/email";
import { writeNewsletterLead } from "../../lib/newsletterLead";
import { panatagChecklistUrl } from "../../lib/site";

type Status = "idle" | "submitting" | "success" | "error";

export default function NewsletterChecklistModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [checklistEmailSent, setChecklistEmailSent] = useState<boolean | null>(
    null
  );
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  const resetForm = () => {
    setStatus("idle");
    setError(null);
    setChecklistEmailSent(null);
    setEmail("");
  };

  const openModal = () => {
    resetForm();
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    if (status === "success") {
      router.push("/newsletter/thank-you");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;
    setError(null);
    setStatus("submitting");
    setChecklistEmailSent(null);

    const normalizedEmail = normalizeEmail(email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      setStatus("error");
      return;
    }
    const name = deriveNameFromEmail(normalizedEmail);

    const payload = {
      email: normalizedEmail,
      source: "newsletter",
    };

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (response.status === 409 && errorData?.code === "email_exists") {
          setError("That email is already subscribed.");
          setStatus("error");
          return;
        }
        setError(errorData?.error || "Newsletter signup failed.");
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

      writeNewsletterLead({
        name,
        email: payload.email,
      });
      setChecklistEmailSent(checklistSent);
      trackNewsletterLeadGenerated(
        { flow_source: "newsletter", flow_mode: "newsletter" },
        {
          source: "newsletter_modal",
          method: checklistSent ? "emailjs" : "fallback",
          destination: "newsletter_thank_you",
        }
      );
      setStatus("success");
    } catch (submitError) {
      console.error(submitError);
      setError("Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  return (
    <>
      <div className="mt-6 flex justify-center sm:justify-start p-1">
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center justify-center bg-[#0E79B2] hover:bg-[#0b5e8b] text-white px-7 py-3 rounded-full font-bold shadow-lg shadow-[#0E79B2]/30 transition-all hover:-translate-y-0.5 w-full sm:w-auto border-2 border-white/70 ring-1 ring-[#0E79B2]/20"
        >
          GET MY CHECKLIST
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeModal}
            aria-hidden="true"
          ></div>
          <div
            className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#E2E0D8] p-6 sm:p-8"
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            {status === "success" ? (
              <div className="mt-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#BEE9E8]/60 text-[#0E79B2]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-[#1F2937] mt-4">
                  You’re on the list!
                </h4>
                <p className="text-slate-600 mt-2">
                  {checklistEmailSent
                    ? "Check your email for the checklist and next steps."
                    : "We couldn’t confirm email delivery right now, but your signup is complete. Continue to download instantly on the next page."}
                </p>
                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-6 inline-flex items-center justify-center px-6 py-2 rounded-full bg-[#0E79B2] text-white font-semibold"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6">
                <div>
                  <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                    Email address
                  </label>
                  <input
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (error) setError(null);
                    }}
                    type="email"
                    required
                    autoComplete="email"
                    autoFocus
                    className="w-full p-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20 outline-none"
                    placeholder="you@email.com"
                  />
                </div>

                {error && (
                  <p className="mt-4 text-sm text-red-600 font-semibold">
                    {error}
                  </p>
                )}

                <p className="mt-4 text-center text-xs text-slate-500">
                  By submitting, you agree to our{" "}
                  <Link
                    href="/privacy"
                    className="font-semibold text-[#0E79B2] underline"
                  >
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/terms"
                    className="font-semibold text-[#0E79B2] underline"
                  >
                    Terms of Service
                  </Link>
                  .
                </p>

                <div className="mt-6 flex items-center justify-center">
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="inline-flex items-center justify-center px-6 py-2 rounded-full bg-[#0E79B2] text-white font-semibold shadow-md shadow-[#0E79B2]/20 disabled:opacity-70"
                  >
                    {status === "submitting"
                      ? "Submitting..."
                      : "Get my checklist now"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
