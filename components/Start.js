"use client";
import { motion } from "framer-motion";

import GooglePlayDownloadButton from "./GooglePlayDownloadButton";
import AppStoreDownloadButton from "./AppStoreDownloadButton";

const Start = () => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.8 } }}
      className="relative z-10 w-full bg-gradient-to-br from-[#0d0a1a] via-[#120825] to-[#0a0a14] text-white overflow-hidden"
    >
      {/* Decorative top glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
      {/* Ambient glow blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <article className="relative container mx-auto py-14 p-4 px-5 md:px-[5%] 2xl:px-0 max-w-[1200px] flex flex-col md:flex-row items-center justify-center gap-12">
        <div className="flex flex-col gap-12 items-center md:items-start justify-center">
          <h2 className="font-tiempos text-h3 lg:text-h4 font-bold text-center md:text-left max-w-[80%] leading-relaxed text-white">
            Transform Your Digital Life Today. <br />
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Your Conscious Journey Begins with LoA</span>
          </h2>
          <div className="mt-8 flex space-x-4">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center gap-3">
                <img
                  src="/loa_android_qrcode.svg"
                  alt="Android QR Code"
                  className="w-24 h-24 p-2 bg-white rounded-2xl hidden sm:block"
                />
                <GooglePlayDownloadButton />
              </div>
              <div className="flex flex-col items-center gap-3">
                <img
                  src="/loa_ios._qrcode.svg"
                  alt="iOS QR Code"
                  className="w-24 h-24 p-2 bg-white rounded-2xl hidden sm:block"
                />
                <AppStoreDownloadButton />
              </div>
            </div>
          </div>
        </div>
        <img
          src="/mock/mock5.png"
          alt="Manifest Your Dreams"
          className="w-auto h-auto max-w-[280px] md:max-w-[320px]"
        />
      </article>
    </motion.section>
  );
};

export default Start;
