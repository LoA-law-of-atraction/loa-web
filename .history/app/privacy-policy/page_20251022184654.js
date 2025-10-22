"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { privacyPolicy } from "@/components/data/legal";
import LegalDocs from "@/components/LegalDocs";

const Privacy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, x: "-100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ delay: 0.5 }}
      className="min-h-screen flex items-center flex-col justify-center"
    >
      <h2 className="text-h2 bg-bg pt-36 pb-20 lg:text-h3 text-white w-full text-center mb-14">
        Privacy Policy
      </h2>
      <div className="mx-auto px-5 md:px-[5%] 2xl:px-0 pb-20 container max-w-[1200px]">
        <article className="bg-secondary">
          <p className="py-5">Effective Date: July 20, 2024</p>
          <article className="flex flex-col gap-5">
            <h3 className="font-extrabold text-h5">Introduction</h3>
            <p className="text-base">
              This Privacy Policy applies to the LoA app (referred to as
              &quot;Application&quot;), created by Yosuke Sakurai (referred to
              as &quot;Service Provider&quot;). This document outlines how the
              Application collects, uses, and protects user data. By using the
              Application, you agree to the terms of this Privacy Policy.
            </p>
          </article>
          <LegalDocs mou={privacyPolicy} />
          <p className="text-center mt-4">
            By using our platform and services, you acknowledge that you have
            read, understood, and agree to be bound by these Terms.
          </p>
        </article>
      </div>
    </motion.section>
  );
};

export default Privacy;
