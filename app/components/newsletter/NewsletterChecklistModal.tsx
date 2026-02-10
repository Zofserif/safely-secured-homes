"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import { writeNewsletterLead } from "../../lib/newsletterLead";

type Status = "idle" | "submitting" | "success" | "error";

export default function NewsletterChecklistModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
  });

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
    setStep(0);
    setStatus("idle");
    setError(null);
    setValues({ firstName: "", lastName: "", email: "", contactNumber: "" });
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

  const updateValue = (field: keyof typeof values, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = () => {
    setError(null);
    if (step === 0) {
      if (!values.firstName.trim() || !values.lastName.trim()) {
        setError("Please enter your first and last name.");
        return false;
      }
    }
    if (step === 1) {
      const email = values.email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError("Please enter a valid email address.");
        return false;
      }
    }
    if (step === 2) {
      const rawContact = values.contactNumber.trim();
      const digitsOnly = rawContact.replace(/\D/g, "");
      let normalizedContact = digitsOnly;
      if (digitsOnly.startsWith("63") && digitsOnly.length === 12) {
        normalizedContact = `0${digitsOnly.slice(2)}`;
      } else if (digitsOnly.startsWith("9") && digitsOnly.length === 10) {
        normalizedContact = `0${digitsOnly}`;
      }
      const phPhoneRegex = /^09\d{9}$/;
      if (!phPhoneRegex.test(normalizedContact)) {
        setError("Use 09XXXXXXXXX or +63 9xx-xxx-xxxx.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((prev) => Math.min(prev + 1, 2));
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setStatus("submitting");
    setError(null);

    const digitsOnly = values.contactNumber.trim().replace(/\D/g, "");
    let normalizedContact = digitsOnly;
    if (digitsOnly.startsWith("63") && digitsOnly.length === 12) {
      normalizedContact = `0${digitsOnly.slice(2)}`;
    } else if (digitsOnly.startsWith("9") && digitsOnly.length === 10) {
      normalizedContact = `0${digitsOnly}`;
    }

    const payload = {
      first_name: values.firstName.trim(),
      last_name: values.lastName.trim(),
      email: values.email.trim(),
      contact_number: normalizedContact,
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
        if (response.status === 400 && errorData?.code === "23514") {
          setError("Please use a valid PH phone number.");
          setStatus("error");
          return;
        }
        setError(errorData?.error || "Newsletter signup failed.");
        setStatus("error");
        return;
      }

      writeNewsletterLead({
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        mobile: normalizedContact,
      });
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
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.shiftKey) return;
              if (status === "success" || status === "submitting") return;
              event.preventDefault();
              if (step < 2) {
                handleNext();
              } else {
                handleSubmit();
              }
            }}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
                Step {step + 1} of 3
              </p>
            </div>
            <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0E79B2] transition-all"
                style={{ width: `${((step + 1) / 3) * 100}%` }}
              ></div>
            </div>

            {status === "success" ? (
              <div className="mt-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#BEE9E8]/60 text-[#0E79B2]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-[#1F2937] mt-4">
                  You’re on the list!
                </h4>
                <p className="text-slate-600 mt-2">
                  Check your email for the checklist and next steps.
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
              <>
                <div className="mt-6 space-y-4">
                  {step === 0 && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                          First name
                        </label>
                        <input
                          value={values.firstName}
                          onChange={(event) =>
                            updateValue("firstName", event.target.value)
                          }
                          className="w-full p-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20 outline-none"
                          placeholder="Juan"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                          Last name
                        </label>
                        <input
                          value={values.lastName}
                          onChange={(event) =>
                            updateValue("lastName", event.target.value)
                          }
                          className="w-full p-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20 outline-none"
                          placeholder="Dela Cruz"
                        />
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div>
                      <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                        Email address
                      </label>
                      <input
                        value={values.email}
                        onChange={(event) =>
                          updateValue("email", event.target.value)
                        }
                        type="email"
                        className="w-full p-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20 outline-none"
                        placeholder="you@email.com"
                      />
                    </div>
                  )}

                  {step === 2 && (
                    <div>
                      <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                        Contact number
                      </label>
                      <input
                        value={values.contactNumber}
                        onChange={(event) =>
                          updateValue("contactNumber", event.target.value)
                        }
                        type="tel"
                        inputMode="tel"
                        className="w-full p-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20 outline-none"
                        placeholder="+63 9xx-xxx-xxxx"
                      />
                    </div>
                  )}
                </div>

                {error && (
                  <p className="mt-4 text-sm text-red-600 font-semibold">
                    {error}
                  </p>
                )}

                <div className="mt-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={step === 0 || status === "submitting"}
                    className="text-sm font-semibold text-slate-500 disabled:opacity-40"
                  >
                    Back
                  </button>
                  {step < 2 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex items-center justify-center px-6 py-2 rounded-full bg-[#0E79B2] text-white font-semibold shadow-md shadow-[#0E79B2]/20"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={status === "submitting"}
                      className="inline-flex items-center justify-center px-6 py-2 rounded-full bg-[#0E79B2] text-white font-semibold shadow-md shadow-[#0E79B2]/20 disabled:opacity-70"
                    >
                      {status === "submitting" ? "Submitting..." : "Submit"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
