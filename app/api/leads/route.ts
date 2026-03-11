import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { estimateCameraPlan, getResultsSummary } from "../../lib/calculations";
import { deriveNameFromEmail } from "../../lib/contactName";
import { sendLeadNtfyNotification } from "../../lib/ntfy";
import { normalizeSafetyHabitAnswers } from "../../lib/safetyHabits";
import {
  getSafetyCategoryScores,
  getSafetySummary,
} from "../../lib/safetyScores";
import { clampSafetyScore } from "../../lib/safetyScale.js";
import type { FormData, LeadTier } from "../../lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

type LeadLocation = {
  source: "ip_header" | "unavailable";
  country_code: string | null;
  region: string | null;
  city: string | null;
};

type LeadContact = {
  name: string;
  email: string;
  mobile: string;
};

type LeadAnswers = Omit<FormData, "name" | "email" | "mobile">;

type LeadCreateBody = {
  contact: LeadContact;
  answers: LeadAnswers;
  meta: {
    source: string;
  };
};

type LeadPayload = {
  source: string;
  location: LeadLocation;
  contact: LeadContact;
  answers: LeadAnswers;
  outcomes: {
    lead: {
      score: number;
      tier: LeadTier;
      model_version: string;
    };
    safety: {
      total: number;
      emergency_readiness_score: number;
      categories: {
        home_entrance: number;
        neighborhood_safety_check: number;
        windows_terrace: number;
        emergency_readiness_home: number;
      };
    };
    panatag_home_rating: number;
    camera_plan: {
      camera_count: number;
      nvr_channel: number;
      storage_recommended_tb: number;
      storage_estimated_tb_7d: number;
    };
  };
};

type LeadInsertBody = {
  email: string;
  name: string;
  payload: LeadPayload;
};

type NewsletterSubscriberInsertBody = {
  name: string;
  email: string;
  source: string;
};

type NewsletterSubscriberLookupRow = {
  id: string | number;
};

const WIZARD_FORM_SOURCE = "wizard_form";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toSafeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const toOptionalHeaderValue = (value: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toNullableBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const toFiniteNumber = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const toScore100 = (value: unknown): number =>
  Math.max(0, Math.min(100, Math.round(toFiniteNumber(value))));

const toNullableSafetyScore = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value)
    ? clampSafetyScore(value)
    : null;

const LEGACY_SAFETY_ANSWER_KEYS = [
  "safety_gate_entry",
  "safety_blindspots",
  "safety_driveway_garage",
  "safety_emergency_readiness",
] as const;
const LEGACY_ADDITIONAL_NOTES_KEY = "goal_obstacle_other";

const sanitizeLeadContact = (value: unknown): LeadContact | null => {
  if (!isRecord(value)) return null;

  const email = toSafeString(value.email).toLowerCase();
  if (!email) return null;

  return {
    name: toSafeString(value.name),
    email,
    mobile: toSafeString(value.mobile),
  };
};

const sanitizeLeadAnswers = (value: unknown): LeadAnswers | null => {
  if (!isRecord(value)) return null;
  if (Object.prototype.hasOwnProperty.call(value, LEGACY_ADDITIONAL_NOTES_KEY)) {
    return null;
  }
  for (const key of LEGACY_SAFETY_ANSWER_KEYS) {
    if (Object.prototype.hasOwnProperty.call(value, key)) return null;
  }

  return {
    property_type: toSafeString(value.property_type),
    has_spare_key: toNullableBoolean(value.has_spare_key),
    changed_wifi_default_password: toNullableBoolean(
      value.changed_wifi_default_password
    ),
    sleeps_with_earphones: toNullableBoolean(value.sleeps_with_earphones),
    locks_windows_gate_at_night: toNullableBoolean(
      value.locks_windows_gate_at_night
    ),
    has_security_cameras: toNullableBoolean(value.has_security_cameras),
    has_smoke_alarm_or_fire_extinguisher: toNullableBoolean(
      value.has_smoke_alarm_or_fire_extinguisher
    ),
    has_first_aid_or_medicine_ready: toNullableBoolean(
      value.has_first_aid_or_medicine_ready
    ),
    knows_local_emergency_contacts: toNullableBoolean(
      value.knows_local_emergency_contacts
    ),
    home_entrance: toNullableSafetyScore(value.home_entrance),
    windows_terrace: toNullableSafetyScore(value.windows_terrace),
    neighborhood_safety_check: toNullableSafetyScore(value.neighborhood_safety_check),
    emergency_readiness_home: toNullableSafetyScore(
      value.emergency_readiness_home
    ),
    household_stage: toSafeString(value.household_stage),
    desired_outcome: toSafeString(value.desired_outcome),
    goal_obstacle: toSafeString(value.goal_obstacle),
    has_additional_notes: toNullableBoolean(value.has_additional_notes),
    additional_notes: toSafeString(value.additional_notes),
    solution: toSafeString(value.solution),
  };
};

const sanitizeLeadCreateBody = (value: unknown): LeadCreateBody | null => {
  if (!isRecord(value)) return null;

  const contact = sanitizeLeadContact(value.contact);
  const answers = sanitizeLeadAnswers(value.answers);
  if (!contact || !answers) return null;

  const rawMeta = isRecord(value.meta) ? value.meta : {};
  const source = toSafeString(rawMeta.source) || "website";

  return {
    contact,
    answers,
    meta: {
      source,
    },
  };
};

const resolveLeadLocation = (req: Request): LeadLocation => {
  const countryCode =
    toOptionalHeaderValue(req.headers.get("x-vercel-ip-country")) ??
    toOptionalHeaderValue(req.headers.get("cf-ipcountry"));
  const region = toOptionalHeaderValue(
    req.headers.get("x-vercel-ip-country-region")
  );
  const city = toOptionalHeaderValue(req.headers.get("x-vercel-ip-city"));
  const hasGeoData = Boolean(countryCode || region || city);

  return {
    source: hasGeoData ? "ip_header" : "unavailable",
    country_code: countryCode,
    region,
    city,
  };
};

const toFormData = (contact: LeadContact, answers: LeadAnswers): FormData =>
  normalizeSafetyHabitAnswers({
    ...answers,
    name: contact.name,
    email: contact.email,
    mobile: contact.mobile,
  });

const buildLeadPayload = (
  input: LeadCreateBody,
  location: LeadLocation
): LeadPayload => {
  const formData = toFormData(input.contact, input.answers);
  const result = estimateCameraPlan(formData);
  const safetySummary = getSafetySummary(formData);
  const safetyCategories = getSafetyCategoryScores(formData);
  const { panatagRating } = getResultsSummary(formData, result);

  return {
    source: input.meta.source,
    location,
    contact: input.contact,
    answers: input.answers,
    outcomes: {
      lead: {
        score: toScore100(result.leadScore),
        tier: result.leadTier,
        model_version: toSafeString(result.leadScoringModelVersion) || "unknown",
      },
      safety: {
        total: toScore100(safetySummary.total),
        emergency_readiness_score: toScore100(
          safetySummary.emergencyReadinessScore
        ),
        categories: {
          home_entrance: toScore100(safetyCategories.home_entrance),
          neighborhood_safety_check: toScore100(
            safetyCategories.neighborhood_safety_check
          ),
          windows_terrace: toScore100(safetyCategories.windows_terrace),
          emergency_readiness_home: toScore100(
            safetyCategories.emergency_readiness_home
          ),
        },
      },
      panatag_home_rating: toScore100(panatagRating),
      camera_plan: {
        camera_count: Math.max(0, Math.round(toFiniteNumber(result.cameraCount))),
        nvr_channel: Math.max(0, Math.round(toFiniteNumber(result.nvrChannel))),
        storage_recommended_tb: Math.max(
          1,
          Math.round(toFiniteNumber(result.storageRecommendedTB))
        ),
        storage_estimated_tb_7d:
          Math.round(toFiniteNumber(result.storageEstimatedTB7d) * 1000) / 1000,
      },
    },
  };
};

const buildNewsletterSubscriberInsertBody = (
  contact: LeadContact
): NewsletterSubscriberInsertBody => {
  const email = toSafeString(contact.email).toLowerCase();
  const name = toSafeString(contact.name);

  return {
    name: name || deriveNameFromEmail(email),
    email,
    source: WIZARD_FORM_SOURCE,
  };
};

const syncLeadToNewsletterSubscribers = async (contact: LeadContact) => {
  if (!supabase) return;

  const newsletterInsertBody = buildNewsletterSubscriberInsertBody(contact);
  const updatePayload = {
    name: newsletterInsertBody.name,
    source: newsletterInsertBody.source,
  };

  const { data: existing, error: lookupError } = await supabase
    .from("newsletter_subscribers")
    .select("id")
    .eq("email", newsletterInsertBody.email)
    .limit(1);

  if (lookupError) throw lookupError;

  const existingRow = (existing?.[0] ?? null) as NewsletterSubscriberLookupRow | null;
  if (existingRow) {
    const { error: updateError } = await supabase
      .from("newsletter_subscribers")
      .update(updatePayload)
      .eq("id", existingRow.id);

    if (updateError) throw updateError;
    return;
  }

  const { error: insertError } = await supabase
    .from("newsletter_subscribers")
    .insert(newsletterInsertBody);

  if (!insertError) return;
  if (insertError.code !== "23505") throw insertError;

  const { error: raceUpdateError } = await supabase
    .from("newsletter_subscribers")
    .update(updatePayload)
    .eq("email", newsletterInsertBody.email);

  if (raceUpdateError) throw raceUpdateError;
};

export async function POST(req: Request) {
  if (!supabase) {
    console.warn("Supabase env vars missing; skipping lead insert.");
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const leadBody = sanitizeLeadCreateBody(body);
  if (!leadBody) {
    return NextResponse.json({ error: "Invalid lead payload" }, { status: 400 });
  }

  const location = resolveLeadLocation(req);
  const payload = buildLeadPayload(leadBody, location);
  const leadName =
    toSafeString(payload.contact.name) || deriveNameFromEmail(payload.contact.email);
  const leadInsertBody: LeadInsertBody = {
    email: payload.contact.email,
    name: leadName,
    payload,
  };

  const { error } = await supabase.from("leads").insert(leadInsertBody);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  try {
    await syncLeadToNewsletterSubscribers(payload.contact);
  } catch (newsletterSyncError) {
    console.error("Lead newsletter sync failed:", {
      email: leadInsertBody.email,
      source: WIZARD_FORM_SOURCE,
      error:
        newsletterSyncError instanceof Error
          ? newsletterSyncError.message
          : newsletterSyncError,
    });
  }

  try {
    await sendLeadNtfyNotification({
      name: leadInsertBody.name,
      email: leadInsertBody.email,
      mobile: leadInsertBody.payload.contact.mobile,
      tier: leadInsertBody.payload.outcomes.lead.tier,
      score: leadInsertBody.payload.outcomes.lead.score,
      source: leadInsertBody.payload.source,
      location: leadInsertBody.payload.location,
    });
  } catch (notificationError) {
    console.error("Lead ntfy notification failed:", notificationError);
  }

  return NextResponse.json({ ok: true });
}
