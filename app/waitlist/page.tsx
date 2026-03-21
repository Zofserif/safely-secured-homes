import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Clock3, Mail, ShieldCheck } from "lucide-react";
import type { FunnelContext } from "../lib/analytics";
import { FunnelPageMountTracker } from "../components/analytics/FunnelTrackingClient";
import Footer from "../components/layout/Footer";
import WaitlistForm from "../components/waitlist/WaitlistForm";
import { ogImageUrl, siteName, siteUrl } from "../lib/site";

export const metadata: Metadata = {
  title: "Waitlist",
  description:
    "Join the Safely Secured Homes waitlist and get notified when the next Panatag Rating opening becomes available.",
  alternates: {
    canonical: "/waitlist",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: `Waitlist | ${siteName}`,
    description:
      "Join the Safely Secured Homes waitlist and get notified when the next Panatag Rating opening becomes available.",
    url: new URL("/waitlist", siteUrl),
    siteName,
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1260,
        height: 750,
        alt: "Safely Secured Homes waitlist",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Waitlist | ${siteName}`,
    description:
      "Join the Safely Secured Homes waitlist and get notified when the next Panatag Rating opening becomes available.",
    images: [ogImageUrl],
  },
};

const readSearchParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0]?.trim() || "";
  }

  return typeof value === "string" ? value.trim() : "";
};

const buildWaitlistContext = (rawSource: string): FunnelContext => {
  const source = rawSource.trim();
  const lowered = source.toLowerCase();

  if (lowered === "reports_sold_out") {
    return {
      flow_source: "direct",
      flow_mode: "default",
    };
  }

  return {
    flow_source: "unknown",
    flow_mode: "default",
    source_raw: source || "waitlist",
  };
};

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const rawSource = readSearchParam(resolvedSearchParams.source) || "reports_sold_out";
  const isLimitedOfferExpired = rawSource.toLowerCase() === "limited_time_offer_expired";
  const trackingContext = buildWaitlistContext(rawSource);

  return (
    <div className="min-h-screen bg-[#F6F1EA] text-[#1F2937]">
      <FunnelPageMountTracker page="waitlist" context={trackingContext} />
      <div className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-linear-to-br from-[#0E79B2]/10 via-[#BEE9E8]/30 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 right-0 h-[320px] w-[320px] rounded-full bg-[#0E79B2]/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-32 h-[260px] w-[260px] rounded-full bg-[#D9C7A2]/20 blur-3xl"
        />

        <header className="relative z-10 container mx-auto flex items-center justify-between px-6 pt-8 pb-6">
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

        <main className="relative z-10 container mx-auto px-6 pb-16 lg:pb-24">
          <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0E79B2]">
                {isLimitedOfferExpired
                  ? "Offer Expired, Waitlist Open"
                  : "Reports Are Currently Sold Out"}
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-tight text-[#1F2937] sm:text-5xl lg:text-6xl">
                Join the waitlist for the next Panatag Rating opening.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                The current Panatag Rating cycle is full, but you can still
                join the waitlist now and get notified as soon as the next
                opening becomes available.
              </p>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
                {isLimitedOfferExpired
                  ? "Your earlier limited-time link already expired, but this waitlist keeps you in line for the next opening."
                  : "You do not need to keep checking the site manually. We will email you when the next opening is ready."}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-[#0E79B2]/10">
                  <Clock3 className="h-5 w-5 text-[#0E79B2]" />
                  <p className="mt-3 text-sm font-semibold text-[#1F2937]">
                    Next cycle alert
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Be first to hear when the next Panatag Rating opening starts.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-[#0E79B2]/10">
                  <Mail className="h-5 w-5 text-[#0E79B2]" />
                  <p className="mt-3 text-sm font-semibold text-[#1F2937]">
                    Priority notification
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Get the first email when new report capacity becomes available.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-[#0E79B2]/10">
                  <ShieldCheck className="h-5 w-5 text-[#0E79B2]" />
                  <p className="mt-3 text-sm font-semibold text-[#1F2937]">
                    Privacy-first follow-up
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Share your details once so you do not need to restart later.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:justify-self-end">
              <WaitlistForm
                title="Join the Waitlist"
                description="Enter your name and email to get notified when the next Panatag Rating opening becomes available."
                submitLabel="JOIN THE WAITLIST"
                defaultSource={rawSource}
                trackingContext={trackingContext}
                successTitle="Thanks. You’re on the waitlist."
                successCopy="We’ll email you when the next Panatag Rating opening becomes available."
              />
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
}
