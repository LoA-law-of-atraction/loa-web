"use client";

import "./globals.css";
import { useRouter } from "next/navigation";
import Head from "next/head";
import Script from "next/script";
import { motion } from "framer-motion";
import Navbar from "@/components/NavBar";
import Footer from "@/components/Footer";

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
      <head>
        <title>Ever Journal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content="Ever Journal is more than just a journal app—it’s your personal biographer. With the help of Eve, your AI biographer, you’ll embark on a journey of self-reflection, rediscovery, and storytelling."
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/ever.svg" />

        {/* Open Graph Meta Tags for Social Sharing */}
        <meta
          property="og:title"
          content="Ever Journal | Your Personal Biographer"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ever-journal.vercel.app" />
        <meta
          property="og:image"
          content="https://ever-journal.vercel.app/ever.svg"
        />
        <meta
          property="og:description"
          content="Ever Journal is more than just a journal app—it’s your personal biographer."
        />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@EverJournal" />
        <meta
          name="twitter:title"
          content="Ever Journal | Your Personal Biographer"
        />
        <meta
          name="twitter:description"
          content="Ever Journal helps you preserve your memories and turn them into a structured biography."
        />
        <meta
          name="twitter:image"
          content="https://ever-journal.vercel.app/ever.svg"
        />
      </head>

      {/* Meta Pixel Tracking (Now in <body> for Performance) */}
      <body className="bg-secondary text-primary min-h-screen flex flex-col">
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}
              (window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');

              fbq('init', 'YOUR_PIXEL_ID'); 
              fbq('track', 'PageView');
            `,
          }}
        />

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
