import AboutUsClient from "./AboutUsClient";

export const metadata = {
  title: "About Us | LoA App",
  description:
    "Meet the team behind LoA and learn how the Law of Attraction inspired a new kind of digital wellness app.",
  alternates: {
    canonical: "/about-us",
  },
  openGraph: {
    title: "About Us | LoA App",
    description:
      "Meet the team behind LoA and learn how the Law of Attraction inspired a new kind of digital wellness app.",
    url: "https://www.loa-lawofattraction.co/about-us",
    type: "website",
  },
};

export default function AboutUsPage() {
  return <AboutUsClient />;
}
