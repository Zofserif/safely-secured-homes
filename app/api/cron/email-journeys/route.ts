import { NextResponse } from "next/server";
import { processDueJourneySteps } from "../../../lib/leadJourney";
import { isNewsletterCampaignsConfigured } from "../../../lib/newsletterCampaigns";

const cronSecret = process.env.CRON_SECRET?.trim() || "";

const isAuthorizedCronRequest = (req: Request) => {
  if (!cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  return req.headers.get("authorization") === `Bearer ${cronSecret}`;
};

const toPositiveInteger = (value: string | null, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export async function GET(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized cron request" }, { status: 401 });
  }

  if (!isNewsletterCampaignsConfigured()) {
    return NextResponse.json(
      { error: "Newsletter campaigns are not configured" },
      { status: 500 },
    );
  }

  const requestUrl = new URL(req.url);
  const limit = toPositiveInteger(requestUrl.searchParams.get("limit"), 200);

  try {
    const result = await processDueJourneySteps({ limit });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Email journey cron failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Email journey cron failed.",
      },
      { status: 500 },
    );
  }
}
