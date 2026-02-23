import { FormData, LeadTier, CalculationResult, ResultsSummary } from "./types";
import {
  BUDGET_BANDS,
  CURRENT_SETUP_OPTIONS,
  FEATURES,
  HOME_SIZE_OPTIONS,
  PERIMETER_PRIORITY_AREAS,
  PRIORITY_AREA_KEYS,
  SMART_HOME_FEATURES,
  TIMELINE_VALUES,
} from "./formOptions";

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

const calculateSafetyTotal = (data: FormData) => {
  const safetyScores = [
    data.safety_gate_entry,
    data.safety_blindspots,
    data.safety_side_back_entry,
    data.safety_windows_terrace,
    data.safety_driveway_garage,
    data.safety_indoor_choke_points,
    data.safety_emergency_readiness,
  ];
  return safetyScores.reduce((sum: number, value) => sum + (typeof value === "number" ? value : 0), 0);
};

export const getResultsSummary = (data: FormData, result: CalculationResult): ResultsSummary => {
  const safetyTotal = calculateSafetyTotal(data);
  const safetyMax = 35;
  const emergencyReadinessScore = typeof data.safety_emergency_readiness === "number" ? data.safety_emergency_readiness : 0;

  const safetyLevel = safetyTotal <= 10
    ? { label: "Protected", range: "0-10 Low", severity: "low" as const }
    : safetyTotal <= 20
      ? { label: "Alert", range: "11-20 Medium", severity: "medium" as const }
      : { label: "Urgent Action", range: "21-35 High", severity: "high" as const };

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
  const rangeScore = Math.min(44, Math.max(0, safetyRiskScore + priorityRisk));
  let panatagRating = 10;
  if (rangeScore >= 39) panatagRating = 1;
  else if (rangeScore >= 34) panatagRating = 2;
  else if (rangeScore >= 29) panatagRating = 3;
  else if (rangeScore >= 24) panatagRating = 4;
  else if (rangeScore >= 19) panatagRating = 5;
  else if (rangeScore >= 14) panatagRating = 6;
  else if (rangeScore >= 9) panatagRating = 7;
  else if (rangeScore >= 6) panatagRating = 8;
  else if (rangeScore >= 3) panatagRating = 9;

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
  const features = data.features_must ?? [];
  const smartHomeFeatures = data.smart_home_features ?? [];
  const currentSetup = data.current_setup ?? "";
  const budgetBand = data.budget_band ?? "";
  const timeline = data.timeline ?? "";
  const smartHomeWeights: Partial<Record<string, number>> = {
    [SMART_HOME_FEATURES.EMERGENCY_DECTION_SYSTEM]: 2,
    [SMART_HOME_FEATURES.SMART_VIDEO_DOORBELL]: 2,
    [SMART_HOME_FEATURES.AUTOMATIC_ENTRY_EXIT_GATE_OPENERS]: 2,
    [SMART_HOME_FEATURES.AUTOMATED_LIGHTING_SYSTEM]: 1,
    [SMART_HOME_FEATURES.SMART_ELECTRONIC_SWITCH_SYSTEM]: 1,
    [SMART_HOME_FEATURES.SMART_ENTERTAINMENT_SYSTEM]: 1,
  };

  const computedCameraTotal = areas.reduce(
    (sum, area) =>
      sum + getPriorityAreaCameraContribution(area, propertyType, floors, size),
    0
  );
  const cameraCount = Math.max(2, computedCameraTotal);
  const nvrChannel = getNvrChannelTier(cameraCount);

  // Scoring Logic
  let score = 0;
  if (
    areas.length >= 3 ||
    areas.some((area) =>
      PERIMETER_PRIORITY_AREAS.includes(
        area as (typeof PERIMETER_PRIORITY_AREAS)[number]
      )
    )
  ) {
    score += 2;
  }
  if (features.some((f) => f === FEATURES.COLOR_NIGHT || f === FEATURES.HUMAN_VEHICLE_ALERT)) score += 1;
  
  // Updated logic for new fields
  if (currentSetup === CURRENT_SETUP_OPTIONS.NEW_INSTALL || currentSetup === CURRENT_SETUP_OPTIONS.BROKEN_OLD) score += 1;
  if (budgetBand === BUDGET_BANDS.PREMIUM || budgetBand === BUDGET_BANDS.FEATURE_RICH) score += 2;
  if (timeline === TIMELINE_VALUES.ASAP) score += 3;
  const smartHomeBonus = smartHomeFeatures.reduce(
    (sum, feature) => sum + (smartHomeWeights[feature] ?? 0),
    0
  );
  score += Math.min(6, smartHomeBonus);
  const safetyScores = [
    data.safety_gate_entry,
    data.safety_blindspots,
    data.safety_side_back_entry,
    data.safety_windows_terrace,
    data.safety_driveway_garage,
    data.safety_indoor_choke_points,
    data.safety_emergency_readiness,
  ].filter((value): value is number => typeof value === "number");
  const safetyAverage = safetyScores.length
    ? safetyScores.reduce((sum, value) => sum + value, 0) / safetyScores.length
    : 0;
  if (safetyAverage >= 3) score += 1;

  let tier: LeadTier = "Nurture";
  if (score >= 7) tier = "Hot";
  else if (score >= 4) tier = "Warm";

  // Recommendations
  const recs: string[] = [];
  if (areas.includes(PRIORITY_AREA_KEYS.OUTDOOR_PERIMETER_STREET_VIEW)) {
    recs.push("Varifocal cameras for plate recognition");
  }
  if (features.includes(FEATURES.HUMAN_VEHICLE_ALERT)) recs.push("Smart filtering for human/vehicle alerts");
  if (data.smart_home_interest) {
    recs.push("Start your Smart Home Starter journey with Smart light and Home Assistant (like Alexa or Google Home) integration for easy control and automation.");
  }
  
  return {
    cameraCount,
    nvrChannel,
    storage1TB: true, // simplified
    leadScore: score,
    leadTier: tier,
    recommendations: recs
  };
};
