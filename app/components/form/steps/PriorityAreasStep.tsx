import { Check, ShieldAlert } from "lucide-react";
import { PRIORITY_AREAS } from "../../../lib/formOptions";
import { PRIORITY_AREA_DETAILS } from "../constants";
import type { PriorityAreasStepProps } from "../types";

export default function PriorityAreasStep({
  getArrayFieldValues,
  onNext,
  onToggleArrayField,
}: PriorityAreasStepProps) {
  const selectedAreas = getArrayFieldValues("priority_areas");

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-center text-[#2D3748]">
        Which areas should we prioritize?
      </h3>
      <p className="text-center text-sm text-slate-500 mb-4">
        Select all that apply
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRIORITY_AREAS.map((area) => {
          const isSelected = selectedAreas.includes(area);
          const areaDetails = PRIORITY_AREA_DETAILS[area] ?? {
            title: area,
            description:
              "Select this if this area matters most for your home security.",
            Icon: ShieldAlert,
          };
          const AreaIcon = areaDetails.Icon;

          return (
            <label
              key={area}
              className={`group relative cursor-pointer rounded-2xl border p-4 transition-all ${isSelected ? "border-[#0E79B2] bg-[#0E79B2]/10 shadow-sm" : "border-slate-200 bg-white hover:border-[#0E79B2]/60 hover:bg-slate-50"}`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleArrayField("priority_areas", area)}
                className="sr-only"
              />
              <span
                className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md border transition-all ${isSelected ? "border-[#0E79B2] bg-[#0E79B2] text-white" : "border-slate-300 bg-white text-transparent"}`}
                aria-hidden="true"
              >
                <Check className="h-4 w-4" />
              </span>
              <div
                className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${isSelected ? "bg-[#0E79B2] text-white" : "bg-slate-100 text-slate-600 group-hover:bg-[#0E79B2]/15 group-hover:text-[#0E79B2]"}`}
                aria-hidden="true"
              >
                <AreaIcon className="h-5 w-5" />
              </div>
              <p
                className={`pr-8 text-sm font-semibold leading-tight ${isSelected ? "text-[#0E79B2]" : "text-slate-800"}`}
              >
                {areaDetails.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {areaDetails.description}
              </p>
            </label>
          );
        })}
      </div>
      <button
        onClick={onNext}
        disabled={selectedAreas.length === 0}
        className="w-full bg-[#0E79B2] text-white py-3 rounded-xl font-bold disabled:opacity-50 mt-4"
      >
        Next
      </button>
    </div>
  );
}
