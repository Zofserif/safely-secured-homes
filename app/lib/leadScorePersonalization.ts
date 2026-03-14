import "server-only";

import { createClient } from "@supabase/supabase-js";
import { normalizeEmail } from "./contactName";
import { buildLeadScorePersonalizationContext } from "./emailPersonalization";

type LeadRow = {
  name: string | null;
  payload: unknown;
  created_at: string | null;
};

export type LeadRecipientProfile = {
  name: string;
  scoreValue: number | null;
  score?: string | null;
  scoreComment?: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

const requireSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase not configured for lead score personalization.");
  }

  return supabase;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toSafeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const clampScore = (value: number): number =>
  Math.max(0, Math.min(100, Math.round(value)));

const readLeadName = (row: LeadRow | null): string => {
  const explicitName = toSafeString(row?.name);
  if (explicitName) return explicitName;

  const payload = row?.payload;
  if (!isRecord(payload)) return "";

  const contact = payload.contact;
  if (!isRecord(contact)) return "";

  return toSafeString(contact.name);
};

const readPanatagHomeRating = (payload: unknown): number | null => {
  if (!isRecord(payload)) return null;

  const outcomes = payload.outcomes;
  if (!isRecord(outcomes)) return null;

  const score = outcomes.panatag_home_rating;
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return null;
  }

  return clampScore(score);
};

export async function getLatestLeadScorePersonalizationByEmail(email: string) {
  const profile = await getLatestLeadRecipientProfileByEmail(email);
  if (!profile || profile.scoreValue === null) {
    return null;
  }

  return {
    scoreValue: profile.scoreValue,
    ...buildLeadScorePersonalizationContext(profile.scoreValue),
  };
}

export async function getLatestLeadRecipientProfileByEmail(
  email: string,
): Promise<LeadRecipientProfile | null> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const client = requireSupabase();
  const { data, error } = await client
    .from("leads")
    .select("name,payload,created_at")
    .eq("email", normalizedEmail)
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const row = (data as LeadRow | null) ?? null;
  if (!row) return null;

  const scoreValue = readPanatagHomeRating(row.payload);
  return {
    name: readLeadName(row),
    scoreValue,
    ...(scoreValue === null ? {} : buildLeadScorePersonalizationContext(scoreValue)),
  };
}
