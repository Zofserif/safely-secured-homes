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
    <section className="rounded-2xl border border-[#0E79B2]/20 bg-linear-to-br from-[#F3F9FD] via-white to-[#EFF7FD] p-5 sm:p-6">
      <span className="inline-flex items-center rounded-full border border-[#0E79B2]/30 bg-[#EAF4FB] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0E79B2]">
        Step 2 of 2
      </span>
      <h4 className="mt-2.5 text-xl font-bold text-slate-900 sm:text-2xl">
        Take Your Recommended Next Action
      </h4>
      <p className="mt-2 text-sm text-slate-700">
        With <strong>{cameraCount} recommended camera points</strong>, guided
        placement helps reduce blind spots and costly rework.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">{children}</div>
    </section>
  );
}
