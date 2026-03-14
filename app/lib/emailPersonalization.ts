export const EMAIL_PERSONALIZATION_NAME_TOKEN = "{name}";
export const EMAIL_PERSONALIZATION_SCORE_TOKEN = "{score}";
export const EMAIL_PERSONALIZATION_SCORE_COMMENT_TOKEN = "{score_comment}";
export const INVALID_EMAIL_PERSONALIZATION_SCORE_COMMENT_TOKEN =
  "{score comment}";
export const DEFAULT_EMAIL_PERSONALIZATION_NAME = "there";
export const DEFAULT_EMAIL_PERSONALIZATION_SCORE = "your current rating";
export const DEFAULT_EMAIL_PERSONALIZATION_SCORE_COMMENT =
  "(I know you want to improve your rating)";

export const EMAIL_PERSONALIZATION_SCORE_TOKENS = [
  EMAIL_PERSONALIZATION_SCORE_TOKEN,
  EMAIL_PERSONALIZATION_SCORE_COMMENT_TOKEN,
] as const;

export type EmailPersonalizationContext = {
  name?: string | null;
  score?: string | null;
  scoreComment?: string | null;
};

export type PersonalizableNewsletterFields = {
  subject: string;
  title: string;
  previewText: string;
  content: string;
  cta: string;
};

const toSafeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const clampScore = (value: number): number =>
  Math.max(0, Math.min(100, Math.round(value)));

const replaceExactTokens = (
  value: string,
  replacements: Readonly<Record<string, string>>,
) => {
  let nextValue = value;

  for (const [token, replacement] of Object.entries(replacements)) {
    if (!nextValue.includes(token)) continue;
    nextValue = nextValue.split(token).join(replacement);
  }

  return nextValue;
};

const replaceHtmlTextNodes = (
  value: string,
  replacements: Readonly<Record<string, string>>,
) =>
  value
    .split(/(<[^>]+>)/g)
    .map((segment) =>
      segment.startsWith("<") && segment.endsWith(">")
        ? segment
        : replaceExactTokens(segment, replacements),
    )
    .join("");

const htmlTextNodesContainPersonalizationToken = (
  value: string,
  tokens?: readonly string[],
): boolean =>
  value
    .split(/(<[^>]+>)/g)
    .some(
      (segment) =>
        !(segment.startsWith("<") && segment.endsWith(">")) &&
        hasEmailPersonalizationToken(segment, tokens),
    );

export const resolveEmailPersonalizationName = (
  context: EmailPersonalizationContext = {},
) => toSafeString(context.name) || DEFAULT_EMAIL_PERSONALIZATION_NAME;

export const resolveEmailPersonalizationScore = (
  context: EmailPersonalizationContext = {},
) => toSafeString(context.score) || DEFAULT_EMAIL_PERSONALIZATION_SCORE;

export const resolveEmailPersonalizationScoreComment = (
  context: EmailPersonalizationContext = {},
) =>
  toSafeString(context.scoreComment) ||
  DEFAULT_EMAIL_PERSONALIZATION_SCORE_COMMENT;

export const formatLeadScoreDisplay = (score: number): string =>
  `${clampScore(score)}%`;

export const getLeadScoreComment = (score: number): string => {
  const safeScore = clampScore(score);

  if (safeScore <= 30) {
    return "Your score is kinda low for comfort, that's why we need to strengthen it";
  }

  if (safeScore <= 60) {
    return "Not bad, but not good either, we've got more work to do";
  }

  return "Your score is nearly there, and only needs minor changes";
};

export const buildLeadScorePersonalizationContext = (
  score: number,
): Pick<EmailPersonalizationContext, "score" | "scoreComment"> => ({
  score: formatLeadScoreDisplay(score),
  scoreComment: getLeadScoreComment(score),
});

export const hasEmailPersonalizationToken = (
  value: string,
  tokens: readonly string[] = [
    EMAIL_PERSONALIZATION_NAME_TOKEN,
    ...EMAIL_PERSONALIZATION_SCORE_TOKENS,
  ],
): boolean => tokens.some((token) => value.includes(token));

export const newsletterFieldsContainPersonalizationTokens = <
  T extends PersonalizableNewsletterFields,
>(
  value: T,
  tokens?: readonly string[],
): boolean =>
  [
    value.subject,
    value.title,
    value.previewText,
  ].some((fieldValue) => hasEmailPersonalizationToken(fieldValue, tokens)) ||
  htmlTextNodesContainPersonalizationToken(value.content, tokens) ||
  htmlTextNodesContainPersonalizationToken(value.cta, tokens);

export const getUnsupportedNewsletterPersonalizationTokenError = <
  T extends PersonalizableNewsletterFields,
>(
  value: T,
): string | null => {
  const fields = [
    value.subject,
    value.title,
    value.previewText,
    value.content,
    value.cta,
  ];

  if (
    fields.some((fieldValue) =>
      fieldValue.includes(INVALID_EMAIL_PERSONALIZATION_SCORE_COMMENT_TOKEN),
    )
  ) {
    return `Unsupported personalization token "${INVALID_EMAIL_PERSONALIZATION_SCORE_COMMENT_TOKEN}". Use "${EMAIL_PERSONALIZATION_SCORE_COMMENT_TOKEN}" instead.`;
  }

  return null;
};

export const assertSupportedNewsletterPersonalizationTokens = <
  T extends PersonalizableNewsletterFields,
>(
  value: T,
) => {
  const errorMessage = getUnsupportedNewsletterPersonalizationTokenError(value);
  if (errorMessage) {
    throw new Error(errorMessage);
  }
};

const resolveEmailPersonalizationTokens = (
  context: EmailPersonalizationContext = {},
): Record<string, string> => ({
  [EMAIL_PERSONALIZATION_NAME_TOKEN]: resolveEmailPersonalizationName(context),
  [EMAIL_PERSONALIZATION_SCORE_TOKEN]: resolveEmailPersonalizationScore(context),
  [EMAIL_PERSONALIZATION_SCORE_COMMENT_TOKEN]:
    resolveEmailPersonalizationScoreComment(context),
});

export const personalizeEmailPlainText = (
  value: string,
  context: EmailPersonalizationContext = {},
) => replaceExactTokens(value, resolveEmailPersonalizationTokens(context));

export const personalizeEmailHtml = (
  value: string,
  context: EmailPersonalizationContext = {},
) =>
  replaceHtmlTextNodes(
    value,
    Object.fromEntries(
      Object.entries(resolveEmailPersonalizationTokens(context)).map(
        ([token, replacement]) => [token, escapeHtml(replacement)],
      ),
    ),
  );

export const personalizeNewsletterFields = <
  T extends PersonalizableNewsletterFields,
>(
  value: T,
  context: EmailPersonalizationContext = {},
): T =>
  ({
    ...value,
    subject: personalizeEmailPlainText(value.subject, context),
    title: personalizeEmailPlainText(value.title, context),
    previewText: personalizeEmailPlainText(value.previewText, context),
    content: personalizeEmailHtml(value.content, context),
    cta: personalizeEmailHtml(value.cta, context),
  }) as T;
