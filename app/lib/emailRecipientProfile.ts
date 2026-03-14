import "server-only";

import { deriveNameFromEmail, normalizeEmail } from "./contactName";
import type { EmailPersonalizationContext } from "./emailPersonalization";
import { getLatestLeadRecipientProfileByEmail } from "./leadScorePersonalization";
import { getNewsletterSubscriberByEmail } from "./newsletterCampaigns";

export type SavedEmailRecipientProfile = {
  email: string;
  name: string;
  personalization: EmailPersonalizationContext;
};

const toSafeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const normalizeSavedName = (value: unknown): string => {
  const safeValue = toSafeString(value);
  if (!safeValue) return "";
  return safeValue.toLowerCase() === "there" ? "" : safeValue;
};

export async function getSavedEmailRecipientProfileByEmail(
  email: string,
): Promise<SavedEmailRecipientProfile | null> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const [subscriber, lead] = await Promise.all([
    getNewsletterSubscriberByEmail(normalizedEmail),
    getLatestLeadRecipientProfileByEmail(normalizedEmail),
  ]);

  const resolvedName =
    normalizeSavedName(subscriber?.name) ||
    normalizeSavedName(lead?.name) ||
    deriveNameFromEmail(normalizedEmail);

  return {
    email: normalizedEmail,
    name: resolvedName,
    personalization: {
      score: lead?.score ?? null,
      scoreComment: lead?.scoreComment ?? null,
    },
  };
}
