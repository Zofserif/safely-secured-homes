import type { SafetyCategoryScores } from "../app/lib/safetyScores";
import type {
  CalculationResult,
  FormData,
  LeadTier,
  ResultsSummary,
} from "../app/lib/types";

const safetyScoresModule = (await import(
  new URL("../app/lib/safetyScores.ts", import.meta.url).href
)) as typeof import("../app/lib/safetyScores");
const scoringModule = (await import(
  new URL("../app/lib/resultsScoring.ts", import.meta.url).href
)) as typeof import("../app/lib/resultsScoring");

const { getSafetyCategoryScores, getSafetySummary } = safetyScoresModule;
const {
  buildResultsScoringBreakdown,
  getEmergencyReadinessFromRiskScore,
  getPanatagRatingFromSafetyCategories,
  getPriorityActionFromLeadTier,
  getSafetyLevelFromTotalRiskScore,
} = scoringModule;

// Mirrors app/lib/calculations.ts getResultsSummary orchestration (without camera-plan concerns).
const getResultsSummaryForVerification = (
  data: FormData,
  result: CalculationResult
): ResultsSummary => {
  const safety = getSafetySummary(data);
  const safetyCategoryScores = getSafetyCategoryScores(data);
  const safetyTotal = safety.total;
  const safetyMax = safety.max;
  const emergencyReadinessScore = safety.emergencyReadinessScore;

  return {
    safetyTotal,
    safetyMax,
    safetyLevel: getSafetyLevelFromTotalRiskScore(safetyTotal),
    priority: getPriorityActionFromLeadTier(result.leadTier),
    emergency: getEmergencyReadinessFromRiskScore(emergencyReadinessScore),
    emergencyReadinessScore,
    panatagRating: getPanatagRatingFromSafetyCategories(safetyCategoryScores),
  };
};

type RiskFixture = {
  homeRisk: number;
  neighborhoodRisk: number;
  blindspotsRisk: number;
  emergencyRisk: number;
};

const failures: string[] = [];
let totalChecks = 0;

const toSerialized = (value: unknown): string =>
  JSON.stringify(value, null, 2);

const assertEqual = (
  label: string,
  actual: unknown,
  expected: unknown
): void => {
  totalChecks += 1;
  if (toSerialized(actual) === toSerialized(expected)) return;
  failures.push(
    `${label}\nExpected:\n${toSerialized(expected)}\nActual:\n${toSerialized(actual)}`
  );
};

const toStoredRisk = (visibleScore: number): number => 5 - visibleScore;

const createBaseFormData = (): FormData => ({
  property_type: "",
  home_size: "",
  floors: "",
  priority_areas: [],
  current_setup: "",
  safety_gate_entry: 0,
  safety_blindspots: 0,
  safety_side_back_entry: 0,
  safety_windows_terrace: 0,
  safety_driveway_garage: 0,
  safety_indoor_choke_points: 0,
  safety_emergency_readiness: 0,
  features_must: [],
  smart_home_features: [],
  smart_home_interest: "",
  diy_security_plan: false,
  budget_band: "",
  timeline: "",
  first_name: "",
  last_name: "",
  email: "",
  mobile: "",
});

const createResult = (leadTier: LeadTier): CalculationResult => ({
  cameraCount: 4,
  nvrChannel: 4,
  storage1TB: true,
  leadScore: 0,
  leadTier,
  leadScoringModelVersion: "verification",
  recommendations: [],
  leadScoreBreakdown: [],
});

const createRiskFormData = (fixture: RiskFixture): FormData => {
  const data = createBaseFormData();

  return {
    ...data,
    safety_gate_entry: fixture.homeRisk,
    safety_side_back_entry: fixture.homeRisk,
    safety_windows_terrace: fixture.homeRisk,
    safety_driveway_garage: fixture.neighborhoodRisk,
    safety_blindspots: fixture.blindspotsRisk,
    safety_indoor_choke_points: fixture.blindspotsRisk,
    safety_emergency_readiness: fixture.emergencyRisk,
  };
};

const createCategoryRiskScoresFromVisible = (
  homeVisible: number,
  blindspotsVisible: number,
  neighborhoodVisible: number,
  emergencyVisible: number
): SafetyCategoryScores => ({
  home_entrance: toStoredRisk(homeVisible),
  indoor_outdoor_blindspots: toStoredRisk(blindspotsVisible),
  neighborhood_safety_check: toStoredRisk(neighborhoodVisible),
  emergency_readiness_home: toStoredRisk(emergencyVisible),
});

// Safety level boundaries.
assertEqual("Safety level 0 => Protected", getSafetyLevelFromTotalRiskScore(0), {
  label: "Protected",
  range: "0-6 Low",
  severity: "low",
});
assertEqual("Safety level 6 => Protected", getSafetyLevelFromTotalRiskScore(6), {
  label: "Protected",
  range: "0-6 Low",
  severity: "low",
});
assertEqual("Safety level 7 => Alert", getSafetyLevelFromTotalRiskScore(7), {
  label: "Alert",
  range: "7-11 Medium",
  severity: "medium",
});
assertEqual("Safety level 11 => Alert", getSafetyLevelFromTotalRiskScore(11), {
  label: "Alert",
  range: "7-11 Medium",
  severity: "medium",
});
assertEqual(
  "Safety level 12 => Urgent Action",
  getSafetyLevelFromTotalRiskScore(12),
  {
    label: "Urgent Action",
    range: "12-20 High",
    severity: "high",
  }
);
assertEqual(
  "Safety level 20 => Urgent Action",
  getSafetyLevelFromTotalRiskScore(20),
  {
    label: "Urgent Action",
    range: "12-20 High",
    severity: "high",
  }
);

// Priority action mapping.
assertEqual(
  "Priority Hot => Emergency Secure",
  getPriorityActionFromLeadTier("Hot"),
  { label: "Emergency Secure", severity: "high" }
);
assertEqual(
  "Priority Warm => Book & Secure",
  getPriorityActionFromLeadTier("Warm"),
  { label: "Book & Secure", severity: "medium" }
);
assertEqual(
  "Priority Nurture => Plan & Assess",
  getPriorityActionFromLeadTier("Nurture"),
  { label: "Plan & Assess", severity: "low" }
);

// Emergency readiness boundaries.
assertEqual(
  "Emergency risk 0 => Good",
  getEmergencyReadinessFromRiskScore(0),
  { label: "Good", severity: "low" }
);
assertEqual(
  "Emergency risk 1 => Not There",
  getEmergencyReadinessFromRiskScore(1),
  { label: "Not There", severity: "medium" }
);
assertEqual(
  "Emergency risk 3 => Not There",
  getEmergencyReadinessFromRiskScore(3),
  { label: "Not There", severity: "medium" }
);
assertEqual(
  "Emergency risk 4 => Worse",
  getEmergencyReadinessFromRiskScore(4),
  { label: "Worse", severity: "high" }
);
assertEqual(
  "Emergency risk 5 => Worse",
  getEmergencyReadinessFromRiskScore(5),
  { label: "Worse", severity: "high" }
);

// Floor-based safety normalization from decimal slider-derived risk values.
const decimalFloorFixtureData = createRiskFormData({
  homeRisk: 2.9,
  neighborhoodRisk: 2.9,
  blindspotsRisk: 3.9,
  emergencyRisk: 3.9,
});
assertEqual(
  "Decimal risk values are floored in category scores",
  getSafetyCategoryScores(decimalFloorFixtureData),
  {
    home_entrance: 2,
    neighborhood_safety_check: 2,
    indoor_outdoor_blindspots: 3,
    emergency_readiness_home: 3,
  }
);
assertEqual(
  "Decimal floor fixture safety summary reflects floored totals",
  getSafetySummary(decimalFloorFixtureData),
  {
    total: 10,
    average: 2.5,
    max: 20,
    emergencyReadinessScore: 3,
  }
);

// Panatag deterministic scenarios using visible score fixtures.
assertEqual(
  "Panatag 5,5,5 + emergency 5 => 10",
  getPanatagRatingFromSafetyCategories(
    createCategoryRiskScoresFromVisible(5, 5, 5, 5)
  ),
  10
);
assertEqual(
  "Panatag 0,0,0 + emergency 0 => 1",
  getPanatagRatingFromSafetyCategories(
    createCategoryRiskScoresFromVisible(0, 0, 0, 0)
  ),
  1
);
assertEqual(
  "Panatag 3,3,3 + emergency 2 => 6",
  getPanatagRatingFromSafetyCategories(
    createCategoryRiskScoresFromVisible(3, 3, 3, 2)
  ),
  6
);
assertEqual(
  "Panatag 2,4,3 + emergency 4 => 7",
  getPanatagRatingFromSafetyCategories(
    createCategoryRiskScoresFromVisible(2, 4, 3, 4)
  ),
  7
);

// Non-regression matrix for getResultsSummary orchestration output.
const summaryFixtures: Array<{
  name: string;
  data: FormData;
  result: CalculationResult;
  expected: ResultsSummary;
}> = [
  {
    name: "low-risk + nurture",
    data: createRiskFormData({
      homeRisk: 0,
      neighborhoodRisk: 0,
      blindspotsRisk: 0,
      emergencyRisk: 0,
    }),
    result: createResult("Nurture"),
    expected: {
      safetyTotal: 0,
      safetyMax: 20,
      safetyLevel: { label: "Protected", range: "0-6 Low", severity: "low" },
      priority: { label: "Plan & Assess", severity: "low" },
      emergency: { label: "Good", severity: "low" },
      emergencyReadinessScore: 0,
      panatagRating: 10,
    },
  },
  {
    name: "medium-risk + warm",
    data: createRiskFormData({
      homeRisk: 3,
      neighborhoodRisk: 2,
      blindspotsRisk: 3,
      emergencyRisk: 3,
    }),
    result: createResult("Warm"),
    expected: {
      safetyTotal: 11,
      safetyMax: 20,
      safetyLevel: { label: "Alert", range: "7-11 Medium", severity: "medium" },
      priority: { label: "Book & Secure", severity: "medium" },
      emergency: { label: "Not There", severity: "medium" },
      emergencyReadinessScore: 3,
      panatagRating: 5,
    },
  },
  {
    name: "high-risk + hot",
    data: createRiskFormData({
      homeRisk: 5,
      neighborhoodRisk: 5,
      blindspotsRisk: 5,
      emergencyRisk: 5,
    }),
    result: createResult("Hot"),
    expected: {
      safetyTotal: 20,
      safetyMax: 20,
      safetyLevel: { label: "Urgent Action", range: "12-20 High", severity: "high" },
      priority: { label: "Emergency Secure", severity: "high" },
      emergency: { label: "Worse", severity: "high" },
      emergencyReadinessScore: 5,
      panatagRating: 1,
    },
  },
  {
    name: "decimal-risk floor behavior near threshold",
    data: decimalFloorFixtureData,
    result: createResult("Warm"),
    expected: {
      safetyTotal: 10,
      safetyMax: 20,
      safetyLevel: { label: "Alert", range: "7-11 Medium", severity: "medium" },
      priority: { label: "Book & Secure", severity: "medium" },
      emergency: { label: "Not There", severity: "medium" },
      emergencyReadinessScore: 3,
      panatagRating: 5,
    },
  },
];

for (const fixture of summaryFixtures) {
  const actual = getResultsSummaryForVerification(fixture.data, fixture.result);
  assertEqual(
    `results summary orchestration fixture: ${fixture.name}`,
    actual,
    fixture.expected
  );
}

// Troubleshooting helper shape sanity check.
const breakdown = buildResultsScoringBreakdown({
  totalRiskScore: 11,
  leadTier: "Warm",
  emergencyRiskScore: 3,
  categoryRiskScores: createCategoryRiskScoresFromVisible(3, 3, 3, 2),
});

assertEqual("Breakdown includes expected safety output", breakdown.outputs.safetyLevel, {
  label: "Alert",
  range: "7-11 Medium",
  severity: "medium",
});
assertEqual("Breakdown includes expected priority output", breakdown.outputs.priority, {
  label: "Book & Secure",
  severity: "medium",
});
assertEqual("Breakdown includes expected emergency output", breakdown.outputs.emergency, {
  label: "Not There",
  severity: "medium",
});
assertEqual(
  "Breakdown panatag output matches helper",
  breakdown.outputs.panatagRating,
  getPanatagRatingFromSafetyCategories(createCategoryRiskScoresFromVisible(3, 3, 3, 2))
);

if (failures.length > 0) {
  console.error(
    `Results scoring verification failed (${failures.length}/${totalChecks} checks failed).`
  );
  for (const failure of failures) {
    console.error(`\n---\n${failure}`);
  }
  process.exit(1);
}

console.log(`Results scoring verification passed (${totalChecks} checks).`);
