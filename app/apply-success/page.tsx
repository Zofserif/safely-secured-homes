import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SuccessStoriesSection from "../components/success-stories/SuccessStoriesSection";
import { FunnelPageMountTracker } from "../components/analytics/FunnelTrackingClient";
import { ogImageUrl, siteName, siteUrl } from "../lib/site";

export const metadata: Metadata = {
  title: "Application Submitted",
  description:
    "Your application is in. A home security consultant will contact you soon. Please check your email for next steps.",
  alternates: {
    canonical: "/apply-success",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: `Application Submitted | ${siteName}`,
    description:
      "Your application is in. A home security consultant will contact you soon. Please check your email for next steps.",
    url: new URL("/apply-success", siteUrl),
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
    title: `Application Submitted | ${siteName}`,
    description:
      "Your application is in. A home security consultant will contact you soon. Please check your email for next steps.",
    images: [ogImageUrl],
  },
};

export default function ApplySuccessPage() {
  return (
    <div className="min-h-screen bg-[#F7FAFC] text-[#2D3748]">
      <FunnelPageMountTracker
        page="apply_success"
        outcome="apply_success"
        context={{ flow_source: "apply", flow_mode: "default" }}
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
            Application submitted
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 text-[#2D3748] leading-tight">
            <span className="block">Thank you for your application.</span>
            <span className="block mt-2 text-[#0E79B2]">
              A Home Security Consultant will call you soon.
            </span>
          </h1>
          <p className="text-slate-600 mt-4 text-base sm:text-lg">
            Please check your email inbox for the confirmation and next steps.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 bg-[#BEE9E8]/70 text-[#0E79B2] px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide">
            We usually reply within 24 hours
          </div>
        </div>
        <div className="mt-10 lg:mt-12 max-w-6xl mx-auto">
          <section className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl border border-white/60">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#2D3748]">
                  What happens next
                </h2>
                <p className="text-slate-500 text-sm sm:text-base mt-2">
                  We&apos;ll review your responses and contact you with practical
                  recommendations for your home.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="group rounded-3xl border border-[#DCE6F1] bg-white/95 p-5 sm:p-6 text-slate-700 text-sm sm:text-base flex flex-col items-center text-center justify-center shadow-[0_20px_45px_rgba(14,121,178,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_28px_55px_rgba(14,121,178,0.12)]">
                <h3 className="text-base sm:text-lg font-semibold text-[#1F2937]">
                  Review in progress
                </h3>
                <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-[16rem]">
                  Our team reviews your submitted application details.
                </p>
              </div>
              <div className="group rounded-3xl border border-[#DCE6F1] bg-white/95 p-5 sm:p-6 text-slate-700 text-sm sm:text-base flex flex-col items-center text-center justify-center shadow-[0_20px_45px_rgba(14,121,178,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_28px_55px_rgba(14,121,178,0.12)]">
                <h3 className="text-base sm:text-lg font-semibold text-[#1F2937]">
                  Consultant follow-up
                </h3>
                <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-[16rem]">
                  A Home Security Consultant will notify you directly.
                </p>
              </div>
              <div className="group rounded-3xl border border-[#DCE6F1] bg-white/95 p-5 sm:p-6 text-slate-700 text-sm sm:text-base flex flex-col items-center text-center justify-center shadow-[0_20px_45px_rgba(14,121,178,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_28px_55px_rgba(14,121,178,0.12)]">
                <h3 className="text-base sm:text-lg font-semibold text-[#1F2937]">
                  Check your inbox
                </h3>
                <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-[16rem]">
                  Watch for our email confirmation and next-step instructions.
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
