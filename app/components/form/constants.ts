import {
  BellRing,
  DoorOpen,
  Lightbulb,
  ShieldAlert,
  ToggleLeft,
  Tv,
  type LucideIcon,
} from "lucide-react";
import {
  SMART_HOME_FEATURE_OPTIONS,
  SMART_HOME_FEATURES,
} from "../../lib/formOptions";
import { readNewsletterLead } from "../../lib/newsletterLead";
import type { FormData } from "../../lib/types";
import type { SafetyField, SafetySection, WizardMode } from "./types";

export const createInitialFormData = (mode: WizardMode): FormData => {
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

export const SAFETY_SECTIONS: SafetySection[] = [
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

export const NA_ENABLED_SAFETY_FIELDS: SafetyField[] = [
  "safety_side_back_entry",
  "safety_windows_terrace",
  "safety_driveway_garage",
];

export const NA_ENABLED_SAFETY_FIELD_SET = new Set<SafetyField>(
  NA_ENABLED_SAFETY_FIELDS,
);

export type SmartHomeFeatureDetail = {
  title: string;
  description: string;
  benefit: string;
  Icon: LucideIcon;
};

export const SMART_HOME_FEATURE_DETAILS: Record<
  (typeof SMART_HOME_FEATURE_OPTIONS)[number],
  SmartHomeFeatureDetail
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
