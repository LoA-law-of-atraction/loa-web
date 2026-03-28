"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import Navbar from "@/components/NavBar";
import Footer from "@/components/Footer";
import ContactFAB from "@/components/ContactFAB";
import dynamic from "next/dynamic";
import { Suspense } from "react";

// ✅ Load Meta Pixel only on the client (Prevents SSR issues)
const MetaPixelNoSSR = dynamic(() => import("@/components/MetaPixelEvents"), {
  ssr: false,
});

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");
  const isDashboardPage = pathname?.startsWith("/dashboard");
  const isPricingPage = pathname === "/pricing";

  const pageVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 0.5, ease: "easeInOut" },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
  };

  // Don't show main site navbar/footer on admin or dashboard (including preview – dashboard has its own bar)
  if (isAdminPage || isDashboardPage) {
    return children;
  }

  return (
    <>
      {/* ✅ Ensure Meta Pixel loads only on the client */}
      <Suspense fallback={null}>
        <MetaPixelNoSSR />
      </Suspense>

      <header className="w-full relative z-50">
        <Navbar />
      </header>

      <motion.main
        className={`w-full mx-auto relative z-10 ${isPricingPage ? "bg-black" : "pb-8"}`}
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
      <ContactFAB />
    </>
  );
}
