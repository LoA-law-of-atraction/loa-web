import HomeClient from "./HomeClient";

export const metadata = {
  title: "LoA - Law of Attraction for the Digital Age",
  description:
    "Transform your phone into a tool for conscious living. Practice the Law of Attraction with personalized affirmations and mindful interruptions.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "LoA - Law of Attraction for the Digital Age",
    description:
      "Transform your phone into a tool for conscious living. Practice the Law of Attraction with personalized affirmations and mindful interruptions.",
    url: "https://www.loa-lawofattraction.co/",
    type: "website",
  },
};

export default function Home() {
  return <HomeClient />;
}
