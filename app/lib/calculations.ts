import { FormData, LeadTier, CalculationResult } from "./types";
export const estimateCameraPlan = (data: FormData): CalculationResult => {
  const areas = data.priority_areas || [];
  const floors = data.floors || "1";
  const size = data.home_size || "Small";

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
  if (data.features_must.some(f => f.includes("ColorVu") || f.includes("AcuSense"))) score += 1;
  
  // Updated logic for new fields
  if (data.current_setup === "No, this is a new installation" || data.current_setup.includes("broken/old")) score += 1;
  if (data.budget_band.includes("All I can need") || data.budget_band.includes("Feature Rich")) score += 2;
  if (data.timeline.includes("ASAP") || data.timeline.includes("This Week")) score += 3;
  if (data.safety_level <= 3) score += 1;

  let tier: LeadTier = 'Nurture';
  if (score >= 12) tier = 'Hot';
  else if (score >= 8) tier = 'Warm';

  // Recommendations
  const recs = [];
  if (areas.includes("Gate/Driveway")) recs.push("Varifocal cameras for plate recognition");
  if (data.features_must.some(f => f.includes("AcuSense"))) recs.push("AcuSense for human/vehicle filtering");
  
  return {
    cameraCount,
    nvrChannel,
    storage1TB: true, // simplified
    leadScore: score,
    leadTier: tier,
    recommendations: recs
  };
};
