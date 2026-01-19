import PrivacyClient from "./PrivacyClient";

export const metadata = {
  title: "Privacy Policy | LoA - Law of Attraction App",
  description:
    "Read the LoA Privacy Policy to understand how we collect, use, and protect your personal information when using our Law of Attraction mobile application.",
  alternates: {
    canonical: "/privacy-policy",
  },
  openGraph: {
    title: "Privacy Policy | LoA - Law of Attraction App",
    description:
      "Read the LoA Privacy Policy to understand how we collect, use, and protect your personal information when using our Law of Attraction mobile application.",
    url: "https://www.loa-lawofattraction.co/privacy-policy",
    type: "website",
  },
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
