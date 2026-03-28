"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import AppStoreDownloadButton from "@/components/AppStoreDownloadButton";
import GooglePlayDownloadButton from "@/components/GooglePlayDownloadButton";

export default function DownloadClient() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative min-h-screen bg-black pt-32 pb-20 overflow-hidden flex items-center"
      >
        <div className="relative z-20 max-w-5xl mx-auto px-6 w-full">
          <div className="flex flex-col md:flex-row items-center gap-20">
            {/* Left - Content */}
            <div className="flex-1">
              {/* App Icon + Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="flex items-center gap-4 mb-4"
              >
                <Image
                  src="/app_logo.svg"
                  alt="LoA Logo"
                  width={56}
                  height={56}
                />
                <h1 className="text-4xl md:text-5xl font-bold text-white">
                  Download the LoA Law of Attraction app
                </h1>
              </motion.div>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-lg text-gray-400 max-w-xl mb-6 leading-relaxed"
              >
                Get LoA on the{" "}
                <strong className="font-semibold text-gray-300">App Store</strong>{" "}
                or{" "}
                <strong className="font-semibold text-gray-300">
                  Google Play
                </strong>{" "}
                and practice{" "}
                <strong className="font-semibold text-gray-300">
                  manifestation
                </strong>
                , affirmations, and streaks in one privacy-first app—no need to
                trade your attention for guilt-based screen tracking.
              </motion.p>

              {/* QR Codes & Download Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="flex flex-row gap-6"
              >
                {/* iOS */}
                <div className="flex flex-col items-center gap-3">
                  <Image
                    src="/loa_ios._qrcode.svg"
                    alt="iOS App QR Code"
                    width={100}
                    height={100}
                    className="hidden sm:block rounded-xl"
                  />
                  <AppStoreDownloadButton />
                </div>

                {/* Android */}
                <div className="flex flex-col items-center gap-3">
                  <Image
                    src="/loa_android_qrcode.svg"
                    alt="Android App QR Code"
                    width={100}
                    height={100}
                    className="hidden sm:block rounded-xl"
                  />
                  <GooglePlayDownloadButton />
                </div>
              </motion.div>
            </div>

            {/* Right - App Preview */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="hidden md:block"
            >
              <Image
                src="/mock/mock6.png"
                alt="LoA Law of Attraction app affirmation screen on a phone"
                width={280}
                height={560}
                className="w-auto h-auto max-w-[280px] rounded-3xl"
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      <section
        className="relative z-10 border-t border-white/[0.06] bg-zinc-950/80 py-16 md:py-20"
        aria-labelledby="download-why-heading"
      >
        <div className="mx-auto max-w-3xl px-6">
          <h2
            id="download-why-heading"
            className="text-2xl font-bold text-white md:text-3xl"
          >
            Why download a Law of Attraction app?
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-gray-400">
            <p>
              Most people do not lack motivation—they lack a calm, repeatable
              place to return to their intentions. A dedicated{" "}
              <strong className="font-semibold text-gray-200">
                Law of Attraction app
              </strong>{" "}
              gives you affirmation screens, vision board moments, and progress
              you can feel—without turning the rest of your phone into a report
              card.
            </p>
            <p>
              LoA is built for{" "}
              <strong className="font-semibold text-gray-200">
                daily manifestation practice
              </strong>
              : write or generate affirmations (AI on paid plans), build streaks,
              and sync when you choose. Start free on{" "}
              <strong className="font-semibold text-gray-200">
                Manifest Starter
              </strong>
              , then upgrade if you want cloud backup and higher AI limits.
            </p>
          </div>
          <ul className="mt-8 space-y-3 text-gray-300">
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
              <span>
                Explore every feature in depth on our{" "}
                <Link
                  href="/features"
                  className="text-purple-400 underline-offset-2 hover:underline"
                >
                  Features
                </Link>{" "}
                page.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
              <span>
                Compare{" "}
                <Link
                  href="/pricing"
                  className="text-purple-400 underline-offset-2 hover:underline"
                >
                  Manifest Creator and Manifest Master
                </Link>{" "}
                for AI and storage limits.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
              <span>
                Browse{" "}
                <Link
                  href="/resources"
                  className="text-purple-400 underline-offset-2 hover:underline"
                >
                  Law of Attraction resources
                </Link>{" "}
                and FAQs in one hub.
              </span>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
