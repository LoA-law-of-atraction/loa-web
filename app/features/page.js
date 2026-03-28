import FeaturesClient from "./FeaturesClient";

export const metadata = {
  title: "Features | LoA App",
  description:
    "Explore LoA's affirmation screens, mindful pause tools, and consciousness-building features for the digital age.",
  alternates: {
    canonical: "/features",
  },
  openGraph: {
    title: "Features | LoA App",
    description:
      "Explore LoA's affirmation screens, mindful pause tools, and consciousness-building features for the digital age.",
    url: "https://www.loa-lawofattraction.co/features",
    type: "website",
  },
};

export default function FeaturesPage() {
  return <FeaturesClient />;
}
