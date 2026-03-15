import "server-only";

import { randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";
import {
  createLimitedOfferLinkUrl,
  isValidLimitedOfferLinkKey,
  normalizeLimitedOfferLinkKey,
  resolveLimitedOfferLinkStatus,
  type LimitedOfferLinkRow,
  type LimitedOfferLinkStatus,
} from "./limitedOfferLinks";
import { normalizeEmail } from "./contactName";
import { siteUrl } from "./site";

const LIMITED_OFFER_LINK_KEY_BYTES = 18;
const LIMITED_OFFER_LINK_INSERT_RETRY_COUNT = 3;

export const LIMITED_OFFER_LINK_SELECT = [
  "link_key",
  "source_key",
  "recipient_name",
  "recipient_email",
  "blog_post_id",
  "created_at",
  "expires_at",
  "first_opened_at",
  "last_opened_at",
  "revoked_at",
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

const toRow = (value: unknown): LimitedOfferLinkRow | null =>
  value ? (value as LimitedOfferLinkRow) : null;

type CreatedLimitedOfferLinkRow = Pick<
  LimitedOfferLinkRow,
  "link_key" | "source_key" | "created_at" | "expires_at"
>;

const getLimitedOfferLinksClient = () => {
  if (!supabase) {
    throw new Error("Supabase not configured for limited-offer links.");
  }

  return supabase;
};

const generateLimitedOfferLinkKey = () =>
  randomBytes(LIMITED_OFFER_LINK_KEY_BYTES).toString("base64url");

const toCreatedLinkResult = (
  row: CreatedLimitedOfferLinkRow,
  baseUrl = siteUrl,
) => ({
  key: row.link_key,
  url: createLimitedOfferLinkUrl(row.link_key, baseUrl),
  createdAt: row.created_at,
  expiresAt: row.expires_at,
  sourceKey: row.source_key,
});

const fetchLimitedOfferLinkRow = async (
  key: string,
): Promise<LimitedOfferLinkRow | null> => {
  const client = getLimitedOfferLinksClient();
  const { data, error } = await client
    .from("limited_offer_links")
    .select(LIMITED_OFFER_LINK_SELECT)
    .eq("link_key", key)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return toRow(data);
};

const fetchLimitedOfferLinkRowBySourceKey = async (
  sourceKey: string,
): Promise<LimitedOfferLinkRow | null> => {
  const client = getLimitedOfferLinksClient();
  const { data, error } = await client
    .from("limited_offer_links")
    .select(LIMITED_OFFER_LINK_SELECT)
    .eq("source_key", sourceKey)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return toRow(data);
};

const normalizeExpiresAt = (value: string): string => {
  const parsedMs = Date.parse(value);
  if (!Number.isFinite(parsedMs)) {
    throw new Error("A valid limited-offer expiration timestamp is required.");
  }

  return new Date(parsedMs).toISOString();
};

export async function getOrCreateLimitedOfferLinkBySourceKey({
  sourceKey,
  recipientName,
  recipientEmail,
  blogPostId,
  expiresAt,
  baseUrl,
}: {
  sourceKey: string;
  recipientName?: string | null;
  recipientEmail?: string | null;
  blogPostId?: string | null;
  expiresAt: string;
  baseUrl?: string;
}) {
  const safeSourceKey = toOptionalText(sourceKey);
  if (!safeSourceKey) {
    throw new Error("A source key is required to reuse limited-offer links.");
  }

  const existingLink = await fetchLimitedOfferLinkRowBySourceKey(safeSourceKey);
  if (existingLink) {
    return toCreatedLinkResult(existingLink, baseUrl);
  }

  const client = getLimitedOfferLinksClient();
  const safeRecipientName = toOptionalText(recipientName);
  const safeRecipientEmail = toOptionalText(recipientEmail);
  const safeBlogPostId = toOptionalText(blogPostId);
  const safeExpiresAt = normalizeExpiresAt(expiresAt);

  for (
    let attempt = 0;
    attempt < LIMITED_OFFER_LINK_INSERT_RETRY_COUNT;
    attempt += 1
  ) {
    const linkKey = generateLimitedOfferLinkKey();
    const { data, error } = await client
      .from("limited_offer_links")
      .insert({
        link_key: linkKey,
        source_key: safeSourceKey,
        recipient_name: safeRecipientName,
        recipient_email: safeRecipientEmail
          ? normalizeEmail(safeRecipientEmail)
          : null,
        blog_post_id: safeBlogPostId,
        expires_at: safeExpiresAt,
      })
      .select("link_key,source_key,created_at,expires_at")
      .maybeSingle();

    if (!error && data) {
      return toCreatedLinkResult(data as CreatedLimitedOfferLinkRow, baseUrl);
    }

    if (error?.code !== "23505") {
      throw new Error(error?.message ?? "Failed to create limited-offer link.");
    }

    const createdBySourceKey = await fetchLimitedOfferLinkRowBySourceKey(
      safeSourceKey,
    );
    if (createdBySourceKey) {
      return toCreatedLinkResult(createdBySourceKey, baseUrl);
    }
  }

  throw new Error("Failed to generate or reuse a source-keyed limited-offer link.");
}

export async function getLimitedOfferLinkStatusByKey(
  key: string,
  nowMs = Date.now(),
): Promise<LimitedOfferLinkStatus> {
  const normalizedKey = normalizeLimitedOfferLinkKey(key);
  if (!isValidLimitedOfferLinkKey(normalizedKey)) {
    return { status: "invalid" };
  }

  const row = await fetchLimitedOfferLinkRow(normalizedKey);
  return resolveLimitedOfferLinkStatus(row, nowMs);
}

export async function openLimitedOfferLink(
  key: string,
  nowMs = Date.now(),
): Promise<LimitedOfferLinkStatus> {
  const normalizedKey = normalizeLimitedOfferLinkKey(key);
  if (!isValidLimitedOfferLinkKey(normalizedKey)) {
    return { status: "invalid" };
  }

  const existingRow = await fetchLimitedOfferLinkRow(normalizedKey);
  if (!existingRow) {
    return { status: "invalid" };
  }

  const client = getLimitedOfferLinksClient();
  const openedAt = new Date(nowMs).toISOString();

  const { data, error } = await client
    .from("limited_offer_links")
    .update({
      first_opened_at: existingRow.first_opened_at || openedAt,
      last_opened_at: openedAt,
    })
    .eq("link_key", normalizedKey)
    .select(LIMITED_OFFER_LINK_SELECT)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return resolveLimitedOfferLinkStatus(toRow(data) ?? existingRow, nowMs);
}
