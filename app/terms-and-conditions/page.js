import TermsClient from "./TermsClient";

export const metadata = {
  title: "Terms and Conditions | LoA - Law of Attraction App",
  description:
    "Review the Terms and Conditions for using the LoA mobile application. Learn about eligibility, usage guidelines, subscriptions, and your rights as a user.",
  alternates: {
    canonical: "/terms-and-conditions",
  },
  openGraph: {
    title: "Terms and Conditions | LoA - Law of Attraction App",
    description:
      "Review the Terms and Conditions for using the LoA mobile application. Learn about eligibility, usage guidelines, subscriptions, and your rights as a user.",
    url: "https://www.loa-lawofattraction.co/terms-and-conditions",
    type: "website",
  },
};

export default function TermsPage() {
  return <TermsClient />;
}
