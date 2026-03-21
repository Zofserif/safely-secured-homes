import { NextResponse } from "next/server";
import { normalizeEmail } from "../../lib/contactName";
import { processWaitlistJourneyEnrollment } from "../../lib/waitlistJourney";
import {
  isWaitlistConfigured,
  syncWaitlistedClient,
} from "../../lib/waitlistClients";

const toSafeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

type InsertWaitlistedClientBody = {
  name: string;
  email: string;
  source: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const sanitizeInsertBody = (
  value: unknown,
): InsertWaitlistedClientBody | null => {
  if (!isRecord(value)) return null;

  const name = toSafeString(value.name).replace(/\s+/g, " ").trim();
  const email = normalizeEmail(toSafeString(value.email));
  if (!name || !email) return null;

  return {
    name,
    email,
    source: toSafeString(value.source) || "waitlist",
    utm_source: toSafeString(value.utm_source),
    utm_medium: toSafeString(value.utm_medium),
    utm_campaign: toSafeString(value.utm_campaign),
  };
};

export async function POST(req: Request) {
  if (!isWaitlistConfigured()) {
    console.warn("Supabase env vars missing; skipping waitlist insert.");
    return NextResponse.json(
      { error: "Waitlist is not configured" },
      { status: 500 },
    );
  }

  const rawBody = await req.json().catch(() => null);
  const insertBody = sanitizeInsertBody(rawBody);

  if (!insertBody) {
    return NextResponse.json(
      { error: "Invalid waitlist payload" },
      { status: 400 },
    );
  }

  try {
    const result = await syncWaitlistedClient({
      email: insertBody.email,
      name: insertBody.name,
      source: insertBody.source,
      utmSource: insertBody.utm_source,
      utmMedium: insertBody.utm_medium,
      utmCampaign: insertBody.utm_campaign,
    });

    if (result.enrollmentId) {
      try {
        await processWaitlistJourneyEnrollment(result.enrollmentId);
      } catch (error) {
        console.error("Immediate waitlist journey processing failed:", error);
      }
    }

    return NextResponse.json({
      ok: true,
      created: result.created,
      reactivated: result.reactivated,
      journeyReady: result.journeyReady,
      enrolled: result.enrolled,
    });
  } catch (error) {
    console.error("Waitlist sync failed:", error);
    const syncError =
      error && typeof error === "object" ? (error as Record<string, unknown>) : {};

    return NextResponse.json(
      {
        error:
          typeof syncError.message === "string"
            ? syncError.message
            : "Waitlist signup failed.",
        code: typeof syncError.code === "string" ? syncError.code : undefined,
        details:
          typeof syncError.details === "string" ? syncError.details : undefined,
      },
      { status: 400 },
    );
  }
}
