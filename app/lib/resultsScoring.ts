import type { SafetyCategoryScores } from "./safetyScores";
import type { LeadTier, ResultsSummary } from "./types";

/**
 * Results scoring legend:
 * - Stored safety scale (database/form state): 0..5 where higher = more risk.
 * - Visible safety slider scale (Wizard UI): 0..5 where higher = safer.
 * - Conversion between scales: visible = 5 - storedRisk.
 * - Safety level + emergency readiness use stored risk to classify severity.
 * - Panatag rating converts to visible scale, applies readiness bonus, then normalizes to /10.
 */

type SafetyLevelSummary = ResultsSummary["safetyLevel"];
type PriorityActionSummary = ResultsSummary["priority"];
type EmergencyReadinessSummary = ResultsSummary["emergency"];

type SafetyLevelThreshold = {
  maxRiskScore: number;
  output: SafetyLevelSummary;
  legend: string;
};

// Total risk score -> Safety Score card label/severity.
const SAFETY_LEVEL_THRESHOLDS: readonly SafetyLevelThreshold[] = [
  {
    maxRiskScore: 6,
    output: { label: "Protected", range: "0-6 Low", severity: "low" },
    legend: "totalRiskScore 0..6 => Protected",
  },
  {
    maxRiskScore: 11,
    output: { label: "Alert", range: "7-11 Medium", severity: "medium" },
    legend: "totalRiskScore 7..11 => Alert",
  },
  {
    maxRiskScore: Number.POSITIVE_INFINITY,
    output: { label: "Urgent Action", range: "12-20 High", severity: "high" },
    legend: "totalRiskScore 12..20 => Urgent Action",
  },
] as const;

// Lead tier -> Priority Action card label/severity.
const PRIORITY_ACTION_BY_LEAD_TIER: Record<LeadTier, PriorityActionSummary> = {
  Hot: { label: "Emergency Secure", severity: "high" },
  Warm: { label: "Book & Secure", severity: "medium" },
  Nurture: { label: "Plan & Assess", severity: "low" },
};

// Emergency risk score -> Emergency Readiness card label/severity.
const EMERGENCY_READINESS_THRESHOLDS = {
  GOOD_MAX_RISK: 0,
  NOT_THERE_MAX_RISK: 3,
} as const;

const PANATAG_SCALE = {
  MIN_RATING: 1,
  MAX_RATING: 10,
  MAX_VISIBLE_SCORE: 5,
  MAX_RAW_SCORE: 8,
} as const;

type EmergencyBonusRule = {
  minVisibleScore: number;
  bonus: number;
  legend: string;
};

// Emergency readiness visible score -> Panatag additive bonus.
const EMERGENCY_BONUS_RULES: readonly EmergencyBonusRule[] = [
  { minVisibleScore: 5, bonus: 3, legend: "emergency visible 5 => +3" },
  { minVisibleScore: 3, bonus: 2, legend: "emergency visible 3..4 => +2" },
  { minVisibleScore: 1, bonus: 1, legend: "emergency visible 1..2 => +1" },
  { minVisibleScore: 0, bonus: 0, legend: "emergency visible 0 => +0" },
] as const;

type PanatagVisibleScores = {
  home_entrance: number;
  neighborhood_safety_check: number;
  indoor_outdoor_blindspots: number;
  emergency_readiness_home: number;
};

type PanatagComputation = {
  storedRiskScores: SafetyCategoryScores;
  visibleScores: PanatagVisibleScores;
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

const toVisibleSafetyScore = (storedRiskScore: number): number =>
  clampNumber(PANATAG_SCALE.MAX_VISIBLE_SCORE - storedRiskScore, 0, PANATAG_SCALE.MAX_VISIBLE_SCORE);

const getEmergencyBonusFromVisibleScore = (
  visibleScore: number
): { bonus: number; legend: string } => {
  for (const rule of EMERGENCY_BONUS_RULES) {
    if (visibleScore >= rule.minVisibleScore) {
      return { bonus: rule.bonus, legend: rule.legend };
    }
  }

  return { bonus: 0, legend: "emergency visible fallback => +0" };
};

const computePanatagComputation = (
  categoryRiskScores: SafetyCategoryScores
): PanatagComputation => {
  const visibleScores: PanatagVisibleScores = {
    home_entrance: toVisibleSafetyScore(categoryRiskScores.home_entrance),
    neighborhood_safety_check: toVisibleSafetyScore(
      categoryRiskScores.neighborhood_safety_check
    ),
    indoor_outdoor_blindspots: toVisibleSafetyScore(
      categoryRiskScores.indoor_outdoor_blindspots
    ),
    emergency_readiness_home: toVisibleSafetyScore(
      categoryRiskScores.emergency_readiness_home
    ),
  };

  const baseAverage =
    (visibleScores.home_entrance +
      visibleScores.indoor_outdoor_blindspots +
      visibleScores.neighborhood_safety_check) /
    3;

  const { bonus: emergencyBonus, legend: emergencyBonusLegend } =
    getEmergencyBonusFromVisibleScore(visibleScores.emergency_readiness_home);

  const rawScore = baseAverage + emergencyBonus;
  const normalizedScore =
    PANATAG_SCALE.MIN_RATING +
    (rawScore / PANATAG_SCALE.MAX_RAW_SCORE) *
      (PANATAG_SCALE.MAX_RATING - PANATAG_SCALE.MIN_RATING);
  const outputRating = Math.round(
    clampNumber(normalizedScore, PANATAG_SCALE.MIN_RATING, PANATAG_SCALE.MAX_RATING)
  );

  return {
    storedRiskScores: categoryRiskScores,
    visibleScores,
    baseAverage,
    emergencyBonus,
    emergencyBonusLegend,
    rawScore,
    normalizedScore,
    outputRating,
  };
};

const getSafetyLevelThresholdLegend = (totalRiskScore: number): string =>
  totalRiskScore <= SAFETY_LEVEL_THRESHOLDS[0].maxRiskScore
    ? SAFETY_LEVEL_THRESHOLDS[0].legend
    : totalRiskScore <= SAFETY_LEVEL_THRESHOLDS[1].maxRiskScore
      ? SAFETY_LEVEL_THRESHOLDS[1].legend
      : SAFETY_LEVEL_THRESHOLDS[2].legend;

const getEmergencyReadinessLegend = (emergencyRiskScore: number): string =>
  emergencyRiskScore <= EMERGENCY_READINESS_THRESHOLDS.GOOD_MAX_RISK
    ? `emergencyRiskScore 0 => Good`
    : emergencyRiskScore <= EMERGENCY_READINESS_THRESHOLDS.NOT_THERE_MAX_RISK
      ? `emergencyRiskScore 1..3 => Not There`
      : `emergencyRiskScore 4..5 => Worse`;

export const getSafetyLevelFromTotalRiskScore = (
  totalRiskScore: number
): SafetyLevelSummary => {
  for (const threshold of SAFETY_LEVEL_THRESHOLDS) {
    if (totalRiskScore <= threshold.maxRiskScore) {
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
  if (emergencyRiskScore <= EMERGENCY_READINESS_THRESHOLDS.GOOD_MAX_RISK) {
    return { label: "Good", severity: "low" };
  }

  if (emergencyRiskScore <= EMERGENCY_READINESS_THRESHOLDS.NOT_THERE_MAX_RISK) {
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
        "((home_entrance + indoor_outdoor_blindspots + neighborhood_safety_check) / 3) + emergency_bonus; then normalize to /10",
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
