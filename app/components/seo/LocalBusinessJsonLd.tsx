import { siteDescription, siteName, siteUrl } from "../../lib/site";

export default function LocalBusinessJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: siteName,
    url: siteUrl,
    image: `${siteUrl}/assets/img/Logo/Black Header.png`,
    description: siteDescription,
    telephone: "+63 995 995 9229",
    areaServed: {
      "@type": "City",
      name: "Candelaria",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Candelaria",
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
