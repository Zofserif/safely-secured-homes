import { sendLeadEmail } from "./email";
import { getResultsSummary } from "./calculations";
import { LEAD_SCORE_MAX } from "./leadScoring";
import {
  getSafetyCategoryScores,
  getSafetySummary,
  type SafetyCategoryScores,
} from "./safetyScores";
import type {
  CalculationResult,
  FormData,
  LeadScoreBreakdownItem,
  LeadTier,
} from "./types";

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
      safety_side_back_entry: number | null;
      safety_windows_terrace: number | null;
      safety_driveway_garage: number | null;
      safety_indoor_choke_points: number | null;
      safety_emergency_readiness: number | null;
    };
  };
  panatag_home_rating: number;
  recommendations: string[];
};

type LeadPayloadV4 = LeadPayloadBase & {
  v: 4;
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
  payload: LeadPayloadV4;
};

const toSafeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const toNullableBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const toNullableFiniteNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const toPanatagHomeRating = (value: number): number =>
  Math.max(0, Math.min(100, Math.round(value)));

const buildLeadPayloadBase = (
  data: FormData,
  safetyCategories: SafetyCategoryScores,
  panatagHomeRating: number,
  source?: string
): LeadPayloadBase => ({
  source: toSafeString(source) || "website",
  mobile: toSafeString(data.mobile),
  property: {
    type: toSafeString(data.property_type),
  },
  priorities: {
    household_stage: toSafeString(data.household_stage),
    desired_outcome: toSafeString(data.desired_outcome),
    goal_obstacle: toSafeString(data.goal_obstacle),
    has_additional_notes: toNullableBoolean(data.has_additional_notes),
    goal_obstacle_other: toSafeString(data.goal_obstacle_other),
    solution: toSafeString(data.solution),
  },
  safety: safetyCategories,
  preferences: {
    safety_habits: {
      has_spare_key: toNullableBoolean(data.has_spare_key),
      changed_wifi_default_password: toNullableBoolean(
        data.changed_wifi_default_password
      ),
      sleeps_with_earphones: toNullableBoolean(data.sleeps_with_earphones),
      locks_windows_gate_at_night: toNullableBoolean(
        data.locks_windows_gate_at_night
      ),
      has_security_cameras: toNullableBoolean(data.has_security_cameras),
      has_smoke_alarm_or_fire_extinguisher: toNullableBoolean(
        data.has_smoke_alarm_or_fire_extinguisher
      ),
      has_first_aid_or_medicine_ready: toNullableBoolean(
        data.has_first_aid_or_medicine_ready
      ),
      knows_local_emergency_contacts: toNullableBoolean(
        data.knows_local_emergency_contacts
      ),
    },
    safety_sliders: {
      safety_gate_entry: toNullableFiniteNumber(data.safety_gate_entry),
      safety_blindspots: toNullableFiniteNumber(data.safety_blindspots),
      safety_side_back_entry: toNullableFiniteNumber(data.safety_side_back_entry),
      safety_windows_terrace: toNullableFiniteNumber(data.safety_windows_terrace),
      safety_driveway_garage: toNullableFiniteNumber(data.safety_driveway_garage),
      safety_indoor_choke_points: toNullableFiniteNumber(
        data.safety_indoor_choke_points
      ),
      safety_emergency_readiness: toNullableFiniteNumber(
        data.safety_emergency_readiness
      ),
    },
  },
  panatag_home_rating: toPanatagHomeRating(panatagHomeRating),
  recommendations: [],
});

const toLeadScoreBreakdown = (value: unknown): LeadScoreBreakdownItem[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is LeadScoreBreakdownItem =>
      typeof item === "object" && item !== null
  );
};

const buildLeadPayloadV4 = (
  data: FormData,
  result: CalculationResult,
  safetyCategories: SafetyCategoryScores,
  panatagHomeRating: number,
  source?: string
): LeadPayloadV4 => ({
  v: 4,
  ...buildLeadPayloadBase(data, safetyCategories, panatagHomeRating, source),
  recommendations: [],
  scoring: {
    model_version: toSafeString(result.leadScoringModelVersion) || "unknown",
    lead_score: result.leadScore,
    lead_score_max: LEAD_SCORE_MAX,
    lead_tier: result.leadTier,
    breakdown: toLeadScoreBreakdown(result.leadScoreBreakdown),
  },
});

export async function submitToEmail(
  data: FormData,
  result: CalculationResult,
  source?: string
) {
  const templateParams = {
    to_email: data.email,
    firstname: data.first_name,
    mobile: data.mobile,
    lead_tier: result.leadTier,
    camera_count: result.cameraCount,
    property_type: data.property_type,
    recommendations: result.recommendations.join(", "),
    lead_source: source ?? "website",
  };

  try {
    await sendLeadEmail(templateParams);
    console.log("Email sent successfully via EmailJS");
  } catch (error) {
    console.error("Email submission failed:", error);
  }
}

export async function submitLeadToSupabase(
  data: FormData,
  result: CalculationResult,
  source?: string
) {
  const safetySummary = getSafetySummary(data);
  const safetyCategories = getSafetyCategoryScores(data);
  const { panatagRating } = getResultsSummary(data, result);

  const fullName = toSafeString(data.first_name);

  const insertBody: LeadInsertBody = {
    email: toSafeString(data.email),
    name: fullName,
    tier: result.leadTier,
    score: result.leadScore,
    camera_count: result.cameraCount,
    safety_score_total: safetySummary.total,
    payload: buildLeadPayloadV4(
      data,
      result,
      safetyCategories,
      panatagRating,
      source
    ),
  };

  try {
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(insertBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "Unknown error",
      }));
      console.error("Supabase insert failed:", errorData);
    } else {
      console.log("Lead saved to Supabase via API route");
    }
  } catch (error) {
    console.error("Supabase request error:", error);
  }
}
