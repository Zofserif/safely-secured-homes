import type { Metadata } from "next";
import AppShell from "../components/AppShell";
import { ogImageUrl, siteName, siteUrl } from "../lib/site";

export const metadata: Metadata = {
  title: `Your Security Plan Results | ${siteName}`,
  description:
    "Review your personalized home security plan, recommended setup, and next steps.",
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

export default function Results() {
  return <AppShell initialView="results" />;
}
