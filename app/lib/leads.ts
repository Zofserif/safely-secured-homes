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

const FORMSPREE_ENDPOINT = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT;

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
  payload: LeadPayloadV3;
};

const toSafeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const toPanatagHomeRating = (value: number): number =>
  Math.max(1, Math.min(10, Math.round(value)));

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
    size: toSafeString(data.home_size),
    floors: toSafeString(data.floors),
    current_setup: toSafeString(data.current_setup),
  },
  priorities: toStringArray(data.priority_areas),
  safety: safetyCategories,
  preferences: {
    security_features: toStringArray(data.features_must),
    budget_band: toSafeString(data.budget_band),
    timeline: toSafeString(data.timeline),
    diy_security_plan: Boolean(data.diy_security_plan),
    smart_home_interest: Boolean(data.smart_home_interest),
    smart_home_features: toStringArray(data.smart_home_features),
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

const buildLeadPayloadV3 = (
  data: FormData,
  result: CalculationResult,
  safetyCategories: SafetyCategoryScores,
  panatagHomeRating: number,
  source?: string
): LeadPayloadV3 => ({
  v: 3,
  ...buildLeadPayloadBase(data, safetyCategories, panatagHomeRating, source),
  recommendations: toStringArray(result.recommendations),
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
    last_name: data.last_name,
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

export async function submitToFormspree(
  data: FormData,
  result: CalculationResult,
  source?: string
) {
  const { panatagRating } = getResultsSummary(data, result);

  const payload = {
    ...data,
    _subject: `New Lead: ${data.first_name} ${data.last_name} [${result.leadTier}]`,
    summary_camera_count: result.cameraCount,
    summary_nvr_channel: result.nvrChannel,
    summary_lead_score: result.leadScore,
    summary_lead_tier: result.leadTier,
    summary_panatag_home_rating: panatagRating,
    summary_recommendations: result.recommendations.join(", "),
    lead_source: source ?? "website",
  };

  if (!FORMSPREE_ENDPOINT) {
    console.warn(
      "⚠️ FORMSPREE_ENDPOINT is not configured. Please set NEXT_PUBLIC_FORMSPREE_ENDPOINT."
    );
    return;
  }

  try {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "Unknown error",
      }));
      console.error("❌ Formspree submission failed:", errorData);

      if (FORMSPREE_ENDPOINT.includes("YOUR_FORMSPREE_ID")) {
        console.warn(
          "⚠️ Placeholder Formspree URL detected. Update NEXT_PUBLIC_FORMSPREE_ENDPOINT."
        );
      }
    } else {
      console.log("✅ Formspree submission successful!");
    }
  } catch (error) {
    console.error("❌ Network error during Formspree submission:", error);
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

  const fullName = [toSafeString(data.first_name), toSafeString(data.last_name)]
    .filter((part) => part.length > 0)
    .join(" ");

  const insertBody: LeadInsertBody = {
    email: toSafeString(data.email),
    name: fullName,
    tier: result.leadTier,
    score: result.leadScore,
    camera_count: result.cameraCount,
    safety_score_total: safetySummary.total,
    payload: buildLeadPayloadV3(
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
