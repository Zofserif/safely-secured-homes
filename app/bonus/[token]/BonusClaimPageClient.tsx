"use client";

import {
  type FormEvent,
  useEffect,
  useEffectEvent,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BONUS_LINK_MOBILE_REGEX,
  BONUS_LINK_VIDEO_URL,
  type BonusLinkClaimedStatus,
  type BonusLinkStatus,
  isValidBonusLinkKey,
} from "../../lib/bonusClaimLinks";

type BonusClaimPageClientProps = {
  token: string;
};

type FieldErrors = Partial<Record<"name" | "mobile" | "address", string>>;

const initialFormData = {
  name: "",
  mobile: "",
  address: "",
};

const formatCountdown = (remainingMs: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const formatTimestamp = (value: string): string =>
  new Date(value).toLocaleString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export default function BonusClaimPageClient({
  token,
}: BonusClaimPageClientProps) {
  const [status, setStatus] = useState<BonusLinkStatus | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [requestError, setRequestError] = useState<string>("");
  const [isOpening, setIsOpening] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [claimedState, setClaimedState] = useState<BonusLinkClaimedStatus | null>(
    null,
  );
  const [nowMs, setNowMs] = useState(() => Date.now());

  const activateLink = useEffectEvent(async () => {
    if (!isValidBonusLinkKey(token)) {
      setStatus({ status: "invalid" });
      setIsOpening(false);
      return;
    }

    setIsOpening(true);
    setRequestError("");

    try {
      const response = await fetch("/api/bonus-links/open", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: token }),
      });

      const nextStatus = (await response.json().catch(() => null)) as
        | BonusLinkStatus
        | { error?: string }
        | null;

      if (!response.ok && (!nextStatus || !("status" in nextStatus))) {
        throw new Error(
          nextStatus?.error || "We could not activate your bonus claim link.",
        );
      }

      if (nextStatus && "status" in nextStatus) {
        setStatus(nextStatus);
        if (
          nextStatus.status === "claimable" &&
          nextStatus.recipientName &&
          !formData.name
        ) {
          setFormData((prev) => ({ ...prev, name: nextStatus.recipientName ?? "" }));
        }
      } else {
        throw new Error("We could not activate your bonus claim link.");
      }
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "We could not activate your bonus claim link.",
      );
    } finally {
      setIsOpening(false);
    }
  });

  useEffect(() => {
    void activateLink();
  }, [token]);

  useEffect(() => {
    if (status?.status !== "claimable") return;

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [status?.status]);

  const effectiveStatus: BonusLinkStatus = (() => {
    if (claimedState) return claimedState;
    if (!status) return { status: "invalid" };

    if (status.status !== "claimable") {
      return status;
    }

    const expiresAtMs = Date.parse(status.claimExpiresAt);
    if (Number.isNaN(expiresAtMs) || nowMs >= expiresAtMs) {
      return {
        status: "expired",
        openedAt: status.openedAt,
        claimExpiresAt: status.claimExpiresAt,
      };
    }

    return {
      ...status,
      remainingMs: expiresAtMs - nowMs,
    };
  })();

  const updateField = (field: keyof typeof initialFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[field];
        return nextErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const nextErrors: FieldErrors = {};
    const normalizedName = formData.name.trim();
    const normalizedMobile = formData.mobile.trim();
    const normalizedAddress = formData.address.trim();

    if (!normalizedName) {
      nextErrors.name = "Please enter the recipient name.";
    }

    if (!BONUS_LINK_MOBILE_REGEX.test(normalizedMobile)) {
      nextErrors.mobile = "Please enter a valid PH mobile number (09xxxxxxxxx).";
    }

    if (!normalizedAddress) {
      nextErrors.address = "Please enter the full shipping address.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || effectiveStatus.status !== "claimable") return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    setRequestError("");

    try {
      const response = await fetch("/api/bonus-links/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: token,
          name: formData.name.trim(),
          mobile: formData.mobile.trim(),
          address: formData.address.trim(),
        }),
      });

      const responseBody = (await response.json().catch(() => null)) as
        | (BonusLinkStatus & { fieldErrors?: FieldErrors; error?: string })
        | { fieldErrors?: FieldErrors; error?: string }
        | null;

      if (response.ok && responseBody && "status" in responseBody) {
        if (responseBody.status === "claimed") {
          setClaimedState(responseBody);
          return;
        }
        setStatus(responseBody);
        return;
      }

      if (responseBody?.fieldErrors) {
        setFieldErrors(responseBody.fieldErrors);
      }

      if (responseBody && "status" in responseBody) {
        setStatus(responseBody);
        if (responseBody.status !== "claimable") {
          return;
        }
      }

      throw new Error(
        responseBody?.error || "We could not submit your shipping details.",
      );
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "We could not submit your shipping details.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const headingText =
    effectiveStatus.status === "claimed" && !claimedState
      ? "This bonus link has already been claimed."
      : effectiveStatus.status === "expired"
        ? "This bonus link has expired."
        : effectiveStatus.status === "invalid"
          ? "This bonus link is not available."
          : claimedState
            ? "Your free bonus is on its way."
            : "Claim your free Safely Secured Homes mug.";

  const subheadingText =
    effectiveStatus.status === "claimable"
      ? "Your one-time shipping window is active. Enter your shipping details before the timer runs out."
      : effectiveStatus.status === "claimed" && !claimedState
        ? "This one-time shipment was already used, so the link is now closed."
        : effectiveStatus.status === "expired"
          ? "The one-hour claim window ended before the shipping form was completed."
          : effectiveStatus.status === "invalid"
            ? "Please contact Safely Secured Homes if you believe this link should still work."
            : "We received your shipping details for the one-time bonus shipment.";

  return (
    <div className="min-h-screen bg-[#F7FAFC] text-[#2D3748]">
      <header className="container mx-auto flex items-center justify-between px-6 pb-6 pt-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/assets/img/Logo/navbar banner.png"
            alt="Safely Secured Homes"
            width={210}
            height={48}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-widest text-slate-500 transition-colors hover:text-[#0E79B2]"
        >
          Back to Home
        </Link>
      </header>

      <main className="container mx-auto px-6 pb-16 pt-2 lg:pb-24">
        <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="space-y-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                One-time bonus shipment
              </p>
              <h1 className="mt-4 text-3xl font-bold leading-tight text-[#2D3748] sm:text-4xl lg:text-5xl">
                {headingText}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                {subheadingText}
              </p>
            </div>

            <div className="relative aspect-[7/4] overflow-hidden rounded-[2rem] border border-white bg-[#0B1724] shadow-2xl shadow-[#0E79B2]/15">
              <video
                className="h-full w-full object-cover"
                controls
                muted
                playsInline
                preload="metadata"
              >
                <source src={BONUS_LINK_VIDEO_URL} type="video/mp4" />
              </video>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
              <div className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1.5 text-xs font-semibold text-[#0E79B2] shadow-sm">
                Safely Secured Homes Bonus
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-left text-white sm:bottom-6 sm:left-6 sm:right-6">
                <p className="text-base font-semibold sm:text-xl">
                  Free bonus mug with one-time shipping.
                </p>
                <p className="mt-1 text-xs text-white/80 sm:text-sm">
                  Complete the form before the claim window expires.
                </p>
              </div>
            </div>

            <article className="rounded-3xl border border-[#DCE6F1] bg-white/95 p-6 shadow-[0_18px_40px_rgba(14,121,178,0.08)]">
              <h2 className="text-lg font-semibold text-[#1F2937]">
                How this link works
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-[#F1F7FB] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0E79B2]">
                    Step 1
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Opening this page starts a one-hour claim window for this link.
                  </p>
                </div>
                <div className="rounded-2xl bg-[#F1F7FB] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0E79B2]">
                    Step 2
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Submit the recipient name, mobile number, and shipping address.
                  </p>
                </div>
                <div className="rounded-2xl bg-[#F1F7FB] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0E79B2]">
                    Step 3
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Once claimed, the link is immediately closed and cannot be reused.
                  </p>
                </div>
              </div>
            </article>
          </div>

          <aside className="rounded-[2rem] border border-white/90 bg-white/98 p-6 shadow-[0_24px_65px_rgba(14,121,178,0.12)] sm:p-8">
            {isOpening ? (
              <div className="space-y-4">
                <div className="inline-flex rounded-full bg-[#F1F7FB] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0E79B2]">
                  Activating link
                </div>
                <div className="space-y-3">
                  <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-3 w-full animate-pulse rounded-full bg-slate-200" />
                  <div className="h-3 w-5/6 animate-pulse rounded-full bg-slate-200" />
                </div>
              </div>
            ) : effectiveStatus.status === "claimable" ? (
              <div>
                <div className="rounded-3xl border border-[#BEE9E8] bg-[#F0F9FF] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#0E79B2]">
                    Claim window active
                  </p>
                  <p className="mt-3 text-4xl font-bold tracking-tight text-[#1F2937]">
                    {formatCountdown(effectiveStatus.remainingMs)}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Link activated on {formatTimestamp(effectiveStatus.openedAt)}.
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Expires on {formatTimestamp(effectiveStatus.claimExpiresAt)}.
                  </p>
                  {effectiveStatus.note && (
                    <p className="mt-3 rounded-2xl bg-white/90 px-4 py-3 text-sm text-slate-600">
                      {effectiveStatus.note}
                    </p>
                  )}
                </div>

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label
                      htmlFor="bonus-name"
                      className="text-sm font-semibold text-[#1F2937]"
                    >
                      Recipient name
                    </label>
                    <input
                      id="bonus-name"
                      type="text"
                      autoComplete="name"
                      maxLength={80}
                      value={formData.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      className={`mt-2 w-full rounded-2xl border px-5 py-3.5 shadow-sm outline-none transition focus-visible:ring-4 ${
                        fieldErrors.name
                          ? "border-red-500 focus-visible:ring-red-100"
                          : "border-[#D8DDE3] focus-visible:border-[#0E79B2] focus-visible:ring-[#0E79B2]/15"
                      }`}
                      placeholder="Full recipient name"
                    />
                    {fieldErrors.name && (
                      <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="bonus-mobile"
                      className="text-sm font-semibold text-[#1F2937]"
                    >
                      Contact number
                    </label>
                    <input
                      id="bonus-mobile"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={11}
                      value={formData.mobile}
                      onChange={(event) => updateField("mobile", event.target.value)}
                      className={`mt-2 w-full rounded-2xl border px-5 py-3.5 shadow-sm outline-none transition focus-visible:ring-4 ${
                        fieldErrors.mobile
                          ? "border-red-500 focus-visible:ring-red-100"
                          : "border-[#D8DDE3] focus-visible:border-[#0E79B2] focus-visible:ring-[#0E79B2]/15"
                      }`}
                      placeholder="09xxxxxxxxx"
                    />
                    {fieldErrors.mobile && (
                      <p className="mt-1 text-xs text-red-500">
                        {fieldErrors.mobile}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="bonus-address"
                      className="text-sm font-semibold text-[#1F2937]"
                    >
                      Shipping address
                    </label>
                    <textarea
                      id="bonus-address"
                      rows={5}
                      autoComplete="street-address"
                      value={formData.address}
                      onChange={(event) => updateField("address", event.target.value)}
                      className={`mt-2 w-full rounded-2xl border px-5 py-3.5 shadow-sm outline-none transition focus-visible:ring-4 ${
                        fieldErrors.address
                          ? "border-red-500 focus-visible:ring-red-100"
                          : "border-[#D8DDE3] focus-visible:border-[#0E79B2] focus-visible:ring-[#0E79B2]/15"
                      }`}
                      placeholder="House number, street, barangay, city, province, and any delivery notes"
                    />
                    {fieldErrors.address && (
                      <p className="mt-1 text-xs text-red-500">
                        {fieldErrors.address}
                      </p>
                    )}
                  </div>

                  {requestError && (
                    <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {requestError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full items-center justify-center rounded-full bg-[#0E79B2] px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-[#0E79B2]/20 transition-all hover:-translate-y-0.5 hover:bg-[#0b5e8b] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
                  >
                    {isSubmitting
                      ? "Submitting your shipping details..."
                      : "Claim My Free Bonus"}
                  </button>

                  <p className="text-center text-xs text-slate-500">
                    JavaScript is required so the one-time timer can be enforced
                    correctly on this page.
                  </p>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="inline-flex rounded-full bg-[#F1F7FB] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0E79B2]">
                  {claimedState
                    ? "Claim complete"
                    : effectiveStatus.status === "claimed"
                      ? "Already claimed"
                      : effectiveStatus.status === "expired"
                        ? "Link expired"
                        : "Link unavailable"}
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-[#1F2937]">
                    {claimedState
                      ? "Shipping details received."
                      : effectiveStatus.status === "claimed"
                        ? "This bonus shipment was already claimed."
                        : effectiveStatus.status === "expired"
                          ? "The one-hour claim window has ended."
                          : "We could not activate this bonus link."}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {claimedState
                      ? `Thank you${
                          claimedState.shippingName
                            ? `, ${claimedState.shippingName}`
                            : ""
                        }. We stored your shipping details on ${formatTimestamp(
                          claimedState.claimedAt,
                        )}.`
                      : effectiveStatus.status === "claimed"
                        ? `This one-time claim was completed on ${formatTimestamp(
                            effectiveStatus.claimedAt,
                          )}.`
                        : effectiveStatus.status === "expired"
                          ? effectiveStatus.claimExpiresAt
                            ? `This link expired on ${formatTimestamp(
                                effectiveStatus.claimExpiresAt,
                              )}.`
                            : "This link is no longer active."
                          : "This token is invalid, incomplete, or no longer available."}
                  </p>
                </div>

                {requestError && (
                  <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {requestError}
                  </p>
                )}

                <div className="rounded-3xl border border-[#DCE6F1] bg-[#F8FBFD] p-5 text-sm text-slate-600">
                  Need help with this bonus shipment? Contact Safely Secured Homes
                  directly so the team can verify whether a replacement link is
                  appropriate.
                </div>
              </div>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}
