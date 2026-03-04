import { Check, ShieldAlert } from "lucide-react";
import { SMART_HOME_FEATURE_OPTIONS } from "../../../lib/formOptions";
import { SMART_HOME_FEATURE_DETAILS } from "../constants";
import type { SmartHomeStepProps } from "../types";

export default function SmartHomeStep({
  formData,
  getArrayFieldValues,
  onNext,
  onToggleArrayField,
  onUpdateField,
}: SmartHomeStepProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-center text-2xl font-black tracking-tight text-[#1F2937] sm:text-3xl">
        Smart Home Implementation
      </h3>
      <div className="rounded-2xl border border-[#D7E8F4] bg-[#F2FAFF] p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0E79B2]">
            Smart Home
          </span>
          <span className="text-[11px] font-medium text-slate-500">Optional</span>
        </div>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 rounded text-[#0E79B2]"
            checked={Boolean(formData.smart_home_interest)}
            onChange={(event) => {
              const isChecked = event.target.checked;
              onUpdateField("smart_home_interest", isChecked ? "Yes" : "");
              if (!isChecked) {
                onUpdateField("smart_home_features", []);
              }
            }}
          />
          <div>
            <span className="text-sm font-semibold text-[#2D3748]">
              I am interested in to start my Smart home journey.
            </span>
            <p className="text-xs text-slate-500">
              Choose the smart home features you want to include.
            </p>
          </div>
        </label>
        {Boolean(formData.smart_home_interest) && (
          <div className="mt-4">
            <p className="mb-3 text-xs font-medium text-slate-600">
              Pick the features you want. You can select multiple options.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SMART_HOME_FEATURE_OPTIONS.map((feature) => {
                const isSelected = getArrayFieldValues("smart_home_features").includes(
                  feature,
                );
                const featureDetails = SMART_HOME_FEATURE_DETAILS[feature] ?? {
                  title: feature,
                  description: "Add this smart feature to your setup.",
                  benefit: "Improves convenience and home monitoring.",
                  Icon: ShieldAlert,
                };
                const FeatureIcon = featureDetails.Icon;

                return (
                  <label
                    key={feature}
                    className={`group relative cursor-pointer rounded-2xl border p-4 transition-all ${isSelected ? "border-[#0E79B2] bg-[#F2FAFF] shadow-sm ring-1 ring-[#0E79B2]/20" : "border-[#E2E8F0] bg-white hover:border-[#0E79B2]/60 hover:bg-slate-50"}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        onToggleArrayField("smart_home_features", feature)
                      }
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
                      <FeatureIcon className="h-5 w-5" />
                    </div>
                    <p
                      className={`pr-8 text-sm font-semibold leading-tight ${isSelected ? "text-[#0E79B2]" : "text-slate-800"}`}
                    >
                      {featureDetails.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      {featureDetails.description}
                    </p>
                    <p className="mt-2 text-[11px] font-medium text-slate-500">
                      {featureDetails.benefit}
                    </p>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <button
        onClick={onNext}
        className="mt-4 w-full rounded-2xl bg-[#0E79B2] py-3.5 font-bold text-white shadow-lg shadow-[#0E79B2]/30 transition hover:bg-[#0C6798]"
      >
        Next
      </button>
    </div>
  );
}
