import type { ReactNode } from "react";

type NextStepPanelProps = {
  cameraCount: number;
  children: ReactNode;
};

export default function NextStepPanel({
  cameraCount,
  children,
}: NextStepPanelProps) {
  return (
    <section className="rounded-[1.75rem] border border-[#D1E4F2] bg-linear-to-br from-[#F6FBFF] via-white to-[#EAF5FF] p-5 sm:p-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
        <span className="inline-flex items-center rounded-full border border-[#0E79B2]/30 bg-[#EAF4FB] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0E79B2]">
          Step 2 of 2
        </span>
        <h4 className="mt-2.5 text-xl font-bold text-[#102A3D] sm:text-2xl">
          Start With Your Best Next Step
        </h4>
        <p className="mt-2 text-sm text-slate-700">
          Based on your answers, this is the fastest move to protect your home.
          With <strong>{cameraCount} recommended camera points</strong>, acting now
          helps avoid blind spots and costly rework.
        </p>

        <div className="mt-4 flex w-full flex-col items-center gap-3">{children}</div>
      </div>
    </section>
  );
}
