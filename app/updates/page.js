import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import UpdatesClient from "./UpdatesClient";

export const metadata = {
  title: "What's New | LoA - Law of Attraction App",
  description:
    "The latest features, improvements, and updates from the LoA team.",
  alternates: {
    canonical: "/updates",
  },
  openGraph: {
    title: "What's New | LoA - Law of Attraction App",
    description:
      "The latest features, improvements, and updates from the LoA team.",
    url: "https://www.loa-lawofattraction.co/updates",
    type: "website",
  },
};

export default function UpdatesPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "What's New", path: "/updates" },
        ]}
      />
      <UpdatesClient />
    </>
  );
}
