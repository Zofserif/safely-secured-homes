import { CheckCircle2 } from "lucide-react";
import type { CalculationResult, FormData } from "../../../lib/types";

type RecommendationsPanelProps = {
  result: CalculationResult;
  data: FormData;
};

export default function RecommendationsPanel({
  result,
  data,
}: RecommendationsPanelProps) {
  return (
    <>
      <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
        <CheckCircle2 className="text-[#2E8B57]" />
        Safely Secured Homes Approach
      </h3>
      <ul className="space-y-3">
        {result.recommendations.length > 0 ? (
          result.recommendations.map((recommendation, index) => (
            <li
              key={index}
              className="flex gap-3 text-slate-700 bg-[#F7FAFC] p-3 rounded-lg"
            >
              <span className="text-[#0E79B2] font-bold">•</span> {recommendation}
            </li>
          ))
        ) : (
          <li className="text-slate-500 italic">
            We focus on security that blends into your home layout—so you feel
            safe, not monitored. The recommendations are based on your selections.
          </li>
        )}
        {data.priority_areas.length > 0 && (
          <li className="flex gap-3 text-slate-700 bg-[#F7FAFC] p-3 rounded-lg">
            <span className="text-[#0E79B2] font-bold">•</span>
            Key Zones: {data.priority_areas.join(", ")}
          </li>
        )}
        <li className="flex gap-3 text-slate-700 bg-[#F7FAFC] p-3 rounded-lg">
          <p>
            <strong>Our baseline promise:</strong> All key zones points covered
            with cameras + notifications configured for real threats (not constant
            alarm) and we are there for your safety needs from consult, install,
            and maintain.
          </p>
        </li>
      </ul>
    </>
  );
}
