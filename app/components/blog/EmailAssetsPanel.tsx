"use client";

import { useEffect, useRef, useState } from "react";
import type { BlogEmailAssets } from "../../lib/blogPosts";

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
    helper: "Use as your campaign subject line.",
    isLongForm: false,
  },
  {
    key: "previewText",
    label: "Preview Text",
    helper: "Use as preheader text in your email tool.",
    isLongForm: false,
  },
  {
    key: "htmlBody",
    label: "HTML Body",
    helper: "Paste into the HTML editor of your email platform.",
    isLongForm: true,
  },
];

const defaultFeedback = (): Record<AssetKey, Feedback> => ({
  subject: { kind: "idle" },
  previewText: { kind: "idle" },
  plainTextBody: { kind: "idle" },
  htmlBody: { kind: "idle" },
});

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

export default function EmailAssetsPanel({
  emailAssets,
}: {
  emailAssets: BlogEmailAssets;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [feedbackByField, setFeedbackByField] =
    useState<Record<AssetKey, Feedback>>(defaultFeedback);
  const resetTimers = useRef<Record<AssetKey, ReturnType<typeof setTimeout> | null>>({
    subject: null,
    previewText: null,
    plainTextBody: null,
    htmlBody: null,
  });

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

  return (
    <section className="rounded-3xl border border-[#BEE9E8]/70 bg-white/95 p-6 shadow-lg shadow-[#0E79B2]/10 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1F2937]">Email Campaign Assets</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
            Internal tools for copywriters and marketers. Blog readers can skip this section.
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
          {FIELD_CONFIG.map((field) => {
            const value = emailAssets[field.key];
            const feedback = feedbackByField[field.key];
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
                    className="inline-flex items-center justify-center rounded-full bg-[#0E79B2] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#0b5e8b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E79B2]"
                    aria-label={`Copy ${field.label}`}
                  >
                    Copy
                  </button>
                </div>

                {field.isLongForm ? (
                  <pre className="mt-4 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap wrap-break-words">
                    {value}
                  </pre>
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
