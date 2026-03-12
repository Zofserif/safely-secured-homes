import "server-only";

import {
  getNewsletterSubscriberByUnsubscribeToken,
  isNewsletterCampaignsConfigured,
  type NewsletterSubscriberStatus,
  unsubscribeNewsletterSubscriberByToken,
} from "./newsletterCampaigns";
import { siteUrl } from "./site";

export type NewsletterUnsubscribeLookupStatus =
  | "valid"
  | "invalid_token"
  | "not_configured"
  | "error";

export type NewsletterUnsubscribeSubmitStatus =
  | "success"
  | "invalid_token"
  | "not_configured"
  | "error";

export type NewsletterUnsubscribeLookupResult = {
  status: NewsletterUnsubscribeLookupStatus;
  subscriberStatus?: NewsletterSubscriberStatus;
  token?: string;
};

export type NewsletterUnsubscribeSubmitResult = {
  status: NewsletterUnsubscribeSubmitStatus;
  token?: string;
};

const NEWSLETTER_UNSUBSCRIBE_TOKEN_PATTERN = /^[a-f0-9]{36}$/;

export const normalizeNewsletterUnsubscribeToken = (value: string) =>
  value.trim().toLowerCase();

export const isValidNewsletterUnsubscribeToken = (value: string) =>
  NEWSLETTER_UNSUBSCRIBE_TOKEN_PATTERN.test(
    normalizeNewsletterUnsubscribeToken(value),
  );

export const createNewsletterUnsubscribeUrl = (
  rawToken: string,
  baseUrl = siteUrl,
) => {
  const token = normalizeNewsletterUnsubscribeToken(rawToken);
  if (!isValidNewsletterUnsubscribeToken(token)) {
    throw new Error("A valid unsubscribe token is required.");
  }

  return new URL(`/unsubscribe/${encodeURIComponent(token)}`, `${baseUrl}/`).toString();
};

export async function getNewsletterUnsubscribeLookup(
  rawToken: string,
): Promise<NewsletterUnsubscribeLookupResult> {
  const token = normalizeNewsletterUnsubscribeToken(rawToken);
  if (!isValidNewsletterUnsubscribeToken(token)) {
    return { status: "invalid_token" };
  }

  if (!isNewsletterCampaignsConfigured()) {
    return { status: "not_configured" };
  }

  try {
    const subscriber = await getNewsletterSubscriberByUnsubscribeToken(token);
    if (!subscriber) {
      return { status: "invalid_token" };
    }

    return {
      status: "valid",
      subscriberStatus: subscriber.status,
      token: subscriber.unsubscribeToken,
    };
  } catch (error) {
    console.error("Newsletter unsubscribe token lookup failed:", error);
    return { status: "error" };
  }
}

export async function submitNewsletterUnsubscribe(
  rawToken: string,
): Promise<NewsletterUnsubscribeSubmitResult> {
  const token = normalizeNewsletterUnsubscribeToken(rawToken);
  if (!isValidNewsletterUnsubscribeToken(token)) {
    return { status: "invalid_token" };
  }

  if (!isNewsletterCampaignsConfigured()) {
    return { status: "not_configured" };
  }

  try {
    const unsubscribed = await unsubscribeNewsletterSubscriberByToken(token);
    if (!unsubscribed) {
      return { status: "invalid_token" };
    }

    return { status: "success", token };
  } catch (error) {
    console.error("Newsletter unsubscribe failed:", error);
    return { status: "error", token };
  }
}
