import emailjs from "@emailjs/browser";
import { getBlogPostById, type BlogPost } from "./blogPosts";
import { deriveNameFromEmail, normalizeEmail } from "./contactName";
import { panatagChecklistUrl, siteUrl } from "./site";

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";
const EMAIL_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "";

const DEFAULT_LEAD_SUBJECT = "We received your home security inquiry";
const DEFAULT_LEAD_TITLE = "Your request is in";
const DEFAULT_LEAD_PREVIEW_TEXT =
  "Thanks for reaching out. We received your inquiry and will contact you soon.";
const DEFAULT_LEAD_CONTENT = [
  "<p>Thanks for reaching out to Safely Secured Homes.</p>",
  "<p>We received your inquiry and a home security consultant will review your request and contact you with next steps.</p>",
  "<p>If you want to move faster, you can book a quick call with us today.</p>",
].join("");
const DEFAULT_LEAD_CTA_LABEL = "Book a Quick Security Call";
const DEFAULT_CHECKLIST_TITLE = "Your Panatag Home Checklist";
const DEFAULT_CHECKLIST_PREVIEW_TEXT =
  "Your free Panatag Home Checklist is ready for download.";

export type EmailTemplateKind = "lead" | "checklist" | "newsletter";
export type NewsletterEmailPost = Pick<
  BlogPost,
  "id" | "subject" | "title" | "previewText" | "content" | "cta"
>;
export type NewsletterEmailRecipient = {
  toEmail: string;
  name?: string;
};
export type SharedEmailTemplateParams = {
  to_email: string;
  name: string;
  subject: string;
  title: string;
  preview_text: string;
  content: string;
  cta: string;
};

export type LeadEmailInput = {
  to_email: string;
  name?: string;
};

export type ChecklistEmailInput = {
  to_email: string;
  name?: string;
  checklist_name?: string;
  checklist_url?: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const resolveAbsoluteUrl = (value: string) => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return "";

  if (trimmedValue.startsWith("/")) {
    try {
      return new URL(trimmedValue, siteUrl).toString();
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

const buildEmailCta = ({ label, url }: { label: string; url: string }) =>
  `<div style="margin:24px 0 0 0;"><a href="${escapeHtml(
    url,
  )}" target="_blank" style="display:inline-block;border-radius:9999px;background-color:#0E79B2;color:#FFFFFF;font-weight:700;line-height:1.2;padding:14px 24px;text-decoration:none;">${escapeHtml(
    label,
  )}</a></div>`;

const resolveRecipient = ({
  to_email,
  name,
}: {
  to_email: string;
  name?: string;
}) => {
  const normalizedRecipientEmail = normalizeEmail(to_email);
  if (!normalizedRecipientEmail) {
    throw new Error("Recipient email is required to build EmailJS template params.");
  }

  return {
    to_email: normalizedRecipientEmail,
    name: name?.trim() || deriveNameFromEmail(normalizedRecipientEmail),
  };
};

const buildLeadTemplateParams = (
  input: LeadEmailInput,
): SharedEmailTemplateParams => {
  const recipient = resolveRecipient(input);
  const scheduleCallUrl = resolveAbsoluteUrl("/schedule-call");

  return {
    ...recipient,
    subject: DEFAULT_LEAD_SUBJECT,
    title: DEFAULT_LEAD_TITLE,
    preview_text: DEFAULT_LEAD_PREVIEW_TEXT,
    content: DEFAULT_LEAD_CONTENT,
    cta: scheduleCallUrl
      ? buildEmailCta({
          label: DEFAULT_LEAD_CTA_LABEL,
          url: scheduleCallUrl,
        })
      : "",
  };
};

const buildChecklistTemplateParams = (
  input: ChecklistEmailInput,
): SharedEmailTemplateParams => {
  const recipient = resolveRecipient(input);
  const checklistName = input.checklist_name?.trim() || DEFAULT_CHECKLIST_TITLE;
  const checklistUrl = resolveAbsoluteUrl(input.checklist_url?.trim() || panatagChecklistUrl);

  return {
    ...recipient,
    subject: `${checklistName} is ready`,
    title: checklistName,
    preview_text: DEFAULT_CHECKLIST_PREVIEW_TEXT,
    content: [
      `<p>Your free <strong>${escapeHtml(checklistName)}</strong> is ready.</p>`,
      "<p>Use it to review the key safety gaps around your home and take the first practical steps toward a more secure setup.</p>",
      checklistUrl
        ? "<p>Use the button below to open or download your copy.</p>"
        : "<p>Your checklist is ready and will be shared with you shortly.</p>",
    ].join(""),
    cta: checklistUrl
      ? buildEmailCta({
          label: `Download ${checklistName}`,
          url: checklistUrl,
        })
      : "",
  };
};

export function buildNewsletterTemplateParams(
  post: NewsletterEmailPost,
  recipient: NewsletterEmailRecipient,
): SharedEmailTemplateParams {
  const resolvedRecipient = resolveRecipient({
    to_email: recipient.toEmail,
    name: recipient.name,
  });

  return {
    ...resolvedRecipient,
    subject: post.subject,
    title: post.title,
    preview_text: post.previewText,
    content: post.content,
    cta: post.cta,
  };
}

const normalizeSharedTemplateParams = (
  templateKind: EmailTemplateKind,
  templateParams:
    | LeadEmailInput
    | ChecklistEmailInput
    | SharedEmailTemplateParams,
): SharedEmailTemplateParams => {
  switch (templateKind) {
    case "lead":
      return buildLeadTemplateParams(templateParams as LeadEmailInput);
    case "checklist":
      return buildChecklistTemplateParams(templateParams as ChecklistEmailInput);
    case "newsletter":
      return templateParams as SharedEmailTemplateParams;
    default: {
      const exhaustiveCheck: never = templateKind;
      throw new Error(`Unsupported EmailJS template kind: ${exhaustiveCheck}`);
    }
  }
};

/**
 * Usage:
 * await sendEmail("checklist", { to_email, name, checklist_name, checklist_url });
 * await sendEmail("lead", { to_email, name });
 * await sendNewsletterEmail(post, { toEmail: "you@example.com", name: "Lemon" });
 * await sendNewsletterEmailByPostId(postId, { toEmail: "you@example.com", name: "Lemon" });
 * node --experimental-strip-types --input-type=module -e "import { sendEmail } from './app/lib/email.ts'; await sendEmail('lead', { to_email: 'you@example.com', name: 'Lemon' })"
 */
export function sendEmail(
  templateKind: "lead",
  templateParams: LeadEmailInput,
): Promise<unknown> | undefined;
export function sendEmail(
  templateKind: "checklist",
  templateParams: ChecklistEmailInput,
): Promise<unknown> | undefined;
export function sendEmail(
  templateKind: "newsletter",
  templateParams: SharedEmailTemplateParams,
): Promise<unknown> | undefined;
export function sendEmail(
  templateKind: EmailTemplateKind,
  templateParams:
    | LeadEmailInput
    | ChecklistEmailInput
    | SharedEmailTemplateParams,
) {
  if (!SERVICE_ID || !PUBLIC_KEY) {
    console.warn("EmailJS is not configured; skipping send.", {
      SERVICE_ID,
      PUBLIC_KEY,
      templateKind,
    });
    return;
  }

  if (!EMAIL_TEMPLATE_ID) {
    console.warn("EmailJS template is not configured; skipping send.", {
      templateKind,
      templateId: EMAIL_TEMPLATE_ID,
    });
    return;
  }

  const normalizedTemplateParams = normalizeSharedTemplateParams(
    templateKind,
    templateParams,
  );

  return emailjs.send(
    SERVICE_ID,
    EMAIL_TEMPLATE_ID,
    normalizedTemplateParams,
    PUBLIC_KEY,
  );
}

export async function sendNewsletterEmail(
  post: NewsletterEmailPost,
  recipient: NewsletterEmailRecipient,
) {
  return sendEmail("newsletter", buildNewsletterTemplateParams(post, recipient));
}

export async function sendNewsletterEmailByPostId(
  postId: string,
  recipient: NewsletterEmailRecipient,
) {
  const post = await getBlogPostById(postId);
  if (!post) {
    throw new Error(`Blog post "${postId}" was not found.`);
  }

  return sendNewsletterEmail(post, recipient);
}
