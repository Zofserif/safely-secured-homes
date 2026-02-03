import { FormData, LeadTier, CalculationResult, ResultsSummary } from "./types";

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

  const safetyRiskScore = Math.round((safetyTotal / safetyMax) * 10);
  const priorityRisk = result.leadTier === "Hot" ? 2 : result.leadTier === "Warm" ? 1 : 0;
  const panatagRating = Math.max(1, Math.min(10, 10 - (safetyRiskScore + priorityRisk)));

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
  const floors = data.floors ?? "1";
  const size = data.home_size ?? "Small";
  const features = data.features_must ?? [];
  const currentSetup = data.current_setup ?? "";
  const budgetBand = data.budget_band ?? "";
  const timeline = data.timeline ?? "";

  // Baseline from areas
  let cameraCount = areas.includes("Whole perimeter (360°)") ? 8 : Math.max(areas.length, 4);

  // Adjust for floors & lot size
  if (floors === "2") cameraCount += 1;
  if (floors === "3+") cameraCount += 2;
  if (size === "Large (251-450 sqm)" || size === "Extra Large (451+ sqm)") cameraCount += 1;

  // Clamp
  cameraCount = Math.min(Math.max(cameraCount, 2), 16);
  
  // NVR Channel Map
  const nvrChannel = cameraCount <= 4 ? 4 : cameraCount <= 8 ? 8 : 16;

  // Scoring Logic
  let score = 0;
  if (areas.length >= 3 || areas.includes("Whole perimeter (360°)")) score += 2;
  if (features.some((f) => f.includes("Color at night") || f.includes("Human/Vehicle Alerts"))) score += 1;
  
  // Updated logic for new fields
  if (currentSetup === "No, this is a new installation" || currentSetup.includes("broken/old")) score += 1;
  if (budgetBand.includes("All I can need") || budgetBand.includes("Feature Rich")) score += 2;
  if (timeline.includes("ASAP") || timeline.includes("This Week")) score += 3;
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

  let tier: LeadTier = 'Nurture';
  if (score >= 12) tier = 'Hot';
  else if (score >= 8) tier = 'Warm';

  // Recommendations
  const recs = [];
  if (areas.includes("Gate/Driveway")) recs.push("Varifocal cameras for plate recognition");
  if (features.some((f) => f.includes("AcuSense"))) recs.push("AcuSense for human/vehicle filtering");
  
  return {
    cameraCount,
    nvrChannel,
    storage1TB: true, // simplified
    leadScore: score,
    leadTier: tier,
    recommendations: recs
  };
};
