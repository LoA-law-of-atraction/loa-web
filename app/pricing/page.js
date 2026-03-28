import PricingClient from "./PricingClient";

export const metadata = {
  title: "Pricing | LoA App",
  description:
    "Start for free or unlock the full Law of Attraction experience with LoA Premium.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing | LoA App",
    description:
      "Start for free or unlock the full Law of Attraction experience with LoA Premium.",
    url: "https://www.loa-lawofattraction.co/pricing",
    type: "website",
  },
};

export default function PricingPage() {
  return <PricingClient />;
}
