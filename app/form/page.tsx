import type { Metadata } from "next";
import AppShell from "../components/AppShell";
import { ogImageUrl, siteName, siteUrl } from "../lib/site";

export const metadata: Metadata = {
  title: `Get Your Free Plan | ${siteName}`,
  description:
    "Answer a few quick questions to receive a personalized home security plan tailored to your home.",
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

export default function FormPage() {
  return <AppShell initialView="form" />;
}
