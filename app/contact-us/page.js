import ContactClient from "./ContactClient";

export const metadata = {
  title: "Contact Us | LoA - Law of Attraction App",
  description:
    "Get in touch with the LoA team. We'd love to hear from you about using the Law of Attraction app, partnerships, sponsorships, or any questions you may have.",
  alternates: {
    canonical: "/contact-us",
  },
  openGraph: {
    title: "Contact Us | LoA - Law of Attraction App",
    description:
      "Get in touch with the LoA team. We'd love to hear from you about using the Law of Attraction app, partnerships, sponsorships, or any questions you may have.",
    url: "https://www.loa-lawofattraction.co/contact-us",
    type: "website",
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
