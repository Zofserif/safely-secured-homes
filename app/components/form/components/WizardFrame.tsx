import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import type { WizardFrameProps } from "../types";

export default function WizardFrame({
  step,
  stepCount,
  onBack,
  children,
}: WizardFrameProps) {
  const progressPercent =
    stepCount <= 1 ? 0 : Math.min(100, Math.max(0, (step / (stepCount - 1)) * 100));

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F4F0E3] px-4 py-6 sm:px-6 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-140px] top-[-120px] h-72 w-72 rounded-full bg-[#CFE5F3]/55 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-140px] right-[-120px] h-72 w-72 rounded-full bg-[#F7D7BF]/45 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-[2rem] border border-[#E3DDCA] bg-[#FBF9F2]/95 p-4 shadow-[0_24px_70px_-40px_rgba(35,35,35,0.55)] backdrop-blur sm:p-6"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          {step > 0 ? (
            <button
              onClick={onBack}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E1D9C4] bg-white text-slate-500 transition-colors hover:text-slate-700"
              aria-label="Go back"
            >
              <ChevronLeft />
            </button>
          ) : (
            <div className="h-10 w-10" aria-hidden="true" />
          )}
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <span>Security Quiz</span>
              <span>
                Step {step + 1} of {stepCount}
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-[#E7E1CF]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progressPercent)}
            >
              <div
                className="h-full bg-gradient-to-r from-[#0E79B2] via-[#1E95D6] to-[#4AB7F4] transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-[#EAE4D3] bg-white p-4 sm:p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
