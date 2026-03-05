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
const leadScoringModule = (await import(
  new URL("../app/lib/leadScoring.ts", import.meta.url).href
)) as typeof import("../app/lib/leadScoring");
const formOptionsModule = (await import(
  new URL("../app/lib/formOptions.ts", import.meta.url).href
)) as typeof import("../app/lib/formOptions");

const { getSafetyCategoryScores, getSafetySummary } = safetyScoresModule;
const {
  buildResultsScoringBreakdown,
  getEmergencyReadinessFromRiskScore,
  getPanatagRatingFromSafetyCategories,
  getPriorityActionFromLeadTier,
  getSafetyLevelFromTotalRiskScore,
} = scoringModule;
const {
  calculateLeadScore,
  getLeadTierFromScore,
  LEAD_SCORE_MAX,
} = leadScoringModule;
const {
  PRIORITY_AREAS,
  SMART_HOME_FEATURE_OPTIONS,
  BUDGET_BAND_OPTIONS,
  CURRENT_SETUP_VALUES,
  TIMELINE_VALUES,
} = formOptionsModule;

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

const toSerialized = (value: unknown): string => JSON.stringify(value, null, 2);

const assertEqual = (label: string, actual: unknown, expected: unknown): void => {
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
  has_additional_notes: null,
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
assertEqual("Safety level 70 => Protected", getSafetyLevelFromTotalRiskScore(70), {
  label: "Protected",
  range: "70-100",
  severity: "low",
});
assertEqual("Safety level 100 => Protected", getSafetyLevelFromTotalRiskScore(100), {
  label: "Protected",
  range: "70-100",
  severity: "low",
});
assertEqual("Safety level 45 => Alert", getSafetyLevelFromTotalRiskScore(45), {
  label: "Alert",
  range: "45-69",
  severity: "medium",
});
assertEqual("Safety level 69 => Alert", getSafetyLevelFromTotalRiskScore(69), {
  label: "Alert",
  range: "45-69",
  severity: "medium",
});
assertEqual("Safety level 0 => Urgent Action", getSafetyLevelFromTotalRiskScore(0), {
  label: "Urgent Action",
  range: "0-44",
  severity: "high",
});
assertEqual("Safety level 44 => Urgent Action", getSafetyLevelFromTotalRiskScore(44), {
  label: "Urgent Action",
  range: "0-44",
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
  "Emergency safety 100 => Good",
  getEmergencyReadinessFromRiskScore(100),
  { label: "Good", severity: "low" }
);
assertEqual(
  "Emergency safety 99 => Not There",
  getEmergencyReadinessFromRiskScore(99),
  { label: "Not There", severity: "medium" }
);
assertEqual(
  "Emergency safety 40 => Not There",
  getEmergencyReadinessFromRiskScore(40),
  { label: "Not There", severity: "medium" }
);
assertEqual(
  "Emergency safety 39 => Worse",
  getEmergencyReadinessFromRiskScore(39),
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
    total: 34,
    average: 34,
    max: 100,
    emergencyReadinessScore: 39,
  }
);

// Panatag deterministic scenarios using safety score fixtures.
assertEqual(
  "Panatag 100,100,100 + emergency 100 => 100",
  getPanatagRatingFromSafetyCategories(
    createCategorySafetyScores(100, 100, 100, 100)
  ),
  100
);
assertEqual(
  "Panatag 0,0,0 + emergency 0 => 0",
  getPanatagRatingFromSafetyCategories(
    createCategorySafetyScores(0, 0, 0, 0)
  ),
  0
);
assertEqual(
  "Panatag 30,30,30 + emergency 29 => 31",
  getPanatagRatingFromSafetyCategories(
    createCategorySafetyScores(30, 30, 30, 29)
  ),
  31
);
assertEqual(
  "Panatag 20,40,30 + emergency 45 => 31",
  getPanatagRatingFromSafetyCategories(
    createCategorySafetyScores(20, 40, 30, 45)
  ),
  31
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
      homeSafety: 100,
      neighborhoodSafety: 100,
      blindspotsSafety: 100,
      emergencySafety: 100,
    }),
    result: createResult("Nurture"),
    expected: {
      safetyTotal: 100,
      safetyMax: 100,
      safetyLevel: { label: "Protected", range: "70-100", severity: "low" },
      priority: { label: "Plan & Assess", severity: "low" },
      emergency: { label: "Good", severity: "low" },
      emergencyReadinessScore: 100,
      panatagRating: 100,
    },
  },
  {
    name: "mid-safety + warm",
    data: createSafetyFormData({
      homeSafety: 60,
      neighborhoodSafety: 50,
      blindspotsSafety: 60,
      emergencySafety: 40,
    }),
    result: createResult("Warm"),
    expected: {
      safetyTotal: 52,
      safetyMax: 100,
      safetyLevel: { label: "Alert", range: "45-69", severity: "medium" },
      priority: { label: "Book & Secure", severity: "medium" },
      emergency: { label: "Not There", severity: "medium" },
      emergencyReadinessScore: 40,
      panatagRating: 48,
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
      safetyTotal: 7,
      safetyMax: 100,
      safetyLevel: { label: "Urgent Action", range: "0-44", severity: "high" },
      priority: { label: "Emergency Secure", severity: "high" },
      emergency: { label: "Worse", severity: "high" },
      emergencyReadinessScore: 10,
      panatagRating: 4,
    },
  },
  {
    name: "decimal-safety floor behavior near threshold",
    data: decimalFloorFixtureData,
    result: createResult("Warm"),
    expected: {
      safetyTotal: 34,
      safetyMax: 100,
      safetyLevel: { label: "Urgent Action", range: "0-44", severity: "high" },
      priority: { label: "Book & Secure", severity: "medium" },
      emergency: { label: "Worse", severity: "high" },
      emergencyReadinessScore: 39,
      panatagRating: 33,
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
  totalRiskScore: 60,
  leadTier: "Warm",
  emergencyRiskScore: 40,
  categoryRiskScores: createCategorySafetyScores(60, 60, 50, 40),
});

assertEqual("Breakdown includes expected safety output", breakdown.outputs.safetyLevel, {
  label: "Alert",
  range: "45-69",
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
assertEqual("Breakdown includes expected panatag output", breakdown.outputs.panatagRating, 48);
assertEqual(
  "Breakdown panatag output matches helper",
  breakdown.outputs.panatagRating,
  getPanatagRatingFromSafetyCategories(createCategorySafetyScores(60, 60, 50, 40))
);

// Lead scoring normalization checks.
const createLeadContext = (
  overrides: Partial<{
    priority_areas: string[];
    smart_home_features: string[];
    current_setup: string;
    budget_band: string;
    timeline: string;
    safety_average: number;
  }> = {}
) => ({
  priority_areas: [] as string[],
  smart_home_features: [] as string[],
  current_setup: "",
  budget_band: "",
  timeline: "",
  safety_average: 100,
  ...overrides,
});

const maxLead = calculateLeadScore(
  createLeadContext({
    priority_areas: [...PRIORITY_AREAS],
    smart_home_features: [...SMART_HOME_FEATURE_OPTIONS],
    current_setup: CURRENT_SETUP_VALUES[0],
    budget_band: BUDGET_BAND_OPTIONS[BUDGET_BAND_OPTIONS.length - 1],
    timeline: TIMELINE_VALUES.ASAP,
    safety_average: 0,
  })
);
const zeroLead = calculateLeadScore(
  createLeadContext({
    current_setup: CURRENT_SETUP_VALUES[1],
    budget_band: BUDGET_BAND_OPTIONS[0],
    timeline: TIMELINE_VALUES.RESEARCHING,
    safety_average: 100,
  })
);
const midLead = calculateLeadScore(
  createLeadContext({
    priority_areas: [PRIORITY_AREAS[0]],
    smart_home_features: [SMART_HOME_FEATURE_OPTIONS[0]],
    current_setup: CURRENT_SETUP_VALUES[0],
    budget_band: BUDGET_BAND_OPTIONS[1],
    timeline: TIMELINE_VALUES.THIS_MONTH,
    safety_average: 100,
  })
);

assertEqual("Lead score max constant is 100", LEAD_SCORE_MAX, 100);
assertEqual("Lead max context maps to 100", maxLead.leadScore, 100);
assertEqual("Lead zero context maps to 0", zeroLead.leadScore, 0);
assertEqual("Lead mid context maps to rounded percentage", midLead.leadScore, 56);
assertEqual(
  "Lead breakdown maxPoints sum to 100",
  maxLead.leadScoreBreakdown.reduce((sum, item) => sum + item.maxPoints, 0),
  100
);
assertEqual(
  "Lead breakdown points sum to lead score",
  maxLead.leadScoreBreakdown.reduce((sum, item) => sum + item.points, 0),
  maxLead.leadScore
);
assertEqual("Lead tier 70 => Hot", getLeadTierFromScore(70), "Hot");
assertEqual("Lead tier 50 => Warm", getLeadTierFromScore(50), "Warm");
assertEqual("Lead tier 49 => Nurture", getLeadTierFromScore(49), "Nurture");

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
