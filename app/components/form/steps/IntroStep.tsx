import type { IntroStepProps } from "../types";

export default function IntroStep({ onNext }: IntroStepProps) {
  return (
    <div className="text-center py-10">
      <h2 className="text-2xl font-bold mb-4 text-[#2D3748]">
        Let&apos;s shape your plan.
      </h2>
      <p className="text-slate-600 mb-8">
        A few quick questions to design the perfect security system for your
        home.
      </p>
      <button
        onClick={onNext}
        className="w-full bg-[#0E79B2] text-white py-3 rounded-xl font-bold"
      >
        Start
      </button>
    </div>
  );
}
