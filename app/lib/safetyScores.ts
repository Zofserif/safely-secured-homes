import type { FormData } from "./types";
import {
  SAFETY_SCORE_MAX,
  SAFETY_SCORE_MIN,
  SAFETY_TOTAL_MAX_SCORE,
} from "./safetyScale.js";

// Category scores are stored as safety-oriented values:
// 0 = riskiest, 50 = safest. Results summary mappings consume this scale.
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

// Normalizes any unknown input into a floored integer safety score on the stored 0..50 scale.
export const toSafetyScore = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return SAFETY_SCORE_MIN;

  const clamped = Math.min(SAFETY_SCORE_MAX, Math.max(SAFETY_SCORE_MIN, value));
  return Math.floor(clamped);
};

// Preserves one-decimal precision on the same stored 0..50 safety scale.
export const toSafetyScorePrecise = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return SAFETY_SCORE_MIN;

  const clamped = Math.min(SAFETY_SCORE_MAX, Math.max(SAFETY_SCORE_MIN, value));
  return Number(clamped.toFixed(1));
};

const averageSafetyScore = (values: unknown[]): number => {
  if (values.length === 0) return 0;

  const total = values.reduce<number>((sum, value) => sum + toSafetyScore(value), 0);
  return toSafetyScore(total / values.length);
};

const averageSafetyScorePrecise = (values: unknown[]): number => {
  if (values.length === 0) return 0;

  const total = values.reduce<number>(
    (sum, value) => sum + toSafetyScorePrecise(value),
    0
  );
  return toSafetyScorePrecise(total / values.length);
};

// These are normalized category safety scores used by resultsScoring/getResultsSummary.
export const getSafetyCategoryScores = (data: FormData): SafetyCategoryScores => ({
  home_entrance: averageSafetyScore([
    data.safety_gate_entry,
    data.safety_side_back_entry,
    data.safety_windows_terrace,
  ]),
  neighborhood_safety_check: toSafetyScore(data.safety_driveway_garage),
  windows_terrace: averageSafetyScore([
    data.safety_blindspots,
    data.safety_indoor_choke_points,
  ]),
  emergency_readiness_home: toSafetyScore(data.safety_emergency_readiness),
});

// These retain one-decimal category safety precision for display-oriented scoring.
export const getSafetyCategoryScoresPrecise = (
  data: FormData
): SafetyCategoryScores => ({
  home_entrance: averageSafetyScorePrecise([
    data.safety_gate_entry,
    data.safety_side_back_entry,
    data.safety_windows_terrace,
  ]),
  neighborhood_safety_check: toSafetyScorePrecise(data.safety_driveway_garage),
  windows_terrace: averageSafetyScorePrecise([
    data.safety_blindspots,
    data.safety_indoor_choke_points,
  ]),
  emergency_readiness_home: toSafetyScorePrecise(data.safety_emergency_readiness),
});

// Aggregate safety summary that drives Safety Score and Emergency Readiness classifications.
export const getSafetySummary = (data: FormData): SafetySummary => {
  const categoryScores = getSafetyCategoryScores(data);
  const total = Object.values(categoryScores).reduce<number>(
    (sum, value) => sum + value,
    0
  );

  return {
    total,
    average: total / 4,
    max: SAFETY_TOTAL_MAX_SCORE,
    emergencyReadinessScore: categoryScores.emergency_readiness_home,
  };
};
