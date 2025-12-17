import { sendLeadEmail } from "./email";
import { FormData, CalculationResult } from "./types";

const FORMSPREE_ENDPOINT = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT;

export async function submitToEmail(
  data: FormData,
  result: CalculationResult
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
  result: CalculationResult
) {
  const payload = {
    ...data,
    _subject: `New Lead: ${data.first_name} ${data.last_name} [${result.leadTier}]`,
    summary_camera_count: result.cameraCount,
    summary_nvr_channel: result.nvrChannel,
    summary_lead_score: result.leadScore,
    summary_lead_tier: result.leadTier,
    summary_recommendations: result.recommendations.join(", "),
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
  result: CalculationResult
) {
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
        payload: data,
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
