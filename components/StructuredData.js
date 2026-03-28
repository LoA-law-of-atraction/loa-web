export default function StructuredData() {
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
            sameAs: ["https://twitter.com/LoAApp"],
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
    </>
  );
}
