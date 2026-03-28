/** SoftwareApplication + Offer list for /pricing (RevenueCat prices; monthly as representative). */
export default function PricingJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "LoA - Law of Attraction",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "iOS, Android",
    url: "https://www.loa-lawofattraction.co/pricing",
    offers: [
      {
        "@type": "Offer",
        name: "Manifest Starter",
        price: "0",
        priceCurrency: "USD",
        description: "Free tier with local affirmations, vision board, and basic streak tracking.",
      },
      {
        "@type": "Offer",
        name: "Manifest Creator",
        price: "4.99",
        priceCurrency: "USD",
        description: "Monthly subscription with AI affirmations, cloud backup, and cross-device sync.",
      },
      {
        "@type": "Offer",
        name: "Manifest Master",
        price: "9.99",
        priceCurrency: "USD",
        description: "Monthly subscription with higher AI limits and premium insights.",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
