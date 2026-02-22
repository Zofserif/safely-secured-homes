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
import type { SafetyCategory, WizardMode } from "./types";

export const createInitialFormData = (mode: WizardMode): FormData => {
  const baseFormData: FormData = {
    property_type: "",
    home_size: "",
    floors: "",
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

export const SAFETY_CATEGORIES: SafetyCategory[] = [
  {
    id: "home_entrance",
    title: "Home entrance",
    subtitle: "Check if entry points are secure, visible, and hard to access.",
    legacyFields: [
      "safety_gate_entry",
      "safety_side_back_entry",
      "safety_windows_terrace",
    ],
  },
  {
    id: "neighborhood_safety_check",
    title: "Your Neighborhood Safety check",
    subtitle: "Rate outside lighting, visibility, and street-side exposure.",
    legacyFields: ["safety_driveway_garage"],
  },
  {
    id: "indoor_outdoor_blindspots",
    title: "Indoor and outdoor Blindspots",
    subtitle: "Rate how many hidden areas can be missed around your home.",
    legacyFields: ["safety_blindspots", "safety_indoor_choke_points"],
  },
  {
    id: "emergency_readiness_home",
    title: "Emergency readiness home",
    subtitle: "Rate your family’s emergency planning and response readiness.",
    legacyFields: ["safety_emergency_readiness"],
  },
];

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
