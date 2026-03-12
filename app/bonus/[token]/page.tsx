import type { Metadata } from "next";
import { buildPageMetadata } from "../../lib/seo";
import { normalizeBonusLinkKey } from "../../lib/bonusClaimLinks";
import BonusClaimPageClient from "./BonusClaimPageClient";

type BonusClaimPageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({
  params,
}: BonusClaimPageProps): Promise<Metadata> {
  const { token } = await params;
  const normalizedToken = encodeURIComponent(normalizeBonusLinkKey(token));

  return buildPageMetadata({
    title: "Claim Your Free Bonus",
    description:
      "Claim your free Safely Secured Homes bonus shipment before the one-time link expires.",
    path: `/bonus/${normalizedToken}`,
    indexable: false,
    ogType: "website",
  });
}

export default async function BonusClaimPage({ params }: BonusClaimPageProps) {
  const { token } = await params;
  return <BonusClaimPageClient token={normalizeBonusLinkKey(token)} />;
}

