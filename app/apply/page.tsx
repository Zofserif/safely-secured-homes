import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ogImageUrl, siteName, siteUrl } from "../lib/site";

export const metadata: Metadata = {
  title: `Apply Now | ${siteName}`,
  description:
    "Start your Safely Secured Homes application and get a personalized security plan.",
  openGraph: {
    title: `Apply Now | ${siteName}`,
    description:
      "Start your Safely Secured Homes application and get a personalized security plan.",
    url: new URL("/apply", siteUrl),
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
    title: `Apply Now | ${siteName}`,
    description:
      "Start your Safely Secured Homes application and get a personalized security plan.",
    images: [ogImageUrl],
  },
};

export default function ApplyPage() {
  return (
    <div className="min-h-screen bg-[#F7FAFC] text-[#2D3748]">
      <header className="container mx-auto px-6 pt-8 pb-6 flex items-center justify-between">
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
          className="text-xs font-semibold uppercase tracking-widest text-slate-500 hover:text-[#0E79B2] transition-colors"
        >
          Back to Home
        </Link>
      </header>

      <main className="container mx-auto px-6 pb-16 lg:pb-24 pt-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Apply for your plan
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 text-[#2D3748] leading-tight">
            Get a personalized security plan for your home.
          </h1>
          <p className="text-slate-600 mt-4 text-base sm:text-lg">
            Answer a few quick questions and we&apos;ll craft the safest,
            most practical setup for your family.
          </p>
        </div>

        <div className="mt-10 lg:mt-12 max-w-5xl mx-auto">
          <div className="relative rounded-4xl overflow-hidden shadow-2xl shadow-[#0E79B2]/15 border border-white">
            <Image
              src="/assets/img/Hero/pexels-vlada-karpovich-4609033.jpg"
              alt="Safely Secured Homes quick intro"
              width={1400}
              height={800}
              className="w-full h-auto object-cover"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/40 via-black/10 to-transparent"></div>
            <div className="absolute top-4 left-4 bg-white/90 px-3 py-1.5 rounded-full text-xs font-semibold text-[#0E79B2] shadow-sm">
              Safely Secured Homes
            </div>
            <div className="absolute bottom-6 left-6 right-6 text-left">
              <p className="text-white text-lg sm:text-xl font-semibold">
                60-second tour: what you&apos;ll get after you apply
              </p>
              <p className="text-white/80 text-sm mt-1">
                Practical, calm, and actionable security tips for Filipino
                homes.
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/form?source=apply"
              className="inline-flex items-center justify-center bg-[#0E79B2] hover:bg-[#0b5e8b] text-white px-10 py-3 rounded-full font-bold shadow-lg shadow-[#0E79B2]/25 transition-all hover:-translate-y-0.5"
            >
              START MY JOURNEY
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
