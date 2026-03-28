import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import PricingJsonLd from "@/components/PricingJsonLd";
import PricingClient from "./PricingClient";

export const metadata = {
  title: "Pricing | LoA - Law of Attraction App",
  description:
    "Manifest Starter is free and local-only. Upgrade to Manifest Creator or Manifest Master for AI affirmations, cloud backup, and higher limits.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing | LoA - Law of Attraction App",
    description:
      "Manifest Starter is free and local-only. Upgrade to Manifest Creator or Manifest Master for AI affirmations, cloud backup, and higher limits.",
    url: "https://www.loa-lawofattraction.co/pricing",
    type: "website",
  },
};

export default function PricingPage() {
  return (
    <>
      <PricingJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Pricing", path: "/pricing" },
        ]}
      />
      <PricingClient />
    </>
  );
}
