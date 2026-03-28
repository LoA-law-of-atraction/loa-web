import ResourcesClient from "./ResourcesClient";

export const metadata = {
  title: "Resources | LoA App",
  description:
    "Explore LoA guides, product pages, updates, and support resources for building a more conscious digital practice.",
  alternates: {
    canonical: "/resources",
  },
  openGraph: {
    title: "Resources | LoA App",
    description:
      "Explore LoA guides, product pages, updates, and support resources for building a more conscious digital practice.",
    url: "https://www.loa-lawofattraction.co/resources",
    type: "website",
  },
};

export default function ResourcesPage() {
  return <ResourcesClient />;
}
