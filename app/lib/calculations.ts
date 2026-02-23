import type {
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
import {
  getSafetyCategoryScores,
  getSafetySummary,
} from "./safetyScores";
import {
  getEmergencyReadinessFromRiskScore,
  getPanatagRatingFromSafetyCategories,
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
  const safetyCategoryScores = getSafetyCategoryScores(data);
  const safetyTotal = safety.total;
  const safetyMax = safety.max;
  const emergencyReadinessScore = safety.emergencyReadinessScore;

  const safetyLevel = getSafetyLevelFromTotalRiskScore(safetyTotal);
  const priority = getPriorityActionFromLeadTier(result.leadTier);
  const emergency = getEmergencyReadinessFromRiskScore(emergencyReadinessScore);
  const panatagRating = getPanatagRatingFromSafetyCategories(safetyCategoryScores);

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
