import { NextResponse } from "next/server";
import {
  createBonusLink,
  getBonusLinksAdminSecret,
} from "../../lib/bonusClaimLinksServer";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

export const dynamic = "force-dynamic";

const toOptionalText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const isAuthorizedRequest = (req: Request, secret: string) =>
  req.headers.get("authorization") === `Bearer ${secret}`;

export async function POST(req: Request) {
  const adminSecret = getBonusLinksAdminSecret();
  if (!adminSecret) {
    return NextResponse.json(
      { error: "BONUS_LINKS_ADMIN_SECRET is not configured." },
      { status: 500, headers: noStoreHeaders },
    );
  }

  if (!isAuthorizedRequest(req, adminSecret)) {
    return NextResponse.json(
      { error: "Unauthorized bonus link request" },
      { status: 401, headers: noStoreHeaders },
    );
  }

  const body = await req.json().catch(() => null);
  const recipientName = toOptionalText(body?.recipientName ?? body?.name);
  const recipientEmail = toOptionalText(body?.recipientEmail ?? body?.email);
  const note = toOptionalText(body?.note);

  try {
    const requestBaseUrl = new URL(req.url).origin;
    const result = await createBonusLink({
      recipientName,
      recipientEmail,
      note,
      baseUrl: requestBaseUrl,
    });

    return NextResponse.json(result, { headers: noStoreHeaders });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create bonus link.",
      },
      { status: 500, headers: noStoreHeaders },
    );
  }
}

