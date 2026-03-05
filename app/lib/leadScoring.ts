import {
  LEAD_SCORING_MODEL_VERSION,
  LEAD_SCORING_SECTIONS,
  TODO_POINT,
} from "./leadScoringConfig.js";
import type {
  LeadScorePointValue,
  LeadScoringFormData,
  LeadScoreBooleanQuestionConfig,
  LeadScoreSingleSelectQuestionConfig,
  LeadScoreSafetySliderInverseQuestionConfig,
  LeadScoreTextPresenceQuestionConfig,
} from "./leadScoringConfig";
import { clampSafetyScore, SAFETY_SCORE_MAX } from "./safetyScale.js";
import type { LeadScoreBreakdownItem, LeadTier } from "./types";

export { LEAD_SCORING_MODEL_VERSION };

export const LEAD_SCORE_MAX = 100;

type SectionQuestionEvaluation = {
  id: string;
  label: string;
  selectedAnswer: string | null;
  rawPoints: number;
  maxPoints: number;
};

type SectionEvaluation = {
  id: string;
  label: string;
  weightPercent: number;
  rawPoints: number;
  autoMaxPoints: number;
  effectiveMaxPoints: number;
  exactWeightedPoints: number;
  questions: SectionQuestionEvaluation[];
};

export type LeadScoringContext = LeadScoringFormData;

export type LeadScoreCalculationResult = {
  leadScore: number;
  leadScoreBreakdown: LeadScoreBreakdownItem[];
  leadScoringModelVersion: string;
};

export const LEAD_TIER_PERCENT_THRESHOLDS = {
  HOT: 0.7,
  WARM: 0.5,
} as const;

const WARNED_PLACEHOLDER_PATHS = new Set<string>();

const normalizeToNonNegativeNumber = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
};

const toNonNegativeInteger = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
};

const clampLeadScore = (score: number): number =>
  Math.min(LEAD_SCORE_MAX, Math.max(0, Math.round(score)));

const uniqueAnswers = (answers: readonly string[]): string[] => {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const answer of answers) {
    const trimmed = answer.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
};

const getPlaceholderPolicy = (): "throw" | "warn" => {
  const environment = process.env.NODE_ENV;
  if (environment === "development" || environment === "test") {
    return "throw";
  }

  return "warn";
};

const applyPlaceholderPolicy = (paths: Set<string>): void => {
  if (paths.size === 0) return;

  const sortedPaths = [...paths].sort();
  const policy = getPlaceholderPolicy();

  if (policy === "throw") {
    throw new Error(
      [
        "Lead scoring has unresolved TODO points. Fill these config paths:",
        ...sortedPaths.map((path) => `- ${path}`),
      ].join("\n")
    );
  }

  const unseenPaths = sortedPaths.filter((path) => !WARNED_PLACEHOLDER_PATHS.has(path));
  if (unseenPaths.length === 0) return;

  for (const path of unseenPaths) {
    WARNED_PLACEHOLDER_PATHS.add(path);
  }

  console.warn(
    [
      "[leadScoring] Unresolved TODO points defaulted to 0 in production mode:",
      ...unseenPaths.map((path) => `- ${path}`),
    ].join("\n")
  );
};

const resolveConfiguredPoint = (
  value: LeadScorePointValue,
  path: string,
  unresolvedPaths: Set<string>
): number => {
  if (value === TODO_POINT) {
    unresolvedPaths.add(path);
    return 0;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    unresolvedPaths.add(path);
    return 0;
  }

  return toNonNegativeInteger(value);
};

const findMatchingAnswerKey = (
  answerPoints: Readonly<Record<string, LeadScorePointValue>>,
  answer: string
): string | null => {
  if (Object.prototype.hasOwnProperty.call(answerPoints, answer)) {
    return answer;
  }

  const normalizedAnswer = answer.trim();
  for (const key of Object.keys(answerPoints)) {
    if (key.trim() === normalizedAnswer) {
      return key;
    }
  }

  return null;
};

const averageSafetySliderValue = (
  context: LeadScoringContext,
  fields: readonly (keyof LeadScoringContext)[]
): number | null => {
  const values: number[] = [];

  for (const field of fields) {
    const value = context[field];
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    values.push(clampSafetyScore(value));
  }

  if (values.length === 0) return null;

  const total = values.reduce((sum, value) => sum + value, 0);
  return clampSafetyScore(total / values.length);
};

const evaluateBooleanQuestion = (
  sectionPath: string,
  question: LeadScoreBooleanQuestionConfig,
  context: LeadScoringContext,
  unresolvedPaths: Set<string>
): SectionQuestionEvaluation => {
  const yesPath = `${sectionPath}.questions.${question.id}.points.yes`;
  const noPath = `${sectionPath}.questions.${question.id}.points.no`;

  const yesPoints = resolveConfiguredPoint(question.points.yes, yesPath, unresolvedPaths);
  const noPoints = resolveConfiguredPoint(question.points.no, noPath, unresolvedPaths);

  const value = context[question.field];
  const selectedAnswer =
    value === true ? "Yes" : value === false ? "No" : null;

  const rawPoints =
    value === true ? yesPoints : value === false ? noPoints : 0;

  return {
    id: question.id,
    label: question.label,
    selectedAnswer,
    rawPoints,
    maxPoints: Math.max(yesPoints, noPoints),
  };
};

const evaluateSingleSelectQuestion = (
  sectionPath: string,
  question: LeadScoreSingleSelectQuestionConfig,
  context: LeadScoringContext,
  unresolvedPaths: Set<string>
): SectionQuestionEvaluation => {
  let maxPoints = 0;
  for (const [answer, configuredValue] of Object.entries(question.points)) {
    const resolved = resolveConfiguredPoint(
      configuredValue,
      `${sectionPath}.questions.${question.id}.points.${answer}`,
      unresolvedPaths
    );
    maxPoints = Math.max(maxPoints, resolved);
  }

  const selectedRawValue = context[question.field];
  const selectedValue = typeof selectedRawValue === "string" ? selectedRawValue.trim() : "";

  if (!selectedValue) {
    return {
      id: question.id,
      label: question.label,
      selectedAnswer: null,
      rawPoints: 0,
      maxPoints,
    };
  }

  const selectedAnswerKey = findMatchingAnswerKey(question.points, selectedValue);
  if (!selectedAnswerKey) {
    return {
      id: question.id,
      label: question.label,
      selectedAnswer: selectedValue,
      rawPoints: 0,
      maxPoints,
    };
  }

  const rawPoints = resolveConfiguredPoint(
    question.points[selectedAnswerKey],
    `${sectionPath}.questions.${question.id}.points.${selectedAnswerKey}`,
    unresolvedPaths
  );

  return {
    id: question.id,
    label: question.label,
    selectedAnswer: selectedAnswerKey,
    rawPoints,
    maxPoints,
  };
};

const evaluateSafetySliderInverseQuestion = (
  question: LeadScoreSafetySliderInverseQuestionConfig,
  context: LeadScoringContext
): SectionQuestionEvaluation => {
  const sliderValue = averageSafetySliderValue(context, question.fields);
  const rawPoints = sliderValue === null ? 0 : SAFETY_SCORE_MAX - sliderValue;

  return {
    id: question.id,
    label: question.label,
    selectedAnswer: sliderValue === null ? null : `Score ${sliderValue}`,
    rawPoints,
    maxPoints: SAFETY_SCORE_MAX,
  };
};

const evaluateTextPresenceQuestion = (
  sectionPath: string,
  question: LeadScoreTextPresenceQuestionConfig,
  context: LeadScoringContext,
  unresolvedPaths: Set<string>
): SectionQuestionEvaluation => {
  const filledPath = `${sectionPath}.questions.${question.id}.points.filled`;
  const emptyPath = `${sectionPath}.questions.${question.id}.points.empty`;

  const filledPoints = resolveConfiguredPoint(
    question.points.filled,
    filledPath,
    unresolvedPaths
  );
  const emptyPoints = resolveConfiguredPoint(
    question.points.empty,
    emptyPath,
    unresolvedPaths
  );

  const rawValue = context[question.field];
  const hasValue = typeof rawValue === "string" && rawValue.trim().length > 0;

  return {
    id: question.id,
    label: question.label,
    selectedAnswer: hasValue ? "Provided" : "Not provided",
    rawPoints: hasValue ? filledPoints : emptyPoints,
    maxPoints: Math.max(filledPoints, emptyPoints),
  };
};

const evaluateSection = (
  section: (typeof LEAD_SCORING_SECTIONS)[number],
  context: LeadScoringContext,
  unresolvedPaths: Set<string>
): SectionEvaluation => {
  const sectionPath = `sections.${section.id}`;

  const questions: SectionQuestionEvaluation[] = section.questions.map((question) => {
    if (question.type === "boolean") {
      return evaluateBooleanQuestion(sectionPath, question, context, unresolvedPaths);
    }

    if (question.type === "single_select") {
      return evaluateSingleSelectQuestion(sectionPath, question, context, unresolvedPaths);
    }

    if (question.type === "text_presence") {
      return evaluateTextPresenceQuestion(sectionPath, question, context, unresolvedPaths);
    }

    return evaluateSafetySliderInverseQuestion(question, context);
  });

  const rawPoints = questions.reduce((sum, item) => sum + item.rawPoints, 0);
  const autoMaxPoints = questions.reduce((sum, item) => sum + item.maxPoints, 0);

  const override =
    typeof section.maxPointsOverride === "number" && Number.isFinite(section.maxPointsOverride)
      ? Math.max(0, section.maxPointsOverride)
      : undefined;
  const effectiveMaxPoints = override ?? autoMaxPoints;
  const weightPercent = toNonNegativeInteger(section.weightPercent);

  const exactWeightedPoints =
    effectiveMaxPoints > 0
      ? Math.min(weightPercent, (rawPoints / effectiveMaxPoints) * weightPercent)
      : 0;

  return {
    id: section.id,
    label: section.label,
    weightPercent,
    rawPoints,
    autoMaxPoints,
    effectiveMaxPoints,
    exactWeightedPoints,
    questions,
  };
};

const allocateByWeights = (weights: readonly number[], target: number): number[] => {
  const normalizedTarget = toNonNegativeInteger(target);
  if (normalizedTarget <= 0) return weights.map(() => 0);

  const normalizedWeights = weights.map((weight) =>
    Number.isFinite(weight) ? Math.max(0, weight) : 0
  );
  const weightTotal = normalizedWeights.reduce((sum, weight) => sum + weight, 0);
  if (weightTotal <= 0) return normalizedWeights.map(() => 0);

  const exacts = normalizedWeights.map((weight) => (weight / weightTotal) * normalizedTarget);
  const points = exacts.map((value) => Math.floor(value));
  let remaining = normalizedTarget - points.reduce((sum, value) => sum + value, 0);

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

const allocateSectionPoints = (
  sectionExacts: readonly number[],
  sectionMaxPoints: readonly number[],
  targetScore: number
): number[] => {
  const normalizedTarget = toNonNegativeInteger(targetScore);
  if (normalizedTarget <= 0) return sectionExacts.map(() => 0);

  const states = sectionExacts.map((exactValue, index) => {
    const maxPoints = toNonNegativeInteger(sectionMaxPoints[index] ?? 0);
    const exact = Math.min(maxPoints, normalizeToNonNegativeNumber(exactValue));
    const points = Math.min(maxPoints, Math.floor(exact));

    return {
      index,
      maxPoints,
      exact,
      remainder: exact - points,
      points,
    };
  });

  let delta = normalizedTarget - states.reduce((sum, state) => sum + state.points, 0);

  const increaseOrder = [...states]
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
    .map((state) => state.index);
  const decreaseOrder = [...states]
    .sort((a, b) => a.remainder - b.remainder || a.index - b.index)
    .map((state) => state.index);

  let cursor = 0;
  let stalled = 0;
  while (delta > 0 && increaseOrder.length > 0) {
    const state = states[increaseOrder[cursor % increaseOrder.length]];
    if (state.points < state.maxPoints) {
      state.points += 1;
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
    const state = states[decreaseOrder[cursor % decreaseOrder.length]];
    if (state.points > 0) {
      state.points -= 1;
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

const buildLeadScoreBreakdown = (
  sections: readonly SectionEvaluation[],
  sectionPoints: readonly number[]
): LeadScoreBreakdownItem[] =>
  sections.map((section, index) => {
    const points = toNonNegativeInteger(sectionPoints[index] ?? 0);
    const questionPoints = allocateByWeights(
      section.questions.map((question) => question.rawPoints),
      points
    );

    const matchedAnswers = section.questions.map((question, questionIndex) => ({
      answer: `${question.label}: ${question.selectedAnswer ?? "Unanswered"}`,
      points: questionPoints[questionIndex] ?? 0,
    }));

    const matchedPoints = matchedAnswers.reduce<number>(
      (sum, item) => sum + item.points,
      0
    );

    return {
      id: section.id,
      label: section.label,
      questionKey: section.id,
      selectedAnswers: uniqueAnswers(
        section.questions
          .map((question) => question.selectedAnswer)
          .filter((value): value is string => typeof value === "string")
      ),
      matchedAnswers,
      matchedPoints,
      bonusPoints: 0,
      maxPoints: section.weightPercent,
      points,
    };
  });

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

export const calculateLeadScore = (
  context: LeadScoringContext
): LeadScoreCalculationResult => {
  const unresolvedPaths = new Set<string>();
  const sections = LEAD_SCORING_SECTIONS.map((section) =>
    evaluateSection(section, context, unresolvedPaths)
  );

  applyPlaceholderPolicy(unresolvedPaths);

  const exactScore = sections.reduce(
    (sum, section) => sum + section.exactWeightedPoints,
    0
  );
  const leadScore = clampLeadScore(exactScore);

  const sectionPoints = allocateSectionPoints(
    sections.map((section) => section.exactWeightedPoints),
    sections.map((section) => section.weightPercent),
    leadScore
  );

  return {
    leadScore,
    leadScoreBreakdown: buildLeadScoreBreakdown(sections, sectionPoints),
    leadScoringModelVersion: LEAD_SCORING_MODEL_VERSION,
  };
};
