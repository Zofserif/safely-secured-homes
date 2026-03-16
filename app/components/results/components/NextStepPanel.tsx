import type { ReactNode } from "react";

type NextStepPanelProps = {
  cameraCount?: number;
  badgeLabel?: string;
  title?: string;
  description?: ReactNode;
  children: ReactNode;
};

export default function NextStepPanel({
  cameraCount,
  badgeLabel,
  title,
  description,
  children,
}: NextStepPanelProps) {
  const resolvedCameraCount =
    typeof cameraCount === "number" && Number.isFinite(cameraCount)
      ? cameraCount
      : 0;
  const resolvedBadgeLabel = badgeLabel || "Step 2 of 2";
  const resolvedTitle = title || "Start With Your Best Next Step";
  const resolvedDescription = description ?? (
    <>
      Based on your answers, this is the fastest move to protect your home. With{" "}
      <strong>{resolvedCameraCount} recommended camera points</strong>, acting now
      helps avoid blind spots and costly rework.
    </>
  );

  return (
    <section className="rounded-[1.75rem] border border-[#D1E4F2] bg-linear-to-br from-[#F6FBFF] via-white to-[#EAF5FF] p-5 sm:p-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
        <span className="inline-flex items-center rounded-full border border-[#0E79B2]/30 bg-[#EAF4FB] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0E79B2]">
          {resolvedBadgeLabel}
        </span>
        <h4 className="mt-2.5 text-xl font-bold text-[#102A3D] sm:text-2xl">
          {resolvedTitle}
        </h4>
        <p className="mt-2 text-sm text-slate-700">
          {resolvedDescription}
        </p>

        <div className="mt-4 flex w-full flex-col items-center gap-3">{children}</div>
      </div>
    </section>
  );
}
