import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeFirstName } from "../../../lib/contactName";
import type { SqueezeStepProps } from "../types";

const SQUEEZE_DURATION_MS = 5000;
const CHECKLIST_ITEM_COUNT = 5;
type SqueezePhase = "intro" | "loading";

export default function SqueezeStep({ formData, onNext }: SqueezeStepProps) {
  const firstName = normalizeFirstName(formData.name);
  const onNextRef = useRef(onNext);
  const hasAdvancedRef = useRef(false);
  const [phase, setPhase] = useState<SqueezePhase>("intro");
  const [progressPercent, setProgressPercent] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  const checklistItems = useMemo(
    () => [
      "Searching Safely Secured Homes Database",
      "Filtering Based on Your Home Layout",
      firstName
        ? `Recommending Insights for your Home ${firstName}`
        : "Recommending Insights for your Home",
      "Assigning you with a Home Security Specialist",
      firstName
        ? `Completing your Home Panatag Rating Results ${firstName}`
        : "Completing your Home Panatag Rating Results",
    ],
    [firstName],
  );

  useEffect(() => {
    if (typeof window === "undefined" || phase !== "loading") return;

    const startedAt = window.performance.now();
    const intervalId = window.setInterval(() => {
      const elapsedMs = window.performance.now() - startedAt;
      const nextProgressPercent = Math.min(
        100,
        (elapsedMs / SQUEEZE_DURATION_MS) * 100,
      );
      const nextCompletedCount = Math.min(
        CHECKLIST_ITEM_COUNT,
        Math.floor((nextProgressPercent / 100) * CHECKLIST_ITEM_COUNT),
      );

      setProgressPercent(nextProgressPercent);
      setCompletedCount(nextCompletedCount);

      if (elapsedMs < SQUEEZE_DURATION_MS || hasAdvancedRef.current) return;

      hasAdvancedRef.current = true;
      setProgressPercent(100);
      setCompletedCount(CHECKLIST_ITEM_COUNT);
      window.clearInterval(intervalId);
      onNextRef.current();
    }, 50);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [phase]);

  const activeItemIndex =
    completedCount >= checklistItems.length ? -1 : completedCount;
  const personalizedHeading = firstName
    ? `Your Panatag Rating is being generated for you, ${firstName}`
    : "Your Panatag Rating is being generated for you";
  const showLoadingState = phase === "loading";

  const handleStartGeneration = () => {
    hasAdvancedRef.current = false;
    setProgressPercent(0);
    setCompletedCount(0);
    setPhase("loading");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3 text-center">
        <h3 className="text-2xl font-black tracking-tight text-[#1F2937] sm:text-3xl">
          {personalizedHeading}
        </h3>
        <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
          We&apos;re preparing your personalized home insights now.
        </p>
      </div>

      {showLoadingState ? (
        <div className="mx-auto w-full max-w-2xl rounded-[28px] border border-[#D7E8F4] bg-[#F8FCFF] p-5 shadow-sm sm:p-6">
          <div
            className="h-3 overflow-hidden rounded-full bg-[#D9EAF4]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progressPercent)}
          >
            <div
              className="h-full rounded-full bg-linear-to-r from-[#0E79B2] via-[#1E95D6] to-[#4AB7F4] transition-[width] duration-75 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-5 space-y-3">
            {checklistItems.map((item, index) => {
              const isComplete = index < completedCount;
              const isActive = index === activeItemIndex;

              return (
                <div
                  key={item}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                    isComplete
                      ? "border-[#B9DEC9] bg-[#F3FBF5]"
                      : isActive
                        ? "border-[#B9D8EC] bg-white"
                        : "border-[#E5EDF3] bg-white/70"
                  }`}
                >
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      isComplete
                        ? "bg-[#2E8B57] text-white"
                        : isActive
                          ? "bg-[#EAF4FB] text-[#0E79B2]"
                          : "bg-slate-100 text-slate-400"
                    }`}
                    aria-hidden="true"
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isActive ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full bg-current" />
                    )}
                  </span>
                  <p
                    className={`text-sm font-medium leading-relaxed sm:text-base ${
                      isComplete || isActive ? "text-[#1F2937]" : "text-slate-500"
                    }`}
                  >
                    {item}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-xl rounded-[28px] border border-[#D7E8F4] bg-[#F8FCFF] p-6 text-center shadow-sm sm:p-8">
          <button
            type="button"
            onClick={handleStartGeneration}
            className="flex w-full items-center justify-center rounded-2xl bg-[#0E79B2] py-3.5 font-bold text-white shadow-lg shadow-[#0E79B2]/30 transition hover:bg-[#0C6798]"
          >
            GENERATE MY RATING NOW
          </button>
        </div>
      )}
    </div>
  );
}
