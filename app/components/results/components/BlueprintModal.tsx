import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { RESULTS_BOOK_VISIT_URL } from "../constants";
import type { BlueprintCard } from "../types";

type BlueprintModalProps = {
  activeBlueprint: BlueprintCard | null;
  onClose: () => void;
  isCompleted: boolean;
  onToggleComplete: () => void;
};

const hasReachedBottom = (container: HTMLDivElement) => {
  const remainingDistance =
    container.scrollHeight - container.scrollTop - container.clientHeight;
  return remainingDistance <= 20;
};

export default function BlueprintModal({
  activeBlueprint,
  onClose,
  isCompleted,
  onToggleComplete,
}: BlueprintModalProps) {
  const isAwarenessBlueprint = activeBlueprint?.id === "awareness";
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [showFooterAction, setShowFooterAction] = useState(false);

  const handleContentScroll = (
    event: React.UIEvent<HTMLDivElement>,
  ) => {
    if (showFooterAction) return;

    if (hasReachedBottom(event.currentTarget)) {
      setShowFooterAction(true);
    }
  };

  useEffect(() => {
    if (!activeBlueprint) return;

    const frame = window.requestAnimationFrame(() => {
      const container = contentRef.current;
      if (!container) return;

      if (hasReachedBottom(container)) {
        setShowFooterAction(true);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeBlueprint]);

  if (!activeBlueprint) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-md"
        aria-label="Close blueprint details"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.6)] ring-1 ring-slate-200"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/20 p-2 text-white shadow-sm backdrop-blur hover:bg-white/30"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="bg-linear-to-r from-[#0E79B2] via-[#1B8CCB] to-[#0E79B2] px-5 py-5 text-white sm:px-6">
          <h4 className=" text-2xl font-bold">{activeBlueprint.title}</h4>
        </div>
        <div
          ref={contentRef}
          onScroll={handleContentScroll}
          className="max-h-[72vh] overflow-y-auto bg-white px-4 py-5 sm:px-6"
        >
          {activeBlueprint.content}
        </div>
        <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
          {showFooterAction ? (
            isAwarenessBlueprint ? (
              <a
                href={RESULTS_BOOK_VISIT_URL}
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#0E79B2] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0b5e8b]"
              >
                Book a Home Audit (FREE)
              </a>
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
            <p className="text-center text-xs font-semibold text-slate-500">
              {isAwarenessBlueprint
                ? "Scroll to the end of this blueprint to unlock booking."
                : "Scroll to the end of this blueprint to unlock completion."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
