import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Footer from "../components/layout/Footer";
import RateForm from "../components/testimonials/RateForm";
import { ogImageUrl, siteName, siteUrl } from "../lib/site";

export const metadata: Metadata = {
  title: "Rate Us",
  description:
    "Share your feedback and tell Safely Secured Homes about your experience.",
  alternates: {
    canonical: "/rate",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: `Rate Us | ${siteName}`,
    description:
      "Share your feedback and tell Safely Secured Homes about your experience.",
    url: new URL("/rate", siteUrl),
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
    title: `Rate Us | ${siteName}`,
    description:
      "Share your feedback and tell Safely Secured Homes about your experience.",
    images: [ogImageUrl],
  },
};

export default function RatePage() {
  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#1F2937]">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-[340px] w-[340px] rounded-full bg-[#BEE9E8]/45 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-[340px] w-[340px] rounded-full bg-[#63B3ED]/20 blur-3xl" />

        <header className="container mx-auto flex items-center justify-between px-6 pb-6 pt-8">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/assets/img/Logo/navbar banner.png"
              alt="Safely Secured Homes"
              width={210}
              height={48}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-widest text-slate-500 transition-colors hover:text-[#0E79B2]"
          >
            Back to Home
          </Link>
        </header>

        <main className="container mx-auto px-6 pb-16 pt-4 lg:pb-24">
          <section className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
            <div className="self-center">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Share Feedback
              </p>
              <h1 className="mt-4 text-3xl font-bold leading-tight text-[#1F2937] sm:text-4xl lg:text-5xl">
                Help us improve by rating your experience.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Your feedback helps us improve every installation journey. Reviews are
                checked before publishing so public testimonials stay accurate and
                high-quality.
              </p>
              <div className="mt-8 rounded-3xl border border-[#DCE6F1] bg-white/80 p-5 shadow-sm">
                <p className="text-sm font-semibold text-[#2D3748]">What happens next</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li>1. Submit your review and rating.</li>
                  <li>2. We quickly verify and approve it.</li>
                  <li>3. Approved feedback may appear on our website.</li>
                </ul>
              </div>
            </div>

            <RateForm />
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
}
