import { ogImageUrl, siteName } from "../../lib/site";
import { absoluteUrl } from "../../lib/seo";

export default function BlogPostingJsonLd({
  slug,
  title,
  description,
  publishedAt,
}: {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
}) {
  const articleUrl = absoluteUrl(`/blog/${slug}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    datePublished: publishedAt,
    dateModified: publishedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    author: {
      "@type": "Organization",
      name: siteName,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: {
        "@type": "ImageObject",
        url: ogImageUrl,
      },
    },
    image: [ogImageUrl],
    url: articleUrl,
  };

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
