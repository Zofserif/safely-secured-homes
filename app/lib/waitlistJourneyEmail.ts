import "server-only";

import { getBlogPostById } from "./blogPosts";
import {
  EMAIL_PERSONALIZATION_LIMITED_TIME_OFFER_TOKEN,
  EMAIL_PERSONALIZATION_RESULTS_LINK_TOKEN,
  EMAIL_PERSONALIZATION_SCORE_TOKENS,
  assertSupportedNewsletterPersonalizationTokens,
  newsletterFieldsContainPersonalizationTokens,
} from "./emailPersonalization";
import { deriveNameFromEmail, normalizeEmail } from "./contactName";
import { sendNewsletterEmail } from "./email";
import { EMAIL_JOURNEY_KEYS } from "./emailJourneys";
import {
  ensureWaitlistEmailDelivery,
  getWaitlistedClientById,
  updateWaitlistEmailDeliveryStatus,
} from "./waitlistClients";
import { createWaitlistUnsubscribeUrl } from "./waitlistSubscriptions";

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

const assertWaitlistJourneyPostIsSendable = (post: {
  subject: string;
  title: string;
  previewText: string;
  content: string;
  cta: string;
}) => {
  assertSupportedNewsletterPersonalizationTokens(post);

  if (
    newsletterFieldsContainPersonalizationTokens(post, [
      ...EMAIL_PERSONALIZATION_SCORE_TOKENS,
      EMAIL_PERSONALIZATION_RESULTS_LINK_TOKEN,
      EMAIL_PERSONALIZATION_LIMITED_TIME_OFFER_TOKEN,
    ])
  ) {
    throw new Error(
      "Waitlist journey emails only support the {name} personalization token.",
    );
  }
};

export async function sendTrackedWaitlistJourneyEmailByPostId({
  waitlistedClientId,
  enrollmentId,
  recipientEmail,
  recipientName,
  postId,
  stepKey,
  ctaOverrideHtml,
}: {
  waitlistedClientId: string;
  enrollmentId: string;
  recipientEmail: string;
  recipientName?: string;
  postId: string;
  stepKey: string;
  ctaOverrideHtml?: string;
}) {
  const normalizedRecipientEmail = normalizeEmail(recipientEmail);
  if (!normalizedRecipientEmail) {
    throw new Error("Recipient email is required for tracked waitlist journey sends.");
  }

  const post = await getBlogPostById(postId);
  if (!post) {
    throw new Error(`Blog post "${postId}" was not found.`);
  }

  const waitlistedClient = await getWaitlistedClientById(waitlistedClientId);
  if (!waitlistedClient) {
    throw new Error(`Waitlisted client "${waitlistedClientId}" was not found.`);
  }

  const delivery = await ensureWaitlistEmailDelivery({
    waitlistedClientId,
    deliveryKind: "journey",
    enrollmentId,
    journeyKey: EMAIL_JOURNEY_KEYS.reportsWaitlistJourney,
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
    const deliveryPost = {
      ...post,
      cta: toSafeString(ctaOverrideHtml) || post.cta,
    };
    assertWaitlistJourneyPostIsSendable(deliveryPost);

    const sendResult = await sendNewsletterEmail(deliveryPost, {
      toEmail: normalizedRecipientEmail,
      name: resolveRecipientName(normalizedRecipientEmail, recipientName),
      unsubscribeUrl: createWaitlistUnsubscribeUrl(waitlistedClient.unsubscribeToken),
    });

    if (!sendResult) {
      throw new Error("EmailJS is not configured for tracked waitlist journey sends.");
    }

    await updateWaitlistEmailDeliveryStatus(delivery.id, "sent", {
      providerMessageId: resolveProviderMessageId(sendResult),
    });

    return {
      sendLogId: delivery.id,
      sendResult,
      skipped: false,
    };
  } catch (error) {
    await updateWaitlistEmailDeliveryStatus(delivery.id, "failed", {
      errorMessage:
        error instanceof Error
          ? error.message
          : "Tracked waitlist journey send failed.",
    });
    throw error;
  }
}
