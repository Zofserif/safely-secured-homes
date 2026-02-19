import Image from "next/image";
import { FLOOR_OPTIONS, HOME_SIZE_CARDS } from "../../../lib/formOptions";
import type { HomeDetailsStepProps } from "../types";

export default function HomeDetailsStep({
  formData,
  onNext,
  onUpdateField,
}: HomeDetailsStepProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <h3 className="text-lg sm:text-xl font-bold text-center text-[#2D3748]">
        Home Details
      </h3>
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <label className="text-sm font-medium text-slate-700">Lot Size</label>
          <span className="text-[11px] text-slate-500">Choose one</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {HOME_SIZE_CARDS.map((option) => {
            const isSelected = formData.home_size === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onUpdateField("home_size", option.value)}
                className={`group overflow-hidden rounded-xl sm:rounded-2xl border text-left transition-all ${isSelected ? "border-[#0E79B2] ring-2 ring-[#0E79B2]/20" : "border-slate-200 hover:border-[#0E79B2]/60"}`}
                aria-pressed={isSelected}
              >
                <div className="relative h-20 sm:h-28 w-full bg-slate-100">
                  <Image
                    src={option.image}
                    alt={option.label}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-contain p-2 sm:p-3"
                  />
                </div>
                <div className="p-2 sm:p-3 text-center">
                  <div
                    className={`text-xs sm:text-sm leading-tight font-semibold ${isSelected ? "text-[#0E79B2]" : "text-slate-800"}`}
                  >
                    {option.title ?? option.label}
                  </div>
                  <div className="mt-0.5 text-[10px] sm:text-[11px] leading-tight text-slate-500">
                    {option.subtitle ?? "Approx. bedrooms"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-slate-700">
          Floors
        </label>
        <div className="flex gap-2">
          {FLOOR_OPTIONS.map((floor) => (
            <button
              key={floor}
              type="button"
              onClick={() => onUpdateField("floors", floor)}
              className={`flex-1 py-2.5 sm:py-3 text-sm font-semibold rounded-xl border ${formData.floors === floor ? "bg-[#0E79B2] text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              {floor}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={onNext}
        disabled={!formData.home_size || !formData.floors}
        className="w-full bg-[#0E79B2] text-white py-3 rounded-xl font-bold disabled:opacity-50 mt-2 sm:mt-4"
      >
        Next
      </button>
    </div>
  );
}
