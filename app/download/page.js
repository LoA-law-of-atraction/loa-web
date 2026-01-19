"use client";

import "../globals.css";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import AppStoreDownloadButton from "@/components/AppStoreDownloadButton";
import GooglePlayDownloadButton from "@/components/GooglePlayDownloadButton";

export default function Download() {
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
                  Download LoA
                </h1>
              </motion.div>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-lg text-gray-400 max-w-md mb-10"
              >
                Start your manifestation journey today. Available on iOS and
                Android.
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
                alt="LoA App"
                width={280}
                height={560}
                className="w-auto h-auto max-w-[280px] rounded-3xl"
              />
            </motion.div>
          </div>
        </div>
      </motion.section>
    </>
  );
}
