"use client";

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
        <title>LoA - Law of Attraction for the Digital Age</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content="LoA transforms your phone into a tool for conscious living. Practice the Law of Attraction with affirmation screens, digital mindfulness, and intentional awareness in every interaction."
        />
        <link rel="icon" href="/favicon/favicon.ico" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon/favicon-16x16.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <meta
          property="og:title"
          content="LoA - Law of Attraction for the Digital Age"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://loa-web-landing.vercel.app" />
        <meta
          property="og:image"
          content="https://loa-web-landing.vercel.app/og.png"
        />
        <meta
          property="og:description"
          content="Transform digital distractions into moments of conscious awareness. Align your technology use with the Law of Attraction."
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@LoAApp" />
        <meta
          name="twitter:title"
          content="LoA - Law of Attraction for the Digital Age"
        />
        <meta
          name="twitter:description"
          content="Transform digital distractions into moments of conscious awareness. Align your technology use with the Law of Attraction."
        />
        <meta
          name="twitter:image"
          content="https://loa-web-landing.vercel.app//og.png"
        />

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
      <body className="text-gray-900 min-h-screen flex flex-col bg-black">
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
