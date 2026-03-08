import type {
  FormData,
  CalculationResult,
  ResultsSummary,
} from "./types";
import { calculateLeadScore, getLeadTierFromScore } from "./leadScoring";
import { getSafetySummary } from "./safetyScores";
import {
  getEmergencyReadinessFromRiskScore,
  getPanatagRatingFromScores,
  getPriorityActionFromLeadTier,
  getSafetyLevelFromTotalRiskScore,
} from "./resultsScoring";

const getNvrChannelTier = (cameraCount: number): number => {
  let tier = 4;

  while (tier < cameraCount) {
    tier *= 2;
  }

  return tier;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isNonEmpty = (value: string): boolean => value.trim().length > 0;
const isNumeric = (value: number | null): value is number =>
  typeof value === "number" && Number.isFinite(value);

const getCompletedStepCameraCount = (data: FormData): number => {
  let count = 0;

  if (isNonEmpty(data.first_name)) count += 1;
  if (isNonEmpty(data.property_type)) count += 1;

  const safetyHabits = [
    data.has_spare_key,
    data.changed_wifi_default_password,
    data.sleeps_with_earphones,
    data.locks_windows_gate_at_night,
    data.has_security_cameras,
    data.has_smoke_alarm_or_fire_extinguisher,
    data.has_first_aid_or_medicine_ready,
    data.knows_local_emergency_contacts,
  ];
  count += safetyHabits.filter((value) => value !== null).length;

  if (
    isNumeric(data.safety_gate_entry) &&
    isNumeric(data.safety_side_back_entry) &&
    isNumeric(data.safety_windows_terrace)
  ) {
    count += 1;
  }

  if (isNumeric(data.safety_driveway_garage)) count += 1;

  if (
    isNumeric(data.safety_blindspots) &&
    isNumeric(data.safety_indoor_choke_points)
  ) {
    count += 1;
  }

  if (isNumeric(data.safety_emergency_readiness)) count += 1;

  if (isNonEmpty(data.household_stage)) count += 1;
  if (isNonEmpty(data.desired_outcome)) count += 1;
  if (isNonEmpty(data.goal_obstacle)) count += 1;
  if (isNonEmpty(data.solution)) count += 1;

  if (data.has_additional_notes !== null) count += 1;

  if (EMAIL_REGEX.test(data.email.trim())) count += 1;

  return count;
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
  const cameraCount = getCompletedStepCameraCount(data);
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
