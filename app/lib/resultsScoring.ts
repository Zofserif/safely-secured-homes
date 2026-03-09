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
 * - Lead score (0..100) represents need/risk and is inverted for Panatag quality.
 * - Panatag rating uses weighted lead/safety/emergency scores on a 0..100 scale.
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
    output: { label: "Almost", range: "70-100", severity: "low" },
    legend: "totalSafetyScore 70..100 => Almost",
  },
  {
    minSafetyScore: 45,
    output: { label: "Improve", range: "45-69", severity: "medium" },
    legend: "totalSafetyScore 45..69 => Improve",
  },
  {
    minSafetyScore: 0,
    output: { label: "Urgent", range: "0-44", severity: "high" },
    legend: "totalSafetyScore 0..44 => Urgent",
  },
] as const;

// Lead tier -> Priority Action card label/severity.
const PRIORITY_ACTION_BY_LEAD_TIER: Record<LeadTier, PriorityActionSummary> = {
  Hot: { label: "Urgent", severity: "high" },
  Warm: { label: "Improve", severity: "medium" },
  Nurture: { label: "Almost", severity: "low" },
};

// Emergency safety score -> Emergency Readiness card label/severity.
const EMERGENCY_READINESS_THRESHOLDS = {
  GOOD_MIN_SAFETY: SAFETY_SCORE_MAX,
  NOT_THERE_MIN_SAFETY: 40,
} as const;

const PANATAG_WEIGHT_LEAD = 0.1;
const PANATAG_WEIGHT_SAFETY = 0.6;
const PANATAG_WEIGHT_EMERGENCY = 0.3;

export type PanatagScoreInputs = {
  leadScore: number;
  safetyTotal: number;
  emergencyReadinessScore: number;
};

type PanatagComputation = {
  leadScore: number;
  safetyTotal: number;
  emergencyReadinessScore: number;
  leadContribution: number;
  safetyContribution: number;
  emergencyContribution: number;
  weightedScore: number;
  outputRating: number;
};

export type BuildResultsScoringBreakdownArgs = {
  totalRiskScore: number;
  leadTier: LeadTier;
  emergencyRiskScore: number;
  panatagScoreInputs: PanatagScoreInputs;
};

export type ResultsScoringBreakdown = {
  inputs: BuildResultsScoringBreakdownArgs;
  legends: {
    safetyLevel: string;
    priorityAction: string;
    emergencyReadiness: string;
    panatagFormula: string;
    panatagWeights: string;
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

const toPanatagScoreInput = (value: number): number => {
  if (!Number.isFinite(value)) return SAFETY_SCORE_MIN;
  return clampNumber(value, SAFETY_SCORE_MIN, SAFETY_SCORE_MAX);
};

const toInvertedPanatagLeadScore = (value: number): number => {
  if (!Number.isFinite(value)) return SAFETY_SCORE_MIN;
  const normalizedLead = clampNumber(value, SAFETY_SCORE_MIN, SAFETY_SCORE_MAX);
  return SAFETY_SCORE_MAX - normalizedLead;
};

const computePanatagComputation = (
  inputs: PanatagScoreInputs
): PanatagComputation => {
  // Higher lead score means higher need/risk, so invert it for quality rating.
  const leadScore = toInvertedPanatagLeadScore(inputs.leadScore);
  const safetyTotal = toPanatagScoreInput(inputs.safetyTotal);
  const emergencyReadinessScore = toPanatagScoreInput(
    inputs.emergencyReadinessScore
  );
  const leadContribution = leadScore * PANATAG_WEIGHT_LEAD;
  const safetyContribution = safetyTotal * PANATAG_WEIGHT_SAFETY;
  const emergencyContribution =
    emergencyReadinessScore * PANATAG_WEIGHT_EMERGENCY;
  const weightedScore =
    leadContribution + safetyContribution + emergencyContribution;
  const outputRating = Math.round(
    clampNumber(weightedScore, SAFETY_SCORE_MIN, SAFETY_SCORE_MAX)
  );

  return {
    leadScore,
    safetyTotal,
    emergencyReadinessScore,
    leadContribution,
    safetyContribution,
    emergencyContribution,
    weightedScore,
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
    return "emergencySafetyScore 100 => Almost";
  }

  if (
    emergencySafetyScore >=
    EMERGENCY_READINESS_THRESHOLDS.NOT_THERE_MIN_SAFETY
  ) {
    return "emergencySafetyScore 40..99 => Improve";
  }

  return "emergencySafetyScore 0..39 => Urgent";
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
    return { label: "Almost", severity: "low" };
  }

  if (
    emergencySafetyScore >=
    EMERGENCY_READINESS_THRESHOLDS.NOT_THERE_MIN_SAFETY
  ) {
    return { label: "Improve", severity: "medium" };
  }

  return { label: "Urgent", severity: "high" };
};

export const getPanatagRatingFromScores = (
  inputs: PanatagScoreInputs
): number => computePanatagComputation(inputs).outputRating;

export const buildResultsScoringBreakdown = (
  args: BuildResultsScoringBreakdownArgs
): ResultsScoringBreakdown => {
  const safetyLevel = getSafetyLevelFromTotalRiskScore(args.totalRiskScore);
  const priority = getPriorityActionFromLeadTier(args.leadTier);
  const emergency = getEmergencyReadinessFromRiskScore(args.emergencyRiskScore);
  const panatag = computePanatagComputation(args.panatagScoreInputs);

  return {
    inputs: args,
    legends: {
      safetyLevel: getSafetyLevelThresholdLegend(args.totalRiskScore),
      priorityAction: `leadTier ${args.leadTier} => ${priority.label}`,
      emergencyReadiness: getEmergencyReadinessLegend(args.emergencyRiskScore),
      panatagFormula:
        "round(((isFinite(leadScore) ? (100 - clamp(leadScore, 0, 100)) : 0) * 0.10) + (safetyTotal * 0.60) + (emergencyReadinessScore * 0.30))",
      panatagWeights: "lead 10% + safety 60% + emergency 30%",
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
