import {
  FormData,
  CalculationResult,
  ResultsSummary,
} from "./types";
import {
  FEATURES,
  HOME_SIZE_OPTIONS,
  PRIORITY_AREA_KEYS,
} from "./formOptions";
import { calculateLeadScore, getLeadTierFromScore } from "./leadScoring";
import { getSafetySummary } from "./safetyScores";

const getNvrChannelTier = (cameraCount: number): number => {
  let tier = 4;

  while (tier < cameraCount) {
    tier *= 2;
  }

  return tier;
};

const getPriorityAreaCameraContribution = (
  area: string,
  propertyType: string,
  floors: string,
  size: string
): number => {
  const isCondoApartment = propertyType === "Condo / Apartment";
  const isFloorTwoOrThree = floors === "2" || floors === "3+";
  const isLargeHome = size === HOME_SIZE_OPTIONS.LARGE;
  const isExtraLargeHome = size === HOME_SIZE_OPTIONS.EXTRA_LARGE;

  switch (area) {
    case PRIORITY_AREA_KEYS.GENERAL_INDOOR_LIVING_AREAS: {
      let cameras = isCondoApartment ? 1 : 2;
      if (floors === "2" || size === HOME_SIZE_OPTIONS.MEDIUM) cameras += 1;
      if (floors === "3+") cameras += 2;
      if (isLargeHome) cameras += 2;
      if (isExtraLargeHome) cameras += 3;
      return cameras;
    }
    case PRIORITY_AREA_KEYS.CHILD_ELDERLY_PET:
      return 1;
    case PRIORITY_AREA_KEYS.ENTRANCES_CRITICAL_ZONES: {
      let cameras = 1;
      if (isFloorTwoOrThree || size === HOME_SIZE_OPTIONS.MEDIUM) cameras += 1;
      if (isLargeHome) cameras += 2;
      if (isExtraLargeHome) cameras += 3;
      return cameras;
    }
    case PRIORITY_AREA_KEYS.OUTDOOR_PERIMETER_STREET_VIEW: {
      let cameras = 1;
      if (isFloorTwoOrThree || size === HOME_SIZE_OPTIONS.MEDIUM) cameras += 1;
      if (isLargeHome) cameras += 2;
      if (isExtraLargeHome) cameras += 4;
      return cameras;
    }
    case PRIORITY_AREA_KEYS.NO_INTERNET_ELECTRICITY_REMOTE_PROPERTY:
      return 1;
    case PRIORITY_AREA_KEYS.FRONT_DOOR_VISITOR_CHECKING:
      return isLargeHome || isExtraLargeHome ? 2 : 1;
    default:
      return 0;
  }
};

export const getResultsSummary = (data: FormData, result: CalculationResult): ResultsSummary => {
  const safety = getSafetySummary(data);
  const safetyTotal = safety.total;
  const safetyMax = safety.max;
  const emergencyReadinessScore = safety.emergencyReadinessScore;

  const safetyLevel = safetyTotal <= 6
    ? { label: "Protected", range: "0-6 Low", severity: "low" as const }
    : safetyTotal <= 11
      ? { label: "Alert", range: "7-11 Medium", severity: "medium" as const }
      : { label: "Urgent Action", range: "12-20 High", severity: "high" as const };

  const priority = result.leadTier === "Hot"
    ? { label: "Emergency Secure", severity: "high" as const }
    : result.leadTier === "Warm"
      ? { label: "Book & Secure", severity: "medium" as const }
      : { label: "Plan & Assess", severity: "low" as const };

  const emergency = emergencyReadinessScore === 0
    ? { label: "Good", severity: "low" as const }
    : emergencyReadinessScore <= 3
      ? { label: "Not There", severity: "medium" as const }
      : { label: "Worse", severity: "high" as const };

  const safetyRiskScore = safetyTotal;
  const priorityRisk = Math.min(result.leadScore, 9);
  const rangeScore = Math.min(29, Math.max(0, safetyRiskScore + priorityRisk));
  let panatagRating = 10;
  if (rangeScore >= 26) panatagRating = 1;
  else if (rangeScore >= 22) panatagRating = 2;
  else if (rangeScore >= 19) panatagRating = 3;
  else if (rangeScore >= 16) panatagRating = 4;
  else if (rangeScore >= 13) panatagRating = 5;
  else if (rangeScore >= 9) panatagRating = 6;
  else if (rangeScore >= 6) panatagRating = 7;
  else if (rangeScore >= 4) panatagRating = 8;
  else if (rangeScore >= 2) panatagRating = 9;

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
  const areas = data.priority_areas ?? [];
  const propertyType = data.property_type ?? "";
  const floors = data.floors ?? "1";
  const size = data.home_size ?? HOME_SIZE_OPTIONS.SMALL;
  const featuresMust = data.features_must ?? [];
  const smartHomeFeatures = data.smart_home_features ?? [];
  const currentSetup = data.current_setup ?? "";
  const budgetBand = data.budget_band ?? "";
  const timeline = data.timeline ?? "";
  const safetyAverage = getSafetySummary(data).average;

  const computedCameraTotal = areas.reduce(
    (sum, area) =>
      sum + getPriorityAreaCameraContribution(area, propertyType, floors, size),
    0
  );
  const cameraCount = Math.max(2, computedCameraTotal);
  const nvrChannel = getNvrChannelTier(cameraCount);

  const { leadScore, leadScoreBreakdown, leadScoringModelVersion } =
    calculateLeadScore({
      priority_areas: areas,
      smart_home_features: smartHomeFeatures,
      current_setup: currentSetup,
      budget_band: budgetBand,
      timeline,
      safety_average: safetyAverage,
    });
  const tier = getLeadTierFromScore(leadScore);

  // Recommendations
  const recs: string[] = [];
  if (areas.includes(PRIORITY_AREA_KEYS.OUTDOOR_PERIMETER_STREET_VIEW)) {
    recs.push("Varifocal cameras for plate recognition");
  }
  if (featuresMust.includes(FEATURES.HUMAN_VEHICLE_ALERT)) recs.push("Smart filtering for human/vehicle alerts");
  if (data.smart_home_interest) {
    recs.push("Start your Smart Home Starter journey with Smart light and Home Assistant (like Alexa or Google Home) integration for easy control and automation.");
  }
  
  return {
    cameraCount,
    nvrChannel,
    storage1TB: true, // simplified
    leadScore,
    leadTier: tier,
    leadScoringModelVersion,
    recommendations: recs,
    leadScoreBreakdown,
  };
};
