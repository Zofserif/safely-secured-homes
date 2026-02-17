import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ogImageUrl, siteName, siteUrl } from "../lib/site";
import ApplyTestimonialsSection from "../components/testimonials/ApplyTestimonialsSection";

export const metadata: Metadata = {
  title: "Apply Now",
  description:
    "Start your Safely Secured Homes application and get a personalized security plan.",
  alternates: {
    canonical: "/apply",
  },
  robots: {
    index: false,
    follow: false,
  },
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
  const benefits = [
    {
      image: 'https://ukgfftcenpztjkynbymj.supabase.co/storage/v1/object/public/user-assets/pexels-fauxels-3184292.jpg',
      title: "Safely Secured Panatag Report",
      description: "Know your Home Safety Score when taking our assessments.",
    },
    {
      image: 'https://ukgfftcenpztjkynbymj.supabase.co/storage/v1/object/public/user-assets/pexels-mart-production-7088483.jpg',
      title: "Personalized Safety Consultation",
      description: "A clear plan tailored to your home layout and priorities.",
    },
    {
      image: 'https://ukgfftcenpztjkynbymj.supabase.co/storage/v1/object/public/user-assets/pexels-shvets-production-9052461.jpg',
      title: "Priority Coverage Layout",
      description: "Know exactly which entry points to secure first.",
    },
    {
      image: 'https://ukgfftcenpztjkynbymj.supabase.co/storage/v1/object/public/user-assets/pexels-jakubzerdzicki-17536106.jpg',
      title: "Home Automation Plan",
      description: "Practical Smart Home recommendations that fit your lifestyle.",
    },
    {
      image: 'https://ukgfftcenpztjkynbymj.supabase.co/storage/v1/object/public/user-assets/pexels-michael-burrows-7129717.jpg',
      title: "Continuous Support",
      description: "Guidance by call or chat when you need it.",
    },
    {
      image: 'https://ukgfftcenpztjkynbymj.supabase.co/storage/v1/object/public/user-assets/pexels-rdne-8293673.jpg',
      title: "Quarterly Safety Reviews",
      description: "Maintenance checks and updates to keep your home secure over time.",
    },
  ];

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

      <main className="container mx-auto px-6 pb-16 lg:pb-24 pt-2 sm:pt-4">
        <section className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:gap-6 md:min-h-[calc(100svh-8.5rem)] md:justify-between">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Apply for your Home Safety
            </p>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold mt-3 sm:mt-4 text-[#2D3748] leading-tight">
              Get a personalized security plan for your home.
            </h1>
            <p className="text-slate-600 mt-2 sm:mt-4 text-sm sm:text-lg">
              Answer a few quick questions and we&apos;ll craft the safest, most
              practical setup for your family.
            </p>
          </div>

          <div className="max-w-5xl mx-auto w-full">
            <div className="relative aspect-7/4 w-full rounded-4xl overflow-hidden shadow-2xl shadow-[#0E79B2]/15 border border-white">
              <Image
                src="/assets/img/Hero/pexels-vlada-karpovich-4609033.jpg"
                alt="Safely Secured Homes quick intro"
                fill
                sizes="(min-width: 1024px) 70vw, 92vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/40 via-black/10 to-transparent"></div>
              <div className="absolute top-4 left-4 bg-white/90 px-3 py-1.5 rounded-full text-xs font-semibold text-[#0E79B2] shadow-sm">
                Safely Secured Homes
              </div>
              <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 text-left">
                <p className="text-white text-base sm:text-xl font-semibold">
                  60-second tour: what you&apos;ll get after you apply
                </p>
                <p className="text-white/80 text-xs sm:text-sm mt-1">
                  Practical, calm, and actionable security tips for Filipino
                  homes.
                </p>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 flex justify-center">
              <Link
                href="/form?source=apply"
                className="inline-flex items-center justify-center bg-[#0E79B2] hover:bg-[#0b5e8b] text-white px-10 py-3 rounded-full font-bold shadow-lg shadow-[#0E79B2]/25 transition-all hover:-translate-y-0.5"
              >
                START MY JOURNEY
              </Link>
            </div>
          </div>
        </section>

        <ApplyTestimonialsSection />

        <section className="mt-16">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              What you&apos;ll receive
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-4 text-[#2D3748]">
              What you get when you apply with Safely Secured Homes
            </h2>
            <p className="text-slate-600 mt-3 text-sm sm:text-base">
              Practical, calm, and actionable guidance designed for Filipino
              households.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((item) => (
              <article
                key={item.title}
                className="rounded-3xl border border-[#DCE6F1] bg-white/95 p-6 shadow-[0_18px_40px_rgba(14,121,178,0.08)] flex flex-col"
              >
                <div className="relative h-40 rounded-2xl bg-[#F1F7FB] border border-white/80 overflow-hidden flex items-center justify-center">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-[70%] w-[75%] rounded-2xl border-2 border-dashed border-[#0E79B2]/30 bg-white/80 flex items-center justify-center text-xs font-semibold uppercase tracking-[0.25em] text-[#0E79B2]">
                      Image
                    </div>
                  )}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[#1F2937] text-center">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm sm:text-base text-slate-600 text-center">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-8 flex justify-center">
          <Link
            href="/form?source=apply"
            className="inline-flex items-center justify-center bg-[#0E79B2] hover:bg-[#0b5e8b] text-white px-10 py-3 rounded-full font-bold shadow-lg shadow-[#0E79B2]/25 transition-all hover:-translate-y-0.5"
          >
            START MY JOURNEY
          </Link>
        </div>
      </main>
    </div>
  );
}
