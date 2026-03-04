import {
  BUDGET_BAND_OPTIONS,
  CURRENT_SETUP_VALUES,
  FEATURE_OPTIONS,
  FLOOR_OPTIONS,
  HOME_SIZE_VALUES,
  PRIORITY_AREAS,
  PROPERTY_TYPES,
  SMART_HOME_FEATURE_OPTIONS,
  TIMELINE_OPTIONS,
} from "./formOptions";
import { deriveDiySecurityPlan } from "./diySecurityPlan";
import { FormData } from "./types";

const PROPERTY_TYPE_VALUES = PROPERTY_TYPES.map((option) => option.value);
const TIMELINE_VALUES = TIMELINE_OPTIONS.map((option) => option.value);
const LEGACY_MAIN_GOAL_VALUES = [
  "Family",
  "Security",
  "Smart Home First",
  "Home Access Control",
  "Emergency Recording",
] as const;

const SAFETY_MIN = 0;
const SAFETY_MAX = 5;

type ResultsSharePayloadBase = {
  property_type: string;
  home_size: string;
  floors: string;
  priority_areas: string[];
  current_setup: string;
  safety_gate_entry: number;
  safety_blindspots: number;
  safety_side_back_entry: number;
  safety_windows_terrace: number;
  safety_driveway_garage: number;
  safety_indoor_choke_points: number;
  safety_emergency_readiness: number;
  features_must: string[];
  smart_home_features?: string[];
  smart_home_interest: boolean;
  diy_security_plan: boolean;
  budget_band: string;
  timeline: string;
};

export type ResultsSharePayloadV1 = ResultsSharePayloadBase & {
  v: 1;
  main_goal: string;
};

export type ResultsSharePayloadV2 = ResultsSharePayloadBase & {
  v: 2;
};

type InvalidField = {
  field: string;
  value: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeOption = (
  options: readonly string[],
  value: unknown
): string | undefined => {
  if (typeof value !== "string") return undefined;

  const exact = options.find((option) => option === value);
  if (exact) return exact;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  return options.find((option) => option.trim() === trimmed);
};

const normalizeOptionArray = (
  options: readonly string[],
  value: unknown,
  requireAtLeastOne: boolean
): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;

  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    const option = normalizeOption(options, item);
    if (!option || seen.has(option)) {
      return undefined;
    }
    seen.add(option);
    normalized.push(option);
  }

  if (requireAtLeastOne && normalized.length === 0) {
    return undefined;
  }

  return normalized;
};

const normalizeSafetyScore = (value: unknown): number | undefined => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  const normalized = Number(value.toFixed(1));
  if (
    normalized < SAFETY_MIN ||
    normalized > SAFETY_MAX
  ) {
    return undefined;
  }

  return normalized;
};

const normalizeBoolean = (value: unknown): boolean =>
  typeof value === "boolean" ? value : Boolean(value);

const collectInvalidFields = (
  payload: Partial<ResultsSharePayloadV2>
): InvalidField[] => {
  const invalid: InvalidField[] = [];

  if (!payload.property_type) {
    invalid.push({ field: "property_type", value: payload.property_type });
  }
  if (!payload.home_size) {
    invalid.push({ field: "home_size", value: payload.home_size });
  }
  if (!payload.floors) {
    invalid.push({ field: "floors", value: payload.floors });
  }
  if (!payload.priority_areas || payload.priority_areas.length === 0) {
    invalid.push({ field: "priority_areas", value: payload.priority_areas });
  }
  if (!payload.current_setup) {
    invalid.push({ field: "current_setup", value: payload.current_setup });
  }
  if (!payload.features_must) {
    invalid.push({ field: "features_must", value: payload.features_must });
  }
  if (!payload.budget_band) {
    invalid.push({ field: "budget_band", value: payload.budget_band });
  }
  if (!payload.timeline) {
    invalid.push({ field: "timeline", value: payload.timeline });
  }

  return invalid;
};

const toPayload = (formData: FormData): {
  payload: ResultsSharePayloadV2 | null;
  invalidFields: InvalidField[];
} => {
  const normalizedTimeline = normalizeOption(TIMELINE_VALUES, formData.timeline);
  const payload: Partial<ResultsSharePayloadV2> = {
    v: 2,
    property_type: normalizeOption(PROPERTY_TYPE_VALUES, formData.property_type),
    home_size: normalizeOption(HOME_SIZE_VALUES, formData.home_size),
    floors: normalizeOption(FLOOR_OPTIONS, formData.floors),
    priority_areas: normalizeOptionArray(
      PRIORITY_AREAS,
      formData.priority_areas,
      true
    ),
    current_setup: normalizeOption(CURRENT_SETUP_VALUES, formData.current_setup),
    safety_gate_entry: normalizeSafetyScore(formData.safety_gate_entry),
    safety_blindspots: normalizeSafetyScore(formData.safety_blindspots),
    safety_side_back_entry: normalizeSafetyScore(formData.safety_side_back_entry),
    safety_windows_terrace: normalizeSafetyScore(formData.safety_windows_terrace),
    safety_driveway_garage: normalizeSafetyScore(formData.safety_driveway_garage),
    safety_indoor_choke_points: normalizeSafetyScore(
      formData.safety_indoor_choke_points
    ),
    safety_emergency_readiness: normalizeSafetyScore(
      formData.safety_emergency_readiness
    ),
    features_must: normalizeOptionArray(FEATURE_OPTIONS, formData.features_must, false),
    smart_home_features: normalizeOptionArray(
      SMART_HOME_FEATURE_OPTIONS,
      formData.smart_home_features,
      false
    ),
    smart_home_interest: normalizeBoolean(formData.smart_home_interest),
    diy_security_plan: normalizedTimeline
      ? deriveDiySecurityPlan(normalizedTimeline)
      : undefined,
    budget_band: normalizeOption(BUDGET_BAND_OPTIONS, formData.budget_band),
    timeline: normalizedTimeline,
  };

  const invalidFields = collectInvalidFields(payload);

  const safetyFields: Array<keyof ResultsSharePayloadV2> = [
    "safety_gate_entry",
    "safety_blindspots",
    "safety_side_back_entry",
    "safety_windows_terrace",
    "safety_driveway_garage",
    "safety_indoor_choke_points",
    "safety_emergency_readiness",
  ];

  for (const field of safetyFields) {
    if (typeof payload[field] !== "number") {
      invalidFields.push({ field, value: payload[field] });
    }
  }

  if (invalidFields.length > 0) {
    return { payload: null, invalidFields };
  }

  return { payload: payload as ResultsSharePayloadV2, invalidFields: [] };
};

export const createShareableResultsPayload = (
  formData: FormData
): ResultsSharePayloadV2 | null => {
  const { payload, invalidFields } = toPayload(formData);

  if (!payload) {
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      console.warn(
        "[resultsShare] Skipping DB share-link creation: invalid/missing fields",
        invalidFields
      );
    }
    return null;
  }

  return payload;
};

export const parseShareableResultsPayload = (
  value: unknown
): FormData | null => {
  if (!isRecord(value)) return null;
  if (value.v !== 1 && value.v !== 2) return null;

  if (value.v === 1) {
    const legacyMainGoal = normalizeOption(LEGACY_MAIN_GOAL_VALUES, value.main_goal);
    if (!legacyMainGoal) return null;
  }

  const propertyType = normalizeOption(PROPERTY_TYPE_VALUES, value.property_type);
  const homeSize = normalizeOption(HOME_SIZE_VALUES, value.home_size);
  const floors = normalizeOption(FLOOR_OPTIONS, value.floors);
  const priorityAreas = normalizeOptionArray(
    PRIORITY_AREAS,
    value.priority_areas,
    true
  );
  const currentSetup = normalizeOption(CURRENT_SETUP_VALUES, value.current_setup);
  const safetyGateEntry = normalizeSafetyScore(value.safety_gate_entry);
  const safetyBlindspots = normalizeSafetyScore(value.safety_blindspots);
  const safetySideBackEntry = normalizeSafetyScore(value.safety_side_back_entry);
  const safetyWindowsTerrace = normalizeSafetyScore(value.safety_windows_terrace);
  const safetyDrivewayGarage = normalizeSafetyScore(value.safety_driveway_garage);
  const safetyIndoorChokePoints = normalizeSafetyScore(
    value.safety_indoor_choke_points
  );
  const safetyEmergencyReadiness = normalizeSafetyScore(
    value.safety_emergency_readiness
  );
  const featuresMust = normalizeOptionArray(
    FEATURE_OPTIONS,
    value.features_must,
    false
  );
  const smartHomeFeatures =
    typeof value.smart_home_features === "undefined"
      ? []
      : normalizeOptionArray(
          SMART_HOME_FEATURE_OPTIONS,
          value.smart_home_features,
          false
        );
  const budgetBand = normalizeOption(BUDGET_BAND_OPTIONS, value.budget_band);
  const timeline = normalizeOption(TIMELINE_VALUES, value.timeline);

  if (
    !propertyType ||
    !homeSize ||
    !floors ||
    !priorityAreas ||
    !currentSetup ||
    typeof safetyGateEntry !== "number" ||
    typeof safetyBlindspots !== "number" ||
    typeof safetySideBackEntry !== "number" ||
    typeof safetyWindowsTerrace !== "number" ||
    typeof safetyDrivewayGarage !== "number" ||
    typeof safetyIndoorChokePoints !== "number" ||
    typeof safetyEmergencyReadiness !== "number" ||
    !featuresMust ||
    !smartHomeFeatures ||
    !budgetBand ||
    !timeline
  ) {
    return null;
  }

  return {
    property_type: propertyType,
    home_size: homeSize,
    floors,
    priority_areas: priorityAreas,
    current_setup: currentSetup,
    safety_gate_entry: safetyGateEntry,
    safety_blindspots: safetyBlindspots,
    safety_side_back_entry: safetySideBackEntry,
    safety_windows_terrace: safetyWindowsTerrace,
    safety_driveway_garage: safetyDrivewayGarage,
    safety_indoor_choke_points: safetyIndoorChokePoints,
    safety_emergency_readiness: safetyEmergencyReadiness,
    features_must: featuresMust,
    smart_home_features: smartHomeFeatures,
    smart_home_interest: value.smart_home_interest ? "Yes" : "",
    diy_security_plan: deriveDiySecurityPlan(timeline),
    budget_band: budgetBand,
    timeline,
    first_name: "",
    email: "",
    mobile: "",
  };
};
