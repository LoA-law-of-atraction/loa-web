import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import WebPageJsonLd from "@/components/WebPageJsonLd";
import AboutUsClient from "./AboutUsClient";

export const metadata = {
  title: "About Us | LoA - Law of Attraction App",
  description:
    "Meet the team behind LoA and learn how the Law of Attraction inspired a new kind of digital wellness app.",
  alternates: {
    canonical: "/about-us",
  },
  openGraph: {
    title: "About Us | LoA - Law of Attraction App",
    description:
      "Meet the team behind LoA and learn how the Law of Attraction inspired a new kind of digital wellness app.",
    url: "https://www.loa-lawofattraction.co/about-us",
    type: "website",
  },
};

export default function AboutUsPage() {
  return (
    <>
      <WebPageJsonLd
        type="AboutPage"
        title="About Us | LoA - Law of Attraction App"
        description="Meet the team behind LoA and learn how the Law of Attraction inspired a new kind of digital wellness app."
        path="/about-us"
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "About", path: "/about-us" },
        ]}
      />
      <AboutUsClient />
    </>
  );
}
