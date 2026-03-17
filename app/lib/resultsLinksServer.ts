import "server-only";

import { randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { normalizeEmail } from "./contactName";
import {
  ENGAGEMENT_LINKS_TABLE,
  ENGAGEMENT_LINK_KIND_RESULTS,
} from "./engagementLinksSchema";
import { getLatestLeadPayloadByEmail } from "./leadPayloadStore";
import {
  buildResultsLinkUrl,
  leadPayloadToResultsFormData,
  RESULTS_LINK_KEY_PATTERN,
  selectReusableResultsLink,
} from "./resultsLinks";
import { createShareableResultsPayload, parseShareableResultsPayload } from "./resultsShare";
import {
  isMissingSupabaseTableError,
  type SupabaseTableError,
} from "./supabaseTableFallback";
import type { FormData } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const LINK_KEY_BYTES = 18;
const LINK_EXPIRY_DAYS = 90;
const INSERT_RETRY_COUNT = 3;
const REUSABLE_LINK_LOOKUP_LIMIT = 20;
const LEGACY_RESULTS_LINKS_TABLE = "results_links";

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

type ResultsLinkContact = {
  name?: string | null;
  email?: string | null;
  mobile?: string | null;
  phone_number?: string | null;
  phone?: string | null;
};

type ResultsLinkLookupRow = {
  link_key: string | null;
  payload: unknown;
  expires_at: string | null;
  revoked_at: string | null;
  name: string | null;
  email: string | null;
  mobile: string | null;
  created_at: string | null;
};

type ReusableResultsLinkRow = {
  link_key: string | null;
  created_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
};

const RESULTS_LINK_SELECT = [
  "link_key",
  "payload",
  "expires_at",
  "revoked_at",
  "name:contact_name",
  "email:contact_email",
  "mobile:contact_mobile",
  "created_at",
].join(",");

const LEGACY_RESULTS_LINK_SELECT = [
  "link_key",
  "payload",
  "expires_at",
  "revoked_at",
  "name",
  "email",
  "mobile",
  "created_at",
].join(",");

export type CreatedResultsLink = {
  key: string;
  url: string;
  expiresAt: string;
};

export type ResultsLinkLookupResult =
  | { status: "invalid_key" }
  | { status: "missing" }
  | { status: "expired" }
  | { status: "invalid_payload" }
  | {
      status: "found";
      key: string;
      formData: FormData;
      createdAt: string | null;
      expiresAt: string | null;
    };

const requireSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase not configured for results links.");
  }

  return supabase;
};

const generateLinkKey = () => randomBytes(LINK_KEY_BYTES).toString("base64url");

const toSafeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const normalizeText = (value: unknown): string | null => {
  const safeValue = toSafeString(value);
  return safeValue || null;
};

const isMissingResultsLinksTableError = (
  error: SupabaseTableError | null | undefined,
) => isMissingSupabaseTableError(error, ENGAGEMENT_LINKS_TABLE);

const normalizeContact = (contact: ResultsLinkContact) => ({
  name: normalizeText(contact.name),
  email: normalizeText(contact.email)?.toLowerCase() ?? null,
  mobile:
    normalizeText(contact.mobile) ??
    normalizeText(contact.phone_number) ??
    normalizeText(contact.phone),
});

const createExpiresAt = () =>
  new Date(Date.now() + LINK_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

export async function createResultsLinkFromFormData(
  formData: FormData,
  contact: ResultsLinkContact = {},
): Promise<CreatedResultsLink | null> {
  const client = requireSupabase();
  const payload = createShareableResultsPayload(formData);
  if (!payload) return null;

  const normalizedContact = normalizeContact(contact);
  const expiresAt = createExpiresAt();

  for (let attempt = 0; attempt < INSERT_RETRY_COUNT; attempt += 1) {
    const linkKey = generateLinkKey();
    let { error } = await client.from(ENGAGEMENT_LINKS_TABLE).insert({
      kind: ENGAGEMENT_LINK_KIND_RESULTS,
      link_key: linkKey,
      contact_name: normalizedContact.name,
      contact_email: normalizedContact.email,
      contact_mobile: normalizedContact.mobile,
      payload,
      expires_at: expiresAt,
    });

    if (error && isMissingResultsLinksTableError(error)) {
      ({ error } = await client.from(LEGACY_RESULTS_LINKS_TABLE).insert({
        link_key: linkKey,
        name: normalizedContact.name,
        email: normalizedContact.email,
        mobile: normalizedContact.mobile,
        payload,
        expires_at: expiresAt,
      }));
    }

    if (!error) {
      return {
        key: linkKey,
        url: buildResultsLinkUrl(linkKey),
        expiresAt,
      };
    }

    if (error.code !== "23505") {
      throw new Error(error.message);
    }
  }

  throw new Error("Failed to generate unique share link key");
}

export async function getResultsLinkByKey(
  key: string,
): Promise<ResultsLinkLookupResult> {
  const normalizedKey = key.trim();
  if (!RESULTS_LINK_KEY_PATTERN.test(normalizedKey)) {
    return { status: "invalid_key" };
  }

  const client = requireSupabase();
  let { data, error } = await client
    .from(ENGAGEMENT_LINKS_TABLE)
    .select(RESULTS_LINK_SELECT)
    .eq("kind", ENGAGEMENT_LINK_KIND_RESULTS)
    .eq("link_key", normalizedKey)
    .maybeSingle();

  if (error && isMissingResultsLinksTableError(error)) {
    ({ data, error } = await client
      .from(LEGACY_RESULTS_LINKS_TABLE)
      .select(LEGACY_RESULTS_LINK_SELECT)
      .eq("link_key", normalizedKey)
      .maybeSingle());
  }

  if (error) {
    throw new Error(error.message);
  }

  const row = (data as ResultsLinkLookupRow | null) ?? null;
  if (!row) {
    return { status: "missing" };
  }

  if (row.revoked_at || selectReusableResultsLink([
    {
      linkKey: row.link_key,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at,
    },
  ], null) === null) {
    return { status: "expired" };
  }

  const formData = parseShareableResultsPayload(row.payload);
  if (!formData) {
    return { status: "invalid_payload" };
  }

  return {
    status: "found",
    key: normalizedKey,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    formData: {
      ...formData,
      name: normalizeText(row.name) ?? "",
      email: normalizeText(row.email) ?? "",
      mobile: normalizeText(row.mobile) ?? "",
    },
  };
}

const getLatestReusableResultsLinkByEmail = async (
  email: string,
  leadCreatedAt: string | null,
): Promise<CreatedResultsLink | null> => {
  const client = requireSupabase();
  let { data, error } = await client
    .from(ENGAGEMENT_LINKS_TABLE)
    .select("link_key,created_at,expires_at,revoked_at")
    .eq("kind", ENGAGEMENT_LINK_KIND_RESULTS)
    .eq("contact_email", email)
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(REUSABLE_LINK_LOOKUP_LIMIT);

  if (error && isMissingResultsLinksTableError(error)) {
    ({ data, error } = await client
      .from(LEGACY_RESULTS_LINKS_TABLE)
      .select("link_key,created_at,expires_at,revoked_at")
      .eq("email", email)
      .order("created_at", { ascending: false, nullsFirst: false })
      .limit(REUSABLE_LINK_LOOKUP_LIMIT));
  }

  if (error) {
    throw new Error(error.message);
  }

  const rows = ((data as ReusableResultsLinkRow[] | null) ?? []).map((row) => ({
    linkKey: toSafeString(row.link_key) || null,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
  }));
  const reusableLink = selectReusableResultsLink(rows, leadCreatedAt);
  if (!reusableLink?.linkKey) return null;

  return {
    key: reusableLink.linkKey,
    url: buildResultsLinkUrl(reusableLink.linkKey),
    expiresAt: reusableLink.expiresAt ?? createExpiresAt(),
  };
};

export async function resolvePersonalizedResultsLinkByEmail(
  email: string,
): Promise<string | null> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  try {
    const latestLead = await getLatestLeadPayloadByEmail(normalizedEmail);
    if (!latestLead) return null;

    const reusableLink = await getLatestReusableResultsLinkByEmail(
      normalizedEmail,
      latestLead.createdAt,
    );
    if (reusableLink) {
      return reusableLink.url;
    }

    const createdLink = await createResultsLinkFromFormData(
      leadPayloadToResultsFormData(latestLead.payload),
      {
        name: latestLead.payload.contact.name,
        email: latestLead.payload.contact.email || normalizedEmail,
        mobile: latestLead.payload.contact.mobile,
      },
    );

    return createdLink?.url ?? null;
  } catch (error) {
    console.error(
      `Failed to resolve personalized results link for "${normalizedEmail}":`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
