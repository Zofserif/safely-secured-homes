import "server-only";

import {
  getWaitlistedClientByUnsubscribeToken,
  isWaitlistConfigured,
  unsubscribeWaitlistedClientByToken,
  type WaitlistedClientStatus,
} from "./waitlistClients";
import { siteUrl } from "./site";

export type WaitlistUnsubscribeLookupStatus =
  | "valid"
  | "invalid_token"
  | "not_configured"
  | "error";

export type WaitlistUnsubscribeSubmitStatus =
  | "success"
  | "invalid_token"
  | "not_configured"
  | "error";

export type WaitlistUnsubscribeLookupResult = {
  status: WaitlistUnsubscribeLookupStatus;
  clientStatus?: WaitlistedClientStatus;
  token?: string;
};

export type WaitlistUnsubscribeSubmitResult = {
  status: WaitlistUnsubscribeSubmitStatus;
  token?: string;
};

const WAITLIST_UNSUBSCRIBE_TOKEN_PATTERN = /^[a-f0-9]{36}$/;

export const normalizeWaitlistUnsubscribeToken = (value: string) =>
  value.trim().toLowerCase();

export const isValidWaitlistUnsubscribeToken = (value: string) =>
  WAITLIST_UNSUBSCRIBE_TOKEN_PATTERN.test(
    normalizeWaitlistUnsubscribeToken(value),
  );

export const createWaitlistUnsubscribeUrl = (
  rawToken: string,
  baseUrl = siteUrl,
) => {
  const token = normalizeWaitlistUnsubscribeToken(rawToken);
  if (!isValidWaitlistUnsubscribeToken(token)) {
    throw new Error("A valid waitlist unsubscribe token is required.");
  }

  return new URL(
    `/unsubscribe/${encodeURIComponent(token)}`,
    `${baseUrl}/`,
  ).toString();
};

export async function getWaitlistUnsubscribeLookup(
  rawToken: string,
): Promise<WaitlistUnsubscribeLookupResult> {
  const token = normalizeWaitlistUnsubscribeToken(rawToken);
  if (!isValidWaitlistUnsubscribeToken(token)) {
    return { status: "invalid_token" };
  }

  if (!isWaitlistConfigured()) {
    return { status: "not_configured" };
  }

  try {
    const waitlistedClient = await getWaitlistedClientByUnsubscribeToken(token);
    if (!waitlistedClient) {
      return { status: "invalid_token" };
    }

    return {
      status: "valid",
      clientStatus: waitlistedClient.status,
      token: waitlistedClient.unsubscribeToken,
    };
  } catch (error) {
    console.error("Waitlist unsubscribe token lookup failed:", error);
    return { status: "error" };
  }
}

export async function submitWaitlistUnsubscribe(
  rawToken: string,
): Promise<WaitlistUnsubscribeSubmitResult> {
  const token = normalizeWaitlistUnsubscribeToken(rawToken);
  if (!isValidWaitlistUnsubscribeToken(token)) {
    return { status: "invalid_token" };
  }

  if (!isWaitlistConfigured()) {
    return { status: "not_configured" };
  }

  try {
    const unsubscribed = await unsubscribeWaitlistedClientByToken(token);
    if (!unsubscribed) {
      return { status: "invalid_token" };
    }

    return { status: "success", token };
  } catch (error) {
    console.error("Waitlist unsubscribe failed:", error);
    return { status: "error", token };
  }
}
