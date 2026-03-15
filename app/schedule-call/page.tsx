import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ogImageUrl, siteName, siteUrl } from "../lib/site";
import SuccessStoriesSection from "../components/success-stories/SuccessStoriesSection";
import {
  FunnelPageMountTracker,
  FunnelTrackedAnchor,
} from "../components/analytics/FunnelTrackingClient";
import type { FunnelContext } from "../lib/analytics";

const calendlyUrl = "https://calendly.com/vallarta-troy/30min";

const readSearchParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0]?.trim() || "";
  }

  return typeof value === "string" ? value.trim() : "";
};

const buildScheduleCallContext = (rawSource: string): FunnelContext => {
  const source = rawSource.trim();
  const lowered = source.toLowerCase();

  if (lowered === "apply") {
    return {
      flow_source: "apply",
      flow_mode: "newsletter",
    };
  }

  if (lowered === "newsletter") {
    return {
      flow_source: "newsletter",
      flow_mode: "newsletter",
    };
  }

  return {
    flow_source: "unknown",
    flow_mode: "newsletter",
    source_raw: source,
  };
};

export const metadata: Metadata = {
  title: "Schedule Your Call",
  description:
    "Thanks for sharing your answers. Schedule a quick call with the Safely Secured Homes team.",
  alternates: {
    canonical: "/schedule-call",
  },
  robots: {
    index: false,
    follow: false,
  },
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

export default async function ScheduleCallPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const rawSource = readSearchParam(resolvedSearchParams.source) || "newsletter";
  const trackingContext = buildScheduleCallContext(rawSource);

  return (
    <div className="min-h-screen bg-[#F7FAFC] text-[#2D3748]">
      <FunnelPageMountTracker
        page="schedule_call"
        outcome="schedule_call"
        context={trackingContext}
      />
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
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Thanks for your answers
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 text-[#2D3748] leading-tight">
            <span className="block">You&apos;re pre-approved.</span>
            <span className="block mt-2 text-[#0E79B2]">
              Book a quick call with a Home Security Consultant.
            </span>
          </h1>
          <p className="text-slate-600 mt-4 text-base sm:text-lg">
            We&apos;ll review your responses and walk you through the best security
            plan for your home.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 bg-[#BEE9E8]/70 text-[#0E79B2] px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide">
            15-30 minutes, personalized and practical
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <FunnelTrackedAnchor
            href={calendlyUrl}
            page="schedule_call"
            context={trackingContext}
            ctaId="schedule_my_call"
            ctaLocation="hero_primary"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-[#0E79B2] hover:bg-[#0b5e8b] text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-[#0E79B2]/25 transition-all hover:-translate-y-0.5"
          >
            SCHEDULE MY CALL
          </FunnelTrackedAnchor>
        </div>

        <div className="mt-10 lg:mt-12 max-w-6xl mx-auto">
          <section className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl border border-white/60">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#2D3748]">
                  What we&apos;ll cover
                </h2>
                <p className="text-slate-500 text-sm sm:text-base mt-2">
                  A short, practical walkthrough so you know the best next step.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="group rounded-3xl border border-[#DCE6F1] bg-white/95 p-5 sm:p-6 text-slate-700 text-sm sm:text-base flex flex-col items-center text-center justify-center shadow-[0_20px_45px_rgba(14,121,178,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_28px_55px_rgba(14,121,178,0.12)]">
                <h3 className="text-base sm:text-lg font-semibold text-[#1F2937]">
                  Quick home review
                </h3>
                <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-[16rem]">
                  Walk through your current setup and coverage gaps.
                </p>
              </div>
              <div className="group rounded-3xl border border-[#DCE6F1] bg-white/95 p-5 sm:p-6 text-slate-700 text-sm sm:text-base flex flex-col items-center text-center justify-center shadow-[0_20px_45px_rgba(14,121,178,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_28px_55px_rgba(14,121,178,0.12)]">
                <h3 className="text-base sm:text-lg font-semibold text-[#1F2937]">
                  Your camera plan
                </h3>
                <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-[16rem]">
                  Get a recommended setup tailored to your budget.
                </p>
              </div>
              <div className="group rounded-3xl border border-[#DCE6F1] bg-white/95 p-5 sm:p-6 text-slate-700 text-sm sm:text-base flex flex-col items-center text-center justify-center shadow-[0_20px_45px_rgba(14,121,178,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_28px_55px_rgba(14,121,178,0.12)]">
                <h3 className="text-base sm:text-lg font-semibold text-[#1F2937]">
                  Clear next steps
                </h3>
                <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-[16rem]">
                  Timeline and installation plan you can act on.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-12">
          <SuccessStoriesSection />
        </div>
      </main>
    </div>
  );
}
