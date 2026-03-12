import "server-only";

import { getBlogPostById } from "./blogPosts";
import { deriveNameFromEmail, normalizeEmail } from "./contactName";
import {
  ensureEmailDelivery,
  getNewsletterSubscriberById,
  updateEmailDeliveryStatus,
  type EmailJourneyKey,
} from "./newsletterCampaigns";
import { sendNewsletterEmail } from "./email";
import { createNewsletterUnsubscribeUrl } from "./newsletterSubscribers";

type SendTrackedEnrollmentNewsletterEmailInput = {
  journeyKey: EmailJourneyKey;
  subscriberId: string;
  enrollmentId: string;
  recipientEmail: string;
  recipientName?: string;
  postId: string;
  stepKey: string;
  ctaOverrideHtml?: string;
};

type SendTrackedBroadcastNewsletterEmailInput = {
  sendKey: string;
  subscriberId: string;
  recipientEmail: string;
  recipientName?: string;
  postId: string;
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

const resolveRecipientName = (email: string, recipientName?: string) =>
  toSafeString(recipientName) || deriveNameFromEmail(email);

export async function sendTrackedEnrollmentNewsletterCampaignEmailByPostId({
  journeyKey,
  subscriberId,
  enrollmentId,
  recipientEmail,
  recipientName,
  postId,
  stepKey,
  ctaOverrideHtml,
}: SendTrackedEnrollmentNewsletterEmailInput) {
  const normalizedRecipientEmail = normalizeEmail(recipientEmail);
  if (!normalizedRecipientEmail) {
    throw new Error("Recipient email is required for tracked enrollment sends.");
  }

  const post = await getBlogPostById(postId);
  if (!post) {
    throw new Error(`Blog post "${postId}" was not found.`);
  }

  const subscriber = await getNewsletterSubscriberById(subscriberId);
  if (!subscriber) {
    throw new Error(`Subscriber "${subscriberId}" was not found.`);
  }

  const delivery = await ensureEmailDelivery({
    subscriberId,
    deliveryKind: "journey",
    enrollmentId,
    journeyKey,
    stepKey,
    blogPostId: postId,
    status: "queued",
  });

  if (delivery.status === "sent") {
    return {
      sendLogId: delivery.id,
      sendResult: null,
      skipped: true,
    };
  }

  try {
    const sendResult = await sendNewsletterEmail(
      {
        ...post,
        cta: toSafeString(ctaOverrideHtml) || post.cta,
      },
      {
        toEmail: normalizedRecipientEmail,
        name: resolveRecipientName(normalizedRecipientEmail, recipientName),
        unsubscribeUrl: createNewsletterUnsubscribeUrl(subscriber.unsubscribeToken),
      },
    );

    if (!sendResult) {
      throw new Error("EmailJS is not configured for tracked newsletter sends.");
    }

    await updateEmailDeliveryStatus(delivery.id, "sent", {
      providerMessageId: resolveProviderMessageId(sendResult),
    });

    return {
      sendLogId: delivery.id,
      sendResult,
      skipped: false,
    };
  } catch (error) {
    await updateEmailDeliveryStatus(delivery.id, "failed", {
      errorMessage:
        error instanceof Error ? error.message : "Tracked enrollment send failed.",
    });
    throw error;
  }
}

export async function sendTrackedBroadcastNewsletterEmailByPostId({
  sendKey,
  subscriberId,
  recipientEmail,
  recipientName,
  postId,
}: SendTrackedBroadcastNewsletterEmailInput) {
  const normalizedRecipientEmail = normalizeEmail(recipientEmail);
  if (!normalizedRecipientEmail) {
    throw new Error("Recipient email is required for tracked broadcast sends.");
  }

  const post = await getBlogPostById(postId);
  if (!post) {
    throw new Error(`Blog post "${postId}" was not found.`);
  }

  const subscriber = await getNewsletterSubscriberById(subscriberId);
  if (!subscriber) {
    throw new Error(`Subscriber "${subscriberId}" was not found.`);
  }

  const delivery = await ensureEmailDelivery({
    subscriberId,
    deliveryKind: "broadcast",
    sendKey,
    blogPostId: postId,
    status: "queued",
  });

  if (delivery.status === "sent") {
    return {
      sendLogId: delivery.id,
      sendResult: null,
      skipped: true,
    };
  }

  try {
    const sendResult = await sendNewsletterEmail(post, {
      toEmail: normalizedRecipientEmail,
      name: resolveRecipientName(normalizedRecipientEmail, recipientName),
      unsubscribeUrl: createNewsletterUnsubscribeUrl(subscriber.unsubscribeToken),
    });

    if (!sendResult) {
      throw new Error("EmailJS is not configured for tracked newsletter sends.");
    }

    await updateEmailDeliveryStatus(delivery.id, "sent", {
      providerMessageId: resolveProviderMessageId(sendResult),
    });

    return {
      sendLogId: delivery.id,
      sendResult,
      skipped: false,
    };
  } catch (error) {
    await updateEmailDeliveryStatus(delivery.id, "failed", {
      errorMessage:
        error instanceof Error ? error.message : "Tracked broadcast send failed.",
    });
    throw error;
  }
}
