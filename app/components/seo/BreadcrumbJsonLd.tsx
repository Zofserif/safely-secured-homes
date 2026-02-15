import { absoluteUrl } from "../../lib/seo";

type BreadcrumbItem = {
  name: string;
  item?: string;
};

export default function BreadcrumbJsonLd({
  items,
}: {
  items: BreadcrumbItem[];
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((entry, index) => {
      const listItem: {
        "@type": "ListItem";
        position: number;
        name: string;
        item?: string;
      } = {
        "@type": "ListItem",
        position: index + 1,
        name: entry.name,
      };

      if (entry.item) {
        listItem.item =
          entry.item.startsWith("http://") || entry.item.startsWith("https://")
            ? entry.item
            : absoluteUrl(entry.item);
      }

      return listItem;
    }),
  };

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
