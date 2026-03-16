import type { Metadata } from "next";
import AppShell from "../components/AppShell";
import { parseHasBonusQueryValue } from "../lib/bonusFlag";
import { getPublicSiteSettings } from "../lib/siteAdminSettingsServer";
import { ogImageUrl, siteName, siteUrl } from "../lib/site";

export const metadata: Metadata = {
  title: "Get Your Free Plan",
  description:
    "Answer a few quick questions to receive a personalized home security plan tailored to your home.",
  alternates: {
    canonical: "/form",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: `Get Your Free Plan | ${siteName}`,
    description:
      "Answer a few quick questions to receive a personalized home security plan tailored to your home.",
    url: new URL("/form", siteUrl),
    siteName,
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1260,
        height: 750,
        alt: "Safely Secured Homes - Happy family in a secure home",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Get Your Free Plan | ${siteName}`,
    description:
      "Answer a few quick questions to receive a personalized home security plan tailored to your home.",
    images: [ogImageUrl],
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Record<string, string | string[] | undefined>;

export default async function FormPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const publicSiteSettings = await getPublicSiteSettings();
  const resolvedSearchParams = (await searchParams) ?? {};
  const source =
    typeof resolvedSearchParams.source === "string"
      ? resolvedSearchParams.source
      : undefined;
  const hasBonus =
    publicSiteSettings.bonusEnabled &&
    typeof resolvedSearchParams.has_bonus === "string"
      ? parseHasBonusQueryValue(resolvedSearchParams.has_bonus)
      : false;
  const formMode = source === "newsletter" ? "newsletter" : "default";
  return (
    <AppShell
      initialView="form"
      formMode={formMode}
      source={source}
      hasBonus={hasBonus}
      publicSiteSettings={publicSiteSettings}
    />
  );
}
