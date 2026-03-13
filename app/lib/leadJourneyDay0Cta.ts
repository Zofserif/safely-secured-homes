export const LEAD_DAY_0_STEP_KEY = "lead_day_0_story";
export const LEAD_DAY_0_NON_BONUS_SOURCE = "lead_journey_day_0_no_bonus";
export const LEAD_DAY_0_NON_BONUS_COPY =
  "P.S. Just remember 'Troy to Call' for any home-related safety consult.";
export const LEAD_DAY_0_NON_BONUS_LINK_LABEL =
  "Click here for your FREE Home Call Consult.";
export const LEAD_DAY_0_BONUS_COPY =
  "P.S. As promised, your free Panatag mug bonus is ready for shipping.";
export const LEAD_DAY_0_BONUS_LINK_LABEL = "Click here for instructions.";

const DEFAULT_EMAIL_CTA_BASE_URL = "https://www.safelysecuredhomes.com";
const LEAD_FOLLOW_UP_JOURNEY_KEY = "lead_follow_up_journey";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildParagraphCtaHtml = ({
  bodyText,
  linkLabel,
  url,
}: {
  bodyText: string;
  linkLabel: string;
  url: string;
}) =>
  `<p style="margin:24px 0 0 0;color:#1F2937;font-size:16px;line-height:1.6;">${escapeHtml(
    bodyText,
  )} <a href="${escapeHtml(
    url,
  )}" target="_blank" style="color:#0E79B2;font-weight:700;text-decoration:underline;">${escapeHtml(
    linkLabel,
  )}</a></p>`;

export const createLeadDay0NonBonusUrl = (
  baseUrl = DEFAULT_EMAIL_CTA_BASE_URL,
): string =>
  new URL(
    `/schedule-call?source=${LEAD_DAY_0_NON_BONUS_SOURCE}`,
    `${baseUrl}/`,
  ).toString();

export const buildLeadDay0NonBonusCtaHtml = (
  baseUrl = DEFAULT_EMAIL_CTA_BASE_URL,
): string =>
  buildParagraphCtaHtml({
    bodyText: LEAD_DAY_0_NON_BONUS_COPY,
    linkLabel: LEAD_DAY_0_NON_BONUS_LINK_LABEL,
    url: createLeadDay0NonBonusUrl(baseUrl),
  });

export const buildLeadDay0BonusCtaHtml = (bonusUrl: string): string =>
  buildParagraphCtaHtml({
    bodyText: LEAD_DAY_0_BONUS_COPY,
    linkLabel: LEAD_DAY_0_BONUS_LINK_LABEL,
    url: bonusUrl,
  });

export const isLeadDay0JourneyEmail = (
  journeyKey: string,
  stepKey: string,
): boolean =>
  journeyKey === LEAD_FOLLOW_UP_JOURNEY_KEY && stepKey === LEAD_DAY_0_STEP_KEY;

export const buildLeadDay0BonusLinkSourceKey = (deliveryId: string): string =>
  `${LEAD_FOLLOW_UP_JOURNEY_KEY}:${LEAD_DAY_0_STEP_KEY}:${deliveryId}`;

export const buildLeadDay0BonusLinkNote = (sourceKey: string): string =>
  `Lead day 0 Panatag mug bonus link for ${sourceKey}`;
