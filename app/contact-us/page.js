import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import WebPageJsonLd from "@/components/WebPageJsonLd";
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
  return (
    <>
      <WebPageJsonLd
        type="ContactPage"
        title="Contact Us | LoA - Law of Attraction App"
        description="Get in touch with the LoA team about the Law of Attraction app, partnerships, sponsorships, or support."
        path="/contact-us"
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact-us" },
        ]}
      />
      <ContactClient />
    </>
  );
}
