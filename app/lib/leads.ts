import { sendLeadEmail } from "./email";
import type { CalculationResult, FormData } from "./types";

type LeadAnswers = Omit<FormData, "first_name" | "email" | "mobile">;

type LeadCreateBody = {
  contact: {
    first_name: string;
    email: string;
    mobile: string;
  };
  answers: LeadAnswers;
  meta: {
    source: string;
  };
};

const toSafeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const buildLeadAnswers = (data: FormData): LeadAnswers => ({
  property_type: data.property_type,
  has_spare_key: data.has_spare_key,
  changed_wifi_default_password: data.changed_wifi_default_password,
  sleeps_with_earphones: data.sleeps_with_earphones,
  locks_windows_gate_at_night: data.locks_windows_gate_at_night,
  has_security_cameras: data.has_security_cameras,
  has_smoke_alarm_or_fire_extinguisher: data.has_smoke_alarm_or_fire_extinguisher,
  has_first_aid_or_medicine_ready: data.has_first_aid_or_medicine_ready,
  knows_local_emergency_contacts: data.knows_local_emergency_contacts,
  home_entrance: data.home_entrance,
  windows_terrace: data.windows_terrace,
  neighborhood_safety_check: data.neighborhood_safety_check,
  emergency_readiness_home: data.emergency_readiness_home,
  household_stage: data.household_stage,
  desired_outcome: data.desired_outcome,
  goal_obstacle: data.goal_obstacle,
  has_additional_notes: data.has_additional_notes,
  additional_notes: data.additional_notes,
  solution: data.solution,
});

const buildLeadCreateBody = (data: FormData, source?: string): LeadCreateBody => ({
  contact: {
    first_name: toSafeString(data.first_name),
    email: toSafeString(data.email),
    mobile: toSafeString(data.mobile),
  },
  answers: buildLeadAnswers(data),
  meta: {
    source: toSafeString(source) || "website",
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
  _result: CalculationResult,
  source?: string
) {
  const insertBody = buildLeadCreateBody(data, source);

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
