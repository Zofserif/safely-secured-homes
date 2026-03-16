import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { deriveNameFromEmail } from "../../lib/contactName";
import {
  buildLeadPayload,
  resolveStoredLeadContactName,
  type LeadAnswers,
  type LeadContact,
  type LeadCreateBody,
  type LeadLocation,
  type LeadPayloadV2,
} from "../../lib/leadPayload";
import { sendLeadNtfyNotification } from "../../lib/ntfy";
import { clampSafetyScore } from "../../lib/safetyScale.js";
import { processLeadJourneyEnrollment } from "../../lib/leadJourney";
import {
  EMAIL_JOURNEY_KEYS,
  getActiveJourneyEnrollmentForSubscriber,
  syncNewsletterSubscriber,
} from "../../lib/newsletterCampaigns";
import { getPublicSiteSettings } from "../../lib/siteAdminSettingsServer";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

type LeadInsertBody = {
  email: string;
  name: string;
  payload: LeadPayloadV2;
};

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

const toBoolean = (value: unknown): boolean =>
  typeof value === "boolean" ? value : false;

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
      utm_source: toSafeString(rawMeta.utm_source),
      utm_medium: toSafeString(rawMeta.utm_medium),
      utm_campaign: toSafeString(rawMeta.utm_campaign),
      allow_external_emails: toNullableBoolean(rawMeta.allow_external_emails),
      has_bonus: toBoolean(rawMeta.has_bonus),
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
  const siteSettings = await getPublicSiteSettings();
  if (!siteSettings.bonusEnabled) {
    leadBody.meta.has_bonus = false;
  }

  const location = resolveLeadLocation(req);
  const payload = buildLeadPayload(leadBody, location);
  const leadName =
    resolveStoredLeadContactName(payload.contact) ||
    deriveNameFromEmail(payload.contact.email);
  const leadInsertBody: LeadInsertBody = {
    email: payload.contact.email,
    name: leadName,
    payload,
  };

  const { error } = await supabase.from("leads").insert(leadInsertBody);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  try {
    const newsletterSyncResult = await syncNewsletterSubscriber({
      email: payload.contact.email,
      name: payload.contact.name || deriveNameFromEmail(payload.contact.email),
      acquisitionSource: leadBody.meta.source,
      utmSource: leadBody.meta.utm_source,
      utmMedium: leadBody.meta.utm_medium,
      utmCampaign: leadBody.meta.utm_campaign,
      assignmentProfile: "lead_capture",
    });

    const allowExternalEmails =
      process.env.NODE_ENV === "production"
        ? true
        : leadBody.meta.allow_external_emails === true;

    if (allowExternalEmails) {
      const activeLeadEnrollment = await getActiveJourneyEnrollmentForSubscriber(
        newsletterSyncResult.subscriberId,
        EMAIL_JOURNEY_KEYS.leadFollowUpJourney,
      );

      if (activeLeadEnrollment) {
        const journeyResult = await processLeadJourneyEnrollment(
          activeLeadEnrollment.enrollmentId,
        );

        if (journeyResult.action === "failed") {
          console.error("Immediate lead journey send failed:", {
            email: payload.contact.email,
            enrollmentId: activeLeadEnrollment.enrollmentId,
            stepKey: journeyResult.stepKey,
            reason: journeyResult.reason,
          });
        }
      }
    }
  } catch (newsletterSyncError) {
    console.error("Lead newsletter sync failed:", {
      email: leadInsertBody.email,
      source: leadBody.meta.source,
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
      tier: leadInsertBody.payload.outcomes.lead.tier ?? "Nurture",
      score: leadInsertBody.payload.outcomes.lead.score ?? 0,
      source: leadInsertBody.payload.source,
      location: leadInsertBody.payload.location,
    });
  } catch (notificationError) {
    console.error("Lead ntfy notification failed:", notificationError);
  }

  return NextResponse.json({ ok: true });
}
