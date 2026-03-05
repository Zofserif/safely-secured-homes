import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { LEAD_SCORE_MAX } from "../../lib/leadScoring";
import { clampSafetyScore } from "../../lib/safetyScale.js";
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
    size: string;
    floors: string;
    current_setup: string;
  };
  priorities: string[];
  safety: {
    home_entrance: number;
    neighborhood_safety_check: number;
    windows_terrace: number;
    emergency_readiness_home: number;
  };
  preferences: {
    security_features: string[];
    budget_band: string;
    timeline: string;
    diy_security_plan: boolean;
    smart_home_interest: boolean;
    smart_home_features: string[];
    household_stage: string;
    desired_outcome: string;
    goal_obstacle: string;
    has_additional_notes: boolean | null;
    goal_obstacle_other: string;
    solution: string;
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
  };
  panatag_home_rating: number;
  recommendations: string[];
};

type LeadPayloadV2 = LeadPayloadBase & {
  v: 2;
};

type LeadPayloadV3 = LeadPayloadBase & {
  v: 3;
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
  payload: LeadPayloadV2 | LeadPayloadV3;
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

const toBoolean = (value: unknown): boolean => typeof value === "boolean" && value;

const toNullableBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const toFiniteNumber = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const toNonNegativeInteger = (value: unknown): number =>
  Math.max(0, Math.round(toFiniteNumber(value)));

const toSafetyScore = (value: unknown): number =>
  clampSafetyScore(toFiniteNumber(value));

const toPanatagHomeRating = (value: unknown): number => {
  const normalized = Math.round(toFiniteNumber(value));
  if (normalized <= 0) return 0;
  return Math.max(1, Math.min(10, normalized));
};

const toLeadTier = (value: unknown): LeadTier =>
  value === "Hot" || value === "Warm" || value === "Nurture"
    ? value
    : "Nurture";

const sanitizeLeadPayloadBase = (payload: Record<string, unknown>): LeadPayloadBase => {
  const property = isRecord(payload.property) ? payload.property : {};
  const safety = isRecord(payload.safety) ? payload.safety : {};
  const preferences = isRecord(payload.preferences) ? payload.preferences : {};
  const safetyHabits = isRecord(preferences.safety_habits)
    ? preferences.safety_habits
    : {};
  const source = toSafeString(payload.source) || "website";

  return {
    source,
    mobile: toSafeString(payload.mobile),
    property: {
      type: toSafeString(property.type),
      size: toSafeString(property.size),
      floors: toSafeString(property.floors),
      current_setup: toSafeString(property.current_setup),
    },
    priorities: toStringArray(payload.priorities),
    safety: {
      home_entrance: toSafetyScore(safety.home_entrance),
      neighborhood_safety_check: toSafetyScore(
        safety.neighborhood_safety_check
      ),
      windows_terrace: toSafetyScore(
        safety.windows_terrace
      ),
      emergency_readiness_home: toSafetyScore(safety.emergency_readiness_home),
    },
    preferences: {
      security_features: toStringArray(preferences.security_features),
      budget_band: toSafeString(preferences.budget_band),
      timeline: toSafeString(preferences.timeline),
      diy_security_plan: toBoolean(preferences.diy_security_plan),
      smart_home_interest: toBoolean(preferences.smart_home_interest),
      smart_home_features: toStringArray(preferences.smart_home_features),
      household_stage: toSafeString(preferences.household_stage),
      desired_outcome: toSafeString(preferences.desired_outcome),
      goal_obstacle: toSafeString(preferences.goal_obstacle),
      has_additional_notes: toNullableBoolean(preferences.has_additional_notes),
      goal_obstacle_other: toSafeString(preferences.goal_obstacle_other),
      solution: toSafeString(preferences.solution),
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
    },
    panatag_home_rating: toPanatagHomeRating(payload.panatag_home_rating),
    recommendations: toStringArray(payload.recommendations),
  };
};

const sanitizeLeadScoreBreakdownAnswer = (
  value: unknown
): LeadScoreBreakdownAnswer | null => {
  if (!isRecord(value)) return null;

  return {
    answer: toSafeString(value.answer),
    points: toNonNegativeInteger(value.points),
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
    matchedPoints: toNonNegativeInteger(value.matchedPoints),
    bonusPoints: toNonNegativeInteger(value.bonusPoints),
    maxPoints: toNonNegativeInteger(value.maxPoints),
    points: toNonNegativeInteger(value.points),
  };
};

const sanitizeLeadPayloadV2 = (value: unknown): LeadPayloadV2 | null => {
  if (!isRecord(value) || value.v !== 2) return null;

  return {
    v: 2,
    ...sanitizeLeadPayloadBase(value),
  };
};

const sanitizeLeadPayloadV3 = (value: unknown): LeadPayloadV3 | null => {
  if (!isRecord(value) || value.v !== 3) return null;

  const scoring = isRecord(value.scoring) ? value.scoring : null;
  if (!scoring || !Array.isArray(scoring.breakdown)) return null;

  const breakdown: LeadScoreBreakdownItem[] = [];
  for (const item of scoring.breakdown) {
    const sanitized = sanitizeLeadScoreBreakdownItem(item);
    if (!sanitized) return null;
    breakdown.push(sanitized);
  }

  const sanitizedLeadScoreMax = toNonNegativeInteger(scoring.lead_score_max);
  const leadScoreMax =
    sanitizedLeadScoreMax > 0 ? sanitizedLeadScoreMax : LEAD_SCORE_MAX;

  return {
    v: 3,
    ...sanitizeLeadPayloadBase(value),
    scoring: {
      model_version: toSafeString(scoring.model_version),
      lead_score: toNonNegativeInteger(scoring.lead_score),
      lead_score_max: leadScoreMax,
      lead_tier: toLeadTier(scoring.lead_tier),
      breakdown,
    },
  };
};

const sanitizeLeadPayload = (value: unknown): LeadPayloadV2 | LeadPayloadV3 | null => {
  if (!isRecord(value)) return null;

  if (value.v === 2) return sanitizeLeadPayloadV2(value);
  if (value.v === 3) return sanitizeLeadPayloadV3(value);
  return null;
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
    score: toFiniteNumber(value.score),
    camera_count: toNonNegativeInteger(value.camera_count),
    safety_score_total: toNonNegativeInteger(value.safety_score_total),
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
  return NextResponse.json({ ok: true });
}
