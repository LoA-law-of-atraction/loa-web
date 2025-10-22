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
        <title>LoA</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content="LoA is more than just a journal app—it’s your personal biographer. With the help of Eve, your AI biographer, you’ll embark on a journey of self-reflection, rediscovery, and storytelling."
        />
        <link rel="icon" href="/favicon.ico" type="image/png" />
        <meta property="og:title" content="LoA | Your Personal Biographer" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.loa.com" />
        <meta property="og:image" content="https://www.loa.com/og.png" />
        <meta
          property="og:description"
          content="LoA helps you preserve your memories and turn them into a structured biography."
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@EverJournal" />
        <meta name="twitter:title" content="LoA | Your Personal Biographer" />
        <meta
          name="twitter:description"
          content="LoA helps you preserve your memories and turn them into a structured biography."
        />
        <meta name="twitter:image" content="https://www.loa.com/loa.svg" />
      </head>
      <body className="bg-secondary text-primary min-h-screen flex flex-col">
        {/* ✅ Ensure Meta Pixel loads only on the client */}
        <Suspense fallback={null}>
          <MetaPixelNoSSR />
        </Suspense>

        <header className="w-full">
          <Navbar />
        </header>

        <motion.main
          className="w-full mx-auto py-8"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {children}
        </motion.main>

        <Footer />
      </body>
    </html>
  );
};

export default Layout;
