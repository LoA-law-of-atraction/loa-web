const BASE = "https://www.loa-lawofattraction.co";

/**
 * BreadcrumbList JSON-LD for inner marketing routes.
 * @param {{ name: string, path: string }[]} items — paths like "/features" (no trailing slash)
 */
export default function BreadcrumbJsonLd({ items }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${BASE}${item.path}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
