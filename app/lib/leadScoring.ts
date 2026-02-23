import {
  BUDGET_BAND_OPTIONS,
  CURRENT_SETUP_VALUES,
  PRIORITY_AREAS,
  PRIORITY_AREA_KEYS,
  SMART_HOME_FEATURE_OPTIONS,
  SMART_HOME_FEATURES,
  TIMELINE_VALUES,
} from "./formOptions";
import type { LeadScoreBreakdownItem, LeadTier } from "./types";

export const LEAD_SCORING_MODEL_VERSION = "answer-map-v1";

type SafetyAverageBucket = "safety_average_gte_3" | "safety_average_lt_3";

type LeadScoreQuestionKey =
  | "priority_areas"
  | "current_setup"
  | "budget_band"
  | "timeline"
  | "smart_home_features"
  | "safety_average";

export type LeadScoringContext = {
  priority_areas: string[];
  smart_home_features: string[];
  current_setup: string;
  budget_band: string;
  timeline: string;
  safety_average: number;
};

type LeadScoreQuestionDefinition = {
  id: string;
  label: string;
  questionKey: LeadScoreQuestionKey;
  answerPoints: Readonly<Record<string, number>>;
  maxPoints: number;
  getSelectedAnswers: (context: LeadScoringContext) => string[];
  getBonusPoints?: (
    context: LeadScoringContext,
    selectedAnswers: readonly string[]
  ) => number;
};

export type LeadScoreCalculationResult = {
  leadScore: number;
  leadScoreBreakdown: LeadScoreBreakdownItem[];
  leadScoringModelVersion: string;
};

const PRIORITY_AREA_POINTS: Record<(typeof PRIORITY_AREAS)[number], number> = {
  [PRIORITY_AREA_KEYS.GENERAL_INDOOR_LIVING_AREAS]: 0,
  [PRIORITY_AREA_KEYS.CHILD_ELDERLY_PET]: 1,
  [PRIORITY_AREA_KEYS.ENTRANCES_CRITICAL_ZONES]: 0,
  [PRIORITY_AREA_KEYS.OUTDOOR_PERIMETER_STREET_VIEW]: 1,
  [PRIORITY_AREA_KEYS.NO_INTERNET_ELECTRICITY_REMOTE_PROPERTY]: 0,
  [PRIORITY_AREA_KEYS.FRONT_DOOR_VISITOR_CHECKING]: 0,
};

const CURRENT_SETUP_POINTS: Record<(typeof CURRENT_SETUP_VALUES)[number], number> =
  {
    "No, this is a new installation": 2,
    "Yes, but it's broken/old (Needs replacement)": 0,
    "Yes, looking to expand/upgrade": 2,
  };

const BUDGET_BAND_POINTS: Record<(typeof BUDGET_BAND_OPTIONS)[number], number> = {
  "Starter Value (₱30K - ₱50K)": 0,
  "My Needed Features (₱50K - ₱75K)": 1,
  "Premium Features (₱75K+) ": 2,
};

const TIMELINE_POINTS: Record<string, number> = {
  [TIMELINE_VALUES.ASAP]: 3,
  [TIMELINE_VALUES.THIS_MONTH]: 1,
  [TIMELINE_VALUES.BEFORE_MOVE_IN]: 0,
  [TIMELINE_VALUES.RESEARCHING]: 0,
};

const SMART_HOME_FEATURE_POINTS: Record<
  (typeof SMART_HOME_FEATURE_OPTIONS)[number],
  number
> = {
  [SMART_HOME_FEATURES.AUTOMATED_LIGHTING_SYSTEM]: 1,
  [SMART_HOME_FEATURES.SMART_VIDEO_DOORBELL]: 1,
  [SMART_HOME_FEATURES.AUTOMATIC_ENTRY_EXIT_GATE_OPENERS]: 1,
  [SMART_HOME_FEATURES.SMART_ENTERTAINMENT_SYSTEM]: 1,
  [SMART_HOME_FEATURES.SMART_ELECTRONIC_SWITCH_SYSTEM]: 1,
  [SMART_HOME_FEATURES.EMERGENCY_DECTION_SYSTEM]: 1,
};

const SAFETY_AVERAGE_POINTS: Record<SafetyAverageBucket, number> = {
  safety_average_gte_3: 1,
  safety_average_lt_3: 0,
};

export const LEAD_SCORE_ANSWER_POINTS = {
  priority_areas: PRIORITY_AREA_POINTS,
  current_setup: CURRENT_SETUP_POINTS,
  budget_band: BUDGET_BAND_POINTS,
  timeline: TIMELINE_POINTS,
  smart_home_features: SMART_HOME_FEATURE_POINTS,
  safety_average: SAFETY_AVERAGE_POINTS,
} as const;

const LEAD_SCORE_QUESTION_DEFINITIONS: readonly LeadScoreQuestionDefinition[] = [
  {
    id: "priority_area_coverage",
    label: "Priority areas coverage/perimeter focus",
    questionKey: "priority_areas",
    answerPoints: LEAD_SCORE_ANSWER_POINTS.priority_areas,
    maxPoints: 2,
    getSelectedAnswers: ({ priority_areas }) => priority_areas,
    getBonusPoints: (_, selectedAnswers) =>
      selectedAnswers.length >= 3 ? 2 : 0,
  },
  {
    id: "current_setup_urgency",
    label: "Current setup indicates install/replacement urgency",
    questionKey: "current_setup",
    answerPoints: LEAD_SCORE_ANSWER_POINTS.current_setup,
    maxPoints: 1,
    getSelectedAnswers: ({ current_setup }) =>
      current_setup ? [current_setup] : [],
  },
  {
    id: "budget_readiness",
    label: "Budget indicates implementation readiness",
    questionKey: "budget_band",
    answerPoints: LEAD_SCORE_ANSWER_POINTS.budget_band,
    maxPoints: 2,
    getSelectedAnswers: ({ budget_band }) => (budget_band ? [budget_band] : []),
  },
  {
    id: "timeline_urgency",
    label: "Timeline urgency",
    questionKey: "timeline",
    answerPoints: LEAD_SCORE_ANSWER_POINTS.timeline,
    maxPoints: 3,
    getSelectedAnswers: ({ timeline }) => (timeline ? [timeline] : []),
  },
  {
    id: "smart_home_bonus",
    label: "Smart home feature bonus",
    questionKey: "smart_home_features",
    answerPoints: LEAD_SCORE_ANSWER_POINTS.smart_home_features,
    maxPoints: 6,
    getSelectedAnswers: ({ smart_home_features }) => smart_home_features,
  },
  {
    id: "safety_risk_signal",
    label: "Safety risk signal",
    questionKey: "safety_average",
    answerPoints: LEAD_SCORE_ANSWER_POINTS.safety_average,
    maxPoints: 1,
    getSelectedAnswers: ({ safety_average }) => [
      safety_average >= 3 ? "safety_average_gte_3" : "safety_average_lt_3",
    ],
  },
];

export const LEAD_SCORE_MAX = LEAD_SCORE_QUESTION_DEFINITIONS.reduce<number>(
  (sum, definition) => sum + definition.maxPoints,
  0
);

export const LEAD_TIER_PERCENT_THRESHOLDS = {
  HOT: 0.8,
  WARM: 0.5,
} as const;

const normalizeToNonNegativeNumber = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
};

export const getLeadTierThresholds = (
  maxScore: number = LEAD_SCORE_MAX
): { hotMinScore: number; warmMinScore: number } => {
  const normalizedMaxScore = normalizeToNonNegativeNumber(maxScore);

  return {
    hotMinScore: Math.ceil(
      normalizedMaxScore * LEAD_TIER_PERCENT_THRESHOLDS.HOT
    ),
    warmMinScore: Math.ceil(
      normalizedMaxScore * LEAD_TIER_PERCENT_THRESHOLDS.WARM
    ),
  };
};

export const getLeadTierFromScore = (
  score: number,
  maxScore: number = LEAD_SCORE_MAX
): LeadTier => {
  const normalizedScore = normalizeToNonNegativeNumber(score);
  const { hotMinScore, warmMinScore } = getLeadTierThresholds(maxScore);

  if (normalizedScore >= hotMinScore) return "Hot";
  if (normalizedScore >= warmMinScore) return "Warm";
  return "Nurture";
};

const toNonNegativeInteger = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
};

const uniqueAnswers = (answers: readonly string[]): string[] => {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const answer of answers) {
    if (typeof answer !== "string") continue;
    const trimmed = answer.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
};

const buildBreakdownItem = (
  definition: LeadScoreQuestionDefinition,
  context: LeadScoringContext
): LeadScoreBreakdownItem => {
  const selectedAnswers = uniqueAnswers(definition.getSelectedAnswers(context));

  const matchedAnswers = selectedAnswers
    .filter((answer) =>
      Object.prototype.hasOwnProperty.call(definition.answerPoints, answer)
    )
    .map((answer) => ({
      answer,
      points: toNonNegativeInteger(definition.answerPoints[answer] ?? 0),
    }));

  const matchedPoints = matchedAnswers.reduce<number>(
    (sum, item) => sum + item.points,
    0
  );
  const bonusPoints = toNonNegativeInteger(
    definition.getBonusPoints?.(context, selectedAnswers) ?? 0
  );
  const uncappedPoints = matchedPoints + bonusPoints;
  const points = Math.min(definition.maxPoints, uncappedPoints);

  return {
    id: definition.id,
    label: definition.label,
    questionKey: definition.questionKey,
    selectedAnswers,
    matchedAnswers,
    matchedPoints,
    bonusPoints,
    maxPoints: definition.maxPoints,
    points,
  };
};

export const calculateLeadScore = (
  context: LeadScoringContext
): LeadScoreCalculationResult => {
  const leadScoreBreakdown = LEAD_SCORE_QUESTION_DEFINITIONS.map((definition) =>
    buildBreakdownItem(definition, context)
  );

  const leadScore = leadScoreBreakdown.reduce<number>(
    (sum, item) => sum + item.points,
    0
  );

  return {
    leadScore,
    leadScoreBreakdown,
    leadScoringModelVersion: LEAD_SCORING_MODEL_VERSION,
  };
};
