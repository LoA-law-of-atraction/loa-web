"use client";

import "./globals.css";
import { useRouter } from "next/navigation";
import Head from "next/head";
import { motion } from "framer-motion";
import Navbar from "@/components/NavBar";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";
import { Suspense } from 'react'

// const PixelTracker = dynamic(() => import("../components/MetaPixelEvents"), {
//   ssr: false,
// });

const Layout = ({ children }) => {
  const router = useRouter();

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
      <Head>
        <title>Ever Journal</title>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png"></link>
        <link rel="shortcut icon" href="/favicon.png" type="image/png"></link>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content="Ever Journal is more than just a journal app—it’s your personal biographer. With the help of Eve, your AI biographer, you’ll embark on a journey of self-reflection, rediscovery, and storytelling"
        />
        <link rel="shortcut icon" href="/ever.svg" />
        <meta
          property="og:title"
          content="Ever Journal | Your Personal Biographer"
        />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.ever-journal.com" />
        <meta
          property="og:image"
          content="hhttps://www.ever-journal.com/ever.svg"
        />
        <meta
          property="og:description"
          content="Ever Journal is more than just a journal app—it’s your personal biographer."
        />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:site" content="" />
        <meta name="twitter:title" content="" />
        <meta name="twitter:description" content="" />
        <meta name="twitter:creator" content="" />
        <meta name="twitter:image" content="https://www.ever-journal.com" />
      </Head>

      <body className="bg-secondary text-primary min-h-screen flex flex-col">

        <PixelTracker />

        <header className="w-full">
          <Navbar />
        </header>

        <motion.main
          className="w-full mx-auto py-8"
          key={router.route}
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
