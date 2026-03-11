import {
  DESIRED_OUTCOME_OPTIONS,
  GOAL_OBSTACLE_OPTIONS,
  HOUSEHOLD_STAGE_OPTIONS,
  PROPERTY_TYPES,
  SOLUTION_OPTIONS,
} from "./formOptions";
import type { FormData } from "./types";
import {
  normalizeSafetyScore,
  SAFETY_SCORE_MAX,
  SAFETY_SCORE_MIN,
} from "./safetyScale.js";

const PROPERTY_TYPE_VALUES = PROPERTY_TYPES.map((option) => option.value);
const SOLUTION_VALUES = Object.values(SOLUTION_OPTIONS);

type ResultsSharePayloadBase = {
  property_type: string;
  has_spare_key: boolean | null;
  changed_wifi_default_password: boolean | null;
  sleeps_with_earphones: boolean | null;
  locks_windows_gate_at_night: boolean | null;
  has_security_cameras: boolean | null;
  has_smoke_alarm_or_fire_extinguisher: boolean | null;
  has_first_aid_or_medicine_ready: boolean | null;
  knows_local_emergency_contacts: boolean | null;
  home_entrance: number;
  windows_terrace: number;
  neighborhood_safety_check: number;
  emergency_readiness_home: number;
  household_stage: string;
  desired_outcome: string;
  goal_obstacle: string;
  has_additional_notes: boolean;
  additional_notes: string;
  solution: string;
};

export type ResultsSharePayloadV8 = ResultsSharePayloadBase & {
  v: 8;
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

const normalizeStoredSafetyScore = (value: unknown): number | undefined => {
  const normalized = normalizeSafetyScore(value);
  if (typeof normalized !== "number") return undefined;

  if (normalized < SAFETY_SCORE_MIN || normalized > SAFETY_SCORE_MAX) {
    return undefined;
  }

  return normalized;
};

const normalizeNullableBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const normalizeRequiredBoolean = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const collectInvalidFields = (
  payload: Partial<ResultsSharePayloadV8>
): InvalidField[] => {
  const invalid: InvalidField[] = [];

  if (!payload.property_type) {
    invalid.push({ field: "property_type", value: payload.property_type });
  }

  if (!payload.household_stage) {
    invalid.push({ field: "household_stage", value: payload.household_stage });
  }

  if (!payload.desired_outcome) {
    invalid.push({ field: "desired_outcome", value: payload.desired_outcome });
  }

  if (!payload.goal_obstacle) {
    invalid.push({ field: "goal_obstacle", value: payload.goal_obstacle });
  }

  if (typeof payload.has_additional_notes !== "boolean") {
    invalid.push({
      field: "has_additional_notes",
      value: payload.has_additional_notes,
    });
  }

  if (!payload.solution) {
    invalid.push({ field: "solution", value: payload.solution });
  }

  return invalid;
};

const toPayload = (formData: FormData): {
  payload: ResultsSharePayloadV8 | null;
  invalidFields: InvalidField[];
} => {
  const payload: Partial<ResultsSharePayloadV8> = {
    v: 8,
    property_type: normalizeOption(PROPERTY_TYPE_VALUES, formData.property_type),
    has_spare_key: normalizeNullableBoolean(formData.has_spare_key),
    changed_wifi_default_password: normalizeNullableBoolean(
      formData.changed_wifi_default_password
    ),
    sleeps_with_earphones: normalizeNullableBoolean(formData.sleeps_with_earphones),
    locks_windows_gate_at_night: normalizeNullableBoolean(
      formData.locks_windows_gate_at_night
    ),
    has_security_cameras: normalizeNullableBoolean(formData.has_security_cameras),
    has_smoke_alarm_or_fire_extinguisher: normalizeNullableBoolean(
      formData.has_smoke_alarm_or_fire_extinguisher
    ),
    has_first_aid_or_medicine_ready: normalizeNullableBoolean(
      formData.has_first_aid_or_medicine_ready
    ),
    knows_local_emergency_contacts: normalizeNullableBoolean(
      formData.knows_local_emergency_contacts
    ),
    home_entrance: normalizeStoredSafetyScore(formData.home_entrance),
    windows_terrace: normalizeStoredSafetyScore(formData.windows_terrace),
    neighborhood_safety_check: normalizeStoredSafetyScore(formData.neighborhood_safety_check),
    emergency_readiness_home: normalizeStoredSafetyScore(
      formData.emergency_readiness_home
    ),
    household_stage: normalizeOption(HOUSEHOLD_STAGE_OPTIONS, formData.household_stage),
    desired_outcome: normalizeOption(
      DESIRED_OUTCOME_OPTIONS,
      formData.desired_outcome
    ),
    goal_obstacle: normalizeOption(GOAL_OBSTACLE_OPTIONS, formData.goal_obstacle),
    has_additional_notes: normalizeRequiredBoolean(formData.has_additional_notes),
    additional_notes: normalizeText(formData.additional_notes),
    solution: normalizeOption(SOLUTION_VALUES, formData.solution),
  };

  const invalidFields = collectInvalidFields(payload);

  const safetyFields: Array<keyof ResultsSharePayloadV8> = [
    "home_entrance",
    "windows_terrace",
    "neighborhood_safety_check",
    "emergency_readiness_home",
  ];

  for (const field of safetyFields) {
    if (typeof payload[field] !== "number") {
      invalidFields.push({ field, value: payload[field] });
    }
  }

  if (invalidFields.length > 0) {
    return { payload: null, invalidFields };
  }

  return { payload: payload as ResultsSharePayloadV8, invalidFields: [] };
};

export const createShareableResultsPayload = (
  formData: FormData
): ResultsSharePayloadV8 | null => {
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
  if (value.v !== 8) return null;
  if (Object.prototype.hasOwnProperty.call(value, "goal_obstacle_other")) {
    return null;
  }

  const propertyType = normalizeOption(PROPERTY_TYPE_VALUES, value.property_type);
  const homeEntrance = normalizeStoredSafetyScore(value.home_entrance);
  const windowsTerrace = normalizeStoredSafetyScore(value.windows_terrace);
  const neighborhoodSafetyCheck = normalizeStoredSafetyScore(
    value.neighborhood_safety_check
  );
  const emergencyReadinessHome = normalizeStoredSafetyScore(
    value.emergency_readiness_home
  );
  const householdStage = normalizeOption(HOUSEHOLD_STAGE_OPTIONS, value.household_stage);
  const desiredOutcome = normalizeOption(
    DESIRED_OUTCOME_OPTIONS,
    value.desired_outcome
  );
  const goalObstacle = normalizeOption(GOAL_OBSTACLE_OPTIONS, value.goal_obstacle);
  const solution = normalizeOption(SOLUTION_VALUES, value.solution);
  const hasAdditionalNotes = normalizeRequiredBoolean(value.has_additional_notes);

  if (
    !propertyType ||
    typeof homeEntrance !== "number" ||
    typeof windowsTerrace !== "number" ||
    typeof neighborhoodSafetyCheck !== "number" ||
    typeof emergencyReadinessHome !== "number" ||
    !householdStage ||
    !desiredOutcome ||
    !goalObstacle ||
    typeof hasAdditionalNotes !== "boolean" ||
    !solution
  ) {
    return null;
  }

  return {
    property_type: propertyType,
    has_spare_key: normalizeNullableBoolean(value.has_spare_key),
    changed_wifi_default_password: normalizeNullableBoolean(
      value.changed_wifi_default_password
    ),
    sleeps_with_earphones: normalizeNullableBoolean(value.sleeps_with_earphones),
    locks_windows_gate_at_night: normalizeNullableBoolean(
      value.locks_windows_gate_at_night
    ),
    has_security_cameras: normalizeNullableBoolean(value.has_security_cameras),
    has_smoke_alarm_or_fire_extinguisher: normalizeNullableBoolean(
      value.has_smoke_alarm_or_fire_extinguisher
    ),
    has_first_aid_or_medicine_ready: normalizeNullableBoolean(
      value.has_first_aid_or_medicine_ready
    ),
    knows_local_emergency_contacts: normalizeNullableBoolean(
      value.knows_local_emergency_contacts
    ),
    home_entrance: homeEntrance,
    windows_terrace: windowsTerrace,
    neighborhood_safety_check: neighborhoodSafetyCheck,
    emergency_readiness_home: emergencyReadinessHome,
    household_stage: householdStage,
    desired_outcome: desiredOutcome,
    goal_obstacle: goalObstacle,
    has_additional_notes: hasAdditionalNotes,
    additional_notes: normalizeText(value.additional_notes),
    solution,
    name: "",
    email: "",
    mobile: "",
  };
};
