export const SAFETY_SCORE_MIN = 0;
export const SAFETY_SCORE_MAX = 50;
export const SAFETY_SCORE_STEP = 1;

export const SAFETY_TOTAL_CATEGORY_COUNT = 4;
export const SAFETY_TOTAL_MAX_SCORE = SAFETY_TOTAL_CATEGORY_COUNT * SAFETY_SCORE_MAX;

export const clampSafetyScore = (value: number): number => {
  if (!Number.isFinite(value)) return SAFETY_SCORE_MIN;

  const rounded = Math.round(value / SAFETY_SCORE_STEP) * SAFETY_SCORE_STEP;
  return Math.min(SAFETY_SCORE_MAX, Math.max(SAFETY_SCORE_MIN, rounded));
};

export const normalizeSafetyScore = (value: unknown): number | undefined => {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;

  const clamped = clampSafetyScore(value);
  if (clamped !== value) return undefined;
  return clamped;
};
