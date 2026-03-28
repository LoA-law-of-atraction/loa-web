export default function StructuredData() {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LoA - Law of Attraction",
    url: "https://www.loa-lawofattraction.co",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate:
          "https://www.loa-lawofattraction.co/resources?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "LoA - Law of Attraction",
            alternateName: "LoA App",
            url: "https://www.loa-lawofattraction.co",
            logo: {
              "@type": "ImageObject",
              url: "https://www.loa-lawofattraction.co/app_logo.svg",
              width: 512,
              height: 512,
            },
            description:
              "LoA transforms your phone into a tool for conscious living. Practice the Law of Attraction with personalized affirmations and reflection—your practice lives in LoA, without monitoring other apps.",
            sameAs: [
              "https://twitter.com/LoAApp",
              "https://apps.apple.com/app/6754241860",
              "https://play.google.com/store/apps/details?id=com.loa.lawofattraction.prod",
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MobileApplication",
            name: "LoA - Law of Attraction",
            operatingSystem: "iOS, Android",
            applicationCategory: "LifestyleApplication",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            description:
              "Build a daily Law of Attraction practice with affirmations and intention—inside LoA, on your terms.",
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd),
        }}
      />
    </>
  );
}
