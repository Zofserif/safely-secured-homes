import "server-only";

import { getBlogPostById } from "./blogPosts";
import { deriveNameFromEmail, normalizeEmail } from "./contactName";
import {
  ensureCampaignEnrollment,
  type CampaignAssignmentMethod,
  type EmailCampaignKey,
  type NewsletterAssignmentProfile,
  syncNewsletterSubscriber,
  createCampaignSendLog,
  updateCampaignSendLogStatus,
} from "./newsletterCampaigns";
import {
  sendNewsletterEmail,
  sendNewsletterEmailByPostId,
  type NewsletterEmailPost,
} from "./email";

type SendTrackedNewsletterEmailInput = {
  campaignKey: EmailCampaignKey;
  recipientEmail: string;
  recipientName?: string;
  acquisitionSource?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  assignmentProfile?: NewsletterAssignmentProfile;
  stepKey?: string;
  stepOrder?: number | null;
  assignmentMethod?: CampaignAssignmentMethod;
  assignmentReason?: string;
};

const toSafeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const resolveProviderMessageId = (value: unknown) => {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  if (typeof record.text === "string" && record.text.trim()) {
    return record.text.trim();
  }
  if (typeof record.status === "string" && record.status.trim()) {
    return record.status.trim();
  }
  if (typeof record.status === "number") {
    return String(record.status);
  }
  return "";
};

const buildSendablePost = (
  post: NewsletterEmailPost,
  ctaOverrideHtml?: string,
): NewsletterEmailPost => ({
  ...post,
  cta: toSafeString(ctaOverrideHtml) || post.cta,
});

const prepareTrackedSend = async ({
  campaignKey,
  recipientEmail,
  recipientName,
  acquisitionSource,
  utmSource,
  utmMedium,
  utmCampaign,
  assignmentProfile = "newsletter_signup",
  stepKey,
  stepOrder,
  assignmentMethod = "manual",
  assignmentReason = "tracked_send",
}: SendTrackedNewsletterEmailInput) => {
  const normalizedRecipientEmail = normalizeEmail(recipientEmail);
  if (!normalizedRecipientEmail) {
    throw new Error("Recipient email is required for campaign email sends.");
  }

  const subscriber = await syncNewsletterSubscriber({
    email: normalizedRecipientEmail,
    name: toSafeString(recipientName) || deriveNameFromEmail(normalizedRecipientEmail),
    acquisitionSource,
    utmSource,
    utmMedium,
    utmCampaign,
    assignmentProfile,
  });

  const enrollment = await ensureCampaignEnrollment({
    subscriberId: subscriber.subscriberId,
    campaignKey,
    currentStepKey: stepKey,
    currentStepOrder: stepOrder,
    assignmentMethod,
    assignmentReason,
  });

  const sendLog = await createCampaignSendLog({
    subscriberId: subscriber.subscriberId,
    campaignId: enrollment.campaignId,
    enrollmentId: enrollment.enrollmentId,
    stepKey,
    status: "queued",
  });

  return {
    subscriberId: subscriber.subscriberId,
    enrollment,
    sendLogId: sendLog.id,
    recipientName:
      toSafeString(recipientName) || deriveNameFromEmail(normalizedRecipientEmail),
    recipientEmail: normalizedRecipientEmail,
  };
};

export async function sendTrackedNewsletterCampaignEmail(
  post: NewsletterEmailPost,
  input: SendTrackedNewsletterEmailInput,
) {
  const preparedSend = await prepareTrackedSend(input);

  try {
    const sendResult = await sendNewsletterEmail(post, {
      toEmail: preparedSend.recipientEmail,
      name: preparedSend.recipientName,
    });

    if (!sendResult) {
      throw new Error("EmailJS is not configured for tracked newsletter sends.");
    }

    await updateCampaignSendLogStatus(preparedSend.sendLogId, "sent", {
      providerMessageId: resolveProviderMessageId(sendResult),
    });

    return {
      sendLogId: preparedSend.sendLogId,
      subscriberId: preparedSend.subscriberId,
      campaignId: preparedSend.enrollment.campaignId,
      enrollmentId: preparedSend.enrollment.enrollmentId,
      sendResult,
    };
  } catch (error) {
    await updateCampaignSendLogStatus(preparedSend.sendLogId, "failed", {
      errorMessage: error instanceof Error ? error.message : "Tracked send failed.",
    });
    throw error;
  }
}

export async function sendTrackedNewsletterCampaignEmailByPostId(
  postId: string,
  input: SendTrackedNewsletterEmailInput,
) {
  const preparedSend = await prepareTrackedSend(input);

  try {
    const sendResult = await sendNewsletterEmailByPostId(postId, {
      toEmail: preparedSend.recipientEmail,
      name: preparedSend.recipientName,
    });

    if (!sendResult) {
      throw new Error("EmailJS is not configured for tracked newsletter sends.");
    }

    await updateCampaignSendLogStatus(preparedSend.sendLogId, "sent", {
      providerMessageId: resolveProviderMessageId(sendResult),
    });

    return {
      sendLogId: preparedSend.sendLogId,
      subscriberId: preparedSend.subscriberId,
      campaignId: preparedSend.enrollment.campaignId,
      enrollmentId: preparedSend.enrollment.enrollmentId,
      sendResult,
    };
  } catch (error) {
    await updateCampaignSendLogStatus(preparedSend.sendLogId, "failed", {
      errorMessage: error instanceof Error ? error.message : "Tracked send failed.",
    });
    throw error;
  }
}

export async function sendTrackedEnrollmentNewsletterCampaignEmailByPostId({
  campaignId,
  subscriberId,
  enrollmentId,
  recipientEmail,
  recipientName,
  postId,
  stepKey,
  ctaOverrideHtml,
}: {
  campaignId: string;
  subscriberId: string;
  enrollmentId: string;
  recipientEmail: string;
  recipientName?: string;
  postId: string;
  stepKey: string;
  ctaOverrideHtml?: string;
}) {
  const normalizedRecipientEmail = normalizeEmail(recipientEmail);
  if (!normalizedRecipientEmail) {
    throw new Error("Recipient email is required for tracked enrollment sends.");
  }

  const post = await getBlogPostById(postId);
  if (!post) {
    throw new Error(`Blog post "${postId}" was not found.`);
  }

  const sendLog = await createCampaignSendLog({
    subscriberId,
    campaignId,
    enrollmentId,
    stepKey,
    status: "queued",
  });

  try {
    const sendResult = await sendNewsletterEmail(
      buildSendablePost(post, ctaOverrideHtml),
      {
        toEmail: normalizedRecipientEmail,
        name:
          toSafeString(recipientName) ||
          deriveNameFromEmail(normalizedRecipientEmail),
      },
    );

    if (!sendResult) {
      throw new Error("EmailJS is not configured for tracked newsletter sends.");
    }

    await updateCampaignSendLogStatus(sendLog.id, "sent", {
      providerMessageId: resolveProviderMessageId(sendResult),
    });

    return {
      sendLogId: sendLog.id,
      sendResult,
    };
  } catch (error) {
    await updateCampaignSendLogStatus(sendLog.id, "failed", {
      errorMessage:
        error instanceof Error ? error.message : "Tracked enrollment send failed.",
    });
    throw error;
  }
}
