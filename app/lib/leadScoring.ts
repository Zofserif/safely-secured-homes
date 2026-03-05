import {
  BUDGET_BAND_OPTIONS,
  CURRENT_SETUP_VALUES,
  PRIORITY_AREAS,
  PRIORITY_AREA_KEYS,
  SMART_HOME_FEATURE_OPTIONS,
  SMART_HOME_FEATURES,
  TIMELINE_VALUES,
} from "./formOptions.js";
import type { LeadScoreBreakdownItem, LeadTier } from "./types";

export const LEAD_SCORING_MODEL_VERSION = "answer-map-v5";
export const LEAD_SCORE_MAX = 100;

type SafetyAverageBucket = "safety_average_lte_40" | "safety_average_gt_40";

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

type RawLeadScoreBreakdownAnswer = {
  answer: string;
  points: number;
};

type RawLeadScoreBreakdownItem = {
  id: string;
  label: string;
  questionKey: string;
  selectedAnswers: string[];
  matchedAnswers: RawLeadScoreBreakdownAnswer[];
  matchedPoints: number;
  bonusPoints: number;
  maxPoints: number;
  points: number;
};

export type LeadScoreCalculationResult = {
  leadScore: number;
  leadScoreBreakdown: LeadScoreBreakdownItem[];
  leadScoringModelVersion: string;
};

const PRIORITY_AREA_POINTS: Record<(typeof PRIORITY_AREAS)[number], number> = {
  [PRIORITY_AREA_KEYS.GENERAL_INDOOR_LIVING_AREAS]: 0,
  [PRIORITY_AREA_KEYS.CHILD_ELDERLY_PET]: 0,
  [PRIORITY_AREA_KEYS.ENTRANCES_CRITICAL_ZONES]: 0,
  [PRIORITY_AREA_KEYS.OUTDOOR_PERIMETER_STREET_VIEW]: 0,
  [PRIORITY_AREA_KEYS.NO_INTERNET_ELECTRICITY_REMOTE_PROPERTY]: 0,
  [PRIORITY_AREA_KEYS.FRONT_DOOR_VISITOR_CHECKING]: 0,
};

const CURRENT_SETUP_POINTS: Record<(typeof CURRENT_SETUP_VALUES)[number], number> =
  {
    "No, I don't have a security system": 1,
    "Yes, but it's broken/old (Needs replacement)": 0,
    "Yes, looking to expand/upgrade": 1,
  };

const BUDGET_BAND_POINTS: Record<(typeof BUDGET_BAND_OPTIONS)[number], number> = {
  "Starter Value (₱30K - ₱50K)": 0,
  "My Needed Features (₱50K - ₱75K)": 1,
  "Premium Features (₱75K+) ": 2,
};

const TIMELINE_POINTS: Record<string, number> = {
  [TIMELINE_VALUES.ASAP]: 2,
  [TIMELINE_VALUES.THIS_MONTH]: 1,
  [TIMELINE_VALUES.BEFORE_MOVE_IN]: 2,
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
  safety_average_lte_40: 1,
  safety_average_gt_40: 0,
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
    getBonusPoints: (_, selectedAnswers) => {
      const validSelectionCount = selectedAnswers.filter((answer) =>
        typeof getAnswerPoints(LEAD_SCORE_ANSWER_POINTS.priority_areas, answer) ===
        "number"
      ).length;
      const moreThanHalfMin = Math.floor(PRIORITY_AREAS.length / 2) + 1;

      if (validSelectionCount >= moreThanHalfMin) return 2;
      if (validSelectionCount >= 1) return 1;
      return 0;
    },
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
    maxPoints: 2,
    getSelectedAnswers: ({ timeline }) => (timeline ? [timeline] : []),
  },
  {
    id: "smart_home_bonus",
    label: "Smart home feature bonus",
    questionKey: "smart_home_features",
    answerPoints: LEAD_SCORE_ANSWER_POINTS.smart_home_features,
    maxPoints: 1,
    getSelectedAnswers: ({ smart_home_features }) => smart_home_features,
  },
  {
    id: "safety_risk_signal",
    label: "Safety score risk signal",
    questionKey: "safety_average",
    answerPoints: LEAD_SCORE_ANSWER_POINTS.safety_average,
    maxPoints: 1,
    getSelectedAnswers: ({ safety_average }) => [
      safety_average <= 40 ? "safety_average_lte_40" : "safety_average_gt_40",
    ],
  },
];

const RAW_LEAD_SCORE_MAX = LEAD_SCORE_QUESTION_DEFINITIONS.reduce<number>(
  (sum, definition) => sum + definition.maxPoints,
  0
);

const allocateByWeights = (weights: readonly number[], target: number): number[] => {
  if (target <= 0) return weights.map(() => 0);

  const normalizedWeights = weights.map((weight) =>
    Number.isFinite(weight) ? Math.max(0, weight) : 0
  );
  const weightTotal = normalizedWeights.reduce((sum, weight) => sum + weight, 0);
  if (weightTotal <= 0) return normalizedWeights.map(() => 0);

  const exacts = normalizedWeights.map((weight) => (weight / weightTotal) * target);
  const points = exacts.map((value) => Math.floor(value));
  let remaining = target - points.reduce((sum, value) => sum + value, 0);

  const order = exacts
    .map((exact, index) => ({ index, remainder: exact - points[index] }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);

  let cursor = 0;
  while (remaining > 0 && order.length > 0) {
    const targetIndex = order[cursor % order.length].index;
    points[targetIndex] += 1;
    remaining -= 1;
    cursor += 1;
  }

  return points;
};

const NORMALIZED_MAX_POINTS_BY_QUESTION = allocateByWeights(
  LEAD_SCORE_QUESTION_DEFINITIONS.map((definition) => definition.maxPoints),
  LEAD_SCORE_MAX
);

export const LEAD_TIER_PERCENT_THRESHOLDS = {
  HOT: 0.7,
  WARM: 0.5,
} as const;

const normalizeToNonNegativeNumber = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
};

const clampLeadScore = (score: number): number =>
  Math.min(LEAD_SCORE_MAX, Math.max(0, Math.round(score)));

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

const getAnswerPoints = (
  answerPoints: Readonly<Record<string, number>>,
  answer: string
): number | undefined => {
  if (Object.prototype.hasOwnProperty.call(answerPoints, answer)) {
    return toNonNegativeInteger(answerPoints[answer] ?? 0);
  }

  const normalizedAnswer = answer.trim();
  for (const key of Object.keys(answerPoints)) {
    if (key.trim() === normalizedAnswer) {
      return toNonNegativeInteger(answerPoints[key] ?? 0);
    }
  }

  return undefined;
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

const buildRawBreakdownItem = (
  definition: LeadScoreQuestionDefinition,
  context: LeadScoringContext
): RawLeadScoreBreakdownItem => {
  const selectedAnswers = uniqueAnswers(definition.getSelectedAnswers(context));

  const matchedAnswers = selectedAnswers
    .map((answer) => {
      const points = getAnswerPoints(definition.answerPoints, answer);
      if (typeof points !== "number") return null;
      return { answer, points };
    })
    .filter((item): item is RawLeadScoreBreakdownAnswer => Boolean(item));

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

const normalizeItemPoints = (
  rawItems: readonly RawLeadScoreBreakdownItem[],
  normalizedScore: number
): number[] => {
  const states = rawItems.map((item, index) => {
    const normalizedMax = NORMALIZED_MAX_POINTS_BY_QUESTION[index] ?? 0;
    const exact =
      item.maxPoints > 0 ? (item.points / item.maxPoints) * normalizedMax : 0;
    const basePoints = Math.min(normalizedMax, Math.floor(exact));

    return {
      index,
      exact,
      remainder: exact - basePoints,
      maxPoints: normalizedMax,
      points: basePoints,
    };
  });

  let delta =
    normalizedScore - states.reduce((sum, state) => sum + state.points, 0);
  const increaseOrder = [...states]
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
    .map((state) => state.index);
  const decreaseOrder = [...states]
    .sort((a, b) => a.remainder - b.remainder || a.index - b.index)
    .map((state) => state.index);

  let cursor = 0;
  let stalled = 0;
  while (delta > 0 && increaseOrder.length > 0) {
    const targetIndex = increaseOrder[cursor % increaseOrder.length];
    const target = states[targetIndex];
    if (target.points < target.maxPoints) {
      target.points += 1;
      delta -= 1;
      stalled = 0;
    } else {
      stalled += 1;
      if (stalled >= increaseOrder.length) break;
    }
    cursor += 1;
  }

  cursor = 0;
  stalled = 0;
  while (delta < 0 && decreaseOrder.length > 0) {
    const targetIndex = decreaseOrder[cursor % decreaseOrder.length];
    const target = states[targetIndex];
    if (target.points > 0) {
      target.points -= 1;
      delta += 1;
      stalled = 0;
    } else {
      stalled += 1;
      if (stalled >= decreaseOrder.length) break;
    }
    cursor += 1;
  }

  return states.map((state) => state.points);
};

const normalizeBreakdownItem = (
  rawItem: RawLeadScoreBreakdownItem,
  normalizedItemPoints: number,
  normalizedItemMaxPoints: number
): LeadScoreBreakdownItem => {
  const clampedItemPoints = Math.min(
    normalizedItemMaxPoints,
    Math.max(0, normalizedItemPoints)
  );

  if (clampedItemPoints === 0 || rawItem.points <= 0) {
    return {
      id: rawItem.id,
      label: rawItem.label,
      questionKey: rawItem.questionKey,
      selectedAnswers: rawItem.selectedAnswers,
      matchedAnswers: rawItem.matchedAnswers.map((item) => ({
        answer: item.answer,
        points: 0,
      })),
      matchedPoints: 0,
      bonusPoints: 0,
      maxPoints: normalizedItemMaxPoints,
      points: 0,
    };
  }

  const cappedMatchedPoints = Math.min(rawItem.matchedPoints, rawItem.points);
  const cappedBonusPoints = Math.min(
    rawItem.bonusPoints,
    Math.max(0, rawItem.points - cappedMatchedPoints)
  );

  let matchedPoints = 0;
  let bonusPoints = 0;
  if (cappedMatchedPoints <= 0) {
    matchedPoints = 0;
    bonusPoints = clampedItemPoints;
  } else if (cappedBonusPoints <= 0) {
    matchedPoints = clampedItemPoints;
    bonusPoints = 0;
  } else {
    const [normalizedMatched, normalizedBonus] = allocateByWeights(
      [cappedMatchedPoints, cappedBonusPoints],
      clampedItemPoints
    );
    matchedPoints = normalizedMatched;
    bonusPoints = normalizedBonus;
  }

  const normalizedMatchedAnswerPoints = allocateByWeights(
    rawItem.matchedAnswers.map((item) => item.points),
    matchedPoints
  );

  return {
    id: rawItem.id,
    label: rawItem.label,
    questionKey: rawItem.questionKey,
    selectedAnswers: rawItem.selectedAnswers,
    matchedAnswers: rawItem.matchedAnswers.map((item, index) => ({
      answer: item.answer,
      points: normalizedMatchedAnswerPoints[index] ?? 0,
    })),
    matchedPoints,
    bonusPoints,
    maxPoints: normalizedItemMaxPoints,
    points: clampedItemPoints,
  };
};

export const calculateLeadScore = (
  context: LeadScoringContext
): LeadScoreCalculationResult => {
  const rawBreakdown = LEAD_SCORE_QUESTION_DEFINITIONS.map((definition) =>
    buildRawBreakdownItem(definition, context)
  );

  const rawScore = rawBreakdown.reduce<number>((sum, item) => sum + item.points, 0);
  const leadScore = clampLeadScore((rawScore / RAW_LEAD_SCORE_MAX) * LEAD_SCORE_MAX);
  const normalizedItemPoints = normalizeItemPoints(rawBreakdown, leadScore);
  const leadScoreBreakdown = rawBreakdown.map((item, index) =>
    normalizeBreakdownItem(
      item,
      normalizedItemPoints[index] ?? 0,
      NORMALIZED_MAX_POINTS_BY_QUESTION[index] ?? 0
    )
  );

  return {
    leadScore,
    leadScoreBreakdown,
    leadScoringModelVersion: LEAD_SCORING_MODEL_VERSION,
  };
};
