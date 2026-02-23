import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

type LeadPayloadV2 = {
  v: 2;
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
  recommendations: string[];
};

type LeadInsertBody = {
  email: string;
  name: string;
  tier: string;
  score: number;
  camera_count: number;
  safety_score_total: number;
  payload: LeadPayloadV2;
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

const sanitizeLeadPayload = (value: unknown): LeadPayloadV2 => {
  const payload = isRecord(value) ? value : {};
  const property = isRecord(payload.property) ? payload.property : {};
  const safety = isRecord(payload.safety) ? payload.safety : {};
  const preferences = isRecord(payload.preferences) ? payload.preferences : {};
  const source = toSafeString(payload.source) || "website";

  return {
    v: 2,
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
    recommendations: toStringArray(payload.recommendations),
  };
};

const sanitizeLeadInsertBody = (value: unknown): LeadInsertBody | null => {
  if (!isRecord(value)) return null;

  const email = toSafeString(value.email);
  if (!email) return null;

  return {
    email,
    name: toSafeString(value.name),
    tier: toSafeString(value.tier),
    score: toFiniteNumber(value.score),
    camera_count: toNonNegativeInteger(value.camera_count),
    safety_score_total: toNonNegativeInteger(value.safety_score_total),
    payload: sanitizeLeadPayload(value.payload),
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
