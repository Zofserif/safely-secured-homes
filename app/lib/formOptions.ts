export type PropertyTypeOption = {
  label: string;
  value: string;
  image: string;
};

export const PROPERTY_TYPES: PropertyTypeOption[] = [
  {
    label: "Single-family house",
    value: "Single-family house",
    image: "/assets/img/Property Types/single-family-home.png",
  },
  {
    label: "Condo / Apartment",
    value: "Condo / Apartment",
    image: "/assets/img/Property Types/condo-apartment.png",
  },
  {
    label: "Townhouse / Pre-built House",
    value: "Townhouse / Pre-built House",
    image: "/assets/img/Property Types/townhouse-pre-built-house.png",
  },
  {
    label: "Vacation Home / Beach House",
    value: "Vacation Home / Beach House",
    image: "/assets/img/Property Types/vacation-home-beach-house.png",
  },
];

export const CURRENT_SETUP_OPTIONS = {
  NEW_INSTALL: "No, I don't have a security system",
  BROKEN_OLD: "Yes, but it's broken/old (Needs replacement)",
  UPGRADE: "Yes, looking to expand/upgrade",
} as const;

export const CURRENT_SETUP_VALUES = [
  CURRENT_SETUP_OPTIONS.NEW_INSTALL,
  CURRENT_SETUP_OPTIONS.BROKEN_OLD,
  CURRENT_SETUP_OPTIONS.UPGRADE,
] as const;

export const HOUSEHOLD_STAGE_OPTIONS = [
  "Just me",
  "Couple (no kids yet)",
  "Expecting a baby",
  "Family with kids at home",
  "Older adults/retirees",
] as const;

export const DESIRED_OUTCOME_OPTIONS = [
  "Check on family/pets while I'm away",
  "See who's at the gate/door before opening",
  "Monitor outside areas around the home",
  "Protect my home and valuables from break-ins/theft",
  "Get emergency alerts for hazards",
  "Make my home more convenient with smart control/automation",
] as const;

export const GOAL_OBSTACLE_OPTIONS = [
  "I'm not sure what's right for my home",
  "I'm worried it will be complicated or won't work properly",
  "I tried something before and it's not applicable to me",
  "I don't want solutions that feel uninviting",
] as const;

export const SOLUTION_OPTIONS = {
  DIY_HOME_SAFETY_PLAN: "Start with DIY Home Safety Plan",
  DONE_FOR_YOU_SETUP: "Done for you Setup",
  ONE_ON_ONE_HOME_SECURITY_CONSULTATION: "Get 1:1 Home Security Consultation",
} as const;

export type SolutionOptionValue =
  (typeof SOLUTION_OPTIONS)[keyof typeof SOLUTION_OPTIONS];

export type SolutionOptionCard = {
  value: SolutionOptionValue;
  title: string;
  subtitle: string;
  benefits: readonly [string, string, string];
  isFeatured?: boolean;
  badge?: string;
};

export const SOLUTION_OPTION_CARDS: readonly SolutionOptionCard[] = [
  {
    value: SOLUTION_OPTIONS.DIY_HOME_SAFETY_PLAN,
    title: "Start with DIY Home Safety Plan",
    subtitle: "For families who want clear guidance they can execute on their own.",
    benefits: [
      "Personalized checklist based on your current risks",
      "Straightforward setup steps for quick action",
      "Best if you prefer to move at your own pace",
    ],
  },
  {
    value: SOLUTION_OPTIONS.DONE_FOR_YOU_SETUP,
    title: "Done for you Setup",
    subtitle: "For homeowners who want planning, setup, and execution handled end-to-end.",
    benefits: [
      "Professional design and installation workflow",
      "Balanced security and convenience for daily living",
      "Best value for speed, confidence, and support",
    ],
    isFeatured: true,
    badge: "Best value",
  },
  {
    value: SOLUTION_OPTIONS.ONE_ON_ONE_HOME_SECURITY_CONSULTATION,
    title: "Get 1:1 Home Security Consultation",
    subtitle: "For households that want expert recommendations before deciding.",
    benefits: [
      "Live walkthrough of your home's priorities",
      "Custom recommendations matched to your goals",
      "Action plan you can review before committing",
    ],
  },
] as const;

export const HOME_SIZE_OPTIONS = {
  SMALL: "Small (≤120 sqm) Approx. 1-2 bedrooms",
  MEDIUM: "Medium (121-200 sqm) Approx. 3-4 bedrooms",
  LARGE: "Large (200-300 sqm) Approx. 5-6 bedrooms",
  EXTRA_LARGE: "Extra Large (300+ sqm) Approx. 7+ bedrooms",
} as const;

export const HOME_SIZE_VALUES = [
  HOME_SIZE_OPTIONS.SMALL,
  HOME_SIZE_OPTIONS.MEDIUM,
  HOME_SIZE_OPTIONS.LARGE,
  HOME_SIZE_OPTIONS.EXTRA_LARGE,
] as const;

export type HomeSizeCard = {
  title: string;
  subtitle: string;
  label: string;
  value: string;
  image: string;
};

export const HOME_SIZE_CARDS: HomeSizeCard[] = [
  {
    title: "Small (≤120 sqm)",
    subtitle: "Approx. 1-2 bedrooms",
    label: HOME_SIZE_OPTIONS.SMALL,
    value: HOME_SIZE_OPTIONS.SMALL,
    image: "/assets/img/Home Size/small.png",
  },
  {
    title: "Medium (121-200 sqm)",
    subtitle: "Approx. 3-4 bedrooms",
    label: HOME_SIZE_OPTIONS.MEDIUM,
    value: HOME_SIZE_OPTIONS.MEDIUM,
    image: "/assets/img/Home Size/medium.png",
  },
  {
    title: "Large (200-300 sqm)",
    subtitle: "Approx. 5-6 bedrooms",
    label: HOME_SIZE_OPTIONS.LARGE,
    value: HOME_SIZE_OPTIONS.LARGE,
    image: "/assets/img/Home Size/large.png",
  },
  {
    title: "Extra Large (300+ sqm)",
    subtitle: "Approx. 7+ bedrooms",
    label: HOME_SIZE_OPTIONS.EXTRA_LARGE,
    value: HOME_SIZE_OPTIONS.EXTRA_LARGE,
    image: "/assets/img/Home Size/extra-large.png",
  },
];

export const FLOOR_OPTIONS = ["1", "2", "3+"] as const;

export const PRIORITY_AREAS = [
  "General Indoor Living Areas",
  "Look out for my child/elderly/pet",
  "Entrances & Critical Zones",
  "Outdoor Perimeter or Street View",
  "No Internet/ Electricity Remote Property",
  "Front door Visitor Checking",
] as const;

export const PRIORITY_AREA_KEYS = {
  GENERAL_INDOOR_LIVING_AREAS: "General Indoor Living Areas",
  CHILD_ELDERLY_PET: "Look out for my child/elderly/pet",
  ENTRANCES_CRITICAL_ZONES: "Entrances & Critical Zones",
  OUTDOOR_PERIMETER_STREET_VIEW: "Outdoor Perimeter or Street View",
  NO_INTERNET_ELECTRICITY_REMOTE_PROPERTY:
    "No Internet/ Electricity Remote Property",
  FRONT_DOOR_VISITOR_CHECKING: "Front door Visitor Checking",
} as const;

export const FEATURES = {
  HUMAN_VEHICLE_ALERT: "Human/Vehicle Alert",
  TWO_WAY_AUDIO: "Two-way Audio",
  COLOR_NIGHT: "Colored Capture at night",
  MOBILE_APP: "Mobile App Access",
  RECORDING_24_7: "24/7 Recording",
} as const;

export const FEATURE_OPTIONS = [
  FEATURES.HUMAN_VEHICLE_ALERT,
  FEATURES.TWO_WAY_AUDIO,
  FEATURES.COLOR_NIGHT,
  FEATURES.MOBILE_APP,
  FEATURES.RECORDING_24_7,
] as const;

export const SMART_HOME_FEATURES = {
  AUTOMATED_LIGHTING_SYSTEM: "Automated Lighting System",
  SMART_VIDEO_DOORBELL: "Smart Video Doorbell",
  AUTOMATIC_ENTRY_EXIT_GATE_OPENERS: "Automatic Entry/Exit Gate Openers",
  SMART_ENTERTAINMENT_SYSTEM: "Smart Entertainment System",
  SMART_ELECTRONIC_SWITCH_SYSTEM: "Smart Electronic Switch System",
  EMERGENCY_DECTION_SYSTEM:
    "Emergency Dection System (Fire/Smoke)",
} as const;

export const SMART_HOME_FEATURE_OPTIONS = [
  SMART_HOME_FEATURES.AUTOMATED_LIGHTING_SYSTEM,
  SMART_HOME_FEATURES.SMART_VIDEO_DOORBELL,
  SMART_HOME_FEATURES.AUTOMATIC_ENTRY_EXIT_GATE_OPENERS,
  SMART_HOME_FEATURES.SMART_ENTERTAINMENT_SYSTEM,
  SMART_HOME_FEATURES.SMART_ELECTRONIC_SWITCH_SYSTEM,
  SMART_HOME_FEATURES.EMERGENCY_DECTION_SYSTEM,
] as const;

export const BUDGET_BANDS = {
  BEST_VALUE: "Starter Value (₱30K - ₱50K)",
  FEATURE_RICH: "My Needed Features (₱50K - ₱75K)",
  PREMIUM: "Premium Features (₱75K+) ",
} as const;

export const BUDGET_BAND_OPTIONS = [
  BUDGET_BANDS.BEST_VALUE,
  BUDGET_BANDS.FEATURE_RICH,
  BUDGET_BANDS.PREMIUM,
] as const;

export const TIMELINE_VALUES = {
  ASAP: "ASAP",
  THIS_MONTH: "This Month",
  BEFORE_MOVE_IN: "Before Move-in",
  RESEARCHING: "Researching",
} as const;

export const TIMELINE_OPTIONS = [
  { label: "🔥 ASAP / This Week", value: TIMELINE_VALUES.ASAP },
  { label: "📅 Within this month", value: TIMELINE_VALUES.THIS_MONTH },
  { label: "🏠 Before I move in / renovations finish", value: TIMELINE_VALUES.BEFORE_MOVE_IN },
  { label: "👀 Just researching for now", value: TIMELINE_VALUES.RESEARCHING },
] as const;

export const PERIMETER_PRIORITY_AREAS = [
  PRIORITY_AREA_KEYS.OUTDOOR_PERIMETER_STREET_VIEW,
] as const;
