import {
  siteAddressLocality,
  siteAddressRegion,
  siteCountryCode,
  siteDescription,
  siteName,
  sitePhone,
  sitePostalCode,
  siteUrl,
} from "../../lib/site";

export default function LocalBusinessJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: siteName,
    url: siteUrl,
    image: `${siteUrl}/assets/img/Logo/Black Header.png`,
    description: siteDescription,
    telephone: sitePhone,
    priceRange: "PHP 10000-150000",
    areaServed: [
      {
        "@type": "AdministrativeArea",
        name: "Metro Manila",
      },
      {
        "@type": "AdministrativeArea",
        name: "Laguna",
      },
      {
        "@type": "AdministrativeArea",
        name: "Quezon",
      },
      {
        "@type": "AdministrativeArea",
        name: "Cavite",
      },
      {
        "@type": "AdministrativeArea",
        name: "Rizal",
      },
      {
        "@type": "AdministrativeArea",
        name: "Batangas",
      },
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: siteAddressLocality,
      addressRegion: siteAddressRegion,
      postalCode: sitePostalCode,
      addressCountry: siteCountryCode,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: sitePhone,
        areaServed: "PH",
        availableLanguage: ["en", "fil"],
      },
    ],
    sameAs: [
      "https://www.facebook.com/profile.php?id=61581014067336",
    ],
  };

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
