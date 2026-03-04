import {
  BUDGET_BAND_OPTIONS,
  CURRENT_SETUP_VALUES,
  FEATURE_OPTIONS,
  FLOOR_OPTIONS,
  HOME_SIZE_VALUES,
  PRIORITY_AREAS,
  PROPERTY_TYPES,
  TIMELINE_OPTIONS,
} from "./formOptions";
import { deriveDiySecurityPlan } from "./diySecurityPlan";
import { FormData } from "./types";

const PROPERTY_TYPE_VALUES = PROPERTY_TYPES.map((option) => option.value);
const TIMELINE_VALUES = TIMELINE_OPTIONS.map((option) => option.value);

const SAFETY_MIN = 0;
const SAFETY_MAX = 5;
const SAFETY_FIELD_COUNT = 7;

type SafetyTuple = [number, number, number, number, number, number, number];

type ResultsTokenV3 = {
  v: 3;
  p: number;
  h: number;
  f: number;
  a: number[];
  c: number;
  s: SafetyTuple;
  m: number[];
  i: boolean;
  d: boolean;
  b: number;
  t: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const encodeBase64 = (value: string): string => {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    return window.btoa(value);
  }

  if (typeof btoa === "function") {
    return btoa(value);
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf8").toString("base64");
  }

  throw new Error("No base64 encoder available");
};

const decodeBase64 = (value: string): string => {
  if (typeof window !== "undefined" && typeof window.atob === "function") {
    return window.atob(value);
  }

  if (typeof atob === "function") {
    return atob(value);
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "base64").toString("utf8");
  }

  throw new Error("No base64 decoder available");
};

const toBase64Url = (value: string): string =>
  encodeBase64(value)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const fromBase64Url = (value: string): string | null => {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) {
    return null;
  }

  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = normalized.length % 4;
  const padded =
    remainder === 0 ? normalized : normalized + "=".repeat(4 - remainder);

  try {
    return decodeBase64(padded);
  } catch {
    return null;
  }
};

const toIndex = (options: readonly string[], value: string): number => {
  const index = options.indexOf(value);
  if (index >= 0) {
    return index;
  }

  const trimmed = value.trim();
  if (!trimmed) return -1;

  return options.findIndex((option) => option.trim() === trimmed);
};

const toIndexArray = (
  options: readonly string[],
  values: string[]
): number[] | null => {
  const indexes: number[] = [];

  for (const value of values) {
    const index = toIndex(options, value);
    if (index < 0) {
      return null;
    }
    indexes.push(index);
  }

  return indexes;
};

const normalizeSafetyScore = (value: number | null): number => {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < SAFETY_MIN ||
    value > SAFETY_MAX
  ) {
    return SAFETY_MIN;
  }

  return value;
};

const isValidOptionIndex = (
  value: unknown,
  options: readonly string[]
): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 0 &&
  value < options.length;

const isValidIndexArray = (
  value: unknown,
  options: readonly string[],
  requireAtLeastOne: boolean
): value is number[] => {
  if (!Array.isArray(value)) return false;
  if (requireAtLeastOne && value.length === 0) return false;

  const seen = new Set<number>();
  for (const item of value) {
    if (!isValidOptionIndex(item, options) || seen.has(item)) {
      return false;
    }
    seen.add(item);
  }

  return true;
};

const isValidSafetyTuple = (value: unknown): value is SafetyTuple =>
  Array.isArray(value) &&
  value.length === SAFETY_FIELD_COUNT &&
  value.every(
    (item) =>
      typeof item === "number" &&
      Number.isInteger(item) &&
      item >= SAFETY_MIN &&
      item <= SAFETY_MAX
  );

export const createResultsToken = (formData: FormData): string => {
  const propertyType = toIndex(PROPERTY_TYPE_VALUES, formData.property_type);
  const homeSize = toIndex(HOME_SIZE_VALUES, formData.home_size);
  const floors = toIndex(FLOOR_OPTIONS, formData.floors);
  const priorityAreas = toIndexArray(PRIORITY_AREAS, formData.priority_areas);
  const currentSetup = toIndex(CURRENT_SETUP_VALUES, formData.current_setup);
  const mustFeatures = toIndexArray(FEATURE_OPTIONS, formData.features_must);
  const budgetBand = toIndex(BUDGET_BAND_OPTIONS, formData.budget_band);
  const timeline = toIndex(TIMELINE_VALUES, formData.timeline);
  const invalidFields: Array<{ field: string; value: unknown }> = [];

  if (propertyType < 0) {
    invalidFields.push({
      field: "property_type",
      value: formData.property_type,
    });
  }
  if (homeSize < 0) {
    invalidFields.push({ field: "home_size", value: formData.home_size });
  }
  if (floors < 0) {
    invalidFields.push({ field: "floors", value: formData.floors });
  }
  if (!priorityAreas) {
    invalidFields.push({
      field: "priority_areas",
      value: formData.priority_areas,
    });
  }
  if (currentSetup < 0) {
    invalidFields.push({
      field: "current_setup",
      value: formData.current_setup,
    });
  }
  if (!mustFeatures) {
    invalidFields.push({
      field: "features_must",
      value: formData.features_must,
    });
  }
  if (budgetBand < 0) {
    invalidFields.push({
      field: "budget_band",
      value: formData.budget_band,
    });
  }
  if (timeline < 0) {
    invalidFields.push({ field: "timeline", value: formData.timeline });
  }

  if (invalidFields.length > 0) {
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      console.warn(
        "[resultsLink] Skipping results token creation: invalid/missing fields",
        invalidFields
      );
    }
    return "";
  }

  const safePriorityAreas = priorityAreas ?? [];
  const safeMustFeatures = mustFeatures ?? [];

  const payload: ResultsTokenV3 = {
    v: 3,
    p: propertyType,
    h: homeSize,
    f: floors,
    a: safePriorityAreas,
    c: currentSetup,
    s: [
      normalizeSafetyScore(formData.safety_gate_entry),
      normalizeSafetyScore(formData.safety_blindspots),
      normalizeSafetyScore(formData.safety_side_back_entry),
      normalizeSafetyScore(formData.safety_windows_terrace),
      normalizeSafetyScore(formData.safety_driveway_garage),
      normalizeSafetyScore(formData.safety_indoor_choke_points),
      normalizeSafetyScore(formData.safety_emergency_readiness),
    ],
    m: safeMustFeatures,
    i: Boolean(formData.smart_home_interest),
    d: deriveDiySecurityPlan(formData.timeline),
    b: budgetBand,
    t: timeline,
  };

  return toBase64Url(JSON.stringify(payload));
};

export const parseResultsToken = (token: string): FormData | null => {
  const decoded = fromBase64Url(token);
  if (!decoded) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded);
  } catch {
    return null;
  }

  if (!isRecord(parsed) || parsed.v !== 3) {
    return null;
  }

  const { p, h, f, a, c, s, m, i, d, b, t } = parsed;

  if (!isValidOptionIndex(p, PROPERTY_TYPE_VALUES)) return null;
  if (!isValidOptionIndex(h, HOME_SIZE_VALUES)) return null;
  if (!isValidOptionIndex(f, FLOOR_OPTIONS)) return null;
  if (!isValidIndexArray(a, PRIORITY_AREAS, true)) return null;
  if (!isValidOptionIndex(c, CURRENT_SETUP_VALUES)) return null;
  if (!isValidSafetyTuple(s)) return null;
  if (!isValidIndexArray(m, FEATURE_OPTIONS, false)) return null;
  if (typeof i !== "boolean") return null;
  if (typeof d !== "boolean") return null;
  if (!isValidOptionIndex(b, BUDGET_BAND_OPTIONS)) return null;
  if (!isValidOptionIndex(t, TIMELINE_VALUES)) return null;

  return {
    property_type: PROPERTY_TYPE_VALUES[p],
    home_size: HOME_SIZE_VALUES[h],
    floors: FLOOR_OPTIONS[f],
    priority_areas: a.map((index) => PRIORITY_AREAS[index]),
    current_setup: CURRENT_SETUP_VALUES[c],
    has_spare_key: null,
    changed_wifi_default_password: null,
    sleeps_with_earphones: null,
    locks_windows_gate_at_night: null,
    has_security_cameras: null,
    has_smoke_alarm_or_fire_extinguisher: null,
    has_first_aid_or_medicine_ready: null,
    knows_local_emergency_contacts: null,
    safety_gate_entry: s[0],
    safety_blindspots: s[1],
    safety_side_back_entry: s[2],
    safety_windows_terrace: s[3],
    safety_driveway_garage: s[4],
    safety_indoor_choke_points: s[5],
    safety_emergency_readiness: s[6],
    features_must: m.map((index) => FEATURE_OPTIONS[index]),
    smart_home_features: [],
    smart_home_interest: i ? "Yes" : "",
    diy_security_plan: deriveDiySecurityPlan(TIMELINE_VALUES[t]),
    budget_band: BUDGET_BAND_OPTIONS[b],
    timeline: TIMELINE_VALUES[t],
    first_name: "",
    email: "",
    mobile: "",
  };
};
