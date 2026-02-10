import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ogImageUrl, siteName, siteUrl } from "../lib/site";

const calendlyUrl = "https://calendly.com/vallarta-troy/30min";

export const metadata: Metadata = {
  title: `Schedule Your Call | ${siteName}`,
  description:
    "Thanks for sharing your answers. Schedule a quick call with the Safely Secured Homes team.",
  openGraph: {
    title: `Schedule Your Call | ${siteName}`,
    description:
      "Thanks for sharing your answers. Schedule a quick call with the Safely Secured Homes team.",
    url: new URL("/schedule-call", siteUrl),
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
    title: `Schedule Your Call | ${siteName}`,
    description:
      "Thanks for sharing your answers. Schedule a quick call with the Safely Secured Homes team.",
    images: [ogImageUrl],
  },
};

export default function ScheduleCallPage() {
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
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-6 text-[#2D3748]">
            Thanks for your answers! Let's schedule your call.
          </h1>
          <p className="text-slate-600 mt-4 text-base sm:text-lg">
            We'll review your responses and walk you through the best security
            plan for your home.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 bg-[#BEE9E8]/70 text-[#0E79B2] px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide">
            15-30 minutes, personalized and practical
          </div>
        </div>

        <div className="mt-10 lg:mt-12 max-w-5xl mx-auto">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] items-center">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-white/60">
              <h2 className="text-2xl font-bold text-[#2D3748]">
                What we'll cover
              </h2>
              <ul className="mt-4 space-y-3 text-slate-600 text-sm sm:text-base">
                <li>Quick review of your home and current setup</li>
                <li>Priority areas that need coverage first</li>
                <li>Recommended camera plan and budget-fit options</li>
                <li>Next steps and timeline for installation</li>
              </ul>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <a
                  href={calendlyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-[#0E79B2] hover:bg-[#0b5e8b] text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-[#0E79B2]/20 transition-all hover:-translate-y-0.5"
                >
                  SCHEDULE MY CALL
                </a>
                <a
                  href="tel:09959959229"
                  className="inline-flex items-center justify-center border border-[#0E79B2]/30 text-[#0E79B2] px-6 py-3 rounded-full font-bold hover:bg-[#F7FAFC] transition-colors"
                >
                  Call Us Now
                </a>
              </div>
            </div>

            <div className="relative rounded-3xl overflow-hidden bg-white/70 border border-white shadow-2xl shadow-[#0E79B2]/10">
              <Image
                src="/assets/img/Hero/pexels-vlada-karpovich-4609033.jpg"
                alt="Safely Secured Homes consultation"
                width={900}
                height={700}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/35 via-black/10 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-white text-lg font-semibold">
                  Calm, clear guidance - tailored to your home.
                </p>
                <p className="text-white/80 text-sm mt-1">
                  No pressure. Just practical recommendations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
