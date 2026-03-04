import Image from "next/image";
import { PROPERTY_TYPES } from "../../../lib/formOptions";
import type { PropertyTypeStepProps } from "../types";

export default function PropertyTypeStep({
  formData,
  onNext,
  onUpdateField,
}: PropertyTypeStepProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-center text-2xl font-black tracking-tight text-[#1F2937] sm:text-3xl">
        Our place is a...
      </h3>
      <p className="text-center text-sm text-slate-600 sm:text-base">
        Choose the property type that best matches your home.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {PROPERTY_TYPES.map((option) => {
          const isSelected = formData.property_type === option.value;
          return (
            <button
              key={option.value}
              onClick={() => {
                onUpdateField("property_type", option.value);
                onNext();
              }}
              className={`group overflow-hidden rounded-2xl border text-left transition-all ${isSelected ? "border-[#0E79B2] bg-[#F2FAFF] ring-2 ring-[#0E79B2]/20 shadow-md shadow-[#0E79B2]/10" : "border-[#E3E6EC] bg-white hover:-translate-y-0.5 hover:border-[#0E79B2]/60 hover:shadow-md hover:shadow-slate-200/70"}`}
              aria-pressed={isSelected}
              type="button"
            >
              <div className="relative aspect-square w-full bg-[#F7F9FC]">
                <Image
                  src={option.image}
                  alt={option.label}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-contain p-3 sm:p-4"
                />
              </div>
              <div
                className={`p-3 text-sm font-semibold sm:text-base ${isSelected ? "text-[#0E79B2]" : "text-slate-700"}`}
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
