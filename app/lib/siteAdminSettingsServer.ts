import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  DEFAULT_PUBLIC_SITE_SETTINGS,
  MIN_PANATAG_CYCLE_LIMIT,
  SITE_ADMIN_SETTINGS_KEY,
  normalizePublicSiteSettings,
  type PublicSiteSettings,
} from "./siteAdminSettings";

type SiteAdminSettingsRow = {
  settings_key: string | null;
  bonus_enabled: boolean | null;
  panatag_cycle_limit: number | null;
  results_review_cta_enabled: boolean | null;
  email_sending_enabled: boolean | null;
  updated_at?: string | null;
};

type SupabaseError = {
  code?: string;
  details?: string;
  message?: string;
};

export type SaveSiteAdminSettingsInput = {
  bonusEnabled: boolean;
  panatagCycleLimit: number;
  resultsReviewCtaEnabled: boolean;
  emailSendingEnabled: boolean;
};

const SITE_ADMIN_SETTINGS_SELECT =
  "settings_key,bonus_enabled,panatag_cycle_limit,results_review_cta_enabled,email_sending_enabled,updated_at";

const SITE_ADMIN_SETTINGS_MISSING_SCHEMA_ERROR =
  "Supabase site admin settings schema is missing. Run supabase/site_admin_settings.sql before using /admin/settings.";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

const isMissingSiteAdminSettingsSchemaError = (
  error: SupabaseError | null | undefined,
) => {
  const code = typeof error?.code === "string" ? error.code : "";
  const message = typeof error?.message === "string" ? error.message : "";

  return (
    code === "42P01" ||
    (message.includes("site_admin_settings") &&
      (message.includes("does not exist") ||
        message.includes("schema cache") ||
        message.includes("Could not find")))
  );
};

const requireSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured for admin site settings.");
  }

  return supabase;
};

const normalizeRow = (
  row?: SiteAdminSettingsRow | null,
): PublicSiteSettings =>
  normalizePublicSiteSettings({
    bonusEnabled: row?.bonus_enabled ?? undefined,
    panatagCycleLimit: row?.panatag_cycle_limit ?? undefined,
    resultsReviewCtaEnabled: row?.results_review_cta_enabled ?? undefined,
    emailSendingEnabled: row?.email_sending_enabled ?? undefined,
  });

const parseCycleLimitInput = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("Panatag cycle limit must be a whole number.");
  }

  const normalizedValue = Math.trunc(value);
  if (normalizedValue < MIN_PANATAG_CYCLE_LIMIT) {
    throw new Error(
      `Panatag cycle limit must be at least ${MIN_PANATAG_CYCLE_LIMIT}.`,
    );
  }

  return normalizedValue;
};

const fetchSiteAdminSettingsRow = async (): Promise<SiteAdminSettingsRow | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("site_admin_settings")
    .select(SITE_ADMIN_SETTINGS_SELECT)
    .eq("settings_key", SITE_ADMIN_SETTINGS_KEY)
    .maybeSingle();

  if (error) {
    if (isMissingSiteAdminSettingsSchemaError(error)) {
      return null;
    }

    throw error;
  }

  return (data as SiteAdminSettingsRow | null) ?? null;
};

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  try {
    const row = await fetchSiteAdminSettingsRow();
    return row
      ? normalizeRow(row)
      : normalizePublicSiteSettings(DEFAULT_PUBLIC_SITE_SETTINGS);
  } catch (error) {
    console.error("Failed to load site admin settings:", error);
    return normalizePublicSiteSettings(DEFAULT_PUBLIC_SITE_SETTINGS);
  }
}

export async function saveSiteAdminSettings(
  input: SaveSiteAdminSettingsInput,
): Promise<PublicSiteSettings> {
  const client = requireSupabase();

  const payload = {
    settings_key: SITE_ADMIN_SETTINGS_KEY,
    bonus_enabled: input.bonusEnabled === true,
    panatag_cycle_limit: parseCycleLimitInput(input.panatagCycleLimit),
    results_review_cta_enabled: input.resultsReviewCtaEnabled === true,
    email_sending_enabled: input.emailSendingEnabled !== false,
  };

  const { data, error } = await client
    .from("site_admin_settings")
    .upsert(payload, { onConflict: "settings_key" })
    .select(SITE_ADMIN_SETTINGS_SELECT)
    .single();

  if (error) {
    if (isMissingSiteAdminSettingsSchemaError(error)) {
      throw new Error(SITE_ADMIN_SETTINGS_MISSING_SCHEMA_ERROR);
    }

    throw error;
  }

  return normalizeRow(data as SiteAdminSettingsRow);
}
