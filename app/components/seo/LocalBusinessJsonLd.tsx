import { siteDescription, siteName, siteUrl } from "../../lib/site";

export default function LocalBusinessJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: siteName,
    url: siteUrl,
    image: `${siteUrl}/assets/img/Hero/pexels-vlada-karpovich-4609033.jpg`,
    description: siteDescription,
    telephone: "+63 995 995 9229",
    areaServed: {
      "@type": "City",
      name: "Manila",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Manila",
      addressCountry: "PH",
    },
    sameAs: [
      "https://www.facebook.com/people/Safely-Secured-Homes/61581014067336/",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
