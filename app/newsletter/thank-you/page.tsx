import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ogImageUrl, siteName, siteUrl } from "../../lib/site";
import SuccessStoriesSection from "../../components/success-stories/SuccessStoriesSection";

export const metadata: Metadata = {
  title: "Thanks for Joining",
  description:
    "Thanks for joining the Safely Secured Homes newsletter. Your checklist is on the way.",
  alternates: {
    canonical: "/newsletter/thank-you",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: `Thanks for Joining | ${siteName}`,
    description:
      "Thanks for joining the Safely Secured Homes newsletter. Your checklist is on the way.",
    url: new URL("/newsletter/thank-you", siteUrl),
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
    title: `Thanks for Joining | ${siteName}`,
    description:
      "Thanks for joining the Safely Secured Homes newsletter. Your checklist is on the way.",
    images: [ogImageUrl],
  },
};

export default function NewsletterThankYouPage() {
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
            You’re in! Thanks for subscribing to our newsletter.
          </h1>
          <p className="text-slate-600 mt-4 text-base sm:text-lg">
            Your checklist is on the way. Please check your inbox in a few
            minutes.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 bg-[#BEE9E8]/70 text-[#0E79B2] px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide">
            Before you go, watch this...
          </div>
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
                60-second tour: what you’ll get each Friday
              </p>
              <p className="text-white/80 text-sm mt-1">
                Practical, calm, and actionable security tips for Filipino
                homes.
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center text-center gap-4">
            <p className="text-lg sm:text-xl lg:text-2xl text-[#2D3748] max-w-3xl">
              If you&apos;re ready to build a personalized security plan for
              your home, apply now and let&apos;s talk.
            </p>
            <Link
              href="/form?source=newsletter"
              className="inline-flex items-center justify-center bg-[#0E79B2] hover:bg-[#0b5e8b] text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-[#0E79B2]/20 transition-all hover:-translate-y-0.5"
            >
              APPLY NOW
            </Link>
          </div>

          <SuccessStoriesSection />
        </div>
      </main>
    </div>
  );
}
