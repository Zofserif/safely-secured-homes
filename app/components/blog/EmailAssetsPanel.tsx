"use client";

import { useEffect, useRef, useState } from "react";
import type {
  BlogEmailAssetDiagnostics,
  BlogEmailAssets,
  BlogPostEmailUsage,
} from "../../lib/blogPosts";

type AssetKey = keyof BlogEmailAssets;

type Feedback = {
  kind: "idle" | "copied" | "error";
  message?: string;
};

const FIELD_CONFIG: Array<{
  key: AssetKey;
  label: string;
  helper: string;
  isLongForm: boolean;
}> = [
  {
    key: "subject",
    label: "Subject",
    helper:
      "Maps to {{subject}} for the EmailJS subject line. Blog copy may include {name}, {score}, {score_comment}, {results_link}, and {limited_time_offer}.",
    isLongForm: false,
  },
  {
    key: "preview_text",
    label: "Preview Text",
    helper:
      "Use this as the EmailJS preheader variable. Blog copy may include {name}, {score}, {score_comment}, {results_link}, and {limited_time_offer}.",
    isLongForm: false,
  },
  {
    key: "content",
    label: "Content",
    helper:
      "Paste into the HTML variable rendered with {{{content}}}. Text nodes may include {name}, {score}, {score_comment}, {results_link}, and {limited_time_offer}; use [label]({results_link}) or [label]({limited_time_offer}) to control anchor text.",
    isLongForm: true,
  },
  {
    key: "cta",
    label: "CTA",
    helper:
      "Paste into the HTML variable rendered with {{{cta}}}. Visible CTA copy may include {name}, {score}, {score_comment}, {results_link}, and {limited_time_offer}; regular CTA URLs stay literal unless you use one of those tokens as the markdown link target.",
    isLongForm: true,
  },
];

const ASSET_KEYS = FIELD_CONFIG.map((field) => field.key);

const defaultFeedback = (): Record<AssetKey, Feedback> =>
  ASSET_KEYS.reduce(
    (accumulator, key) => {
      accumulator[key] = { kind: "idle" };
      return accumulator;
    },
    {} as Record<AssetKey, Feedback>,
  );

const defaultResetTimers = (): Record<
  AssetKey,
  ReturnType<typeof setTimeout> | null
> =>
  ASSET_KEYS.reduce(
    (accumulator, key) => {
      accumulator[key] = null;
      return accumulator;
    },
    {} as Record<AssetKey, ReturnType<typeof setTimeout> | null>,
  );

const legacyCopy = (value: string) => {
  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  textArea.style.pointerEvents = "none";
  document.body.appendChild(textArea);
  textArea.select();
  textArea.setSelectionRange(0, textArea.value.length);

  const copied = document.execCommand("copy");
  document.body.removeChild(textArea);
  return copied;
};

const formatKilobytes = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;

const formatDateTimeLabel = (value: string | null) => {
  if (!value) return "Unknown";

  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "Unknown";

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function EmailAssetsPanel({
  emailAssets,
  emailAssetDiagnostics,
  emailUsage,
}: {
  emailAssets: BlogEmailAssets;
  emailAssetDiagnostics: BlogEmailAssetDiagnostics;
  emailUsage: BlogPostEmailUsage;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [feedbackByField, setFeedbackByField] =
    useState<Record<AssetKey, Feedback>>(defaultFeedback);
  const resetTimers = useRef(defaultResetTimers());
  const hasCampaignUsage =
    emailUsage.broadcastSends.length > 0 ||
    emailUsage.journeySteps.length > 0;

  useEffect(() => {
    const timers = resetTimers.current;
    return () => {
      (Object.keys(timers) as AssetKey[]).forEach((key) => {
        const timer = timers[key];
        if (timer) {
          clearTimeout(timer);
        }
      });
    };
  }, []);

  const setFeedbackWithReset = (
    key: AssetKey,
    nextFeedback: Feedback,
    delayMs: number,
  ) => {
    const existingTimer = resetTimers.current[key];
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    setFeedbackByField((prev) => ({ ...prev, [key]: nextFeedback }));

    resetTimers.current[key] = setTimeout(() => {
      setFeedbackByField((prev) => ({ ...prev, [key]: { kind: "idle" } }));
      resetTimers.current[key] = null;
    }, delayMs);
  };

  const copyField = async (key: AssetKey, value: string) => {
    if (!value) {
      setFeedbackWithReset(
        key,
        {
          kind: "error",
          message: "Nothing to copy for this field.",
        },
        2200,
      );
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const copied = legacyCopy(value);
        if (!copied) {
          throw new Error("Copy failed");
        }
      }
      setFeedbackWithReset(key, { kind: "copied" }, 1800);
    } catch {
      setFeedbackWithReset(
        key,
        {
          kind: "error",
          message: "Clipboard is unavailable. Please copy manually.",
        },
        3000,
      );
    }
  };

  const sizeMessage = emailAssetDiagnostics.overLimit
    ? `Generated preview_text + content + cta totals ${formatKilobytes(
        emailAssetDiagnostics.totalDynamicVariableBytes,
      )}. EmailJS limits dynamic variables to 50 KB, so trim the content before sending.`
    : emailAssetDiagnostics.nearLimit
      ? `Generated preview_text + content + cta totals ${formatKilobytes(
          emailAssetDiagnostics.totalDynamicVariableBytes,
        )}. This is close to EmailJS's 50 KB dynamic-variable limit.`
      : null;

  return (
    <section className="rounded-3xl border border-[#BEE9E8]/70 bg-white/95 p-6 shadow-lg shadow-[#0E79B2]/10 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1F2937]">Email Campaign Assets</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
            Internal publishing assets for EmailJS-ready newsletter campaigns.
            The shared branded footer and unsubscribe link are injected
            automatically at send time. Blog-authored <code>{"{name}"}</code>,{" "}
            <code>{"{score}"}</code>, <code>{"{score_comment}"}</code>, and{" "}
            <code>{"{results_link}"}</code>, and{" "}
            <code>{"{limited_time_offer}"}</code> merge tags are resolved
            before the EmailJS request is sent.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-controls="email-assets-content"
          className="inline-flex items-center justify-center rounded-full border border-[#0E79B2] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#0E79B2] transition-colors hover:bg-[#0E79B2] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E79B2]"
        >
          {isExpanded ? "Hide Assets" : "Show Assets"}
        </button>
      </div>

      {isExpanded && (
        <div id="email-assets-content" className="mt-6 space-y-4">
          <article className="rounded-2xl border border-[#BEE9E8] bg-[#F0F9FF] p-4 sm:p-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-[#2D3748]">
              EmailJS Template Contract
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Runtime placeholders must use these exact names. Use triple braces
              for HTML fragments, and set the EmailJS subject line to
              {" "}
              <code>{"{{subject}}"}</code>.
              {" "}App-generated emails also append the shared branded footer and
              unsubscribe link automatically. Separately, blog-managed copy may
              include <code>{"{name}"}</code>, <code>{"{score}"}</code>, and{" "}
              <code>{"{score_comment}"}</code>, plus{" "}
              <code>{"{results_link}"}</code> and{" "}
              <code>{"{limited_time_offer}"}</code>. Use{" "}
              <code>{"[label]({results_link})"}</code> when you want custom
              clickable text, or <code>{"[label]({limited_time_offer})"}</code>{" "}
              for the expiring offer link. Bare <code>{"{results_link}"}</code>{" "}
              and <code>{"{limited_time_offer}"}</code> render the raw URL. The
              app resolves those author tokens before calling EmailJS. Manual
              admin test sends and newsletter broadcasts require offer-hours
              input when <code>{"{limited_time_offer}"}</code> is used. Public
              blog surfaces use fallback values like{" "}
              <code>there</code>, <code>your current rating</code>, the default
              score comment, the generic results URL, and the canonical
              schedule-call URL. For score copy, write{" "}
              <code>{"It's {score} 😯"}</code> because the token already includes
              the percent sign.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[#1F2937]">
              <code className="rounded-full bg-white px-3 py-1">{"{name}"}</code>
              <code className="rounded-full bg-white px-3 py-1">{"{score}"}</code>
              <code className="rounded-full bg-white px-3 py-1">
                {"{score_comment}"}
              </code>
              <code className="rounded-full bg-white px-3 py-1">
                {"{results_link}"}
              </code>
              <code className="rounded-full bg-white px-3 py-1">
                {"{limited_time_offer}"}
              </code>
              <code className="rounded-full bg-white px-3 py-1">{"{{name}}"}</code>
              <code className="rounded-full bg-white px-3 py-1">{"{{subject}}"}</code>
              <code className="rounded-full bg-white px-3 py-1">{"{{title}}"}</code>
              <code className="rounded-full bg-white px-3 py-1">
                {"{{preview_text}}"}
              </code>
              <code className="rounded-full bg-white px-3 py-1">
                {"{{to_email}}"}
              </code>
              <code className="rounded-full bg-white px-3 py-1">
                {"{{{content}}}"}
              </code>
              <code className="rounded-full bg-white px-3 py-1">
                {"{{{cta}}}"}
              </code>
            </div>
          </article>

          <article className="rounded-2xl border border-[#BEE9E8] bg-[#F8FAFC] p-4 sm:p-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-[#2D3748]">
              Email Usage
            </h3>

            {!hasCampaignUsage ? (
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                This post is not assigned to any email bucket or campaign yet.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                <section className="rounded-xl border border-slate-200 bg-white p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                    Weekly Newsletter Sends
                  </h4>
                  {emailUsage.broadcastSends.length > 0 ? (
                    <div className="mt-3 space-y-3">
                      {emailUsage.broadcastSends.map((send) => (
                        <div
                          key={send.sendKey}
                          className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3"
                        >
                          <p className="text-sm font-semibold text-[#1F2937]">
                            {send.sendKey}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Queued: {formatDateTimeLabel(send.queuedAt)}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <span>Recipients: {send.recipientCount}</span>
                            <span>Sent: {send.sentCount}</span>
                            {send.failedCount > 0 && (
                              <span>Failed: {send.failedCount}</span>
                            )}
                            {send.queuedCount > 0 && (
                              <span>Queued: {send.queuedCount}</span>
                            )}
                          </div>
                          {send.processedAt && (
                            <p className="mt-2 text-xs text-slate-500">
                              Last processed: {formatDateTimeLabel(send.processedAt)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">
                      No weekly newsletter sends have used this post yet.
                    </p>
                  )}
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                    Journey Steps
                  </h4>
                  {emailUsage.journeySteps.length > 0 ? (
                    <div className="mt-3 space-y-3">
                      {emailUsage.journeySteps.map((step) => (
                        <div
                          key={step.id}
                          className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-[#1F2937]">
                              {step.journeyName}
                            </p>
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                              Step {step.stepOrder}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            <code>{step.stepKey}</code>
                          </p>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <span>Delay: {step.delayDays} day{step.delayDays === 1 ? "" : "s"}</span>
                            <span>Journey: {step.journeyKey}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">
                      No journey steps currently reference this post.
                    </p>
                  )}
                </section>
              </div>
            )}
          </article>

          {emailAssetDiagnostics.warnings.length > 0 && (
            <article className="rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-5">
              <h3 className="text-sm font-bold uppercase tracking-wide text-amber-900">
                Warnings
              </h3>
              <div className="mt-3 space-y-2">
                {emailAssetDiagnostics.warnings.map((warning) => (
                  <p key={warning} className="text-sm leading-relaxed text-amber-900">
                    {warning}
                  </p>
                ))}
              </div>
            </article>
          )}

          {sizeMessage && (
            <article
              className={`rounded-2xl border p-4 sm:p-5 ${
                emailAssetDiagnostics.overLimit
                  ? "border-red-300 bg-red-50"
                  : "border-amber-300 bg-amber-50"
              }`}
            >
              <h3
                className={`text-sm font-bold uppercase tracking-wide ${
                  emailAssetDiagnostics.overLimit ? "text-red-700" : "text-amber-900"
                }`}
              >
                Size Warning
              </h3>
              <p
                className={`mt-2 text-sm leading-relaxed ${
                  emailAssetDiagnostics.overLimit ? "text-red-700" : "text-amber-900"
                }`}
              >
                {sizeMessage}
              </p>
            </article>
          )}

          {FIELD_CONFIG.map((field) => {
            const value = emailAssets[field.key];
            const feedback = feedbackByField[field.key];
            const isEmptyCta = field.key === "cta" && !value;
            return (
              <article
                key={field.key}
                className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-[#2D3748]">
                      {field.label}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">{field.helper}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyField(field.key, value)}
                    disabled={!value}
                    className="inline-flex items-center justify-center rounded-full bg-[#0E79B2] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#0b5e8b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E79B2] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:hover:bg-slate-300"
                    aria-label={`Copy ${field.label}`}
                  >
                    Copy
                  </button>
                </div>

                {field.isLongForm ? (
                  isEmptyCta ? (
                    <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                      CTA omitted. Leave <code>cta</code> blank for campaigns without a
                      CTA, or store the final HTML fragment in the <code>cta</code>{" "}
                      column to populate this field.
                    </div>
                  ) : (
                    <pre className="mt-4 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed whitespace-pre-wrap wrap-break-word text-slate-700">
                      {value}
                    </pre>
                  )
                ) : (
                  <p className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                    {value}
                  </p>
                )}

                {feedback.kind === "copied" && (
                  <p className="mt-2 text-xs font-semibold text-[#2E8B57]">
                    Copied to clipboard.
                  </p>
                )}
                {feedback.kind === "error" && feedback.message && (
                  <p className="mt-2 text-xs font-semibold text-red-600">
                    {feedback.message}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
