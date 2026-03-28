import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import ResourcesClient from "./ResourcesClient";
import { resourcesFaqJsonLd } from "./resourcesFaq";

export const metadata = {
  title: "Law of Attraction Resources & Guides | LoA App",
  description:
    "Law of Attraction resources for LoA: guides to manifestation and affirmations, feature overviews, download links, pricing, updates, privacy, and support—everything for your daily practice.",
  alternates: {
    canonical: "/resources",
  },
  openGraph: {
    title: "Law of Attraction Resources & Guides | LoA App",
    description:
      "Law of Attraction resources for LoA: guides to manifestation and affirmations, feature overviews, download links, pricing, updates, privacy, and support.",
    url: "https://www.loa-lawofattraction.co/resources",
    type: "website",
  },
};

export default function ResourcesPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Resources", path: "/resources" },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(resourcesFaqJsonLd()),
        }}
      />
      <ResourcesClient />
    </>
  );
}
