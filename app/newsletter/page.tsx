import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Sparkles, Mail } from "lucide-react";
import NewsletterForm from "../components/newsletter/NewsletterForm";
import Footer from "../components/layout/Footer";
import { ogImageUrl, siteName, siteUrl } from "../lib/site";

export const metadata: Metadata = {
  title: `Newsletter | ${siteName}`,
  description:
    "Sign up for smart home security tips, product updates, and practical guides from Safely Secured Homes.",
  openGraph: {
    title: `Newsletter | ${siteName}`,
    description:
      "Sign up for smart home security tips, product updates, and practical guides from Safely Secured Homes.",
    url: new URL("/newsletter", siteUrl),
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
    title: `Newsletter | ${siteName}`,
    description:
      "Sign up for smart home security tips, product updates, and practical guides from Safely Secured Homes.",
    images: [ogImageUrl],
  },
};

export default function NewsletterPage() {
  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      <div className="relative overflow-hidden">
        <div className="absolute -top-32 -right-24 w-[420px] h-[420px] bg-[#BEE9E8]/50 rounded-full blur-3xl opacity-80 pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-24 w-[420px] h-[420px] bg-[#63B3ED]/20 rounded-full blur-3xl opacity-80 pointer-events-none"></div>

        <header className="container mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/assets/img/Logo/navbar banner.png"
              alt="Safely Secured Homes"
              width={180}
              height={40}
              className="h-9 w-auto"
              priority
            />
          </Link>
          <Link
            href="/"
            className="text-sm font-semibold text-[#0E79B2] hover:text-[#0b5e8b] transition-colors"
          >
            Back to Home
          </Link>
        </header>

        <main className="container mx-auto px-6 pb-16 lg:pb-24 pt-4 lg:pt-10">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-start">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white border border-[#BEE9E8] rounded-full px-4 py-1.5 mb-6 shadow-sm">
                <Sparkles className="w-4 h-4 text-[#0E79B2]" />
                <span className="text-[#2D3748] font-semibold text-xs uppercase tracking-wide">
                  Safety Updates
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2D3748] leading-tight">
                Practical tips to keep your home calm, smart, and protected.
              </h1>
              <p className="text-slate-600 mt-4 text-base sm:text-lg leading-relaxed">
                Get curated insights from our security specialists, plus checklists
                for maintenance and upgrades you can do without stress.
              </p>
              <div className="mt-6 space-y-3 text-sm sm:text-base text-slate-600">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#2E8B57] mt-0.5" />
                  <span>Weekly guidance on CCTV placement and smart home setup.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#0E79B2] mt-0.5" />
                  <span>Product updates, promos, and emergency readiness tips.</span>
                </div>
              </div>
            </div>

            <NewsletterForm />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
