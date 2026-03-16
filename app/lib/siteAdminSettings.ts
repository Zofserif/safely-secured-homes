export const SITE_ADMIN_SETTINGS_KEY = "global";
export const DEFAULT_PANATAG_CYCLE_LIMIT = 15;
export const MIN_PANATAG_CYCLE_LIMIT = 1;

export type PublicSiteSettings = {
  bonusEnabled: boolean;
  panatagCycleLimit: number;
  resultsReviewCtaEnabled: boolean;
};

export const DEFAULT_PUBLIC_SITE_SETTINGS: PublicSiteSettings = {
  bonusEnabled: false,
  panatagCycleLimit: DEFAULT_PANATAG_CYCLE_LIMIT,
  resultsReviewCtaEnabled: true,
};

const toFiniteInteger = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

export const normalizePanatagCycleLimit = (value: unknown): number => {
  const parsed = toFiniteInteger(value);
  if (parsed === null || parsed < MIN_PANATAG_CYCLE_LIMIT) {
    return DEFAULT_PANATAG_CYCLE_LIMIT;
  }

  return parsed;
};

export const normalizePublicSiteSettings = (
  value?: Partial<PublicSiteSettings> | null,
): PublicSiteSettings => ({
  bonusEnabled:
    typeof value?.bonusEnabled === "boolean"
      ? value.bonusEnabled
      : DEFAULT_PUBLIC_SITE_SETTINGS.bonusEnabled,
  panatagCycleLimit:
    value && "panatagCycleLimit" in value
      ? normalizePanatagCycleLimit(value.panatagCycleLimit)
      : DEFAULT_PUBLIC_SITE_SETTINGS.panatagCycleLimit,
  resultsReviewCtaEnabled:
    typeof value?.resultsReviewCtaEnabled === "boolean"
      ? value.resultsReviewCtaEnabled
      : DEFAULT_PUBLIC_SITE_SETTINGS.resultsReviewCtaEnabled,
});
