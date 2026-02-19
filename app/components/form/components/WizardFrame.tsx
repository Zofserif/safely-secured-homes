import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import type { WizardFrameProps } from "../types";

export default function WizardFrame({
  step,
  stepCount,
  onBack,
  children,
}: WizardFrameProps) {
  return (
    <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-xl p-8 rounded-3xl shadow-xl relative"
      >
        <div className="mb-8 flex items-center gap-4">
          {step > 0 ? (
            <button
              onClick={onBack}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Go back"
            >
              <ChevronLeft />
            </button>
          ) : (
            <div className="h-6 w-6" aria-hidden="true" />
          )}
          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0E79B2] transition-all duration-500 ease-out"
              style={{ width: `${(step / (stepCount - 1)) * 100}%` }}
            />
          </div>
        </div>

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
      </motion.div>
    </div>
  );
}
