import { NextResponse } from "next/server";
import {
  deriveNameFromEmail,
  normalizeEmail,
} from "../../lib/contactName";
import {
  isNewsletterCampaignsConfigured,
  syncNewsletterSubscriber,
} from "../../lib/newsletterCampaigns";
import { getPublicSiteSettings } from "../../lib/siteAdminSettingsServer";
import { createNewsletterUnsubscribeUrl } from "../../lib/newsletterSubscribers";

const toSafeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

type InsertNewsletterSubscriber = {
  name: string;
  email: string;
  source: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const sanitizeInsertBody = (value: unknown): InsertNewsletterSubscriber | null => {
  if (!isRecord(value)) return null;

  const email = normalizeEmail(toSafeString(value.email));
  if (!email) return null;

  return {
    name: deriveNameFromEmail(email),
    email,
    source: toSafeString(value.source) || "newsletter",
    utm_source: toSafeString(value.utm_source),
    utm_medium: toSafeString(value.utm_medium),
    utm_campaign: toSafeString(value.utm_campaign),
  };
};

export async function POST(req: Request) {
  if (!isNewsletterCampaignsConfigured()) {
    console.warn("Supabase env vars missing; skipping newsletter insert.");
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const rawBody = await req.json().catch(() => null);
  const insertBody = sanitizeInsertBody(rawBody);

  if (!insertBody) {
    return NextResponse.json(
      { error: "Invalid newsletter payload" },
      { status: 400 }
    );
  }

  try {
    const [result, siteSettings] = await Promise.all([
      syncNewsletterSubscriber({
        email: insertBody.email,
        name: insertBody.name,
        acquisitionSource: insertBody.source,
        utmSource: insertBody.utm_source,
        utmMedium: insertBody.utm_medium,
        utmCampaign: insertBody.utm_campaign,
        assignmentProfile: "newsletter_signup",
      }),
      getPublicSiteSettings(),
    ]);

    return NextResponse.json({
      ok: true,
      subscriberId: result.subscriberId,
      created: result.created,
      reactivated: result.reactivated,
      journeys: result.journeyKeys,
      campaigns: result.campaignKeys,
      unsubscribeUrl: createNewsletterUnsubscribeUrl(result.unsubscribeToken),
      emailSendingEnabled: siteSettings.emailSendingEnabled,
    });
  } catch (error) {
    console.error("Newsletter sync failed:", error);
    const syncError =
      error && typeof error === "object" ? (error as Record<string, unknown>) : {};
    return NextResponse.json(
      {
        error:
          typeof syncError.message === "string"
            ? syncError.message
            : "Newsletter signup failed.",
        code: typeof syncError.code === "string" ? syncError.code : undefined,
        details:
          typeof syncError.details === "string" ? syncError.details : undefined,
      },
      { status: 400 },
    );
  }
}
