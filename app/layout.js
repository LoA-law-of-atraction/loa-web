import "./globals.css";
import { motion } from "framer-motion";
import Navbar from "@/components/NavBar";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";
import { Suspense } from "react";

// ✅ Load Meta Pixel only on the client (Prevents SSR issues)
const MetaPixelNoSSR = dynamic(() => import("@/components/MetaPixelEvents"), {
  ssr: false,
});

export const metadata = {
  title: "LoA - Law of Attraction for the Digital Age",
  description:
    "LoA transforms your phone into a tool for conscious living. Practice the Law of Attraction with affirmation screens, digital mindfulness, and intentional awareness in every interaction.",
  icons: {
    icon: [
      { url: "/favicon/favicon.ico" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
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
};

const Layout = ({ children }) => {
  const pageVariants = {
    initial: { opacity: 0, x: -100 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: "easeInOut" },
    },
    exit: {
      opacity: 0,
      x: 100,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
  };

  return (
    <html lang="en">
      <head>
        {/* JSON-LD Structured Data for Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "LoA - Law of Attraction",
              alternateName: "LoA App",
              url: "https://loa-web-landing.vercel.app",
              logo: "https://loa-web-landing.vercel.app/app_logo.svg",
              description:
                "LoA transforms your phone into a tool for conscious living. Practice the Law of Attraction with affirmation screens, digital mindfulness, and intentional awareness in every interaction.",
              sameAs: ["https://twitter.com/LoAApp"],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MobileApplication",
              name: "LoA - Law of Attraction",
              operatingSystem: ["iOS", "Android"],
              applicationCategory: "LifestyleApplication",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "1000",
              },
              description:
                "Transform digital distractions into moments of conscious awareness. Align your technology use with the Law of Attraction.",
            }),
          }}
        />
      </head>
      <body
        className="text-gray-900 min-h-screen flex flex-col bg-black"
        suppressHydrationWarning
      >
        {/* ✅ Ensure Meta Pixel loads only on the client */}
        <Suspense fallback={null}>
          <MetaPixelNoSSR />
        </Suspense>

        <header className="w-full relative z-50">
          <Navbar />
        </header>

        <motion.main
          className="w-full mx-auto py-8 relative z-10"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {children}
        </motion.main>

        <div className="relative z-10">
          <Footer />
        </div>
      </body>
    </html>
  );
};

export default Layout;
