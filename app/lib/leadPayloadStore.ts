import "server-only";

import { createClient } from "@supabase/supabase-js";
import { normalizeEmail } from "./contactName";
import {
  getLeadPayloadName,
  normalizeStoredLeadPayload,
  type LeadPayloadV2,
} from "./leadPayload";

type LeadRow = {
  email: string | null;
  name: string | null;
  payload: unknown;
  created_at: string | null;
};

export type LatestLeadPayloadRecord = {
  email: string;
  name: string;
  createdAt: string | null;
  payload: LeadPayloadV2;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

const requireSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase not configured for lead payload lookup.");
  }

  return supabase;
};

export async function getLatestLeadPayloadByEmail(
  email: string,
): Promise<LatestLeadPayloadRecord | null> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const client = requireSupabase();
  const { data, error } = await client
    .from("leads")
    .select("email,name,payload,created_at")
    .eq("email", normalizedEmail)
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const row = (data as LeadRow | null) ?? null;
  if (!row) return null;

  const payload = normalizeStoredLeadPayload(row.payload, {
    email: row.email ?? normalizedEmail,
    name: row.name,
  });
  if (!payload) return null;

  return {
    email: payload.contact.email || normalizedEmail,
    name: getLeadPayloadName(row.payload, {
      email: row.email ?? normalizedEmail,
      name: row.name,
    }),
    createdAt: row.created_at,
    payload,
  };
}
