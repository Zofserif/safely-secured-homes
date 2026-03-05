import type { SafetyCategoryScores } from "./safetyScores";
import type { LeadTier, ResultsSummary } from "./types";
import {
  SAFETY_SCORE_MAX,
  SAFETY_SCORE_MIN,
  SAFETY_TOTAL_MAX_SCORE,
} from "./safetyScale.js";

/**
 * Results scoring legend:
 * - Stored safety scale (database/form state): 0..100 where higher = safer.
 * - Safety level + emergency readiness classify severity from safety scores.
 * - Panatag rating uses category safety scores plus emergency bonus, then normalizes to /100.
 */

type SafetyLevelSummary = ResultsSummary["safetyLevel"];
type PriorityActionSummary = ResultsSummary["priority"];
type EmergencyReadinessSummary = ResultsSummary["emergency"];

type SafetyLevelThreshold = {
  minSafetyScore: number;
  output: SafetyLevelSummary;
  legend: string;
};

// Total safety score -> Safety Score card label/severity.
const SAFETY_LEVEL_THRESHOLDS: readonly SafetyLevelThreshold[] = [
  {
    minSafetyScore: 70,
    output: { label: "Protected", range: "70-100", severity: "low" },
    legend: "totalSafetyScore 70..100 => Protected",
  },
  {
    minSafetyScore: 45,
    output: { label: "Alert", range: "45-69", severity: "medium" },
    legend: "totalSafetyScore 45..69 => Alert",
  },
  {
    minSafetyScore: 0,
    output: { label: "Urgent Action", range: "0-44", severity: "high" },
    legend: "totalSafetyScore 0..44 => Urgent Action",
  },
] as const;

// Lead tier -> Priority Action card label/severity.
const PRIORITY_ACTION_BY_LEAD_TIER: Record<LeadTier, PriorityActionSummary> = {
  Hot: { label: "Emergency Secure", severity: "high" },
  Warm: { label: "Book & Secure", severity: "medium" },
  Nurture: { label: "Plan & Assess", severity: "low" },
};

// Emergency safety score -> Emergency Readiness card label/severity.
const EMERGENCY_READINESS_THRESHOLDS = {
  GOOD_MIN_SAFETY: SAFETY_SCORE_MAX,
  NOT_THERE_MIN_SAFETY: 40,
} as const;

const PANATAG_SCALE = {
  MIN_RATING: 0,
  MAX_RATING: 100,
  MAX_RAW_SCORE: 160,
} as const;

type EmergencyBonusRule = {
  minSafetyScore: number;
  bonus: number;
  legend: string;
};

// Emergency readiness safety score -> Panatag additive bonus.
const EMERGENCY_BONUS_RULES: readonly EmergencyBonusRule[] = [
  { minSafetyScore: 100, bonus: 60, legend: "emergency safety 100 => +60" },
  { minSafetyScore: 60, bonus: 40, legend: "emergency safety 60..99 => +40" },
  { minSafetyScore: 20, bonus: 20, legend: "emergency safety 20..59 => +20" },
  { minSafetyScore: 0, bonus: 0, legend: "emergency safety 0..19 => +0" },
] as const;

type PanatagComputation = {
  safetyScores: SafetyCategoryScores;
  baseAverage: number;
  emergencyBonus: number;
  emergencyBonusLegend: string;
  rawScore: number;
  normalizedScore: number;
  outputRating: number;
};

export type BuildResultsScoringBreakdownArgs = {
  totalRiskScore: number;
  leadTier: LeadTier;
  emergencyRiskScore: number;
  categoryRiskScores: SafetyCategoryScores;
};

export type ResultsScoringBreakdown = {
  inputs: BuildResultsScoringBreakdownArgs;
  legends: {
    safetyLevel: string;
    priorityAction: string;
    emergencyReadiness: string;
    panatagFormula: string;
    panatagEmergencyBonus: string;
  };
  outputs: {
    safetyLevel: SafetyLevelSummary;
    priority: PriorityActionSummary;
    emergency: EmergencyReadinessSummary;
    panatagRating: number;
  };
  panatag: PanatagComputation;
};

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const getEmergencyBonusFromSafetyScore = (
  safetyScore: number
): { bonus: number; legend: string } => {
  for (const rule of EMERGENCY_BONUS_RULES) {
    if (safetyScore >= rule.minSafetyScore) {
      return { bonus: rule.bonus, legend: rule.legend };
    }
  }

  return { bonus: 0, legend: "emergency safety fallback => +0" };
};

const computePanatagComputation = (
  categoryRiskScores: SafetyCategoryScores
): PanatagComputation => {
  const safetyScores: SafetyCategoryScores = {
    home_entrance: clampNumber(
      categoryRiskScores.home_entrance,
      SAFETY_SCORE_MIN,
      SAFETY_SCORE_MAX
    ),
    neighborhood_safety_check: clampNumber(
      categoryRiskScores.neighborhood_safety_check,
      SAFETY_SCORE_MIN,
      SAFETY_SCORE_MAX
    ),
    windows_terrace: clampNumber(
      categoryRiskScores.windows_terrace,
      SAFETY_SCORE_MIN,
      SAFETY_SCORE_MAX
    ),
    emergency_readiness_home: clampNumber(
      categoryRiskScores.emergency_readiness_home,
      SAFETY_SCORE_MIN,
      SAFETY_SCORE_MAX
    ),
  };

  const baseAverage =
    (safetyScores.home_entrance +
      safetyScores.windows_terrace +
      safetyScores.neighborhood_safety_check) /
    3;

  const { bonus: emergencyBonus, legend: emergencyBonusLegend } =
    getEmergencyBonusFromSafetyScore(safetyScores.emergency_readiness_home);

  const rawScore = baseAverage + emergencyBonus;
  const normalizedScore = (rawScore / PANATAG_SCALE.MAX_RAW_SCORE) * PANATAG_SCALE.MAX_RATING;
  const outputRating = Math.round(
    clampNumber(normalizedScore, PANATAG_SCALE.MIN_RATING, PANATAG_SCALE.MAX_RATING)
  );

  return {
    safetyScores,
    baseAverage,
    emergencyBonus,
    emergencyBonusLegend,
    rawScore,
    normalizedScore,
    outputRating,
  };
};

const getSafetyLevelThresholdLegend = (totalRiskScore: number): string => {
  const totalSafetyScore = clampNumber(
    totalRiskScore,
    SAFETY_SCORE_MIN,
    SAFETY_TOTAL_MAX_SCORE
  );

  for (const threshold of SAFETY_LEVEL_THRESHOLDS) {
    if (totalSafetyScore >= threshold.minSafetyScore) {
      return threshold.legend;
    }
  }

  return SAFETY_LEVEL_THRESHOLDS[SAFETY_LEVEL_THRESHOLDS.length - 1].legend;
};

const getEmergencyReadinessLegend = (emergencyRiskScore: number): string => {
  const emergencySafetyScore = clampNumber(
    emergencyRiskScore,
    SAFETY_SCORE_MIN,
    SAFETY_SCORE_MAX
  );

  if (emergencySafetyScore >= EMERGENCY_READINESS_THRESHOLDS.GOOD_MIN_SAFETY) {
    return "emergencySafetyScore 100 => Good";
  }

  if (
    emergencySafetyScore >=
    EMERGENCY_READINESS_THRESHOLDS.NOT_THERE_MIN_SAFETY
  ) {
    return "emergencySafetyScore 40..99 => Not There";
  }

  return "emergencySafetyScore 0..39 => Worse";
};

export const getSafetyLevelFromTotalRiskScore = (
  totalRiskScore: number
): SafetyLevelSummary => {
  const totalSafetyScore = clampNumber(
    totalRiskScore,
    SAFETY_SCORE_MIN,
    SAFETY_TOTAL_MAX_SCORE
  );

  for (const threshold of SAFETY_LEVEL_THRESHOLDS) {
    if (totalSafetyScore >= threshold.minSafetyScore) {
      return threshold.output;
    }
  }

  return SAFETY_LEVEL_THRESHOLDS[SAFETY_LEVEL_THRESHOLDS.length - 1].output;
};

export const getPriorityActionFromLeadTier = (
  leadTier: LeadTier
): PriorityActionSummary => PRIORITY_ACTION_BY_LEAD_TIER[leadTier];

export const getEmergencyReadinessFromRiskScore = (
  emergencyRiskScore: number
): EmergencyReadinessSummary => {
  const emergencySafetyScore = clampNumber(
    emergencyRiskScore,
    SAFETY_SCORE_MIN,
    SAFETY_SCORE_MAX
  );

  if (emergencySafetyScore >= EMERGENCY_READINESS_THRESHOLDS.GOOD_MIN_SAFETY) {
    return { label: "Good", severity: "low" };
  }

  if (
    emergencySafetyScore >=
    EMERGENCY_READINESS_THRESHOLDS.NOT_THERE_MIN_SAFETY
  ) {
    return { label: "Not There", severity: "medium" };
  }

  return { label: "Worse", severity: "high" };
};

export const getPanatagRatingFromSafetyCategories = (
  categoryRiskScores: SafetyCategoryScores
): number => computePanatagComputation(categoryRiskScores).outputRating;

export const buildResultsScoringBreakdown = (
  args: BuildResultsScoringBreakdownArgs
): ResultsScoringBreakdown => {
  const safetyLevel = getSafetyLevelFromTotalRiskScore(args.totalRiskScore);
  const priority = getPriorityActionFromLeadTier(args.leadTier);
  const emergency = getEmergencyReadinessFromRiskScore(args.emergencyRiskScore);
  const panatag = computePanatagComputation(args.categoryRiskScores);

  return {
    inputs: args,
    legends: {
      safetyLevel: getSafetyLevelThresholdLegend(args.totalRiskScore),
      priorityAction: `leadTier ${args.leadTier} => ${priority.label}`,
      emergencyReadiness: getEmergencyReadinessLegend(args.emergencyRiskScore),
      panatagFormula:
        "((home_entrance + windows_terrace + neighborhood_safety_check) / 3) + emergency_bonus; then normalize to /100",
      panatagEmergencyBonus: panatag.emergencyBonusLegend,
    },
    outputs: {
      safetyLevel,
      priority,
      emergency,
      panatagRating: panatag.outputRating,
    },
    panatag,
  };
};
