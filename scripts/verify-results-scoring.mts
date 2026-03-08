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
const leadScoringConfigModule = (await import(
  new URL("../app/lib/leadScoringConfig.ts", import.meta.url).href
)) as typeof import("../app/lib/leadScoringConfig");

const { getSafetyCategoryScores, getSafetySummary } = safetyScoresModule;
const {
  buildResultsScoringBreakdown,
  getEmergencyReadinessFromRiskScore,
  getPanatagRatingFromScores,
  getPriorityActionFromLeadTier,
  getSafetyLevelFromTotalRiskScore,
} = scoringModule;
const {
  calculateLeadScore,
  getLeadTierFromScore,
  LEAD_SCORE_MAX,
  LEAD_SCORING_MODEL_VERSION,
} = leadScoringModule;
const { LEAD_SCORING_SECTIONS, LEAD_SCORING_WEIGHT_TOTAL } =
  leadScoringConfigModule;

// Mirrors app/lib/calculations.ts getResultsSummary orchestration (without camera-plan concerns).
const getResultsSummaryForVerification = (
  data: FormData,
  result: CalculationResult
): ResultsSummary => {
  const safety = getSafetySummary(data);
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
    panatagRating: getPanatagRatingFromScores({
      leadScore: result.leadScore,
      safetyTotal,
      emergencyReadinessScore,
    }),
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
  has_spare_key: null,
  changed_wifi_default_password: null,
  sleeps_with_earphones: null,
  locks_windows_gate_at_night: null,
  has_security_cameras: null,
  has_smoke_alarm_or_fire_extinguisher: null,
  has_first_aid_or_medicine_ready: null,
  knows_local_emergency_contacts: null,
  safety_gate_entry: null,
  safety_blindspots: null,
  safety_side_back_entry: null,
  safety_windows_terrace: null,
  safety_driveway_garage: null,
  safety_indoor_choke_points: null,
  safety_emergency_readiness: null,
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

const withSafeYesNoHabits = (data: FormData): FormData => ({
  ...data,
  has_spare_key: true,
  changed_wifi_default_password: true,
  sleeps_with_earphones: false,
  locks_windows_gate_at_night: true,
  has_security_cameras: true,
  has_smoke_alarm_or_fire_extinguisher: true,
  has_first_aid_or_medicine_ready: true,
  knows_local_emergency_contacts: true,
});

const withRiskyYesNoHabits = (data: FormData): FormData => ({
  ...data,
  has_spare_key: false,
  changed_wifi_default_password: false,
  sleeps_with_earphones: true,
  locks_windows_gate_at_night: false,
  has_security_cameras: false,
  has_smoke_alarm_or_fire_extinguisher: false,
  has_first_aid_or_medicine_ready: false,
  knows_local_emergency_contacts: false,
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
    emergencyReadinessScore: 38,
  }
);

const maxSafetyWithRiskyYesNo = getSafetySummary(
  withRiskyYesNoHabits(
    createSafetyFormData({
      homeSafety: 100,
      neighborhoodSafety: 100,
      blindspotsSafety: 100,
      emergencySafety: 100,
    })
  )
);
assertEqual(
  "Weighted safety score: safe sliders + risky yes/no => 50",
  maxSafetyWithRiskyYesNo.total,
  50
);

const maxSafetyWithSafeYesNo = getSafetySummary(
  withSafeYesNoHabits(
    createSafetyFormData({
      homeSafety: 100,
      neighborhoodSafety: 100,
      blindspotsSafety: 100,
      emergencySafety: 100,
    })
  )
);
assertEqual(
  "Weighted safety score: safe sliders + safe yes/no => 100",
  maxSafetyWithSafeYesNo.total,
  100
);

const maxSafetyWithSpareKeyOnly = getSafetySummary({
  ...createSafetyFormData({
    homeSafety: 100,
    neighborhoodSafety: 100,
    blindspotsSafety: 100,
    emergencySafety: 100,
  }),
  has_spare_key: true,
});
assertEqual(
  "Weighted safety score: safe sliders + spare key yes only => 54",
  maxSafetyWithSpareKeyOnly.total,
  54
);

const maxSafetyWithTwoSafeHabits = getSafetySummary({
  ...createSafetyFormData({
    homeSafety: 100,
    neighborhoodSafety: 100,
    blindspotsSafety: 100,
    emergencySafety: 100,
  }),
  has_spare_key: true,
  changed_wifi_default_password: true,
  sleeps_with_earphones: false,
});
assertEqual(
  "Weighted safety score: safe sliders + spare key yes + wifi yes + earphones no => 59",
  maxSafetyWithTwoSafeHabits.total,
  59
);

const maxSafetyWithEarphonesRisk = getSafetySummary({
  ...createSafetyFormData({
    homeSafety: 100,
    neighborhoodSafety: 100,
    blindspotsSafety: 100,
    emergencySafety: 100,
  }),
  has_spare_key: true,
  sleeps_with_earphones: true,
});
assertEqual(
  "Weighted safety score: safe sliders + spare key yes + earphones yes => 50",
  maxSafetyWithEarphonesRisk.total,
  50
);

const missingYesNoSafetySummary = getSafetySummary(
  createSafetyFormData({
    homeSafety: 60,
    neighborhoodSafety: 50,
    blindspotsSafety: 60,
    emergencySafety: 40,
  })
);
const safeYesNoSafetySummary = getSafetySummary(
  withSafeYesNoHabits(
    createSafetyFormData({
      homeSafety: 60,
      neighborhoodSafety: 50,
      blindspotsSafety: 60,
      emergencySafety: 40,
    })
  )
);
const riskyYesNoSafetySummary = getSafetySummary(
  withRiskyYesNoHabits(
    createSafetyFormData({
      homeSafety: 60,
      neighborhoodSafety: 50,
      blindspotsSafety: 60,
      emergencySafety: 40,
    })
  )
);
assertEqual(
  "Weighted safety score: missing yes/no re-normalizes answered sections",
  missingYesNoSafetySummary.total,
  55
);
assertEqual(
  "Weighted safety score: safe yes/no increases score versus missing yes/no",
  safeYesNoSafetySummary.total > missingYesNoSafetySummary.total,
  true
);
assertEqual(
  "Weighted safety score: risky yes/no decreases score versus missing yes/no",
  riskyYesNoSafetySummary.total < missingYesNoSafetySummary.total,
  true
);

const safeSliderFixture = createSafetyFormData({
  homeSafety: 100,
  neighborhoodSafety: 100,
  blindspotsSafety: 100,
  emergencySafety: 100,
});
assertEqual(
  "Emergency readiness weighted score: safe sliders + all emergency-scored yes/no true => 100",
  getSafetySummary(withSafeYesNoHabits(safeSliderFixture)).emergencyReadinessScore,
  100
);
assertEqual(
  "Emergency readiness weighted score: safe sliders + all emergency-scored yes/no false => 65",
  getSafetySummary(withRiskyYesNoHabits(safeSliderFixture)).emergencyReadinessScore,
  65
);
assertEqual(
  "Emergency readiness weighted score: safe sliders + has_spare_key only => 65",
  getSafetySummary({
    ...safeSliderFixture,
    has_spare_key: true,
  }).emergencyReadinessScore,
  65
);
assertEqual(
  "Emergency readiness weighted score: safe sliders + emergency contacts only => 70",
  getSafetySummary({
    ...safeSliderFixture,
    knows_local_emergency_contacts: true,
  }).emergencyReadinessScore,
  70
);

// Panatag deterministic scenarios using weighted lead/safety/emergency inputs.
assertEqual(
  "Panatag lead=100 safety=100 emergency=100 => 100",
  getPanatagRatingFromScores({
    leadScore: 100,
    safetyTotal: 100,
    emergencyReadinessScore: 100,
  }),
  100
);
assertEqual(
  "Panatag lead=0 safety=0 emergency=0 => 0",
  getPanatagRatingFromScores({
    leadScore: 0,
    safetyTotal: 0,
    emergencyReadinessScore: 0,
  }),
  0
);
assertEqual(
  "Panatag lead=30 safety=30 emergency=29 => 30",
  getPanatagRatingFromScores({
    leadScore: 30,
    safetyTotal: 30,
    emergencyReadinessScore: 29,
  }),
  30
);
assertEqual(
  "Panatag lead=20 safety=40 emergency=45 => 40",
  getPanatagRatingFromScores({
    leadScore: 20,
    safetyTotal: 40,
    emergencyReadinessScore: 45,
  }),
  40
);
assertEqual(
  "Panatag non-finite inputs are normalized to 0",
  getPanatagRatingFromScores({
    leadScore: Number.NaN,
    safetyTotal: Number.POSITIVE_INFINITY,
    emergencyReadinessScore: Number.NEGATIVE_INFINITY,
  }),
  0
);
assertEqual(
  "Panatag rounds weighted score and clamps each input to 0..100",
  getPanatagRatingFromScores({
    leadScore: 105,
    safetyTotal: 66.5,
    emergencyReadinessScore: 44.5,
  }),
  63
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
      panatagRating: 90,
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
      safetyTotal: 55,
      safetyMax: 100,
      safetyLevel: { label: "Alert", range: "45-69", severity: "medium" },
      priority: { label: "Book & Secure", severity: "medium" },
      emergency: { label: "Not There", severity: "medium" },
      emergencyReadinessScore: 43,
      panatagRating: 46,
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
      emergencyReadinessScore: 9,
      panatagRating: 7,
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
      emergencyReadinessScore: 38,
      panatagRating: 32,
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
  panatagScoreInputs: {
    leadScore: 60,
    safetyTotal: 60,
    emergencyReadinessScore: 40,
  },
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
assertEqual("Breakdown includes expected panatag output", breakdown.outputs.panatagRating, 54);
assertEqual(
  "Breakdown panatag output matches helper",
  breakdown.outputs.panatagRating,
  getPanatagRatingFromScores({
    leadScore: 60,
    safetyTotal: 60,
    emergencyReadinessScore: 40,
  })
);

// Lead scoring checks for section-weight v2.
const withNodeEnv = <T,>(env: string, run: () => T): T => {
  const envRecord = process.env as Record<string, string | undefined>;
  const previous = process.env.NODE_ENV;
  envRecord.NODE_ENV = env;

  try {
    return run();
  } finally {
    if (typeof previous === "string") {
      envRecord.NODE_ENV = previous;
    } else {
      delete envRecord.NODE_ENV;
    }
  }
};

assertEqual("Lead score max constant is 100", LEAD_SCORE_MAX, 100);
assertEqual(
  "Lead scoring model version is section-weight-v2",
  LEAD_SCORING_MODEL_VERSION,
  "section-weight-v2"
);
assertEqual("Lead scoring section weights sum to 100", LEAD_SCORING_WEIGHT_TOTAL, 100);
assertEqual(
  "Lead scoring sections and maxPoints sum match",
  LEAD_SCORING_SECTIONS.reduce((sum, section) => sum + section.weightPercent, 0),
  100
);

const propertyTypeSingleHomeLead = withNodeEnv("production", () =>
  calculateLeadScore({
    ...createBaseFormData(),
    property_type: "Single-family house",
  })
);
assertEqual(
  "Lead scoring single-family house maps to 3 points (1/2 of property_type weight)",
  propertyTypeSingleHomeLead.leadScore,
  3
);

const propertyTypeBeachHomeLead = withNodeEnv("production", () =>
  calculateLeadScore({
    ...createBaseFormData(),
    property_type: "Vacation Home / Beach House",
  })
);
assertEqual(
  "Lead scoring vacation home/beach house maps to 5 points (2/2 of property_type weight)",
  propertyTypeBeachHomeLead.leadScore,
  5
);
assertEqual(
  "Lead scoring property type high-priority option outranks low-priority option",
  propertyTypeBeachHomeLead.leadScore > propertyTypeSingleHomeLead.leadScore,
  true
);

const householdStageSoloLead = withNodeEnv("production", () =>
  calculateLeadScore({
    ...createBaseFormData(),
    household_stage: "Just me",
  })
);
const householdStageFamilyLead = withNodeEnv("production", () =>
  calculateLeadScore({
    ...createBaseFormData(),
    household_stage: "Family with kids at home",
  })
);
assertEqual(
  "Lead scoring household stage high-priority option outranks low-priority option",
  householdStageFamilyLead.leadScore > householdStageSoloLead.leadScore,
  true
);

const desiredOutcomeRemoteCheckLead = withNodeEnv("production", () =>
  calculateLeadScore({
    ...createBaseFormData(),
    desired_outcome: "Check on family/pets while I'm away",
  })
);
const desiredOutcomeBreakInProtectionLead = withNodeEnv("production", () =>
  calculateLeadScore({
    ...createBaseFormData(),
    desired_outcome: "Protect my home and valuables from break-ins/theft",
  })
);
assertEqual(
  "Lead scoring desired outcome high-priority option outranks low-priority option",
  desiredOutcomeBreakInProtectionLead.leadScore > desiredOutcomeRemoteCheckLead.leadScore,
  true
);

const goalObstacleAestheticLead = withNodeEnv("production", () =>
  calculateLeadScore({
    ...createBaseFormData(),
    goal_obstacle: "I don't want solutions that feel uninviting",
  })
);
const goalObstacleUncertainLead = withNodeEnv("production", () =>
  calculateLeadScore({
    ...createBaseFormData(),
    goal_obstacle: "I'm not sure what's right for my home",
  })
);
assertEqual(
  "Lead scoring goal obstacle high-priority option outranks low-priority option",
  goalObstacleAestheticLead.leadScore > goalObstacleUncertainLead.leadScore,
  true
);

const solutionDiyLead = withNodeEnv("production", () =>
  calculateLeadScore({
    ...createBaseFormData(),
    solution: "Start with DIY Home Safety Plan",
  })
);
const solutionDoneForYouLead = withNodeEnv("production", () =>
  calculateLeadScore({
    ...createBaseFormData(),
    solution: "Done for you Setup",
  })
);
assertEqual(
  "Lead scoring solution high-priority option outranks low-priority option",
  solutionDoneForYouLead.leadScore > solutionDiyLead.leadScore,
  true
);

const yesNoLead = withNodeEnv("production", () =>
  calculateLeadScore({
    ...createBaseFormData(),
    changed_wifi_default_password: false,
    locks_windows_gate_at_night: false,
  })
);
assertEqual("Lead scoring yes/no raw 3 maps to 13 points", yesNoLead.leadScore, 13);

const weightedFormulaLead = withNodeEnv("production", () =>
  calculateLeadScore({
    ...createBaseFormData(),
    changed_wifi_default_password: false,
  })
);
assertEqual(
  "Lead scoring formula raw/max*weight => 1/7*30 => 4",
  weightedFormulaLead.leadScore,
  4
);

const additionalNotesCommentLead = withNodeEnv("production", () =>
  calculateLeadScore({
    ...createBaseFormData(),
    goal_obstacle_other: "Need weekend install",
  })
);
assertEqual(
  "Lead scoring non-empty additional notes comment adds 3 points",
  additionalNotesCommentLead.leadScore,
  3
);

const mobileLead = withNodeEnv("production", () =>
  calculateLeadScore({
    ...createBaseFormData(),
    mobile: "09123456789",
  })
);
assertEqual("Lead scoring non-empty mobile adds 2 points", mobileLead.leadScore, 2);

const commentAndMobileLead = withNodeEnv("production", () =>
  calculateLeadScore({
    ...createBaseFormData(),
    goal_obstacle_other: "Need weekend install",
    mobile: "09123456789",
  })
);
assertEqual(
  "Lead scoring non-empty additional notes + mobile adds 5 points",
  commentAndMobileLead.leadScore,
  5
);

const whitespaceCommentAndMobileLead = withNodeEnv("production", () =>
  calculateLeadScore({
    ...createBaseFormData(),
    goal_obstacle_other: "   ",
    mobile: "   ",
  })
);
assertEqual(
  "Lead scoring whitespace-only additional notes + mobile does not add points",
  whitespaceCommentAndMobileLead.leadScore,
  0
);

const safetyLowSliderLead = withNodeEnv("production", () =>
  calculateLeadScore({
    ...createBaseFormData(),
    safety_gate_entry: 20,
    safety_side_back_entry: 20,
    safety_windows_terrace: 20,
  })
);
const safetyHighSliderLead = withNodeEnv("production", () =>
  calculateLeadScore({
    ...createBaseFormData(),
    safety_gate_entry: 90,
    safety_side_back_entry: 90,
    safety_windows_terrace: 90,
  })
);
assertEqual(
  "Lead scoring safety inverse maps lower safety slider to higher lead score",
  safetyLowSliderLead.leadScore > safetyHighSliderLead.leadScore,
  true
);

const sectionSumLead = withNodeEnv("production", () =>
  calculateLeadScore({
    ...createBaseFormData(),
    changed_wifi_default_password: false,
    locks_windows_gate_at_night: false,
    safety_driveway_garage: 20,
  })
);
assertEqual(
  "Lead breakdown points sum to lead score",
  sectionSumLead.leadScoreBreakdown.reduce((sum, item) => sum + item.points, 0),
  sectionSumLead.leadScore
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
