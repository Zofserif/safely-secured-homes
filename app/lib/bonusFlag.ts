export const HAS_BONUS_QUERY_PARAM = "has_bonus";

export const parseHasBonusQueryValue = (
  value: string | null | undefined,
): boolean => value === "true";

export const formatHasBonusQueryValue = (value: boolean): string =>
  value ? "true" : "false";
