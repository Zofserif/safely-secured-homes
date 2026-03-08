import type { LeadTier } from "./types";

type LeadNotificationLocation = {
  source?: string;
  country_code?: string | null;
  region?: string | null;
  city?: string | null;
};

export type LeadNtfyNotificationPayload = {
  name: string;
  email: string;
  mobile: string;
  tier: LeadTier;
  score: number;
  source: string;
  location?: LeadNotificationLocation;
};

export type LeadNtfySendResult =
  | {
      status: "sent";
    }
  | {
      status: "skipped";
      reason: "missing_config";
    };

const NTFY_TOPIC_URL = (process.env.NTFY_TOPIC_URL ?? "").trim();
const NTFY_ACCESS_TOKEN = (process.env.NTFY_ACCESS_TOKEN ?? "").trim();
const NTFY_TIMEOUT_MS = 5000;

const toSafeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const normalizeError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
};

const toDisplayContact = (value: string): string => {
  const contact = toSafeString(value);
  return contact || "n/a";
};

const formatLocation = (location?: LeadNotificationLocation): string => {
  if (!location) return "Unavailable";

  const parts = [location.city, location.region, location.country_code]
    .map(toSafeString)
    .filter((value) => value.length > 0);

  if (parts.length > 0) return parts.join(", ");
  if (toSafeString(location.source) === "unavailable") return "Unavailable";
  return "Unknown";
};

const toPriorityByTier = (tier: LeadTier): string => {
  switch (tier) {
    case "Hot":
      return "5";
    case "Warm":
      return "4";
    case "Nurture":
    default:
      return "3";
  }
};

const formatScore = (score: number): number =>
  Math.max(0, Math.min(100, Math.round(score)));

const buildTitle = (payload: LeadNtfyNotificationPayload): string => {
  const name = toSafeString(payload.name) || "Unknown";
  const compactName = name.length > 42 ? `${name.slice(0, 39)}...` : name;
  return `New lead: ${compactName} [${payload.tier}]`;
};

const buildMessage = (payload: LeadNtfyNotificationPayload): string => {
  const safeName = toSafeString(payload.name) || "Unknown";
  const safeSource = toSafeString(payload.source) || "website";
  const safeScore = formatScore(payload.score);
  const safeEmail = toDisplayContact(payload.email);
  const safeMobile = toDisplayContact(payload.mobile);

  return [
    "New lead captured",
    `Name: ${safeName}`,
    `Tier/Score: ${payload.tier} (${safeScore}/100)`,
    `Source: ${safeSource}`,
    `Email: ${safeEmail}`,
    `Mobile: ${safeMobile}`,
    `Location: ${formatLocation(payload.location)}`,
  ].join("\n");
};

export async function sendLeadNtfyNotification(
  payload: LeadNtfyNotificationPayload
): Promise<LeadNtfySendResult> {
  if (!NTFY_TOPIC_URL || !NTFY_ACCESS_TOKEN) {
    console.warn(
      "[ntfy] NTFY_TOPIC_URL or NTFY_ACCESS_TOKEN missing; skipping lead notification."
    );
    return {
      status: "skipped",
      reason: "missing_config",
    };
  }

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), NTFY_TIMEOUT_MS);

  try {
    const response = await fetch(NTFY_TOPIC_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NTFY_ACCESS_TOKEN}`,
        "Content-Type": "text/plain; charset=utf-8",
        Title: buildTitle(payload),
        Priority: toPriorityByTier(payload.tier),
        Tags: `lead,${payload.tier.toLowerCase()}`,
      },
      body: buildMessage(payload),
      signal: timeoutController.signal,
    });

    if (!response.ok) {
      const responseText = (await response.text().catch(() => "")).trim();
      const details = responseText ? ` ${responseText.slice(0, 300)}` : "";
      throw new Error(
        `ntfy responded with ${response.status} ${response.statusText}.${details}`
      );
    }

    return { status: "sent" };
  } catch (error) {
    throw new Error(`[ntfy] ${normalizeError(error)}`);
  } finally {
    clearTimeout(timeoutId);
  }
}
