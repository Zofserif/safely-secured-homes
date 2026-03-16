import { NextResponse } from "next/server";
import { parseBonusDeliveryCoordinates } from "../../../lib/bonusDeliveryCoverage.ts";
import { validateBonusDeliveryLocation } from "../../../lib/bonusDeliveryCoverageServer.ts";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

export const dynamic = "force-dynamic";

type BonusCoverageRouteDependencies = {
  validateBonusDeliveryLocation: typeof validateBonusDeliveryLocation;
};

const defaultDependencies: BonusCoverageRouteDependencies = {
  validateBonusDeliveryLocation,
};

export async function handleBonusCoverageRequest(
  req: Request,
  dependencies: BonusCoverageRouteDependencies = defaultDependencies,
) {
  const body = await req.json().catch(() => null);
  const location = parseBonusDeliveryCoordinates(body?.location);

  if (!location) {
    return NextResponse.json(
      {
        ok: false,
        code: "unverifiable_location",
      },
      {
        status: 400,
        headers: noStoreHeaders,
      },
    );
  }

  try {
    const result = await dependencies.validateBonusDeliveryLocation(location);
    return NextResponse.json(result, { headers: noStoreHeaders });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to validate delivery coverage.",
      },
      {
        status: 500,
        headers: noStoreHeaders,
      },
    );
  }
}

export async function POST(req: Request) {
  return handleBonusCoverageRequest(req);
}
