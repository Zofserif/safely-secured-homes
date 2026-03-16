import type { Metadata } from "next";
import AppShell from "./components/AppShell";
import LocalBusinessJsonLd from "./components/seo/LocalBusinessJsonLd";
import { getPublicSiteSettings } from "./lib/siteAdminSettingsServer";
import {
  homeLandingOgImageUrl,
  siteName,
  siteUrl,
} from "./lib/site";

const landingPageTitle = "How Panatag Is Your Home?";
const landingPageDescription =
  "Get your free personalized Home Panatag Rating in 60 seconds and discover practical safety steps for your home.";

export const metadata: Metadata = {
  title: landingPageTitle,
  description: landingPageDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: landingPageTitle,
    description: landingPageDescription,
    url: new URL("/", siteUrl),
    siteName,
    type: "website",
    images: [
      {
        url: homeLandingOgImageUrl,
        width: 1200,
        height: 630,
        alt: "How Panatag Is Your Home? Safely Secured Homes landing page preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: landingPageTitle,
    description: landingPageDescription,
    images: [homeLandingOgImageUrl],
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const publicSiteSettings = await getPublicSiteSettings();

  return (
    <>
      <LocalBusinessJsonLd />
      <AppShell initialView="home" publicSiteSettings={publicSiteSettings} />
    </>
  );
}
