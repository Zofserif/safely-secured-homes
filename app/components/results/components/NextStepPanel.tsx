import { AlertTriangle } from "lucide-react";
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
    <div className="bg-[#FFB300]/10 border border-[#FFB300]/30 rounded-2xl p-6">
      <h4 className="font-bold text-[#2D3748] mb-2 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-[#FFB300]" /> Next Step
      </h4>
      <p className="text-[#2D3748] mb-4 text-sm">
        Since your home requires <strong>{cameraCount} cameras</strong>,
        identifying blind spots, professional camera placement, and layout plan.
        Click the &ldquo;Call Us Now&ldquo; to reserve onsite assessment for FREE and
        get a done all for you personalized security system.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">{children}</div>
    </div>
  );
}
