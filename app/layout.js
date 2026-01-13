import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import StructuredData from "@/components/StructuredData";

export const metadata = {
  title: "LoA - Law of Attraction for the Digital Age",
  description:
    "LoA transforms your phone into a tool for conscious living. Practice the Law of Attraction with affirmation screens, digital mindfulness, and intentional awareness in every interaction.",
  metadataBase: new URL("https://loa-web-landing.vercel.app"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      {
        url: "/favicon/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/favicon/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/favicon/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  manifest: "/favicon/site.webmanifest",
  openGraph: {
    title: "LoA - Law of Attraction for the Digital Age",
    description:
      "Transform digital distractions into moments of conscious awareness. Align your technology use with the Law of Attraction.",
    url: "https://loa-web-landing.vercel.app",
    siteName: "LoA App",
    images: [
      {
        url: "https://loa-web-landing.vercel.app/og.png",
        alt: "LoA App",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@LoAApp",
    title: "LoA - Law of Attraction for the Digital Age",
    description:
      "Transform digital distractions into moments of conscious awareness. Align your technology use with the Law of Attraction.",
    images: ["https://loa-web-landing.vercel.app/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function Layout({ children }) {
  return (
    <html lang="en">
      <body
        className="text-gray-900 min-h-screen flex flex-col bg-black"
        suppressHydrationWarning
      >
        <StructuredData />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
