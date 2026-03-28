import DownloadClient from "./DownloadClient";

export const metadata = {
  title: "Download LoA | App Store & Google Play",
  description:
    "Get LoA on iOS and Android. Start practicing the Law of Attraction on your phone today.",
  alternates: {
    canonical: "/download",
  },
  openGraph: {
    title: "Download LoA | App Store & Google Play",
    description:
      "Get LoA on iOS and Android. Start practicing the Law of Attraction on your phone today.",
    url: "https://www.loa-lawofattraction.co/download",
    type: "website",
  },
};

export default function DownloadPage() {
  return <DownloadClient />;
}
