import "server-only";

import {
  getNewsletterUnsubscribeLookup,
  normalizeNewsletterUnsubscribeToken,
  submitNewsletterUnsubscribe,
} from "./newsletterSubscribers";
import {
  getWaitlistUnsubscribeLookup,
  submitWaitlistUnsubscribe,
} from "./waitlistSubscriptions";

export type SubscriptionAudience = "newsletter" | "waitlist";
export type SubscriptionUnsubscribeLookupStatus =
  | "valid"
  | "invalid_token"
  | "not_configured"
  | "error";
export type SubscriptionUnsubscribeSubmitStatus =
  | "success"
  | "invalid_token"
  | "not_configured"
  | "error";

export type SubscriptionUnsubscribeLookupResult = {
  status: SubscriptionUnsubscribeLookupStatus;
  audience?: SubscriptionAudience;
  isActive?: boolean;
  token?: string;
};

export type SubscriptionUnsubscribeSubmitResult = {
  status: SubscriptionUnsubscribeSubmitStatus;
  audience?: SubscriptionAudience;
  token?: string;
};

export const normalizeSubscriptionUnsubscribeToken = (value: string) =>
  normalizeNewsletterUnsubscribeToken(value);

export async function getSubscriptionUnsubscribeLookup(
  rawToken: string,
): Promise<SubscriptionUnsubscribeLookupResult> {
  const token = normalizeSubscriptionUnsubscribeToken(rawToken);

  const newsletterLookup = await getNewsletterUnsubscribeLookup(token);
  if (newsletterLookup.status === "valid") {
    return {
      status: "valid",
      audience: "newsletter",
      isActive: newsletterLookup.subscriberStatus === "subscribed",
      token: newsletterLookup.token,
    };
  }

  const waitlistLookup = await getWaitlistUnsubscribeLookup(token);
  if (waitlistLookup.status === "valid") {
    return {
      status: "valid",
      audience: "waitlist",
      isActive: waitlistLookup.clientStatus === "waitlisted",
      token: waitlistLookup.token,
    };
  }

  if (
    newsletterLookup.status === "not_configured" &&
    waitlistLookup.status === "not_configured"
  ) {
    return { status: "not_configured" };
  }

  if (
    newsletterLookup.status === "error" ||
    waitlistLookup.status === "error"
  ) {
    return { status: "error" };
  }

  return { status: "invalid_token" };
}

export async function submitSubscriptionUnsubscribe(
  rawToken: string,
): Promise<SubscriptionUnsubscribeSubmitResult> {
  const lookup = await getSubscriptionUnsubscribeLookup(rawToken);
  if (lookup.status !== "valid") {
    return {
      status: lookup.status,
      token: lookup.token,
    };
  }

  if (!lookup.audience) {
    return {
      status: "error",
      token: lookup.token,
    };
  }

  if (lookup.audience === "newsletter") {
    const result = await submitNewsletterUnsubscribe(rawToken);
    return {
      status: result.status,
      audience: "newsletter",
      token: result.token,
    };
  }

  const result = await submitWaitlistUnsubscribe(rawToken);
  return {
    status: result.status,
    audience: "waitlist",
    token: result.token,
  };
}
