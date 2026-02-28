import type { Metadata } from "next";
import Link from "next/link";
import Footer from "../components/layout/Footer";
import { siteName, siteUrl } from "../lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for using Safely Secured Homes website and services.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: `Terms of Service | ${siteName}`,
    description: "Terms for using Safely Secured Homes website and services.",
    url: new URL("/terms", siteUrl),
    siteName,
    type: "website",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F7FAFC] text-[#2D3748]">
      <main className="container mx-auto max-w-4xl px-6 py-12">
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-widest text-slate-500 transition-colors hover:text-[#0E79B2]"
        >
          Back to Home
        </Link>
        <h1 className="mt-5 text-3xl font-bold sm:text-4xl">Terms of Service</h1>
        <p className="mt-3 text-sm text-slate-600">
          Effective date: February 27, 2026
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700 sm:text-base">
          <section>
            <h2 className="text-xl font-bold text-[#1F2937]">Service scope</h2>
            <p className="mt-2">
              Our website and forms provide home security guidance, checklist resources, and consultation
              scheduling. Recommendations are informational until confirmed in a formal project quote.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#1F2937]">Quotes and installation</h2>
            <p className="mt-2">
              Final pricing, timelines, and deliverables are confirmed only through an approved proposal
              or service agreement.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#1F2937]">User responsibilities</h2>
            <p className="mt-2">
              You agree to provide accurate information in forms and to use this site lawfully.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#1F2937]">Content and materials</h2>
            <p className="mt-2">
              Site content, checklists, and materials are owned by Safely Secured Homes unless stated
              otherwise and may not be redistributed without permission.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#1F2937]">Contact</h2>
            <p className="mt-2">
              Questions about these terms can be sent to{" "}
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
