import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import FeaturesClient from "./FeaturesClient";

export const metadata = {
  title: "Law of Attraction App Features | LoA",
  description:
    "Explore LoA features: Law of Attraction affirmations, manifestation streaks, vision board tools, mindful pauses, and privacy-first practice on iOS and Android.",
  alternates: {
    canonical: "/features",
  },
  openGraph: {
    title: "Law of Attraction App Features | LoA",
    description:
      "Explore LoA features: Law of Attraction affirmations, manifestation streaks, vision board tools, mindful pauses, and privacy-first practice on iOS and Android.",
    url: "https://www.loa-lawofattraction.co/features",
    type: "website",
  },
};

export default function FeaturesPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Features", path: "/features" },
        ]}
      />
      <FeaturesClient />
    </>
  );
}
