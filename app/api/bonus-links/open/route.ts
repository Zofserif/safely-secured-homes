import { NextResponse } from "next/server";
import { openBonusLink } from "../../../lib/bonusClaimLinksServer";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  try {
    const status = await openBonusLink(body?.key);
    return NextResponse.json(status, { headers: noStoreHeaders });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to open bonus link.",
      },
      { status: 500, headers: noStoreHeaders },
    );
  }
}

