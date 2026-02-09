export const PROPERTY_TYPES = [
  "Single-family house",
  "Condo / Apartment",
  "Townhouse / Pre-built House",
  "Vacation Home / Beach House",
] as const;

export const CURRENT_SETUP_OPTIONS = {
  NEW_INSTALL: "No, this is a new installation",
  BROKEN_OLD: "Yes, but it's broken/old (Needs replacement)",
  UPGRADE: "Yes, looking to expand/upgrade",
} as const;

export const CURRENT_SETUP_VALUES = [
  CURRENT_SETUP_OPTIONS.NEW_INSTALL,
  CURRENT_SETUP_OPTIONS.BROKEN_OLD,
  CURRENT_SETUP_OPTIONS.UPGRADE,
] as const;

export const MAIN_GOAL_OPTIONS = [
  { label: "👶 Checking my family & piece of mind while away", value: "Family" },
  { label: "🛡️ Prevent break-ins & eliminate blind spots", value: "Security" },
  { label: "🏠 Everyday home convinience & control", value: "Smart Home First" },
  { label: "🔓 Control access & track home entry", value: "Home Access Control" },
  { label: "🎥 Emergency alert & Capturing video evidence for police or insurance", value: "Emergency Recording" },
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

export const FLOOR_OPTIONS = ["1", "2", "3+"] as const;

export const PRIORITY_AREAS = [
  "General Indoor Living Areas",
  "Monitor my child/elderly/pets",
  "Main Entrance/Front Door",
  "Home Office Security",
  "Outdoor Gate/Driveway Entrance",
  "Parcel & Mail Drop-off",
  "Side Entrance/Backdoor",
  "Whole Backyard/Front yard coverage",
  "Street View/Outside Perimeter",
  "Indoor Garage",
  "Actively Monitoring Outside",
  "Multiple Floor Security",
  "No Internet/Electricity Remote Property",
] as const;

export const PRIORITY_AREA_KEYS = {
  OUTDOOR_GATE_DRIVEWAY: "Outdoor Gate/Driveway Entrance",
  STREET_VIEW_PERIMETER: "Street View/Outside Perimeter",
  WHOLE_BACKYARD_FRONT_YARD: "Whole Backyard/Front yard coverage",
  ACTIVELY_MONITORING_OUTSIDE: "Actively Monitoring Outside",
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
  PRIORITY_AREA_KEYS.STREET_VIEW_PERIMETER,
  PRIORITY_AREA_KEYS.WHOLE_BACKYARD_FRONT_YARD,
  PRIORITY_AREA_KEYS.ACTIVELY_MONITORING_OUTSIDE,
] as const;
