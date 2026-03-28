"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Button from "@/components/Button";

const UpdatesClient = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, x: "-100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ delay: 0.5 }}
      className="min-h-screen flex flex-col justify-center"
    >
      <h2 className="text-h2 bg-bg pt-36 pb-20 lg:text-h3 text-white w-full text-center mb-14">
        What&apos;s New
      </h2>
      <div className="mx-auto px-5 md:px-[5%] 2xl:px-0 pb-20 container max-w-[1200px]">
        <article className="flex items-center justify-center flex-col gap-12">
          <h3 className="font-extrabold text-h3">Product updates & news</h3>
          <p className="text-center text-white/70 max-w-md">
            Get notified when we ship new features and improvements to LoA.
          </p>
          <Button text="Get updates" />
          <Image
            src="/mockups/mockupJournal.png"
            alt="LoA Law of Attraction app journal and reflection screen preview"
            className="w-[40%]"
            width={300}
            height={300}
          />
        </article>
      </div>
    </motion.section>
  );
};

export default UpdatesClient;
