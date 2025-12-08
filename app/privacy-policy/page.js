"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { privacyPolicy } from "@/components/data/legal";
import LegalDocs from "@/components/LegalDocs";
import SolarSystemBackground from "@/components/SolarSystemBackground";

const Privacy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <SolarSystemBackground />
      <motion.section
        initial={{ opacity: 0, x: "-100%" }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: "100%" }}
        transition={{ delay: 0.5 }}
        className="relative z-10 min-h-screen flex items-center flex-col justify-center bg-transparent"
      >
        <h2 className="text-h2 pt-36 pb-20 lg:text-h3 text-white w-full text-center mb-14">
          Privacy Policy
        </h2>
        <div className="mx-auto px-5 md:px-[5%] 2xl:px-0 pb-20 container max-w-[1200px]">
          <article className="flex flex-col gap-5 text-white">
          <p className="py-5 text-white">
            <strong>Privacy Policy — LoA</strong>
            <br />
            Last updated: October 22, 2025
          </p>
          <p className="text-base text-white/90">
            Thank you for using Loa (&quot;we&quot;, &quot;our&quot;, or
            &quot;us&quot;). Your privacy is important to us. This Privacy
            Policy explains how we collect, use, and protect your information
            when you use the Loa mobile application (&quot;App&quot;).
          </p>
          <LegalDocs mou={privacyPolicy} />
          <p className="text-center mt-6 text-white/90">
            By using our app and services, you acknowledge that you have read,
            understood, and agree to be bound by this Privacy Policy.
          </p>
        </article>
      </div>
    </motion.section>
    </>
  );
};

export default Privacy;
