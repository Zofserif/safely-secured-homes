import Image from "next/image";
import { PROPERTY_TYPES } from "../../../lib/formOptions";
import type { PropertyTypeStepProps } from "../types";

export default function PropertyTypeStep({
  formData,
  onNext,
  onUpdateField,
}: PropertyTypeStepProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-center text-[#2D3748]">
        Our place is a...
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {PROPERTY_TYPES.map((option) => {
          const isSelected = formData.property_type === option.value;
          return (
            <button
              key={option.value}
              onClick={() => {
                onUpdateField("property_type", option.value);
                onNext();
              }}
              className={`group overflow-hidden rounded-2xl border text-left transition-all ${isSelected ? "border-[#0E79B2] ring-2 ring-[#0E79B2]/20" : "border-slate-200 hover:border-[#0E79B2]/60"}`}
              aria-pressed={isSelected}
              type="button"
            >
              <div className="relative aspect-square w-full bg-slate-100">
                <Image
                  src={option.image}
                  alt={option.label}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-contain p-3 sm:p-4"
                />
              </div>
              <div
                className={`p-3 text-sm font-semibold ${isSelected ? "text-[#0E79B2]" : "text-slate-700"}`}
              >
                {option.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
