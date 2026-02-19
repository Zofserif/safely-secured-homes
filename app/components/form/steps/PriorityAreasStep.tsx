import { Check } from "lucide-react";
import { PRIORITY_AREAS } from "../../../lib/formOptions";
import type { PriorityAreasStepProps } from "../types";

export default function PriorityAreasStep({
  getArrayFieldValues,
  onNext,
  onToggleArrayField,
}: PriorityAreasStepProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-center text-[#2D3748]">
        Where do you need eyes?
      </h3>
      <p className="text-center text-sm text-slate-500 mb-4">
        Select all that apply
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRIORITY_AREAS.map((area) => {
          const isSelected = getArrayFieldValues("priority_areas").includes(area);
          return (
            <label
              key={area}
              className={`group flex items-start gap-3 rounded-xl border p-3 transition-all cursor-pointer ${isSelected ? "border-[#0E79B2] bg-[#0E79B2]/10 shadow-sm" : "border-slate-200 hover:border-[#0E79B2]/60 hover:bg-slate-50"}`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleArrayField("priority_areas", area)}
                className="sr-only"
              />
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-all ${isSelected ? "border-[#0E79B2] bg-[#0E79B2] text-white" : "border-slate-300 bg-white text-transparent"}`}
                aria-hidden="true"
              >
                <Check className="h-4 w-4" />
              </span>
              <span
                className={`text-sm font-medium leading-snug ${isSelected ? "text-[#0E79B2]" : "text-slate-700 group-hover:text-slate-900"}`}
              >
                {area}
              </span>
            </label>
          );
        })}
      </div>
      <button
        onClick={onNext}
        disabled={getArrayFieldValues("priority_areas").length === 0}
        className="w-full bg-[#0E79B2] text-white py-3 rounded-xl font-bold disabled:opacity-50 mt-4"
      >
        Next
      </button>
    </div>
  );
}
