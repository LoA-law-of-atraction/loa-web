"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Button from "./Button";
import GooglePlayDownloadButton from "./GooglePlayDownloadButton";
import AppStoreDownloadButton from "./AppStoreDownloadButton";

const Start = () => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.8 } }}
      className="w-full bg-primary text-secondary"
    >
      <article className="container mx-auto py-14 p-4 px-5 md:px-[5%] 2xl:px-0 max-w-[1200px] flex flex-col md:flex-row items-center justify-center gap-12">
        <div className="flex flex-col gap-12 items-center md:items-start justify-center">
          <h2 className="text-h3 lg:text-h4 font-bold text-center md:text-left max-w-[80%] leading-relaxed">
            Start Your Journey Today. <br />
            Your Legacy Begins with LoA
          </h2>
          <div className="mt-8 flex space-x-4">
            <div className="flex flex-col md:flex-row gap-4">
              <GooglePlayDownloadButton />
              <AppStoreDownloadButton />
            </div>
          </div>
        </div>
        <Image
          src="/mockups/mockupJournal.png"
          alt="LoA Mockup"
          className="max-w-[50%] md:max-w-[40%]"
          width={500}
          height={500}
        />
      </article>
    </motion.section>
  );
};

export default Start;
