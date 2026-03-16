import { NextResponse } from "next/server";
import {
  isValidBonusLinkKey,
  normalizeBonusLinkKey,
} from "../../../lib/bonusClaimLinks.ts";
import { claimBonusLink } from "../../../lib/bonusClaimLinksServer.ts";
import { getBonusClaimFieldErrors } from "../../../lib/bonusClaimValidation.ts";
import { validateBonusDeliveryLocation } from "../../../lib/bonusDeliveryCoverageServer.ts";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

export const dynamic = "force-dynamic";

const toRequiredText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

type BonusClaimRouteDependencies = {
  claimBonusLink: typeof claimBonusLink;
  validateBonusDeliveryLocation: typeof validateBonusDeliveryLocation;
};

const defaultDependencies: BonusClaimRouteDependencies = {
  claimBonusLink,
  validateBonusDeliveryLocation,
};

export async function handleBonusClaimRequest(
  req: Request,
  dependencies: BonusClaimRouteDependencies = defaultDependencies,
) {
  const body = await req.json().catch(() => null);
  const key = normalizeBonusLinkKey(body?.key);
  const name = toRequiredText(body?.name);
  const mobile = toRequiredText(body?.mobile);
  const address = toRequiredText(body?.address);

  if (!isValidBonusLinkKey(key)) {
    return NextResponse.json(
      { status: "invalid" },
      { status: 404, headers: noStoreHeaders },
    );
  }

  try {
    const fieldErrors = await getBonusClaimFieldErrors({
      name,
      mobile,
      address,
      location: body?.location,
      validateBonusDeliveryLocation: dependencies.validateBonusDeliveryLocation,
    });

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        {
          error: "Invalid claim payload",
          fieldErrors,
        },
        { status: 400, headers: noStoreHeaders },
      );
    }

    const status = await dependencies.claimBonusLink({
      key,
      shippingName: name,
      shippingMobile: mobile,
      shippingAddress: address,
    });

    if (status.status === "claimed") {
      return NextResponse.json(status, { headers: noStoreHeaders });
    }

    const responseStatus =
      status.status === "expired"
        ? 410
        : status.status === "invalid"
          ? 404
          : 409;

    return NextResponse.json(status, {
      status: responseStatus,
      headers: noStoreHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to claim bonus link.",
      },
      { status: 500, headers: noStoreHeaders },
    );
  }
}

export async function POST(req: Request) {
  return handleBonusClaimRequest(req);
}
