import { useEffect, useRef, useState } from "react";
import { Eye, ShieldCheck, Siren, X } from "lucide-react";
import { RESULTS_CALL_HREF } from "../constants";
import type { BlueprintCard } from "../types";
import CallUsNowCta from "./CallUsNowCta";

type BlueprintModalProps = {
  activeBlueprint: BlueprintCard | null;
  onClose: () => void;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onAwarenessCallNow: () => void;
};

const UNLOCK_PROGRESS_THRESHOLD = 0.98;
const SHORT_CONTENT_SCROLLABLE_HEIGHT_PX = 24;

const clampToProgress = (value: number): number => Math.max(0, Math.min(1, value));

const getScrollProgress = (container: HTMLDivElement): number => {
  const scrollableHeight = container.scrollHeight - container.clientHeight;
  if (scrollableHeight <= SHORT_CONTENT_SCROLLABLE_HEIGHT_PX) {
    return 1;
  }

  return clampToProgress(container.scrollTop / scrollableHeight);
};

const BLUEPRINT_TONE_BY_ID: Record<
  BlueprintCard["id"],
  {
    icon: typeof ShieldCheck;
    iconWrapClassName: string;
    iconClassName: string;
    goalClassName: string;
  }
> = {
  prevention: {
    icon: ShieldCheck,
    iconWrapClassName: "border-[#2E8B57]/30 bg-[#EAF7F0]",
    iconClassName: "text-[#2E8B57]",
    goalClassName: "border-[#2E8B57]/25 bg-[#F2FBF6] text-[#23563B]",
  },
  awareness: {
    icon: Eye,
    iconWrapClassName: "border-[#0E79B2]/30 bg-[#EAF4FB]",
    iconClassName: "text-[#0E79B2]",
    goalClassName: "border-[#0E79B2]/20 bg-[#F2F8FD] text-[#1D4F6E]",
  },
  emergency: {
    icon: Siren,
    iconWrapClassName: "border-[#E4572E]/30 bg-[#FFF1EC]",
    iconClassName: "text-[#C4451D]",
    goalClassName: "border-[#E4572E]/25 bg-[#FFF4F0] text-[#7F3D28]",
  },
};

export default function BlueprintModal({
  activeBlueprint,
  onClose,
  isCompleted,
  onToggleComplete,
  onAwarenessCallNow,
}: BlueprintModalProps) {
  const isAwarenessBlueprint = activeBlueprint?.id === "awareness";
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [showFooterAction, setShowFooterAction] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const activeBlueprintTone = activeBlueprint
    ? BLUEPRINT_TONE_BY_ID[activeBlueprint.id]
    : null;
  const titleId = activeBlueprint ? `blueprint-modal-title-${activeBlueprint.id}` : "";
  const goalId = activeBlueprint ? `blueprint-modal-goal-${activeBlueprint.id}` : "";

  const handleContentScroll = (
    event: React.UIEvent<HTMLDivElement>,
  ) => {
    const progress = getScrollProgress(event.currentTarget);
    setScrollProgress(progress);
    if (!showFooterAction && progress >= UNLOCK_PROGRESS_THRESHOLD) {
      setShowFooterAction(true);
    }
  };

  useEffect(() => {
    if (!activeBlueprint) return;

    const frame = window.requestAnimationFrame(() => {
      const container = contentRef.current;
      if (!container) return;

      const progress = getScrollProgress(container);
      setScrollProgress(progress);

      if (progress >= UNLOCK_PROGRESS_THRESHOLD) {
        setShowFooterAction(true);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeBlueprint]);

  useEffect(() => {
    if (!activeBlueprint || typeof document === "undefined") return;

    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [activeBlueprint]);

  if (!activeBlueprint || !activeBlueprintTone) return null;

  const BlueprintIcon = activeBlueprintTone.icon;
  const progressPercent = showFooterAction
    ? 100
    : Math.min(99, Math.round(scrollProgress * 100));
  const lockedInstruction = isAwarenessBlueprint
    ? "Review to the end to unlock calling."
    : "Review to the end to unlock completion.";
  const completionActionLabel = isCompleted
    ? "Mark as Incomplete"
    : "Mark as Complete";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-5 sm:items-center sm:py-8">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-[#0B4B70]/45 backdrop-blur-[3px]"
        aria-label="Close blueprint details"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={goalId}
        className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-[1.75rem] border border-[#D1E4F2] bg-linear-to-b from-[#F9FCFF] via-white to-[#F2F8FF] shadow-[0_35px_90px_-50px_rgba(4,48,79,0.6)] ring-1 ring-[#DCEBF7] max-h-[calc(100dvh-2.5rem)] sm:max-h-[86vh]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full border border-[#D1E4F2] bg-white/95 p-2 text-[#145276] shadow-sm transition-colors hover:bg-[#F3F9FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E79B2]/35"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="border-b border-[#DCEBF7] bg-linear-to-r from-[#EAF4FB] via-[#F7FBFF] to-[#EAF4FB] px-5 py-5 sm:px-6">
          <span className="inline-flex items-center rounded-full border border-[#0E79B2]/30 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0E79B2]">
            Safety Insight
          </span>
          <div className="mt-3 flex items-start gap-3">
            <span
              className={[
                "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
                activeBlueprintTone.iconWrapClassName,
              ].join(" ")}
            >
              <BlueprintIcon
                aria-hidden="true"
                className={`h-5 w-5 ${activeBlueprintTone.iconClassName}`}
              />
            </span>
            <div className="min-w-0">
              <h4
                id={titleId}
                className="text-2xl font-bold tracking-tight text-[#102A3D]"
              >
                {activeBlueprint.title}
              </h4>
              <p
                id={goalId}
                className={[
                  "mt-2 rounded-xl border px-3 py-2 text-sm leading-relaxed",
                  activeBlueprintTone.goalClassName,
                ].join(" ")}
              >
                <span className="font-semibold">Goal:</span>{" "}
                {activeBlueprint.goal}
              </p>
            </div>
          </div>
        </div>
        <div
          ref={contentRef}
          onScroll={handleContentScroll}
          className="flex-1 overflow-y-auto bg-white px-4 py-5 sm:px-6 sm:py-6"
        >
          <div className="rounded-2xl border border-[#E1EDF8] bg-[#FCFEFF] p-4 sm:p-5">
            {activeBlueprint.content}
          </div>
        </div>
        <div className="border-t border-[#DCEBF7] bg-white/95 px-4 py-4 sm:px-6">
          {showFooterAction ? (
            isAwarenessBlueprint ? (
              <div className="space-y-2">
                <CallUsNowCta
                  href={RESULTS_CALL_HREF}
                  onClick={onAwarenessCallNow}
                  className="px-5 py-4 md:text-lg"
                />
                <p className="text-center text-xs font-medium leading-relaxed text-slate-500">
                  No pressure. No generic package.
                  <br />
                  Just a clearer recommendation for your home.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={onToggleComplete}
                className={[
                  "w-full rounded-xl px-4 py-3 text-sm font-bold transition-colors",
                  isCompleted
                    ? "border border-[#0E79B2]/30 bg-white text-[#0E79B2] hover:bg-[#F7FAFC]"
                    : "bg-[#0E79B2] text-white hover:bg-[#0b5e8b]",
                ].join(" ")}
              >
                {isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
              </button>
            )
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-[#D1E4F2] bg-[#F7FBFF] px-3.5 py-3">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-[#51718A]">
                  <span>Review Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#D9EAF8]">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-[#0E79B2] to-[#1B8CCB] transition-[width] duration-200 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs font-medium text-slate-600">
                  {lockedInstruction}
                </p>
              </div>
              {isAwarenessBlueprint ? (
                <CallUsNowCta
                  disabled
                />
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-400"
                >
                  {completionActionLabel}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
