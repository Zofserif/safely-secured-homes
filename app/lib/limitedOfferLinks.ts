import { publicSiteUrl } from "./site.ts";

export const LIMITED_OFFER_LINK_KEY_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

export type LimitedOfferLinkRow = {
  link_key: string;
  source_key: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  blog_post_id: string | null;
  created_at: string | null;
  expires_at: string | null;
  first_opened_at: string | null;
  last_opened_at: string | null;
  revoked_at: string | null;
};

export type LimitedOfferLinkActiveStatus = {
  status: "active";
  expiresAt: string;
  remainingMs: number;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
};

export type LimitedOfferLinkExpiredStatus = {
  status: "expired";
  expiresAt: string | null;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
};

export type LimitedOfferLinkInvalidStatus = {
  status: "invalid";
};

export type LimitedOfferLinkStatus =
  | LimitedOfferLinkActiveStatus
  | LimitedOfferLinkExpiredStatus
  | LimitedOfferLinkInvalidStatus;

export const normalizeLimitedOfferLinkKey = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export const isValidLimitedOfferLinkKey = (value: unknown): boolean =>
  LIMITED_OFFER_LINK_KEY_PATTERN.test(normalizeLimitedOfferLinkKey(value));

export const createLimitedOfferLinkUrl = (
  key: string,
  baseUrl = publicSiteUrl,
): string => new URL(`/offer/${key}`, `${baseUrl}/`).toString();

export const getLimitedOfferRemainingMs = (
  expiresAt: string,
  nowMs = Date.now(),
): number => {
  const expiresAtMs = Date.parse(expiresAt);
  if (Number.isNaN(expiresAtMs)) return 0;
  return Math.max(0, expiresAtMs - nowMs);
};

export const resolveLimitedOfferLinkStatus = (
  row: LimitedOfferLinkRow | null,
  nowMs = Date.now(),
): LimitedOfferLinkStatus => {
  if (!row) {
    return { status: "invalid" };
  }

  if (row.revoked_at) {
    return {
      status: "expired",
      expiresAt: row.expires_at,
      firstOpenedAt: row.first_opened_at,
      lastOpenedAt: row.last_opened_at,
    };
  }

  if (!row.expires_at) {
    return { status: "invalid" };
  }

  const remainingMs = getLimitedOfferRemainingMs(row.expires_at, nowMs);
  if (remainingMs > 0) {
    return {
      status: "active",
      expiresAt: row.expires_at,
      remainingMs,
      firstOpenedAt: row.first_opened_at,
      lastOpenedAt: row.last_opened_at,
    };
  }

  return {
    status: "expired",
    expiresAt: row.expires_at,
    firstOpenedAt: row.first_opened_at,
    lastOpenedAt: row.last_opened_at,
  };
};
