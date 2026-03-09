import type {
  FormData,
  CalculationResult,
  ResultsSummary,
} from "./types";
import { calculateLeadScore, getLeadTierFromScore } from "./leadScoring.js";
import { getSafetySummary } from "./safetyScores.js";
import {
  DESIRED_OUTCOME_OPTIONS,
  GOAL_OBSTACLE_OPTIONS,
  HOUSEHOLD_STAGE_OPTIONS,
  PROPERTY_TYPES,
  SOLUTION_OPTIONS,
} from "./formOptions.js";
import {
  getEmergencyReadinessFromRiskScore,
  getPanatagRatingFromScores,
  getPriorityActionFromLeadTier,
  getSafetyLevelFromTotalRiskScore,
} from "./resultsScoring.js";

const getNvrChannelTier = (cameraCount: number): number => {
  let tier = 4;

  while (tier < cameraCount) {
    tier *= 2;
  }

  return tier;
};

const isNumeric = (value: number | null): value is number =>
  typeof value === "number" && Number.isFinite(value);

const clampSafetySliderScore = (value: number): number =>
  Math.min(100, Math.max(0, Math.round(value)));

const getHomeEntrancePoints = (value: number | null): number => {
  if (value === null) return 0;
  if (value <= 10) return 2;
  if (value <= 60) return 1;
  return 0;
};

const getNeighborhoodPoints = (value: number | null): number => {
  if (value === null) return 0;
  if (value <= 10) return 1;
  return 0;
};

const getWindowsTerracePoints = (value: number | null): number => {
  if (value === null) return 0;
  if (value <= 10) return 1;
  return 0;
};

const getBooleanPoints = (
  value: boolean | null,
  points: Readonly<{ yes: number; no: number }>
): number => {
  if (value === true) return points.yes;
  if (value === false) return points.no;
  return 0;
};

const getMappedPoints = (
  pointsMap: Readonly<Record<string, number>>,
  value: string
): number => {
  const normalizedValue = value.trim();
  if (!normalizedValue) return 0;
  return pointsMap[normalizedValue] ?? 0;
};

const PROPERTY_TYPE_POINTS: Readonly<Record<string, number>> = {
  [PROPERTY_TYPES[0].value]: 2,
  [PROPERTY_TYPES[1].value]: 1,
  [PROPERTY_TYPES[2].value]: 2,
  [PROPERTY_TYPES[3].value]: 3,
};

const HOUSEHOLD_STAGE_POINTS: Readonly<Record<string, number>> = {
  [HOUSEHOLD_STAGE_OPTIONS[0]]: -2,
  [HOUSEHOLD_STAGE_OPTIONS[1]]: 0,
  [HOUSEHOLD_STAGE_OPTIONS[2]]: 1,
  [HOUSEHOLD_STAGE_OPTIONS[3]]: 1,
  [HOUSEHOLD_STAGE_OPTIONS[4]]: 1,
};

const DESIRED_OUTCOME_POINTS: Readonly<Record<string, number>> = {
  [DESIRED_OUTCOME_OPTIONS[0]]: 1,
  [DESIRED_OUTCOME_OPTIONS[1]]: 1,
  [DESIRED_OUTCOME_OPTIONS[2]]: 1,
  [DESIRED_OUTCOME_OPTIONS[3]]: 2,
  [DESIRED_OUTCOME_OPTIONS[4]]: 1,
  [DESIRED_OUTCOME_OPTIONS[5]]: 2,
};

const GOAL_OBSTACLE_POINTS: Readonly<Record<string, number>> = {
  [GOAL_OBSTACLE_OPTIONS[0]]: 1,
  [GOAL_OBSTACLE_OPTIONS[1]]: 0,
  [GOAL_OBSTACLE_OPTIONS[2]]: 0,
  [GOAL_OBSTACLE_OPTIONS[3]]: 1,
};

const SOLUTION_POINTS: Readonly<Record<string, number>> = {
  [SOLUTION_OPTIONS.DIY_HOME_SAFETY_PLAN]: 0,
  [SOLUTION_OPTIONS.ONE_ON_ONE_HOME_SECURITY_CONSULTATION]: 1,
  [SOLUTION_OPTIONS.DONE_FOR_YOU_SETUP]: 1,
};

const getRuleBasedCameraCount = (data: FormData): number => {
  let totalPoints = 0;

  totalPoints += getMappedPoints(PROPERTY_TYPE_POINTS, data.property_type);

  totalPoints += getBooleanPoints(data.locks_windows_gate_at_night, {
    yes: 0,
    no: 1,
  });
  totalPoints += getBooleanPoints(data.has_security_cameras, {
    yes: -1,
    no: 1,
  });

  const homeEntranceScore = isNumeric(data.home_entrance)
    ? clampSafetySliderScore(data.home_entrance)
    : null;
  totalPoints += getHomeEntrancePoints(homeEntranceScore);

  const neighborhoodScore = isNumeric(data.neighborhood_safety_check)
    ? clampSafetySliderScore(data.neighborhood_safety_check)
    : null;
  totalPoints += getNeighborhoodPoints(neighborhoodScore);

  const windowsTerraceScore = isNumeric(data.windows_terrace)
    ? clampSafetySliderScore(data.windows_terrace)
    : null;
  totalPoints += getWindowsTerracePoints(windowsTerraceScore);

  totalPoints += getMappedPoints(HOUSEHOLD_STAGE_POINTS, data.household_stage);
  totalPoints += getMappedPoints(DESIRED_OUTCOME_POINTS, data.desired_outcome);
  totalPoints += getMappedPoints(GOAL_OBSTACLE_POINTS, data.goal_obstacle);
  totalPoints += getMappedPoints(SOLUTION_POINTS, data.solution);

  return Math.max(1, totalPoints);
};

export const getResultsSummary = (data: FormData, result: CalculationResult): ResultsSummary => {
  // Safety totals are now safety-oriented (higher score = safer).
  const safety = getSafetySummary(data);
  const safetyTotal = safety.total;
  const safetyMax = safety.max;
  const emergencyReadinessScore = safety.emergencyReadinessScore;

  const safetyLevel = getSafetyLevelFromTotalRiskScore(safetyTotal);
  const priority = getPriorityActionFromLeadTier(result.leadTier);
  const emergency = getEmergencyReadinessFromRiskScore(emergencyReadinessScore);
  const panatagRating = getPanatagRatingFromScores({
    leadScore: result.leadScore,
    safetyTotal,
    emergencyReadinessScore,
  });

  return {
    safetyTotal,
    safetyMax,
    safetyLevel,
    priority,
    emergency,
    emergencyReadinessScore,
    panatagRating,
  };
};
export const estimateCameraPlan = (data: FormData): CalculationResult => {
  const cameraCount = getRuleBasedCameraCount(data);
  const nvrChannel = getNvrChannelTier(cameraCount);

  const { leadScore, leadScoreBreakdown, leadScoringModelVersion } =
    calculateLeadScore(data);
  const tier = getLeadTierFromScore(leadScore);

  return {
    cameraCount,
    nvrChannel,
    storage1TB: true, // simplified
    leadScore,
    leadTier: tier,
    leadScoringModelVersion,
    recommendations: [],
    leadScoreBreakdown,
  };
};
