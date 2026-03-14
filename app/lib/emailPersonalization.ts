export const EMAIL_PERSONALIZATION_NAME_TOKEN = "{name}";
export const DEFAULT_EMAIL_PERSONALIZATION_NAME = "there";

export type EmailPersonalizationContext = {
  name?: string | null;
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

const replaceExactNameToken = (value: string, replacement: string) =>
  value.includes(EMAIL_PERSONALIZATION_NAME_TOKEN)
    ? value.split(EMAIL_PERSONALIZATION_NAME_TOKEN).join(replacement)
    : value;

const replaceHtmlTextNodes = (value: string, replacement: string) =>
  value
    .split(/(<[^>]+>)/g)
    .map((segment) =>
      segment.startsWith("<") && segment.endsWith(">")
        ? segment
        : replaceExactNameToken(segment, replacement),
    )
    .join("");

export const resolveEmailPersonalizationName = (
  context: EmailPersonalizationContext = {},
) => toSafeString(context.name) || DEFAULT_EMAIL_PERSONALIZATION_NAME;

export const personalizeEmailPlainText = (
  value: string,
  context: EmailPersonalizationContext = {},
) => replaceExactNameToken(value, resolveEmailPersonalizationName(context));

export const personalizeEmailHtml = (
  value: string,
  context: EmailPersonalizationContext = {},
) =>
  replaceHtmlTextNodes(
    value,
    escapeHtml(resolveEmailPersonalizationName(context)),
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
