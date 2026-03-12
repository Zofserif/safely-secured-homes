import "server-only";

import { randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";
import {
  BONUS_LINK_WINDOW_MS,
  type BonusClaimLinkRow,
  type BonusLinkStatus,
  isValidBonusLinkKey,
  normalizeBonusLinkKey,
  resolveBonusLinkStatus,
} from "./bonusClaimLinks";
import { normalizeEmail } from "./contactName";
import { siteUrl } from "./site";

const BONUS_LINK_KEY_BYTES = 18;
const BONUS_LINK_INSERT_RETRY_COUNT = 3;

export const BONUS_CLAIM_LINK_SELECT = [
  "link_key",
  "recipient_name",
  "recipient_email",
  "note",
  "created_at",
  "opened_at",
  "claim_expires_at",
  "claimed_at",
  "revoked_at",
  "shipping_name",
  "shipping_mobile",
  "shipping_address",
].join(",");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

const toOptionalText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const getBonusLinksAdminSecret = (): string =>
  process.env.BONUS_LINKS_ADMIN_SECRET?.trim() ?? "";

const getBonusLinksClient = () => {
  if (!supabase) {
    throw new Error("Supabase not configured for bonus claim links.");
  }

  return supabase;
};

const generateBonusLinkKey = () =>
  randomBytes(BONUS_LINK_KEY_BYTES).toString("base64url");

const toBonusClaimLinkRow = (value: unknown): BonusClaimLinkRow | null =>
  value ? (value as unknown as BonusClaimLinkRow) : null;

const fetchBonusLinkRow = async (
  key: string,
): Promise<BonusClaimLinkRow | null> => {
  const client = getBonusLinksClient();
  const { data, error } = await client
    .from("bonus_claim_links")
    .select(BONUS_CLAIM_LINK_SELECT)
    .eq("link_key", key)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return toBonusClaimLinkRow(data);
};

export const createBonusLinkUrl = (key: string, baseUrl = siteUrl): string =>
  new URL(`/bonus/${key}`, `${baseUrl}/`).toString();

export async function createBonusLink({
  recipientName,
  recipientEmail,
  note,
  baseUrl,
}: {
  recipientName?: string | null;
  recipientEmail?: string | null;
  note?: string | null;
  baseUrl?: string;
}) {
  const client = getBonusLinksClient();
  const safeRecipientName = toOptionalText(recipientName);
  const safeRecipientEmail = toOptionalText(recipientEmail);
  const safeNote = toOptionalText(note);

  for (let attempt = 0; attempt < BONUS_LINK_INSERT_RETRY_COUNT; attempt += 1) {
    const linkKey = generateBonusLinkKey();
    const { data, error } = await client
      .from("bonus_claim_links")
      .insert({
        link_key: linkKey,
        recipient_name: safeRecipientName,
        recipient_email: safeRecipientEmail
          ? normalizeEmail(safeRecipientEmail)
          : null,
        note: safeNote,
      })
      .select("link_key,created_at")
      .maybeSingle();

    if (!error && data) {
      return {
        key: data.link_key,
        url: createBonusLinkUrl(data.link_key, baseUrl),
        createdAt: data.created_at,
      };
    }

    if (error?.code !== "23505") {
      throw new Error(error?.message ?? "Failed to create bonus link.");
    }
  }

  throw new Error("Failed to generate a unique bonus link key.");
}

export async function getBonusLinkStatusByKey(
  key: string,
  nowMs = Date.now(),
): Promise<BonusLinkStatus> {
  const normalizedKey = normalizeBonusLinkKey(key);
  if (!isValidBonusLinkKey(normalizedKey)) {
    return { status: "invalid" };
  }

  const row = await fetchBonusLinkRow(normalizedKey);
  return resolveBonusLinkStatus(row, nowMs);
}

export async function openBonusLink(key: string): Promise<BonusLinkStatus> {
  const normalizedKey = normalizeBonusLinkKey(key);
  if (!isValidBonusLinkKey(normalizedKey)) {
    return { status: "invalid" };
  }

  const client = getBonusLinksClient();
  const openedAt = new Date();
  const claimExpiresAt = new Date(
    openedAt.getTime() + BONUS_LINK_WINDOW_MS,
  ).toISOString();

  const { data, error } = await client
    .from("bonus_claim_links")
    .update({
      opened_at: openedAt.toISOString(),
      claim_expires_at: claimExpiresAt,
    })
    .eq("link_key", normalizedKey)
    .is("opened_at", null)
    .is("claimed_at", null)
    .is("revoked_at", null)
    .select(BONUS_CLAIM_LINK_SELECT)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    return resolveBonusLinkStatus(
      toBonusClaimLinkRow(data),
      openedAt.getTime(),
    );
  }

  return getBonusLinkStatusByKey(normalizedKey, openedAt.getTime());
}

export async function claimBonusLink({
  key,
  shippingName,
  shippingMobile,
  shippingAddress,
}: {
  key: string;
  shippingName: string;
  shippingMobile: string;
  shippingAddress: string;
}): Promise<BonusLinkStatus> {
  const normalizedKey = normalizeBonusLinkKey(key);
  if (!isValidBonusLinkKey(normalizedKey)) {
    return { status: "invalid" };
  }

  const client = getBonusLinksClient();
  const claimedAt = new Date().toISOString();

  const { data, error } = await client
    .from("bonus_claim_links")
    .update({
      shipping_name: shippingName,
      shipping_mobile: shippingMobile,
      shipping_address: shippingAddress,
      claimed_at: claimedAt,
    })
    .eq("link_key", normalizedKey)
    .is("claimed_at", null)
    .is("revoked_at", null)
    .not("opened_at", "is", null)
    .not("claim_expires_at", "is", null)
    .gt("claim_expires_at", claimedAt)
    .select(BONUS_CLAIM_LINK_SELECT)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    return resolveBonusLinkStatus(toBonusClaimLinkRow(data), Date.now());
  }

  return getBonusLinkStatusByKey(normalizedKey, Date.now());
}
