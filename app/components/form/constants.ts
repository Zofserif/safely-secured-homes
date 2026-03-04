import {
  BellRing,
  DoorOpen,
  Fence,
  Lightbulb,
  ShieldAlert,
  Sofa,
  ToggleLeft,
  Tv,
  Users,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import {
  PRIORITY_AREAS,
  SMART_HOME_FEATURE_OPTIONS,
  SMART_HOME_FEATURES,
} from "../../lib/formOptions";
import { deriveFirstNameFromEmail, normalizeFirstName } from "../../lib/contactName";
import { readNewsletterLead } from "../../lib/newsletterLead";
import type { FormData } from "../../lib/types";
import type {
  SafetyCategory,
  SafetyHabitQuestion,
  WizardMode,
} from "./types";

export const createInitialFormData = (mode: WizardMode): FormData => {
  const baseFormData: FormData = {
    property_type: "",
    home_size: "",
    floors: "",
    priority_areas: [],
    current_setup: "",
    has_spare_key: null,
    changed_wifi_default_password: null,
    sleeps_with_earphones: null,
    locks_windows_gate_at_night: null,
    has_security_cameras: null,
    has_smoke_alarm_or_fire_extinguisher: null,
    has_first_aid_or_medicine_ready: null,
    knows_local_emergency_contacts: null,
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
    household_stage: "",
    desired_outcome: "",
    goal_obstacle: "",
    goal_obstacle_other: "",
    solution: "",
    first_name: "",
    email: "",
    mobile: "",
  };

  if (mode !== "newsletter") return baseFormData;

  const lead = readNewsletterLead();
  if (!lead) return baseFormData;

  return {
    ...baseFormData,
    first_name: normalizeFirstName(
      lead.first_name || deriveFirstNameFromEmail(lead.email || "")
    ),
    email: lead.email || "",
    mobile: lead.mobile || "",
  };
};

export const SAFETY_HABIT_QUESTIONS: readonly SafetyHabitQuestion[] = [
  {
    id: "safety_habit_spare_key",
    field: "has_spare_key",
    question: "Do you have a spare key for your home?",
    subtitle: "Answer honestly so we can tailor your safety checklist.",
    badgeLabel: "Safety Habit 1 of 8",
  },
  {
    id: "safety_habit_wifi_password",
    field: "changed_wifi_default_password",
    question: "Have you changed your Wi-Fi default password?",
    subtitle: "Default passwords are easy to guess and risky for smart devices.",
    badgeLabel: "Safety Habit 2 of 8",
  },
  {
    id: "safety_habit_earphones_sleep",
    field: "sleeps_with_earphones",
    question: "Do you sleep with earphones on?",
    subtitle: "This affects how quickly you can respond to alarms.",
    badgeLabel: "Safety Habit 3 of 8",
  },
  {
    id: "safety_habit_lock_windows_gate",
    field: "locks_windows_gate_at_night",
    question: "Do you lock your windows and gate at night?",
    subtitle: "A consistent night routine lowers avoidable risks.",
    badgeLabel: "Safety Habit 4 of 8",
  },
  {
    id: "safety_habit_security_cameras",
    field: "has_security_cameras",
    question: "Do you have security cameras at home?",
    subtitle: "We use this to suggest upgrades and coverage priorities.",
    badgeLabel: "Safety Habit 5 of 8",
  },
  {
    id: "safety_habit_smoke_alarm_extinguisher",
    field: "has_smoke_alarm_or_fire_extinguisher",
    question: "Do you have a smoke alarm or fire extinguisher at home?",
    subtitle: "Emergency readiness matters as much as intrusion prevention.",
    badgeLabel: "Safety Habit 6 of 8",
  },
  {
    id: "safety_habit_first_aid",
    field: "has_first_aid_or_medicine_ready",
    question: "Do you have first-aid supplies or medicine ready at home?",
    subtitle: "Prepared households recover faster during urgent situations.",
    badgeLabel: "Safety Habit 7 of 8",
  },
  {
    id: "safety_habit_emergency_contacts",
    field: "knows_local_emergency_contacts",
    question: "Do you know the emergency contacts in your town or city?",
    subtitle: "Quick access to help can prevent high-impact incidents.",
    badgeLabel: "Safety Habit 8 of 8",
  },
];

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

export type PriorityAreaDetail = {
  title: string;
  description: string;
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

export const PRIORITY_AREA_DETAILS: Record<
  (typeof PRIORITY_AREAS)[number],
  PriorityAreaDetail
> = {
  "General Indoor Living Areas": {
    title: "General Indoor Living Areas",
    description: "Cover common spaces where your family spends most of the day.",
    Icon: Sofa,
  },
  "Look out for my child/elderly/pet": {
    title: "Look out for my child/elderly/pet",
    description: "Watch over loved ones and pets when you are in another room or away.",
    Icon: Users,
  },
  "Entrances & Critical Zones": {
    title: "Entrances & Critical Zones",
    description: "Monitor main access points and other high-priority zones.",
    Icon: DoorOpen,
  },
  "Outdoor Perimeter or Street View": {
    title: "Outdoor Perimeter or Street View",
    description: "Track movement around your gate, yard, and nearby street area.",
    Icon: Fence,
  },
  "No Internet/ Electricity Remote Property": {
    title: "No Internet/ Electricity Remote Property",
    description: "Secure remote locations with limited or unreliable connectivity.",
    Icon: WifiOff,
  },
  "Front door Visitor Checking": {
    title: "Front door Visitor Checking",
    description: "See who is at your front door before opening or responding.",
    Icon: BellRing,
  },
};
