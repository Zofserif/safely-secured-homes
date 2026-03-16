import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Clock3, Mail, ShieldCheck } from "lucide-react";
import type { FunnelContext } from "../lib/analytics";
import { FunnelPageMountTracker } from "../components/analytics/FunnelTrackingClient";
import NewsletterForm from "../components/newsletter/NewsletterForm";
import Footer from "../components/layout/Footer";
import { ogImageUrl, siteName, siteUrl } from "../lib/site";

export const metadata: Metadata = {
  title: "Waitlist",
  description:
    "Join the Safely Secured Homes waitlist and get notified when the next limited-time offer opens.",
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
      "Join the Safely Secured Homes waitlist and get notified when the next limited-time offer opens.",
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
      "Join the Safely Secured Homes waitlist and get notified when the next limited-time offer opens.",
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
    source_raw: source || "limited_time_offer_expired",
  };
};

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const rawSource =
    readSearchParam(resolvedSearchParams.source) || "limited_time_offer_expired";
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
                Limited-Time Offer Expired
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-tight text-[#1F2937] sm:text-5xl lg:text-6xl">
                Join the waitlist for the next opening.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                That special link is no longer active, but you can still join
                the list for the next offer window and get practical home
                security updates in the meantime.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-[#0E79B2]/10">
                  <Clock3 className="h-5 w-5 text-[#0E79B2]" />
                  <p className="mt-3 text-sm font-semibold text-[#1F2937]">
                    Next offer alert
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Be first to hear when a new limited-time slot opens.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-[#0E79B2]/10">
                  <Mail className="h-5 w-5 text-[#0E79B2]" />
                  <p className="mt-3 text-sm font-semibold text-[#1F2937]">
                    Short weekly emails
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Get practical security tips without a heavy inbox.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-[#0E79B2]/10">
                  <ShieldCheck className="h-5 w-5 text-[#0E79B2]" />
                  <p className="mt-3 text-sm font-semibold text-[#1F2937]">
                    Calm next steps
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Stay ready for the next offer without starting over.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:justify-self-end">
              <NewsletterForm
                title="Join the Waitlist"
                description="Enter your email to get notified when the next limited-time offer opens."
                submitLabel="JOIN THE WAITLIST"
                defaultSource={rawSource}
                trackingPage="waitlist"
                trackingContext={trackingContext}
                trackingDestination="waitlist"
                successTitle="Thanks! You are on the waitlist."
                successEmailSentCopy="You are queued for the next offer window, and your checklist is on its way."
                successFallbackCopy="You are queued for the next offer window. If the checklist email is delayed, we will still keep you posted."
                successEmailDisabledCopy="You are queued for the next offer window. Email delivery is currently turned off, so the checklist will not be emailed right now."
              />
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
}
