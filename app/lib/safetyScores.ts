import type { FormData } from "./types";
import {
  clampSafetyScore,
  SAFETY_SCORE_MAX,
  SAFETY_SCORE_MIN,
  SAFETY_TOTAL_MAX_SCORE,
} from "./safetyScale.js";
import { LEAD_SCORING_SECTIONS } from "./leadScoringConfig.js";

// Category scores are stored as safety-oriented values:
// 0 = riskiest, 100 = safest. Results summary mappings consume this scale.
export type SafetyCategoryScores = {
  home_entrance: number;
  neighborhood_safety_check: number;
  windows_terrace: number;
  emergency_readiness_home: number;
};

export type SafetySummary = {
  total: number;
  average: number;
  max: typeof SAFETY_TOTAL_MAX_SCORE;
  emergencyReadinessScore: number;
};

type SectionRiskEvaluation = {
  hasAnswer: boolean;
  rawPoints: number;
  maxPoints: number;
};

const EMPTY_SECTION_RISK_EVALUATION: SectionRiskEvaluation = {
  hasAnswer: false,
  rawPoints: 0,
  maxPoints: 0,
};

const SAFETY_WEIGHT_BY_SECTION = {
  safety_habits_yes_no: 50,
  safety_home_entrance: 15,
  safety_neighborhood: 15,
  safety_windows_terrace: 15,
  safety_emergency_readiness: 5,
} as const;

type SafetyWeightedSectionId = keyof typeof SAFETY_WEIGHT_BY_SECTION;

const SAFETY_WEIGHTED_SECTION_IDS: readonly SafetyWeightedSectionId[] = [
  "safety_habits_yes_no",
  "safety_home_entrance",
  "safety_neighborhood",
  "safety_windows_terrace",
  "safety_emergency_readiness",
];

const EMERGENCY_READINESS_WEIGHT_BY_SECTION = {
  safety_habits_yes_no: 35,
  safety_home_entrance: 5,
  safety_neighborhood: 5,
  safety_windows_terrace: 5,
  safety_emergency_readiness: 50,
} as const;

type EmergencyReadinessWeightedSectionId =
  keyof typeof EMERGENCY_READINESS_WEIGHT_BY_SECTION;

const EMERGENCY_READINESS_WEIGHTED_SECTION_IDS: readonly EmergencyReadinessWeightedSectionId[] =
  [
    "safety_habits_yes_no",
    "safety_home_entrance",
    "safety_neighborhood",
    "safety_windows_terrace",
    "safety_emergency_readiness",
  ];

const LEAD_SECTION_BY_ID = new Map(
  LEAD_SCORING_SECTIONS.map((section) => [section.id, section] as const)
);

type SafetyYesNoField =
  | "has_spare_key"
  | "changed_wifi_default_password"
  | "sleeps_with_earphones"
  | "locks_windows_gate_at_night"
  | "has_security_cameras"
  | "has_smoke_alarm_or_fire_extinguisher"
  | "has_first_aid_or_medicine_ready"
  | "knows_local_emergency_contacts";

type SafetyYesNoPoints = {
  yes: number;
  no: number;
};

const DEFAULT_SAFETY_YES_NO_POINTS: Readonly<SafetyYesNoPoints> = {
  yes: 0,
  no: 0,
};

const SAFETY_YES_NO_POINTS_BY_FIELD: Readonly<
  Record<SafetyYesNoField, Readonly<SafetyYesNoPoints>>
> = {
  has_spare_key: { yes: 1, no: 0 },
  changed_wifi_default_password: { yes: 1, no: 0 },
  sleeps_with_earphones: { yes: -2, no: 0 },
  locks_windows_gate_at_night: { yes: 2, no: 0 },
  has_security_cameras: { yes: 3, no: 0 },
  has_smoke_alarm_or_fire_extinguisher: { yes: 1, no: 0 },
  has_first_aid_or_medicine_ready: { yes: 2, no: 0 },
  knows_local_emergency_contacts: { yes: 1, no: 0 },
};

const EMERGENCY_READINESS_YES_NO_POINTS_BY_FIELD: Readonly<
  Record<SafetyYesNoField, Readonly<SafetyYesNoPoints>>
> = {
  has_spare_key: { yes: 0, no: 0 },
  changed_wifi_default_password: { yes: 0, no: 0 },
  sleeps_with_earphones: { yes: 0, no: 0 },
  locks_windows_gate_at_night: { yes: 0, no: 0 },
  has_security_cameras: { yes: 1, no: 0 },
  has_smoke_alarm_or_fire_extinguisher: { yes: 2, no: 0 },
  has_first_aid_or_medicine_ready: { yes: 2, no: 0 },
  knows_local_emergency_contacts: { yes: 1, no: 0 },
};

const SAFETY_YES_NO_FIELDS = Object.keys(
  SAFETY_YES_NO_POINTS_BY_FIELD
) as SafetyYesNoField[];

// Normalizes any unknown input into a floored integer safety score on the stored 0..100 scale.
export const toSafetyScore = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return SAFETY_SCORE_MIN;

  const clamped = Math.min(SAFETY_SCORE_MAX, Math.max(SAFETY_SCORE_MIN, value));
  return Math.floor(clamped);
};

const toSignedInteger = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.round(value);
};

const clampRatio = (value: number): number => Math.min(1, Math.max(0, value));

const averageSafetySliderValue = (
  data: FormData,
  fields: readonly string[]
): number | null => {
  const values: number[] = [];

  for (const field of fields) {
    const value = data[field as keyof FormData];
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    values.push(clampSafetyScore(value));
  }

  if (values.length === 0) return null;

  const total = values.reduce((sum, value) => sum + value, 0);
  return clampSafetyScore(total / values.length);
};

const evaluateYesNoSection = (data: FormData): SectionRiskEvaluation => {
  let hasAnswer = false;
  let rawPoints = 0;
  let maxPoints = 0;

  for (const field of SAFETY_YES_NO_FIELDS) {
    const configuredPoints =
      SAFETY_YES_NO_POINTS_BY_FIELD[field] ?? DEFAULT_SAFETY_YES_NO_POINTS;
    const yesPoints = toSignedInteger(configuredPoints.yes);
    const noPoints = toSignedInteger(configuredPoints.no);
    maxPoints += Math.max(0, yesPoints, noPoints);

    const value = data[field];
    if (value === true) {
      rawPoints += yesPoints;
      hasAnswer = true;
      continue;
    }

    if (value === false) {
      rawPoints += noPoints;
      hasAnswer = true;
    }
  }

  return {
    hasAnswer,
    rawPoints,
    maxPoints,
  };
};

const evaluateEmergencyReadinessYesNoSection = (
  data: FormData
): SectionRiskEvaluation => {
  let hasAnswer = false;
  let rawPoints = 0;
  let maxPoints = 0;

  for (const field of SAFETY_YES_NO_FIELDS) {
    const configuredPoints =
      EMERGENCY_READINESS_YES_NO_POINTS_BY_FIELD[field] ??
      DEFAULT_SAFETY_YES_NO_POINTS;
    const yesPoints = toSignedInteger(configuredPoints.yes);
    const noPoints = toSignedInteger(configuredPoints.no);
    maxPoints += Math.max(0, yesPoints, noPoints);

    const value = data[field];
    if (value === true) {
      rawPoints += yesPoints;
      hasAnswer = true;
      continue;
    }

    if (value === false) {
      rawPoints += noPoints;
      hasAnswer = true;
    }
  }

  return {
    hasAnswer,
    rawPoints,
    maxPoints,
  };
};

type SafetySliderSectionId = Exclude<SafetyWeightedSectionId, "safety_habits_yes_no">;

const evaluateSafetySliderSection = (
  sectionId: SafetySliderSectionId,
  data: FormData
): SectionRiskEvaluation => {
  const section = LEAD_SECTION_BY_ID.get(sectionId);
  if (!section) return EMPTY_SECTION_RISK_EVALUATION;

  const sliderQuestion = section.questions.find(
    (question) => question.type === "safety_slider_inverse"
  );
  if (!sliderQuestion) return EMPTY_SECTION_RISK_EVALUATION;

  const sliderValue = averageSafetySliderValue(data, sliderQuestion.fields);
  if (sliderValue === null) {
    return {
      hasAnswer: false,
      rawPoints: 0,
      maxPoints: SAFETY_SCORE_MAX,
    };
  }

  return {
    hasAnswer: true,
    rawPoints: SAFETY_SCORE_MAX - sliderValue,
    maxPoints: SAFETY_SCORE_MAX,
  };
};

const getSafetyWeightedTotal = (data: FormData): number => {
  let weightedRisk = 0;
  let activeWeight = 0;

  for (const sectionId of SAFETY_WEIGHTED_SECTION_IDS) {
    const sectionWeight = SAFETY_WEIGHT_BY_SECTION[sectionId];
    const evaluation =
      sectionId === "safety_habits_yes_no"
        ? evaluateYesNoSection(data)
        : evaluateSafetySliderSection(sectionId, data);

    if (!evaluation.hasAnswer || evaluation.maxPoints <= 0) continue;

    const sectionRisk =
      sectionId === "safety_habits_yes_no"
        ? 1 - clampRatio(evaluation.rawPoints / evaluation.maxPoints)
        : clampRatio(evaluation.rawPoints / evaluation.maxPoints);
    weightedRisk += sectionRisk * sectionWeight;
    activeWeight += sectionWeight;
  }

  if (activeWeight <= 0) return SAFETY_SCORE_MIN;

  const normalizedRisk = (weightedRisk / activeWeight) * SAFETY_SCORE_MAX;
  return toSafetyScore(SAFETY_SCORE_MAX - normalizedRisk);
};

const getEmergencyReadinessWeightedScore = (data: FormData): number => {
  let weightedRisk = 0;
  let activeWeight = 0;

  for (const sectionId of EMERGENCY_READINESS_WEIGHTED_SECTION_IDS) {
    const sectionWeight = EMERGENCY_READINESS_WEIGHT_BY_SECTION[sectionId];
    const evaluation =
      sectionId === "safety_habits_yes_no"
        ? evaluateEmergencyReadinessYesNoSection(data)
        : evaluateSafetySliderSection(sectionId, data);

    if (!evaluation.hasAnswer || evaluation.maxPoints <= 0) continue;

    const sectionRisk =
      sectionId === "safety_habits_yes_no"
        ? 1 - clampRatio(evaluation.rawPoints / evaluation.maxPoints)
        : clampRatio(evaluation.rawPoints / evaluation.maxPoints);

    weightedRisk += sectionRisk * sectionWeight;
    activeWeight += sectionWeight;
  }

  if (activeWeight <= 0) return SAFETY_SCORE_MIN;

  const normalizedRisk = (weightedRisk / activeWeight) * SAFETY_SCORE_MAX;
  return toSafetyScore(SAFETY_SCORE_MAX - normalizedRisk);
};

// These are normalized category safety scores used by resultsScoring/getResultsSummary.
export const getSafetyCategoryScores = (data: FormData): SafetyCategoryScores => ({
  home_entrance: toSafetyScore(data.safety_gate_entry),
  neighborhood_safety_check: toSafetyScore(data.safety_driveway_garage),
  windows_terrace: toSafetyScore(data.safety_blindspots),
  emergency_readiness_home: toSafetyScore(data.safety_emergency_readiness),
});

// Aggregate safety summary that drives Safety Score and Emergency Readiness classifications.
export const getSafetySummary = (data: FormData): SafetySummary => {
  const total = getSafetyWeightedTotal(data);
  const emergencyReadinessScore = getEmergencyReadinessWeightedScore(data);

  return {
    total,
    average: total,
    max: SAFETY_TOTAL_MAX_SCORE,
    emergencyReadinessScore,
  };
};
