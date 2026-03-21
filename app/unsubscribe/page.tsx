import type { Metadata } from "next";
import Link from "next/link";
import { ogImageUrl, siteName, siteUrl } from "../lib/site";
import UnsubscribeShell from "./UnsubscribeShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Manage your Safely Secured Homes email subscription.",
  alternates: {
    canonical: "/unsubscribe",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: `Unsubscribe | ${siteName}`,
    description: "Manage your Safely Secured Homes email subscription.",
    url: new URL("/unsubscribe", siteUrl),
    siteName,
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1260,
        height: 750,
        alt: "Safely Secured Homes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Unsubscribe | ${siteName}`,
    description: "Manage your Safely Secured Homes email subscription.",
    images: [ogImageUrl],
  },
};

export default function UnsubscribePage() {
  return (
    <UnsubscribeShell title="Unsubscribe">
      <p className="text-base leading-relaxed text-slate-700">
        This unsubscribe link is invalid or no longer supported.
      </p>
      <p className="text-sm leading-relaxed text-slate-600">
        Use the unsubscribe link from one of our emails to manage your
        subscription preferences.
      </p>
      <div>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-[#0E79B2] px-6 py-2 font-semibold text-white shadow-md shadow-[#0E79B2]/20 transition-colors hover:bg-[#0b5e8b]"
        >
          Go to Home
        </Link>
      </div>
    </UnsubscribeShell>
  );
}
