import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import DownloadClient from "./DownloadClient";

export const metadata = {
  title: "Download LoA | Law of Attraction App | iOS & Android",
  description:
    "Download the LoA Law of Attraction app from the App Store or Google Play. Manifestation, affirmations, vision board tools, and privacy-first practice—free to start.",
  alternates: {
    canonical: "/download",
  },
  openGraph: {
    title: "Download LoA | Law of Attraction App | iOS & Android",
    description:
      "Download the LoA Law of Attraction app from the App Store or Google Play. Manifestation, affirmations, vision board tools, and privacy-first practice—free to start.",
    url: "https://www.loa-lawofattraction.co/download",
    type: "website",
  },
};

export default function DownloadPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Download", path: "/download" },
        ]}
      />
      <DownloadClient />
    </>
  );
}
