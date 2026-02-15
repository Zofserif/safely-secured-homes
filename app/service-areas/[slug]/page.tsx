import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BreadcrumbJsonLd from "../../components/seo/BreadcrumbJsonLd";
import { buildPageMetadata } from "../../lib/seo";
import {
  getServiceAreaBySlug,
  SERVICE_AREAS,
  SERVICE_AREA_HUB_PATH,
} from "../../lib/serviceAreas";
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

type ServiceAreaPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 3600;

export const generateStaticParams = async () =>
  SERVICE_AREAS.map((area) => ({ slug: area.slug }));

export async function generateMetadata({
  params,
}: ServiceAreaPageProps): Promise<Metadata> {
  const { slug } = await params;
  const area = getServiceAreaBySlug(slug);

  if (!area) {
    return {
      title: "Service Area Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return buildPageMetadata({
    title: `${area.name} CCTV Installation`,
    description: area.introCopy,
    path: `/service-areas/${area.slug}`,
    indexable: true,
    ogType: "website",
  });
}

export default async function ServiceAreaPage({ params }: ServiceAreaPageProps) {
  const { slug } = await params;
  const area = getServiceAreaBySlug(slug);

  if (!area) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `CCTV Installation in ${area.name}`,
    serviceType: "Home security and smart-home integration",
    areaServed: {
      "@type": "AdministrativeArea",
      name: area.name,
    },
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
          { name: area.name, item: `/service-areas/${area.slug}` },
        ]}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="container mx-auto px-6 pb-16 pt-10 lg:pb-24">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          {area.region} Service Area
        </p>
        <h1 className="mt-4 text-3xl font-bold leading-tight text-[#1F2937] sm:text-4xl lg:text-5xl">
          {area.name} CCTV Installation and Home Security
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
          {area.introCopy}
        </p>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-[#BEE9E8]/70 bg-white/95 p-6 shadow-lg shadow-[#0E79B2]/10">
            <h2 className="text-2xl font-bold text-[#1F2937]">Service proof for {area.name}</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700 sm:text-base">
              {area.serviceProof.map((proof) => (
                <li key={proof}>{proof}</li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-[#BEE9E8]/70 bg-white/95 p-6 shadow-lg shadow-[#0E79B2]/10">
            <h2 className="text-2xl font-bold text-[#1F2937]">Common use cases</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700 sm:text-base">
              {area.useCases.map((useCase) => (
                <li key={useCase}>{useCase}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="mt-8 rounded-3xl border border-[#BEE9E8]/70 bg-white/95 p-6 shadow-lg shadow-[#0E79B2]/10 sm:p-8">
          <h2 className="text-2xl font-bold text-[#1F2937]">Primary search topics</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {area.primaryKeywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700"
              >
                {keyword}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-[#BEE9E8]/70 bg-white/95 p-6 shadow-lg shadow-[#0E79B2]/10 sm:p-8">
          <h2 className="text-2xl font-bold text-[#1F2937]">FAQ for {area.name}</h2>
          <div className="mt-4 space-y-4">
            {area.faq.map((entry) => (
              <article
                key={entry.question}
                className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4"
              >
                <h3 className="text-base font-semibold text-[#2D3748]">{entry.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                  {entry.answer}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-[#BEE9E8]/70 bg-white/95 p-6 shadow-lg shadow-[#0E79B2]/10 sm:p-8">
          <h2 className="text-2xl font-bold text-[#1F2937]">Nearby cities and municipalities</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {area.nearbyCities.map((city) => (
              <span
                key={city}
                className="rounded-full border border-[#0E79B2]/25 bg-[#0E79B2]/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0E79B2]"
              >
                {city}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-[#BEE9E8]/70 bg-white/95 p-6 shadow-lg shadow-[#0E79B2]/10 sm:p-8">
          <h2 className="text-2xl font-bold text-[#1F2937]">Next steps</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Get a practical setup recommendation for your home layout and priorities.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/form"
              className="inline-flex items-center justify-center rounded-full bg-[#0E79B2] px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-[#0b5e8b]"
            >
              Get My Free Plan
            </Link>
            <Link
              href="/apply"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-[#0E79B2] hover:text-[#0E79B2]"
            >
              Apply for Consultation
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {area.internalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 transition-colors hover:border-[#0E79B2] hover:text-[#0E79B2]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
