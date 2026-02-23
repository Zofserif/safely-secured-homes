import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { LEAD_SCORE_MAX } from "../../lib/leadScoring";
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

type LeadPayloadBase = {
  source: string;
  mobile: string;
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
    indoor_outdoor_blindspots: number;
    emergency_readiness_home: number;
  };
  preferences: {
    security_features: string[];
    budget_band: string;
    timeline: string;
    diy_security_plan: boolean;
    smart_home_interest: boolean;
    smart_home_features: string[];
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

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const toBoolean = (value: unknown): boolean => typeof value === "boolean" && value;

const toFiniteNumber = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const toNonNegativeInteger = (value: unknown): number =>
  Math.max(0, Math.round(toFiniteNumber(value)));

const toSafetyScore = (value: unknown): number =>
  Math.max(0, Math.min(5, Math.round(toFiniteNumber(value))));

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
      indoor_outdoor_blindspots: toSafetyScore(
        safety.indoor_outdoor_blindspots
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

  const { error } = await supabase.from("leads").insert(sanitizedBody);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
