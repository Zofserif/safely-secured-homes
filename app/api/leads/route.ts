import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { LEAD_SCORE_MAX } from "../../lib/leadScoring";
import { clampSafetyScore } from "../../lib/safetyScale.js";
import { sendLeadNtfyNotification } from "../../lib/ntfy";
import type {
  LeadScoreBreakdownAnswer,
  LeadScoreBreakdownItem,
  LeadTier,
} from "../../lib/types";

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

type LeadPayloadBase = {
  source: string;
  mobile: string;
  location?: LeadLocation;
  property: {
    type: string;
  };
  priorities: {
    household_stage: string;
    desired_outcome: string;
    goal_obstacle: string;
    has_additional_notes: boolean | null;
    goal_obstacle_other: string;
    solution: string;
  };
  safety: {
    home_entrance: number;
    neighborhood_safety_check: number;
    windows_terrace: number;
    emergency_readiness_home: number;
  };
  preferences: {
    safety_habits: {
      has_spare_key: boolean | null;
      changed_wifi_default_password: boolean | null;
      sleeps_with_earphones: boolean | null;
      locks_windows_gate_at_night: boolean | null;
      has_security_cameras: boolean | null;
      has_smoke_alarm_or_fire_extinguisher: boolean | null;
      has_first_aid_or_medicine_ready: boolean | null;
      knows_local_emergency_contacts: boolean | null;
    };
    safety_sliders: {
      safety_gate_entry: number | null;
      safety_blindspots: number | null;
      safety_driveway_garage: number | null;
      safety_emergency_readiness: number | null;
    };
  };
  panatag_home_rating: number;
  recommendations: string[];
};

type LeadPayloadV5 = LeadPayloadBase & {
  v: 5;
  scoring: {
    model_version: string;
    lead_score: number;
    lead_score_max: number;
    lead_tier: LeadTier;
    breakdown: LeadScoreBreakdownItem[];
  };
};

type LeadInsertBody = {
  email: string;
  name: string;
  tier: string;
  score: number;
  camera_count: number;
  safety_score_total: number;
  payload: LeadPayloadV5;
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

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const toNullableBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const toFiniteNumber = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const toNonNegativeInteger = (value: unknown): number =>
  Math.max(0, Math.round(toFiniteNumber(value)));

const toScore100 = (value: unknown): number =>
  Math.max(0, Math.min(100, Math.round(toFiniteNumber(value))));

const toSafetyScore = (value: unknown): number =>
  clampSafetyScore(toFiniteNumber(value));

const toNullableSafetyScore = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value)
    ? clampSafetyScore(value)
    : null;

const toPanatagHomeRating = (value: unknown): number => toScore100(value);

const toLeadTier = (value: unknown): LeadTier =>
  value === "Hot" || value === "Warm" || value === "Nurture"
    ? value
    : "Nurture";

const sanitizeLeadPayloadBase = (payload: Record<string, unknown>): LeadPayloadBase => {
  const property = isRecord(payload.property) ? payload.property : {};
  const priorities = isRecord(payload.priorities) ? payload.priorities : {};
  const safety = isRecord(payload.safety) ? payload.safety : {};
  const preferences = isRecord(payload.preferences) ? payload.preferences : {};
  const safetyHabits = isRecord(preferences.safety_habits)
    ? preferences.safety_habits
    : {};
  const safetySliders = isRecord(preferences.safety_sliders)
    ? preferences.safety_sliders
    : {};
  const source = toSafeString(payload.source) || "website";

  return {
    source,
    mobile: toSafeString(payload.mobile),
    property: {
      type: toSafeString(property.type),
    },
    priorities: {
      household_stage: toSafeString(priorities.household_stage),
      desired_outcome: toSafeString(priorities.desired_outcome),
      goal_obstacle: toSafeString(priorities.goal_obstacle),
      has_additional_notes: toNullableBoolean(priorities.has_additional_notes),
      goal_obstacle_other: toSafeString(priorities.goal_obstacle_other),
      solution: toSafeString(priorities.solution),
    },
    safety: {
      home_entrance: toSafetyScore(safety.home_entrance),
      neighborhood_safety_check: toSafetyScore(safety.neighborhood_safety_check),
      windows_terrace: toSafetyScore(safety.windows_terrace),
      emergency_readiness_home: toSafetyScore(safety.emergency_readiness_home),
    },
    preferences: {
      safety_habits: {
        has_spare_key: toNullableBoolean(safetyHabits.has_spare_key),
        changed_wifi_default_password: toNullableBoolean(
          safetyHabits.changed_wifi_default_password
        ),
        sleeps_with_earphones: toNullableBoolean(safetyHabits.sleeps_with_earphones),
        locks_windows_gate_at_night: toNullableBoolean(
          safetyHabits.locks_windows_gate_at_night
        ),
        has_security_cameras: toNullableBoolean(safetyHabits.has_security_cameras),
        has_smoke_alarm_or_fire_extinguisher: toNullableBoolean(
          safetyHabits.has_smoke_alarm_or_fire_extinguisher
        ),
        has_first_aid_or_medicine_ready: toNullableBoolean(
          safetyHabits.has_first_aid_or_medicine_ready
        ),
        knows_local_emergency_contacts: toNullableBoolean(
          safetyHabits.knows_local_emergency_contacts
        ),
      },
      safety_sliders: {
        safety_gate_entry: toNullableSafetyScore(safetySliders.safety_gate_entry),
        safety_blindspots: toNullableSafetyScore(safetySliders.safety_blindspots),
        safety_driveway_garage: toNullableSafetyScore(
          safetySliders.safety_driveway_garage
        ),
        safety_emergency_readiness: toNullableSafetyScore(
          safetySliders.safety_emergency_readiness
        ),
      },
    },
    panatag_home_rating: toPanatagHomeRating(payload.panatag_home_rating),
    recommendations: [],
  };
};

const sanitizeLeadScoreBreakdownAnswer = (
  value: unknown
): LeadScoreBreakdownAnswer | null => {
  if (!isRecord(value)) return null;

  return {
    answer: toSafeString(value.answer),
    points: toScore100(value.points),
  };
};

const sanitizeLeadScoreBreakdownItem = (
  value: unknown
): LeadScoreBreakdownItem | null => {
  if (!isRecord(value)) return null;

  const matchedAnswersValue = Array.isArray(value.matchedAnswers)
    ? value.matchedAnswers
    : [];
  const matchedAnswers: LeadScoreBreakdownAnswer[] = [];

  for (const item of matchedAnswersValue) {
    const sanitized = sanitizeLeadScoreBreakdownAnswer(item);
    if (!sanitized) return null;
    matchedAnswers.push(sanitized);
  }

  return {
    id: toSafeString(value.id),
    label: toSafeString(value.label),
    questionKey: toSafeString(value.questionKey),
    selectedAnswers: toStringArray(value.selectedAnswers),
    matchedAnswers,
    matchedPoints: toScore100(value.matchedPoints),
    bonusPoints: toScore100(value.bonusPoints),
    maxPoints: toScore100(value.maxPoints),
    points: toScore100(value.points),
  };
};

const sanitizeLeadPayloadV5 = (value: unknown): LeadPayloadV5 | null => {
  if (!isRecord(value) || value.v !== 5) return null;

  const scoring = isRecord(value.scoring) ? value.scoring : null;
  if (!scoring || !Array.isArray(scoring.breakdown)) return null;

  const breakdown: LeadScoreBreakdownItem[] = [];
  for (const item of scoring.breakdown) {
    const sanitized = sanitizeLeadScoreBreakdownItem(item);
    if (!sanitized) return null;
    breakdown.push(sanitized);
  }

  return {
    v: 5,
    ...sanitizeLeadPayloadBase(value),
    scoring: {
      model_version: toSafeString(scoring.model_version),
      lead_score: toScore100(scoring.lead_score),
      lead_score_max: LEAD_SCORE_MAX,
      lead_tier: toLeadTier(scoring.lead_tier),
      breakdown,
    },
  };
};

const sanitizeLeadPayload = (value: unknown): LeadPayloadV5 | null => {
  if (!isRecord(value)) return null;
  return sanitizeLeadPayloadV5(value);
};

const sanitizeLeadInsertBody = (value: unknown): LeadInsertBody | null => {
  if (!isRecord(value)) return null;

  const email = toSafeString(value.email);
  if (!email) return null;
  const payload = sanitizeLeadPayload(value.payload);
  if (!payload) return null;

  return {
    email,
    name: toSafeString(value.name),
    tier: toSafeString(value.tier),
    score: toScore100(value.score),
    camera_count: toNonNegativeInteger(value.camera_count),
    safety_score_total: toScore100(value.safety_score_total),
    payload,
  };
};

const resolveLeadLocation = (req: Request): LeadLocation => {
  const countryCode =
    toOptionalHeaderValue(req.headers.get("x-vercel-ip-country")) ??
    toOptionalHeaderValue(req.headers.get("cf-ipcountry"));
  const region = toOptionalHeaderValue(req.headers.get("x-vercel-ip-country-region"));
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
  const sanitizedBody = sanitizeLeadInsertBody(body);

  if (!sanitizedBody) {
    return NextResponse.json({ error: "Invalid lead payload" }, { status: 400 });
  }

  const resolvedLocation = resolveLeadLocation(req);
  const leadInsertBody: LeadInsertBody = {
    ...sanitizedBody,
    payload: {
      ...sanitizedBody.payload,
      location: resolvedLocation,
    },
  };

  const { error } = await supabase.from("leads").insert(leadInsertBody);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  try {
    await sendLeadNtfyNotification({
      name: leadInsertBody.name,
      email: leadInsertBody.email,
      mobile: leadInsertBody.payload.mobile,
      tier: leadInsertBody.payload.scoring.lead_tier,
      score: leadInsertBody.payload.scoring.lead_score,
      source: leadInsertBody.payload.source,
      location: leadInsertBody.payload.location,
    });
  } catch (notificationError) {
    console.error("Lead ntfy notification failed:", notificationError);
  }

  return NextResponse.json({ ok: true });
}
