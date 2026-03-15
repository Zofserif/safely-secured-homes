import { NextResponse } from "next/server";
import {
  normalizeLimitedOfferLinkKey,
  type LimitedOfferLinkStatus,
} from "../../lib/limitedOfferLinks";
import { openLimitedOfferLink } from "../../lib/limitedOfferLinksServer";
import { siteUrl } from "../../lib/site";

export const dynamic = "force-dynamic";

const buildRedirectUrl = (
  pathname: "/schedule-call" | "/waitlist",
  source: string,
  token: string,
) => {
  const url = new URL(pathname, `${siteUrl}/`);
  url.searchParams.set("source", source);
  if (token) {
    url.searchParams.set("offer", token);
  }
  return url;
};

const toRedirectResponse = (
  status: LimitedOfferLinkStatus,
  token: string,
) => {
  const redirectUrl =
    status.status === "active"
      ? buildRedirectUrl("/schedule-call", "limited_time_offer", token)
      : buildRedirectUrl("/waitlist", "limited_time_offer_expired", token);

  return NextResponse.redirect(redirectUrl, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
};

export async function GET(
  _req: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const normalizedToken = normalizeLimitedOfferLinkKey(token);

  try {
    const status = await openLimitedOfferLink(normalizedToken);
    return toRedirectResponse(status, normalizedToken);
  } catch (error) {
    console.error("Limited-offer redirect failed:", error);
    return toRedirectResponse({ status: "invalid" }, normalizedToken);
  }
}
