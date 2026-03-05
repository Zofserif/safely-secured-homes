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

type SafetyFixture = {
  homeSafety: number;
  neighborhoodSafety: number;
  blindspotsSafety: number;
  emergencySafety: number;
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

const createBaseFormData = (): FormData => ({
  property_type: "",
  home_size: "",
  floors: "",
  priority_areas: [],
  current_setup: "",
  has_spare_key: null,
  changed_wifi_default_password: null,
  sleeps_with_earphones: null,
  locks_windows_gate_at_night: null,
  has_security_cameras: null,
  has_smoke_alarm_or_fire_extinguisher: null,
  has_first_aid_or_medicine_ready: null,
  knows_local_emergency_contacts: null,
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
  household_stage: "",
  desired_outcome: "",
  goal_obstacle: "",
  goal_obstacle_other: "",
  solution: "",
  first_name: "",
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

const createSafetyFormData = (fixture: SafetyFixture): FormData => {
  const data = createBaseFormData();

  return {
    ...data,
    safety_gate_entry: fixture.homeSafety,
    safety_side_back_entry: fixture.homeSafety,
    safety_windows_terrace: fixture.homeSafety,
    safety_driveway_garage: fixture.neighborhoodSafety,
    safety_blindspots: fixture.blindspotsSafety,
    safety_indoor_choke_points: fixture.blindspotsSafety,
    safety_emergency_readiness: fixture.emergencySafety,
  };
};

const createCategorySafetyScores = (
  homeSafety: number,
  blindspotsSafety: number,
  neighborhoodSafety: number,
  emergencySafety: number
): SafetyCategoryScores => ({
  home_entrance: homeSafety,
  windows_terrace: blindspotsSafety,
  neighborhood_safety_check: neighborhoodSafety,
  emergency_readiness_home: emergencySafety,
});

// Safety level boundaries.
assertEqual("Safety level 140 => Protected", getSafetyLevelFromTotalRiskScore(140), {
  label: "Protected",
  range: "140-200",
  severity: "low",
});
assertEqual("Safety level 200 => Protected", getSafetyLevelFromTotalRiskScore(200), {
  label: "Protected",
  range: "140-200",
  severity: "low",
});
assertEqual("Safety level 90 => Alert", getSafetyLevelFromTotalRiskScore(90), {
  label: "Alert",
  range: "90-139",
  severity: "medium",
});
assertEqual("Safety level 139 => Alert", getSafetyLevelFromTotalRiskScore(139), {
  label: "Alert",
  range: "90-139",
  severity: "medium",
});
assertEqual("Safety level 0 => Urgent Action", getSafetyLevelFromTotalRiskScore(0), {
  label: "Urgent Action",
  range: "0-89",
  severity: "high",
});
assertEqual("Safety level 89 => Urgent Action", getSafetyLevelFromTotalRiskScore(89), {
  label: "Urgent Action",
  range: "0-89",
  severity: "high",
});

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
  "Emergency safety 50 => Good",
  getEmergencyReadinessFromRiskScore(50),
  { label: "Good", severity: "low" }
);
assertEqual(
  "Emergency safety 49 => Not There",
  getEmergencyReadinessFromRiskScore(49),
  { label: "Not There", severity: "medium" }
);
assertEqual(
  "Emergency safety 20 => Not There",
  getEmergencyReadinessFromRiskScore(20),
  { label: "Not There", severity: "medium" }
);
assertEqual(
  "Emergency safety 19 => Worse",
  getEmergencyReadinessFromRiskScore(19),
  { label: "Worse", severity: "high" }
);
assertEqual(
  "Emergency safety 0 => Worse",
  getEmergencyReadinessFromRiskScore(0),
  { label: "Worse", severity: "high" }
);

// Floor-based safety normalization from decimal safety values.
const decimalFloorFixtureData = createSafetyFormData({
  homeSafety: 29.9,
  neighborhoodSafety: 29.9,
  blindspotsSafety: 39.9,
  emergencySafety: 39.9,
});
assertEqual(
  "Decimal safety values are floored in category scores",
  getSafetyCategoryScores(decimalFloorFixtureData),
  {
    home_entrance: 29,
    neighborhood_safety_check: 29,
    windows_terrace: 39,
    emergency_readiness_home: 39,
  }
);
assertEqual(
  "Decimal floor fixture safety summary reflects floored totals",
  getSafetySummary(decimalFloorFixtureData),
  {
    total: 136,
    average: 34,
    max: 200,
    emergencyReadinessScore: 39,
  }
);

// Panatag deterministic scenarios using safety score fixtures.
assertEqual(
  "Panatag 50,50,50 + emergency 50 => 10",
  getPanatagRatingFromSafetyCategories(
    createCategorySafetyScores(50, 50, 50, 50)
  ),
  10
);
assertEqual(
  "Panatag 0,0,0 + emergency 0 => 1",
  getPanatagRatingFromSafetyCategories(
    createCategorySafetyScores(0, 0, 0, 0)
  ),
  1
);
assertEqual(
  "Panatag 30,30,30 + emergency 29 => 6",
  getPanatagRatingFromSafetyCategories(
    createCategorySafetyScores(30, 30, 30, 29)
  ),
  6
);
assertEqual(
  "Panatag 20,40,30 + emergency 45 => 7",
  getPanatagRatingFromSafetyCategories(
    createCategorySafetyScores(20, 40, 30, 45)
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
    name: "high-safety + nurture",
    data: createSafetyFormData({
      homeSafety: 50,
      neighborhoodSafety: 50,
      blindspotsSafety: 50,
      emergencySafety: 50,
    }),
    result: createResult("Nurture"),
    expected: {
      safetyTotal: 200,
      safetyMax: 200,
      safetyLevel: { label: "Protected", range: "140-200", severity: "low" },
      priority: { label: "Plan & Assess", severity: "low" },
      emergency: { label: "Good", severity: "low" },
      emergencyReadinessScore: 50,
      panatagRating: 10,
    },
  },
  {
    name: "mid-safety + warm",
    data: createSafetyFormData({
      homeSafety: 30,
      neighborhoodSafety: 20,
      blindspotsSafety: 30,
      emergencySafety: 30,
    }),
    result: createResult("Warm"),
    expected: {
      safetyTotal: 110,
      safetyMax: 200,
      safetyLevel: { label: "Alert", range: "90-139", severity: "medium" },
      priority: { label: "Book & Secure", severity: "medium" },
      emergency: { label: "Not There", severity: "medium" },
      emergencyReadinessScore: 30,
      panatagRating: 6,
    },
  },
  {
    name: "low-safety + hot",
    data: createSafetyFormData({
      homeSafety: 5,
      neighborhoodSafety: 10,
      blindspotsSafety: 5,
      emergencySafety: 10,
    }),
    result: createResult("Hot"),
    expected: {
      safetyTotal: 30,
      safetyMax: 200,
      safetyLevel: { label: "Urgent Action", range: "0-89", severity: "high" },
      priority: { label: "Emergency Secure", severity: "high" },
      emergency: { label: "Worse", severity: "high" },
      emergencyReadinessScore: 10,
      panatagRating: 3,
    },
  },
  {
    name: "decimal-safety floor behavior near threshold",
    data: decimalFloorFixtureData,
    result: createResult("Warm"),
    expected: {
      safetyTotal: 136,
      safetyMax: 200,
      safetyLevel: { label: "Alert", range: "90-139", severity: "medium" },
      priority: { label: "Book & Secure", severity: "medium" },
      emergency: { label: "Not There", severity: "medium" },
      emergencyReadinessScore: 39,
      panatagRating: 7,
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
  totalRiskScore: 110,
  leadTier: "Warm",
  emergencyRiskScore: 30,
  categoryRiskScores: createCategorySafetyScores(30, 30, 20, 30),
});

assertEqual("Breakdown includes expected safety output", breakdown.outputs.safetyLevel, {
  label: "Alert",
  range: "90-139",
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
  getPanatagRatingFromSafetyCategories(createCategorySafetyScores(30, 30, 20, 30))
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
