import type { FormData } from "./types";

export type SafetyCategoryScores = {
  home_entrance: number;
  neighborhood_safety_check: number;
  indoor_outdoor_blindspots: number;
  emergency_readiness_home: number;
};

export type SafetySummary = {
  total: number;
  average: number;
  max: 20;
  emergencyReadinessScore: number;
};

export const toSafetyScore = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(5, Math.round(value)));
};

const averageSafetyScore = (values: unknown[]): number => {
  if (values.length === 0) return 0;

  const total = values.reduce<number>((sum, value) => sum + toSafetyScore(value), 0);
  return toSafetyScore(total / values.length);
};

export const getSafetyCategoryScores = (data: FormData): SafetyCategoryScores => ({
  home_entrance: averageSafetyScore([
    data.safety_gate_entry,
    data.safety_side_back_entry,
    data.safety_windows_terrace,
  ]),
  neighborhood_safety_check: toSafetyScore(data.safety_driveway_garage),
  indoor_outdoor_blindspots: averageSafetyScore([
    data.safety_blindspots,
    data.safety_indoor_choke_points,
  ]),
  emergency_readiness_home: toSafetyScore(data.safety_emergency_readiness),
});

export const getSafetySummary = (data: FormData): SafetySummary => {
  const categoryScores = getSafetyCategoryScores(data);
  const total = Object.values(categoryScores).reduce<number>(
    (sum, value) => sum + value,
    0
  );

  return {
    total,
    average: total / 4,
    max: 20,
    emergencyReadinessScore: categoryScores.emergency_readiness_home,
  };
};
