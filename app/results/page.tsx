import type { Metadata } from "next";
import AppShell from "../components/AppShell";
import { getPublicSiteSettings } from "../lib/siteAdminSettingsServer";
import { ogImageUrl, siteName, siteUrl } from "../lib/site";

export const metadata: Metadata = {
  title: "Your Security Plan Results",
  description:
    "Review your personalized home security plan, recommended setup, and next steps.",
  alternates: {
    canonical: "/results",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: `Your Security Plan Results | ${siteName}`,
    description:
      "Review your personalized home security plan, recommended setup, and next steps.",
    url: new URL("/results", siteUrl),
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
    title: `Your Security Plan Results | ${siteName}`,
    description:
      "Review your personalized home security plan, recommended setup, and next steps.",
    images: [ogImageUrl],
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Results({
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
  const resultsKey =
    typeof resolvedSearchParams.r === "string"
      ? resolvedSearchParams.r
      : undefined;
  const formMode = source?.toLowerCase() === "newsletter" ? "newsletter" : "default";

  return (
    <AppShell
      initialView="results"
      formMode={formMode}
      source={source}
      resultsKey={resultsKey}
      publicSiteSettings={publicSiteSettings}
    />
  );
}
