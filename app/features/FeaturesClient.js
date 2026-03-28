"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Testimonial from "@/components/Testimonial";
import Faqs from "@/components/Faqs";
import Feature from "@/components/Features";
import ReadyToStart from "@/components/Ready";
import SolarSystemBackground from "@/components/SolarSystemBackground";

export default function FeaturesClient() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <SolarSystemBackground />

      <div className="pt-20">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 mx-auto max-w-[720px] px-5 pb-6 pt-8 text-center md:px-[5%]"
          aria-labelledby="features-page-title"
        >
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7986CB]">
            Law of Attraction · Manifestation
          </p>
          <h1
            id="features-page-title"
            className="font-tiempos text-h2 font-bold leading-tight text-white lg:text-h3"
          >
            Law of Attraction app features for daily practice
          </h1>
          <div className="mt-6 space-y-4 text-left text-[15px] leading-relaxed text-white/55 md:text-center">
            <p>
              LoA is a{" "}
              <strong className="font-semibold text-white/80">
                Law of Attraction app
              </strong>{" "}
              built for real phone use: affirmation screens, streaks, vision
              board tools, and reflection—without monitoring other apps or
              breaking your focus with guilt-based tracking.
            </p>
            <p>
              Below you will see how{" "}
              <strong className="font-semibold text-white/80">
                manifestation
              </strong>
              -minded features fit together, from personalized affirmations to
              privacy-first defaults. Ready to install?{" "}
              <Link
                href="/download"
                className="text-[#9FA8DA] underline-offset-2 hover:underline"
              >
                Download LoA for iOS or Android
              </Link>
              , or review{" "}
              <Link
                href="/pricing"
                className="text-[#9FA8DA] underline-offset-2 hover:underline"
              >
                plans and limits
              </Link>
              .
            </p>
          </div>
        </motion.section>
        <Feature />
        <ReadyToStart dark />
        <Testimonial />
        <Faqs />
      </div>
    </>
  );
}
