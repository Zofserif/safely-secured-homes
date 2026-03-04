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
      <h3 className="text-center text-2xl font-black tracking-tight text-[#1F2937] sm:text-3xl">
        Which areas should we prioritize?
      </h3>
      <p className="mb-4 text-center text-sm text-slate-600 sm:text-base">
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
              className={`group relative cursor-pointer rounded-2xl border p-4 transition-all ${isSelected ? "border-[#0E79B2] bg-[#F2FAFF] shadow-sm ring-1 ring-[#0E79B2]/20" : "border-[#E2E8F0] bg-white hover:border-[#0E79B2]/60 hover:bg-slate-50"}`}
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
        className="mt-4 w-full rounded-2xl bg-[#0E79B2] py-3.5 font-bold text-white shadow-lg shadow-[#0E79B2]/30 transition hover:bg-[#0C6798] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
