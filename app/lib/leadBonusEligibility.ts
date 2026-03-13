import "server-only";

import { createClient } from "@supabase/supabase-js";
import { normalizeEmail } from "./contactName";

type LeadRow = {
  payload: unknown;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

const requireSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase not configured for lead bonus eligibility.");
  }

  return supabase;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export async function getLatestLeadHasBonusByEmail(
  email: string,
): Promise<boolean> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return false;

  const client = requireSupabase();
  const { data, error } = await client
    .from("leads")
    .select("payload")
    .eq("email", normalizedEmail)
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const row = (data as LeadRow | null) ?? null;
  if (!isRecord(row?.payload)) {
    return false;
  }

  return row.payload.has_bonus === true;
}
