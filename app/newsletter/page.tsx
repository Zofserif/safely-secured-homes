import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Mail, Quote, ShieldCheck, Sparkles } from "lucide-react";
import NewsletterChecklistModal from "../components/newsletter/NewsletterChecklistModal";
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
    <div className="min-h-screen bg-[#F8F6F2] text-[#1F2937]">
      <div className="relative overflow-hidden">
        <div className="absolute -top-32 -right-24 w-[420px] h-[420px] bg-[#BEE9E8]/45 rounded-full blur-3xl opacity-80 pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-24 w-[420px] h-[420px] bg-[#63B3ED]/15 rounded-full blur-3xl opacity-80 pointer-events-none"></div>
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[720px] h-[720px] bg-[#0E79B2]/10 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

        <header className="container mx-auto px-6 pt-8 pb-6">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center">
            <div className="hidden sm:block"></div>
            <Link href="/" className="flex justify-center">
              <Image
                src="/assets/img/Logo/navbar banner.png"
                alt="Safely Secured Homes"
                width={210}
                height={48}
                className="h-9 w-auto object-contain"
                priority
              />
            </Link>
            <div className="flex justify-end">
              <Link
                href="/"
                className="text-xs font-semibold uppercase tracking-widest text-slate-500 hover:text-[#0E79B2] transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 pb-16 lg:pb-24">
          <section className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/80 border border-[#BEE9E8] rounded-full px-4 py-1.5 mb-6 shadow-sm">
                <Sparkles className="w-4 h-4 text-[#0E79B2]" />
                <span className="text-[#2D3748] font-semibold text-xs uppercase tracking-wide">
                  Safely Secured Homes
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1F2937] leading-tight">
                Build trust. Share your expertise. Stay protected.
              </h1>
              <p className="text-slate-600 mt-4 text-base sm:text-lg leading-relaxed max-w-xl">
                A newsletter for families who want real, practical home security
                guidance without the noise.
              </p>
              <p className="mt-4 text-slate-700 text-base font-semibold">
                More than 1,200 homeowners already rely on these weekly tips.
              </p>
              <p className="mt-3 text-slate-600 text-base leading-relaxed max-w-xl">
                Get the short email series that breaks down safer placement,
                smarter routines, and simple upgrades you can do yourself.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#2E8B57]" />
                  Built for Filipino households
                </span>
                <span className="inline-flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#0E79B2]" />
                  3-minute Friday reads
                </span>
              </div>
              <NewsletterChecklistModal />
            </div>

            <div className="space-y-6">
              <a
                href="#newsletter-form"
                className="group relative mx-auto w-full max-w-[360px] sm:max-w-[400px] lg:max-w-[440px] block"

              >
                <div className="relative rounded-[2.2rem] overflow-hidden shadow-md shadow-[#0E79B2]/10 rotate-2 bg-transparent aspect-4/5">
                  <Image
                    src="/assets/img/book/panatag-home-guide-book.png"
                    alt="Panatag Home Guide Book"
                    fill
                    sizes="(min-width: 1024px) 40vw, 80vw"
                    className="object-cover transition-all duration-300 blur-[2px] group-hover:blur-0"
                  />
                  <div className="absolute inset-0 bg-linear-to-br from-black/5 via-transparent to-transparent"></div>
                </div>
              </a>
            </div>
          </section>

          <section className="mt-12 lg:mt-16">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  quote:
                    "Short, clear, and actually useful. The checklist helped us fix blind spots in one afternoon.",
                  name: "Regina D.",
                  location: "Quezon Province",
                },
                {
                  quote:
                    "I like that it’s not salesy. Just practical advice and reminders that keep our home safer.",
                  name: "Paolo M.",
                  location: "Laguna",
                },
                {
                  quote:
                    "The Friday emails are quick to read and easy to act on. We finally set up our alerts right.",
                  name: "Celine A.",
                  location: "Makati",
                },
              ].map((item) => (
                <div
                  key={item.name}
                  className="bg-white/95 border border-[#E2E0D8] rounded-3xl p-6 shadow-lg shadow-[#0E79B2]/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-[#E8E4DC] flex items-center justify-center text-sm font-bold text-[#1F2937]">
                      {item.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1F2937]">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500">{item.location}</p>
                    </div>
                  </div>
                  <Quote className="w-7 h-7 text-[#BEE9E8] mt-4" />
                  <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                    “{item.quote}”
                  </p>
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>

      <Footer />
    </div>
  );
}
