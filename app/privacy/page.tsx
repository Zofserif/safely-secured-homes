import type { Metadata } from "next";
import Link from "next/link";
import Footer from "../components/layout/Footer";
import { siteName, siteUrl } from "../lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Safely Secured Homes collects, uses, and protects your data.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: `Privacy Policy | ${siteName}`,
    description: "How Safely Secured Homes collects, uses, and protects your data.",
    url: new URL("/privacy", siteUrl),
    siteName,
    type: "website",
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F7FAFC] text-[#2D3748]">
      <main className="container mx-auto max-w-4xl px-6 py-12">
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-widest text-slate-500 transition-colors hover:text-[#0E79B2]"
        >
          Back to Home
        </Link>
        <h1 className="mt-5 text-3xl font-bold sm:text-4xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-slate-600">
          Effective date: February 27, 2026
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700 sm:text-base">
          <section>
            <h2 className="text-xl font-bold text-[#1F2937]">What we collect</h2>
            <p className="mt-2">
              We collect the contact and home-assessment details you submit through our forms, such as
              your name, email, mobile number, location details, and assessment answers. When you submit
              a form, we may also infer your approximate location (country, region, and city) from your
              IP or network headers.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#1F2937]">How we use your data</h2>
            <p className="mt-2">
              We use your information to deliver your Panatag Home Checklist, prepare your personalized
              recommendations, follow up on your request, and improve our services.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#1F2937]">Data sharing</h2>
            <p className="mt-2">
              We do not sell your personal data. We may use secure service providers for form processing,
              analytics, and communications needed to deliver our services.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#1F2937]">Your choices</h2>
            <p className="mt-2">
              You may request updates or deletion of your data and unsubscribe from newsletter emails at
              any time.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#1F2937]">Contact</h2>
            <p className="mt-2">
              For privacy requests, email{" "}
              <a className="text-[#0E79B2] underline" href="mailto:safelysecuredhomes@gmail.com">
                safelysecuredhomes@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
