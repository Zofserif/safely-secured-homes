export const BONUS_LINK_VIDEO_URL =
  "https://ukgfftcenpztjkynbymj.supabase.co/storage/v1/object/public/user-assets/Safely%20Secured%20Homes%20Mug.mp4";

export const BONUS_LINK_KEY_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;
export const BONUS_LINK_WINDOW_MS = 60 * 60 * 1000;
export const BONUS_LINK_MOBILE_REGEX = /^09\d{9}$/;

export type BonusClaimLinkRow = {
  link_key: string;
  source_key: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  note: string | null;
  created_at: string | null;
  opened_at: string | null;
  claim_expires_at: string | null;
  claimed_at: string | null;
  revoked_at: string | null;
  shipping_name: string | null;
  shipping_mobile: string | null;
  shipping_address: string | null;
};

export type BonusLinkClaimableStatus = {
  status: "claimable";
  openedAt: string;
  claimExpiresAt: string;
  remainingMs: number;
  recipientName: string | null;
  recipientEmail: string | null;
  note: string | null;
};

export type BonusLinkExpiredStatus = {
  status: "expired";
  openedAt: string | null;
  claimExpiresAt: string | null;
};

export type BonusLinkClaimedStatus = {
  status: "claimed";
  claimedAt: string;
  shippingName: string | null;
};

export type BonusLinkInvalidStatus = {
  status: "invalid";
};

export type BonusLinkStatus =
  | BonusLinkClaimableStatus
  | BonusLinkExpiredStatus
  | BonusLinkClaimedStatus
  | BonusLinkInvalidStatus;

export const normalizeBonusLinkKey = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export const isValidBonusLinkKey = (value: unknown): boolean =>
  BONUS_LINK_KEY_PATTERN.test(normalizeBonusLinkKey(value));

export const getBonusLinkRemainingMs = (
  claimExpiresAt: string,
  nowMs = Date.now(),
): number => {
  const expiresAtMs = Date.parse(claimExpiresAt);
  if (Number.isNaN(expiresAtMs)) return 0;
  return Math.max(0, expiresAtMs - nowMs);
};

export const resolveBonusLinkStatus = (
  row: BonusClaimLinkRow | null,
  nowMs = Date.now(),
): BonusLinkStatus => {
  if (!row) {
    return { status: "invalid" };
  }

  if (row.claimed_at) {
    return {
      status: "claimed",
      claimedAt: row.claimed_at,
      shippingName: row.shipping_name,
    };
  }

  if (row.revoked_at) {
    return {
      status: "expired",
      openedAt: row.opened_at,
      claimExpiresAt: row.claim_expires_at,
    };
  }

  if (row.claim_expires_at) {
    const remainingMs = getBonusLinkRemainingMs(row.claim_expires_at, nowMs);
    if (row.opened_at && remainingMs > 0) {
      return {
        status: "claimable",
        openedAt: row.opened_at,
        claimExpiresAt: row.claim_expires_at,
        remainingMs,
        recipientName: row.recipient_name,
        recipientEmail: row.recipient_email,
        note: row.note,
      };
    }

    return {
      status: "expired",
      openedAt: row.opened_at,
      claimExpiresAt: row.claim_expires_at,
    };
  }

  return { status: "invalid" };
};
