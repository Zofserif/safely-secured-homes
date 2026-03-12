import { NextResponse } from "next/server";
import {
  BONUS_LINK_MOBILE_REGEX,
  isValidBonusLinkKey,
  normalizeBonusLinkKey,
} from "../../../lib/bonusClaimLinks";
import { claimBonusLink } from "../../../lib/bonusClaimLinksServer";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

export const dynamic = "force-dynamic";

const toRequiredText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const key = normalizeBonusLinkKey(body?.key);
  const name = toRequiredText(body?.name);
  const mobile = toRequiredText(body?.mobile);
  const address = toRequiredText(body?.address);
  const fieldErrors: Record<string, string> = {};

  if (!isValidBonusLinkKey(key)) {
    return NextResponse.json(
      { status: "invalid" },
      { status: 404, headers: noStoreHeaders },
    );
  }

  if (!name) {
    fieldErrors.name = "Please enter the recipient name.";
  }

  if (!BONUS_LINK_MOBILE_REGEX.test(mobile)) {
    fieldErrors.mobile = "Please enter a valid PH mobile number (09xxxxxxxxx).";
  }

  if (!address) {
    fieldErrors.address = "Please enter the full shipping address.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json(
      {
        error: "Invalid claim payload",
        fieldErrors,
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  try {
    const status = await claimBonusLink({
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

