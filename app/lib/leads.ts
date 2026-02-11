import { sendLeadEmail } from "./email";
import { FormData, CalculationResult } from "./types";

const FORMSPREE_ENDPOINT = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT;

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
  const payload = {
    ...data,
    _subject: `New Lead: ${data.first_name} ${data.last_name} [${result.leadTier}]`,
    summary_camera_count: result.cameraCount,
    summary_nvr_channel: result.nvrChannel,
    summary_lead_score: result.leadScore,
    summary_lead_tier: result.leadTier,
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
  const safetyScores = {
    gate_entry: data.safety_gate_entry,
    blindspots: data.safety_blindspots,
    side_back_entry: data.safety_side_back_entry,
    windows_terrace: data.safety_windows_terrace,
    driveway_garage: data.safety_driveway_garage,
    indoor_choke_points: data.safety_indoor_choke_points,
    emergency_readiness: data.safety_emergency_readiness,
  };
  const safetyScoreTotal = Object.values(safetyScores).reduce<number>(
    (sum, value) => (typeof value === "number" ? sum + value : sum),
    0
  );

  try {
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        name: `${data.first_name} ${data.last_name}`,
        tier: result.leadTier,
        score: result.leadScore,
        camera_count: result.cameraCount,
        safety_score_total: safetyScoreTotal,
        payload: {
          ...data,
          safety_scores: safetyScores,
          safety_score_total: safetyScoreTotal,
          lead_source: source ?? "website",
        },
      }),
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
