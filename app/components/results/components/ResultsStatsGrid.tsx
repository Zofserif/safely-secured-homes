import { Gauge, HouseHeart, ShieldCheck, Siren, Video } from "lucide-react";
import type { ResultsSummary } from "../../../lib/types";

type ResultsStatsGridProps = {
  safetyLevel: ResultsSummary["safetyLevel"];
  priority: ResultsSummary["priority"];
  emergency: ResultsSummary["emergency"];
  panatagRating: number;
  cameraCount: number;
};

const severityColors = {
  low: "text-[#2E8B57]",
  medium: "text-[#FFB300]",
  high: "text-[#E53E3E]",
} as const;

export default function ResultsStatsGrid({
  safetyLevel,
  priority,
  emergency,
  panatagRating,
  cameraCount,
}: ResultsStatsGridProps) {
  const panatagIconColor =
    panatagRating <= 5
      ? "text-[#E53E3E]"
      : panatagRating <= 8
        ? "text-[#F6C445]"
        : "text-[#2E8B57]";

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="order-2 md:order-1 bg-[#F7FAFC] p-4 rounded-xl border border-slate-100 text-center flex flex-col items-center gap-2">
        <Gauge className={`h-9 w-9 ${severityColors[priority.severity]}`} />
        <div className="text-xl font-bold leading-tight min-h-2.25rem text-[#2D3748]">
          {priority.label}
        </div>
        <div className="text-[0.7rem] leading-snug text-slate-500 uppercase tracking-wider min-h-[1.9rem]">
          Priority Action
        </div>
      </div>

      <div className="order-3 md:order-2 bg-[#F7FAFC] p-4 rounded-xl border border-slate-100 text-center flex flex-col items-center gap-2">
        <ShieldCheck
          className={`h-9 w-9 ${severityColors[safetyLevel.severity]}`}
        />
        <div className="text-xl font-bold leading-tight min-h-2.25rem text-[#2D3748]">
          {safetyLevel.label}
        </div>
        <div className="text-[0.7rem] leading-snug text-slate-500 uppercase tracking-wider min-h-[1.9rem]">
          Safety Score
        </div>
      </div>

      <div className="order-1 md:order-3 col-span-2 md:col-span-1 bg-[#F7FAFC] p-4 rounded-xl border border-slate-100 text-center flex flex-col items-center gap-2">
        <HouseHeart className={`h-9 w-9 ${panatagIconColor}`} />
        <div className="text-xl font-bold leading-tight min-h-2.25rem text-[#2D3748]">
          {panatagRating}/10
        </div>
        <div className="text-[0.7rem] leading-snug text-slate-500 uppercase tracking-wider min-h-[1.9rem]">
          Panatag Rating
        </div>
      </div>

      <div className="order-4 md:order-4 bg-[#F7FAFC] p-4 rounded-xl border border-slate-100 text-center flex flex-col items-center gap-2">
        <Siren className={`h-9 w-9 ${severityColors[emergency.severity]}`} />
        <div className="text-xl font-bold leading-tight min-h-2.25rem text-[#2D3748]">
          {emergency.label}
        </div>
        <div className="text-[0.7rem] leading-snug text-slate-500 uppercase tracking-wider min-h-[1.9rem]">
          Emergency Readiness
        </div>
      </div>

      <div className="order-5 md:order-5 bg-[#F7FAFC] p-4 rounded-xl border border-slate-100 text-center flex flex-col items-center gap-2">
        <Video className="h-9 w-9 text-[#0E79B2]" />
        <div className="text-xl font-bold leading-tight min-h-2.25rem text-[#2D3748]">
          {cameraCount}
        </div>
        <div className="text-[0.7rem] leading-snug text-slate-500 uppercase tracking-wider min-h-[1.9rem]">
          Security Cameras Needed
        </div>
      </div>
    </div>
  );
}
