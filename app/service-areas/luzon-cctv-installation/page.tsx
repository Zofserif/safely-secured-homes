import Link from "next/link";
import BreadcrumbJsonLd from "../../components/seo/BreadcrumbJsonLd";
import { buildPageMetadata } from "../../lib/seo";
import { SERVICE_AREAS, SERVICE_AREA_HUB_PATH } from "../../lib/serviceAreas";
import {
  ogImageUrl,
  siteAddressLocality,
  siteAddressRegion,
  siteCountryCode,
  siteName,
  sitePhone,
  sitePostalCode,
  siteUrl,
} from "../../lib/site";

export const revalidate = 3600;

export const metadata = buildPageMetadata({
  title: "Luzon CCTV Installation Areas",
  description:
    "Explore Safely Secured Homes service areas across Luzon, including Metro Manila and key CALABARZON locations.",
  path: SERVICE_AREA_HUB_PATH,
  indexable: true,
  ogType: "website",
});

export default function LuzonServiceAreasPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Luzon Home Security and CCTV Installation",
    serviceType: "CCTV installation and smart home security",
    areaServed: SERVICE_AREAS.map((area) => ({
      "@type": "AdministrativeArea",
      name: area.name,
    })),
    provider: {
      "@type": "LocalBusiness",
      name: siteName,
      url: siteUrl,
      telephone: sitePhone,
      image: ogImageUrl,
      address: {
        "@type": "PostalAddress",
        addressLocality: siteAddressLocality,
        addressRegion: siteAddressRegion,
        postalCode: sitePostalCode,
        addressCountry: siteCountryCode,
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#1F2937]">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", item: "/" },
          { name: "Luzon Service Areas", item: SERVICE_AREA_HUB_PATH },
        ]}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="container mx-auto px-6 pb-16 pt-10 lg:pb-24">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          Safely Secured Homes Service Coverage
        </p>
        <h1 className="mt-4 text-3xl font-bold leading-tight text-[#1F2937] sm:text-4xl lg:text-5xl">
          CCTV Installation and Home Security Across Luzon
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
          We support homeowners across Luzon with practical security planning,
          camera placement, and smart-home integration that stays easy for the
          whole household.
        </p>

        <section className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SERVICE_AREAS.map((area) => (
            <article
              key={area.slug}
              className="rounded-3xl border border-[#BEE9E8]/70 bg-white/95 p-6 shadow-lg shadow-[#0E79B2]/10"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[#0E79B2]">
                {area.region}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#1F2937]">{area.name}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {area.introCopy}
              </p>
              <Link
                href={`/service-areas/${area.slug}`}
                className="mt-5 inline-flex rounded-full border border-[#0E79B2] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#0E79B2] transition-colors hover:bg-[#0E79B2] hover:text-white"
              >
                View {area.name} Guide
              </Link>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-3xl border border-[#BEE9E8]/70 bg-white/95 p-6 shadow-lg shadow-[#0E79B2]/10 sm:p-8">
          <h2 className="text-2xl font-bold text-[#1F2937]">Start with a free plan</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Tell us about your home layout and concerns. We will recommend a
            practical setup and next steps tailored to your family.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/form"
              className="inline-flex items-center justify-center rounded-full bg-[#0E79B2] px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-[#0b5e8b]"
            >
              Get My Free Plan
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-[#0E79B2] hover:text-[#0E79B2]"
            >
              Read Security Guides
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
