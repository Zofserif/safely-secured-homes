const EMAIL_FOOTER_HOME_URL = "https://www.safelysecuredhomes.com";
const EMAIL_FOOTER_LOGO_PATH = "/assets/img/Email/email-footer-logo.jpg";
const EMAIL_FOOTER_LOGO_URL = new URL(
  EMAIL_FOOTER_LOGO_PATH,
  EMAIL_FOOTER_HOME_URL,
).toString();
const EMAIL_FOOTER_ADDRESS =
  "Safely Secured Homes, Candelaria, Quezon, 4323, Philippines";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const resolveFooterUrl = (value: string) => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return "";

  if (trimmedValue.startsWith("/")) {
    try {
      return new URL(trimmedValue, `${EMAIL_FOOTER_HOME_URL}/`).toString();
    } catch {
      return "";
    }
  }

  try {
    const parsedUrl = new URL(trimmedValue);
    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return parsedUrl.toString();
    }
  } catch {
    return "";
  }

  return "";
};

export const buildSharedEmailFooter = (unsubscribeUrl: string) => {
  const resolvedUnsubscribeUrl = resolveFooterUrl(unsubscribeUrl);
  if (!resolvedUnsubscribeUrl) {
    throw new Error("A valid unsubscribe URL is required for app-generated emails.");
  }

  return [
    '<div style="margin:32px 0 0 0;border-top:1px solid #E2E8F0;padding-top:24px;text-align:center;">',
    `<a href="${escapeHtml(
      EMAIL_FOOTER_HOME_URL,
    )}" target="_blank" rel="noreferrer" style="display:inline-block;text-decoration:none;">`,
    `<img src="${escapeHtml(
      EMAIL_FOOTER_LOGO_URL,
    )}" alt="Safely Secured Homes" width="250" style="display:block;margin:0 auto;width:250px;max-width:100%;height:auto;border:0;" />`,
    "</a>",
    `<p style="margin:16px 0 0 0;color:#111827;font-size:14px;font-weight:600;line-height:1.5;">${escapeHtml(
      EMAIL_FOOTER_ADDRESS,
    )}</p>`,
    `<p style="margin:4px 0 0 0;font-size:14px;line-height:1.5;"><a href="${escapeHtml(
      resolvedUnsubscribeUrl,
    )}" style="color:#111827;text-decoration:underline;">Unsubscribe</a></p>`,
    "</div>",
  ].join("");
};

export const buildEmailCtaWithFooter = (
  ctaHtml: string,
  unsubscribeUrl: string,
) => {
  const footer = buildSharedEmailFooter(unsubscribeUrl);
  const normalizedCtaHtml = ctaHtml.trim();
  return normalizedCtaHtml ? `${normalizedCtaHtml}${footer}` : footer;
};

export {
  EMAIL_FOOTER_ADDRESS,
  EMAIL_FOOTER_HOME_URL,
  EMAIL_FOOTER_LOGO_URL,
};
