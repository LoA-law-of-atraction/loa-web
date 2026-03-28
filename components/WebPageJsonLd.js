const BASE = "https://www.loa-lawofattraction.co";

/** AboutPage or ContactPage structured data. */
export default function WebPageJsonLd({ type, title, description, path }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": type,
    name: title,
    description,
    url: `${BASE}${path}`,
    isPartOf: {
      "@type": "WebSite",
      name: "LoA - Law of Attraction",
      url: BASE,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
