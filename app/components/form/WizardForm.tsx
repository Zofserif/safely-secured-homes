/* eslint-disable react/no-unescaped-entities */
import { AnimatePresence, motion } from "framer-motion";
import {
  BellRing,
  Check,
  ChevronLeft,
  DoorOpen,
  Lightbulb,
  Loader2,
  ShieldAlert,
  ToggleLeft,
  Tv,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useState, type CSSProperties } from "react";
import {
  trackFormStepCompleted,
  trackFormSubmissionStarted,
  type FunnelContext,
} from "../../lib/analytics";
import {
  BUDGET_BAND_OPTIONS,
  CURRENT_SETUP_VALUES,
  FLOOR_OPTIONS,
  HOME_SIZE_CARDS,
  MAIN_GOAL_OPTIONS,
  PRIORITY_AREAS,
  PROPERTY_TYPES,
  SMART_HOME_FEATURES,
  SMART_HOME_FEATURE_OPTIONS,
  TIMELINE_OPTIONS,
} from "../../lib/formOptions";
import { FormData } from "../../lib/types";
import { readNewsletterLead } from "../../lib/newsletterLead";

const createInitialFormData = (mode: "default" | "newsletter"): FormData => {
  const baseFormData: FormData = {
    property_type: "",
    home_size: "",
    floors: "",
    main_goal: "",
    priority_areas: [],
    current_setup: "",
    safety_gate_entry: null,
    safety_blindspots: null,
    safety_side_back_entry: null,
    safety_windows_terrace: null,
    safety_driveway_garage: null,
    safety_indoor_choke_points: null,
    safety_emergency_readiness: null,
    features_must: [],
    smart_home_features: [],
    smart_home_interest: "",
    diy_security_plan: false,
    budget_band: "",
    timeline: "",
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
  };

  if (mode !== "newsletter") return baseFormData;

  const lead = readNewsletterLead();
  if (!lead) return baseFormData;

  return {
    ...baseFormData,
    first_name: lead.first_name || "",
    last_name: lead.last_name || "",
    email: lead.email || "",
    mobile: lead.mobile || "",
  };
};

const SMART_HOME_FEATURE_DETAILS: Record<
  (typeof SMART_HOME_FEATURE_OPTIONS)[number],
  {
    title: string;
    description: string;
    benefit: string;
    Icon: LucideIcon;
  }
> = {
  [SMART_HOME_FEATURES.AUTOMATED_LIGHTING_SYSTEM]: {
    title: "Automated Lighting",
    description: "Lights turn on/off automatically by schedule or motion.",
    benefit: "Great for night safety and energy saving.",
    Icon: Lightbulb,
  },
  [SMART_HOME_FEATURES.SMART_VIDEO_DOORBELL]: {
    title: "Smart Video Doorbell",
    description: "See and talk to visitors through your phone from anywhere.",
    benefit: "Useful for deliveries and front-door monitoring.",
    Icon: BellRing,
  },
  [SMART_HOME_FEATURES.AUTOMATIC_ENTRY_EXIT_GATE_OPENERS]: {
    title: "Automatic Gate Openers",
    description: "Open and close your gate remotely with your phone or button.",
    benefit: "Adds convenience and safer vehicle entry/exit.",
    Icon: DoorOpen,
  },
  [SMART_HOME_FEATURES.SMART_ENTERTAINMENT_SYSTEM]: {
    title: "Smart Entertainment",
    description: "Control TV, speakers, and media in one connected setup.",
    benefit: "Better comfort and simpler home scenes.",
    Icon: Tv,
  },
  [SMART_HOME_FEATURES.SMART_ELECTRONIC_SWITCH_SYSTEM]: {
    title: "Smart Electronic Switches",
    description: "Convert regular switches to app or voice-controlled switches.",
    benefit: "Easier daily control for lights and appliances.",
    Icon: ToggleLeft,
  },
  [SMART_HOME_FEATURES.EMERGENCY_DECTION_SYSTEM]: {
    title: "Emergency Detection",
    description: "Get alerts for fire, smoke, and water leaks in key areas.",
    benefit: "Faster response to protect family and property.",
    Icon: ShieldAlert,
  },
};

export default function WizardForm({
  onComplete,
  mode = "default",
  analyticsContext,
  submitLabel,
  submittingLabel,
}: {
  onComplete: (data: FormData) => void;
  mode?: "default" | "newsletter";
  analyticsContext?: FunnelContext;
  submitLabel?: string;
  submittingLabel?: string;
}) {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>(() =>
    createInitialFormData(mode),
  );

  const isNewsletterFlow = mode === "newsletter";
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const updateField = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const getArrayFieldValues = (field: keyof FormData): string[] => {
    const value = formData[field];
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === "string");
  };

  const toggleArrayField = (field: keyof FormData, value: string) => {
    const current = getArrayFieldValues(field);
    const updated = current.includes(value)
      ? current.filter((i) => i !== value)
      : [...current, value];
    setFormData((prev) => ({ ...prev, [field]: updated }));
  };

  const nextStep = () => {
    trackFormStepCompleted(step, analyticsContext);
    setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  const validateContactInfo = () => {
    const newErrors: { [key: string]: string } = {};
    const mobileRegex = /^09\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!mobileRegex.test(formData.mobile)) {
      newErrors.mobile = "Please enter a valid PH mobile number (09xxxxxxxxx)";
    }
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFinalSubmit = () => {
    if (validateContactInfo()) {
      setIsSubmitting(true);
      trackFormStepCompleted(step, analyticsContext, { legacy: false });
      trackFormSubmissionStarted(formData, analyticsContext);
      onComplete(formData);
    }
  };

  type SafetyField =
    | "safety_gate_entry"
    | "safety_blindspots"
    | "safety_side_back_entry"
    | "safety_windows_terrace"
    | "safety_driveway_garage"
    | "safety_indoor_choke_points"
    | "safety_emergency_readiness";

  const safetySections: Array<{
    id: SafetyField;
    title: string;
    prompts: string[];
  }> = [
    {
      id: "safety_gate_entry",
      title: "Main Gate + Front Entry",
      prompts: [
        "Gate/lock easily reachable from outside?",
        "Entry area bright at night (no dark approach)?",
        "Clear view of gate + walkway/approach path?",
      ],
    },
    {
      id: "safety_blindspots",
      title: "Blindspots (Corners & Shadows)",
      prompts: [
        "Any corner/shadow you can't see from inside your home?",
        "Trees/Vehicles/Gate blocking visibility?",
        "Has lights implemented to dark zones?",
      ],
    },
    {
      id: "safety_side_back_entry",
      title: "Side & Back Entry",
      prompts: [
        "Side/Back gate sometimes left unlocked?",
        "Side/Back path hidden from neighbors view?",
        "Side/Back entry easy to access by strangers?",
      ],
    },
    {
      id: "safety_windows_terrace",
      title: "Windows + Terrace",
      prompts: [
        "Windows without locks or loose grills?",
        "Climb aids nearby (bins, ladders, ledges)?",
        "Valuables visible from outside at night?",
      ],
    },
    {
      id: "safety_driveway_garage",
      title: "Driveway or Garage",
      prompts: [
        "Garage-to-house door unsecured?",
        "Garage/Driveway dark with hiding spots?",
        "Tools/bikes/items visible and easy to grab?",
      ],
    },
    {
      id: "safety_indoor_choke_points",
      title: "Indoor Entry Choke Points (Halls/Stairs)",
      prompts: [
        "Halls/Stairs have night light?",
        "Has multiple entry points?",
        "Easy to navigate in case of emergency for exit/entry?",
      ],
    },
    {
      id: "safety_emergency_readiness",
      title: "Emergency Readiness Home",
      prompts: [
        "Is your family ready on what to do in case of fire?",
        "Does your home have medicine on-site?",
        "Has your family planned an emergency evacuation route?",
      ],
    },
  ];

  const naEnabledSafetyFields: SafetyField[] = [
    "safety_side_back_entry",
    "safety_windows_terrace",
    "safety_driveway_garage",
  ];
  const naEnabledSafetyFieldSet = new Set<SafetyField>(naEnabledSafetyFields);
  const [safetySliderDrafts, setSafetySliderDrafts] = useState<
    Partial<Record<SafetyField, number>>
  >({});
  const [naSafetySelections, setNaSafetySelections] = useState<
    Partial<Record<SafetyField, boolean>>
  >({});

  const clearSafetySliderDraft = (field: SafetyField) => {
    setSafetySliderDrafts((prev) => {
      if (typeof prev[field] !== "number") return prev;
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  };

  const commitSafetySliderValue = (field: SafetyField, rawValue: number) => {
    if (!Number.isFinite(rawValue)) return;
    const clamped = Math.min(5, Math.max(0, rawValue));
    const snapped = Math.round(clamped);
    setSafetySliderDrafts((prev) => ({ ...prev, [field]: clamped }));
    updateField(field, 5 - snapped);
  };

  const toggleNaSafetySelection = (field: SafetyField) => {
    const nextSelected = !Boolean(naSafetySelections[field]);
    setNaSafetySelections((prev) => {
      if (nextSelected) {
        return { ...prev, [field]: true };
      }
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
    clearSafetySliderDraft(field);
    updateField(field, nextSelected ? 5 : null);
  };

  const safetyFields = safetySections.map((section) => section.id);
  const ratedSafetyCount = safetyFields.filter(
    (field) => typeof formData[field] === "number"
  ).length;
  const safetyCompletionPct = Math.round(
    (ratedSafetyCount / safetyFields.length) * 100
  );
  const isSafetyComplete = safetyFields.every(
    (field) => typeof formData[field] === "number"
  );

  const steps = [
    // 0. Intro
    <div key="start" className="text-center py-10">
      <h2 className="text-2xl font-bold mb-4 text-[#2D3748]">
        Let's shape your plan.
      </h2>
      <p className="text-slate-600 mb-8">
        A few quick questions to design the perfect security system for your
        home.
      </p>
      <button
        onClick={nextStep}
        className="w-full bg-[#0E79B2] text-white py-3 rounded-xl font-bold"
      >
        Start
      </button>
    </div>,

    // 1. Property Type
    <div key="prop" className="space-y-4">
      <h3 className="text-xl font-bold text-center text-[#2D3748]">
        Our place is a...
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {PROPERTY_TYPES.map((opt) => {
          const isSelected = formData.property_type === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => {
                updateField("property_type", opt.value);
                nextStep();
              }}
              className={`group overflow-hidden rounded-2xl border text-left transition-all ${isSelected ? "border-[#0E79B2] ring-2 ring-[#0E79B2]/20" : "border-slate-200 hover:border-[#0E79B2]/60"}`}
              aria-pressed={isSelected}
              type="button"
            >
              <div className="relative aspect-square w-full bg-slate-100">
                <Image
                  src={opt.image}
                  alt={opt.label}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-contain p-3 sm:p-4"
                />
              </div>
              <div className={`p-3 text-sm font-semibold ${isSelected ? "text-[#0E79B2]" : "text-slate-700"}`}>
                {opt.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>,

    // 2. Current Setup
    <div key="setup" className="space-y-6">
      <h3 className="text-xl font-bold text-center text-[#2D3748]">
        Current Setup
      </h3>
      <div>
        <label className="block text-sm font-medium mb-2 text-slate-700 mt-4">
          Do you currently have a security system?
        </label>
        <select
          className="w-full p-3 rounded-xl border border-slate-300"
          value={formData.current_setup}
          onChange={(e) => updateField("current_setup", e.target.value)}
        >
          <option value="">Select status</option>
          {CURRENT_SETUP_VALUES.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <button
        onClick={nextStep}
        disabled={!formData.current_setup}
        className="w-full bg-[#0E79B2] text-white py-3 rounded-xl font-bold disabled:opacity-50 mt-4"
      >
        Next
      </button>
    </div>,

    // 3. Goals
    <div key="goals" className="space-y-4">
      <h3 className="text-xl font-bold text-center text-[#2D3748]">
        What is your main goal?
      </h3>
      <p className="text-center text-sm text-slate-500 mb-4">
        Select the most important one
      </p>
      <div className="space-y-3">
        {MAIN_GOAL_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              updateField("main_goal", opt.value);
              nextStep();
            }}
            className={`w-full p-4 rounded-xl border text-left hover:border-[#0E79B2] transition-all ${formData.main_goal === opt.value ? "border-[#0E79B2] bg-[#0E79B2]/5 ring-1 ring-[#0E79B2]" : "border-slate-200"}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>,

    // 4. Size & Floors
    <div key="size" className="space-y-6">
      <h3 className="text-xl font-bold text-center text-[#2D3748]">
        Home Details
      </h3>
      <div>
        <label className="block text-sm font-medium mb-2 text-slate-700">
          Lot Size
        </label>
        <div className="grid grid-cols-2 gap-4">
          {HOME_SIZE_CARDS.map((opt) => {
            const isSelected = formData.home_size === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateField("home_size", opt.value)}
                className={`group overflow-hidden rounded-2xl border text-left transition-all ${isSelected ? "border-[#0E79B2] ring-2 ring-[#0E79B2]/20" : "border-slate-200 hover:border-[#0E79B2]/60"}`}
                aria-pressed={isSelected}
              >
                <div className="relative aspect-square w-full bg-slate-100">
                  <Image
                    src={opt.image}
                    alt={opt.label}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-contain p-3 sm:p-4"
                  />
                </div>
                <div className="p-3 text-center">
                  <div className={`text-sm font-semibold ${isSelected ? "text-[#0E79B2]" : "text-slate-800"}`}>
                    {opt.title ?? opt.label}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {opt.subtitle ?? "Approx. bedrooms"}
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
          {FLOOR_OPTIONS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => updateField("floors", f)}
              className={`flex-1 py-3 rounded-xl border ${formData.floors === f ? "bg-[#0E79B2] text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <button
      onClick={nextStep}
        disabled={!formData.home_size || !formData.floors}
        className="w-full bg-[#0E79B2] text-white py-3 rounded-xl font-bold disabled:opacity-50 mt-4"
      >
        Next
      </button>
    </div>,

    // 5. Safety Check
    <div key="safety-check" className="space-y-4">
      <h3 className="text-xl font-bold text-center text-[#2D3748]">
        Home Safety Check
      </h3>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        <p className="text-sm font-semibold text-[#2D3748]">How this works</p>
        <p className="text-sm text-slate-600">
          Rate each area by dragging the slider. Left means higher risk. Right
          means safer.
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Progress</span>
            <span>
              {ratedSafetyCount}/{safetyFields.length} rated
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-[#0E79B2] transition-all duration-300"
              style={{ width: `${safetyCompletionPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-5 max-h-[480px] overflow-y-auto pr-1">
        {safetySections.map((section) => {
          const allowsNa = naEnabledSafetyFieldSet.has(section.id);
          const isNaSelected = allowsNa && Boolean(naSafetySelections[section.id]);
          const hasScore = typeof formData[section.id] === "number";
          const storedValue = hasScore ? (formData[section.id] as number) : null;
          const draftSliderValue = safetySliderDrafts[section.id];
          const hasDraft = typeof draftSliderValue === "number";
          const sliderValue = hasDraft
            ? draftSliderValue
            : storedValue === null
              ? 2.5
              : 5 - storedValue;
          const hasVisibleSliderValue = hasScore || hasDraft;
          const safetyState = isNaSelected
            ? {
                label: "N/A",
                className: "border-sky-200 bg-sky-50 text-sky-700",
              }
            : !hasVisibleSliderValue
            ? {
                label: "Not rated",
                className: "border-slate-200 bg-slate-100 text-slate-600",
              }
            : sliderValue <= 1
              ? {
                  label: "High risk",
                  className: "border-rose-200 bg-rose-50 text-rose-700",
                }
              : sliderValue <= 3
                ? {
                    label: "Needs work",
                    className: "border-amber-200 bg-amber-50 text-amber-700",
                  }
                : {
                    label: "Safer",
                    className:
                      "border-emerald-200 bg-emerald-50 text-emerald-700",
                  };
          const fillPercent = hasVisibleSliderValue ? (sliderValue / 5) * 100 : 0;
          const fillPalette = [
            "#ef4444",
            "#f97316",
            "#fb923c",
            "#facc15",
            "#a3e635",
            "#22c55e",
          ];
          const fillColor = fillPalette[Math.round(sliderValue)] ?? "#22c55e";
          const ratingWhole = hasVisibleSliderValue ? Math.round(sliderValue) : null;
          const ratingLabel = hasVisibleSliderValue
            ? `${ratingWhole}/5`
            : "--/5";
          const sliderStyle = {
            "--slider-track": "#e2e8f0",
            "--slider-fill": hasVisibleSliderValue
              ? `linear-gradient(to right, ${fillColor}, ${fillColor})`
              : "none",
            "--slider-fill-size": `${fillPercent}% 100%`,
            "--slider-thumb": hasVisibleSliderValue ? fillColor : "#cbd5e1",
          } as CSSProperties;

          return (
            <div
              key={section.id}
              className={`rounded-2xl border p-5 space-y-4 transition-all ${hasScore ? "border-[#0E79B2]/40 bg-[#F8FBFF] shadow-sm" : "border-slate-200 bg-white"}`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-[#2D3748] text-base">
                  {section.title}
                </h4>
                <div className="flex items-center gap-3">
                  {allowsNa && (
                    <label
                      className={`inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold transition-colors ${isNaSelected ? "text-sky-700" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      <input
                        type="checkbox"
                        checked={isNaSelected}
                        onChange={() => toggleNaSafetySelection(section.id)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        aria-label={`Mark ${section.title} as not applicable`}
                      />
                      <span>No such space</span>
                    </label>
                  )}
                  <span
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${safetyState.className}`}
                  >
                    {safetyState.label}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {isNaSelected ? (
                  <p className="text-xs text-sky-700">
                    Marked as N/A because this space does not exist in your home.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-500">Your rating</span>
                      <span className="font-semibold text-[#2D3748]">
                        {ratingLabel}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step={0.1}
                      value={sliderValue}
                      onChange={(e) => {
                        const rawValue = parseFloat(e.target.value);
                        setSafetySliderDrafts((prev) => ({
                          ...prev,
                          [section.id]: rawValue,
                        }));
                      }}
                      onPointerUp={(e) => {
                        commitSafetySliderValue(
                          section.id,
                          parseFloat((e.target as HTMLInputElement).value)
                        );
                      }}
                      onBlur={(e) => {
                        commitSafetySliderValue(
                          section.id,
                          parseFloat(e.target.value)
                        );
                      }}
                      style={sliderStyle}
                      className="safety-range w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E79B2]/40"
                      aria-label={`${section.title} safety rating`}
                    />
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Riskier</span>
                      <span>Safer</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={nextStep}
        disabled={!isSafetyComplete}
        className="w-full bg-[#0E79B2] text-white py-3 rounded-xl font-bold disabled:opacity-50 mt-2"
      >
        Next
      </button>
    </div>,

    // 6. Priority Areas
    <div key="areas" className="space-y-4">
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
                onChange={() => toggleArrayField("priority_areas", area)}
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
        onClick={nextStep}
        disabled={getArrayFieldValues("priority_areas").length === 0}
        className="w-full bg-[#0E79B2] text-white py-3 rounded-xl font-bold disabled:opacity-50 mt-4"
      >
        Next
      </button>
    </div>,

    // 7. Smart Home Implementation
    <div key="smart-home" className="space-y-6">
      <h3 className="text-xl font-bold text-center text-[#2D3748]">
        Smart Home Implementation
      </h3>
      <div className="rounded-2xl border-2 border-[#0E79B2]/30 bg-[#0E79B2]/5 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0E79B2]">
            Smart Home
          </span>
          <span className="text-[11px] font-medium text-slate-500">
            Optional
          </span>
        </div>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 rounded text-[#0E79B2]"
            checked={Boolean(formData.smart_home_interest)}
            onChange={(e) => {
              const isChecked = e.target.checked;
              updateField("smart_home_interest", isChecked ? "Yes" : "");
              if (!isChecked) {
                updateField("smart_home_features", []);
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
                const isSelected =
                  getArrayFieldValues("smart_home_features").includes(feature);
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
                    className={`group relative rounded-2xl border p-4 transition-all cursor-pointer ${isSelected ? "border-[#0E79B2] bg-[#0E79B2]/10 shadow-sm" : "border-slate-200 bg-white hover:border-[#0E79B2]/60 hover:bg-slate-50"}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        toggleArrayField("smart_home_features", feature)
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
        onClick={nextStep}
        className="w-full bg-[#0E79B2] text-white py-3 rounded-xl font-bold mt-4"
      >
        Next
      </button>
    </div>,

    // 8. Budget + DIY
    <div key="budget-diy" className="space-y-6">
      <h3 className="text-xl font-bold text-center text-[#2D3748]">
        Budget & DIY Plan
      </h3>
      <div className="rounded-2xl border-2 border-[#0E79B2]/30 bg-[#0E79B2]/5 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0E79B2]">
            Optional Upgrade
          </span>
          <span className="text-[11px] font-medium text-slate-500">
            DIY Security
          </span>
        </div>
        <label className="mt-4 flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 rounded text-[#0E79B2]"
            checked={formData.diy_security_plan}
            onChange={(e) => updateField("diy_security_plan", e.target.checked)}
          />
          <div>
            <span className="text-sm font-semibold text-[#2D3748]">
              DIY Security Plan
            </span>
            <p className="text-xs text-slate-500">
              I want a self-install guide and plan.
            </p>
          </div>
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Budget Zone</label>
        <select
          className="w-full p-3 rounded-xl border border-slate-300"
          value={formData.budget_band}
          onChange={(e) => updateField("budget_band", e.target.value)}
        >
          <option value="">Select range</option>
          {BUDGET_BAND_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <button
        onClick={nextStep}
        disabled={!formData.budget_band}
        className="w-full bg-[#0E79B2] text-white py-3 rounded-xl font-bold disabled:opacity-50 mt-4"
      >
        Next
      </button>
    </div>,

    // 9. Timeline
    <div key="timeline" className="space-y-4">
      <h3 className="text-xl font-bold text-center text-[#2D3748]">
        When do you need this?
      </h3>
      <div className="space-y-3">
        {TIMELINE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              updateField("timeline", opt.value);
              nextStep();
            }}
            className={`w-full p-4 rounded-xl border text-left hover:border-[#0E79B2] transition-all ${formData.timeline === opt.value ? "border-[#0E79B2] bg-[#0E79B2]/5 ring-1 ring-[#0E79B2]" : "border-slate-200"}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>,

    // 10. Final Details
    <div key="final" className="space-y-4">
      <h3 className="text-xl font-bold text-center text-[#2D3748]">
        Almost done!
      </h3>
      <p className="text-center text-sm text-slate-500">
        Where should we send your free Checklist?
      </p>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="First Name"
          className="w-1/2 p-3 rounded-xl border border-slate-300"
          value={formData.first_name}
          onChange={(e) => updateField("first_name", e.target.value)}
        />
        <input
          type="text"
          placeholder="Last Name"
          className="w-1/2 p-3 rounded-xl border border-slate-300"
          value={formData.last_name}
          onChange={(e) => updateField("last_name", e.target.value)}
        />
      </div>

      <div>
        <input
          type="email"
          placeholder="Email Address"
          className={`w-full p-3 rounded-xl border ${errors.email ? "border-red-500" : "border-slate-300"}`}
          value={formData.email}
          onChange={(e) => updateField("email", e.target.value)}
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email}</p>
        )}
      </div>

      <div>
        <input
          type="tel"
          placeholder="Mobile Number (09xxxxxxxxx)"
          className={`w-full p-3 rounded-xl border ${errors.mobile ? "border-red-500" : "border-slate-300"}`}
          value={formData.mobile}
          onChange={(e) => updateField("mobile", e.target.value)}
        />
        {errors.mobile && (
          <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>
        )}
      </div>

      <button
        onClick={handleFinalSubmit}
        disabled={
          !formData.email ||
          !formData.first_name ||
          !formData.last_name ||
          isSubmitting
        }
        className="w-full bg-[#0E79B2] text-white py-3 rounded-xl font-bold disabled:opacity-50 shadow-lg shadow-[#0E79B2]/30 flex justify-center items-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />{" "}
            {submittingLabel ??
              (isNewsletterFlow
                ? "Sending your answer..."
                : "Generating Plan...")}
          </>
        ) : (
          submitLabel ??
          (isNewsletterFlow ? "SEND MY ANSWER NOW" : "Generate My FREE PLAN")
        )}
      </button>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-xl p-8 rounded-3xl shadow-xl relative"
      >
        <div className="mb-8 flex items-center gap-4">
          {step > 0 ? (
            <button
              onClick={prevStep}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Go back"
            >
              <ChevronLeft />
            </button>
          ) : (
            <div className="h-6 w-6" aria-hidden="true" />
          )}
          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0E79B2] transition-all duration-500 ease-out"
              style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
