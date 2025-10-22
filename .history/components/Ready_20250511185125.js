"use client";
import { motion } from "framer-motion";
import Button from "./Button";

const ReadyToStart = () => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.8 } }}
      className="w-full bg-primary text-secondary"
    >
      <article className="container mx-auto pb-14 md:pb-32 p-4 px-5 md:px-[5%] 2xl:px-0 max-w-[1200px] flex flex-col md:flex-row items-start justify-between gap-12">
        <div className="flex flex-col gap-8 items-start justify-center">
          <h2 className="text-h3 lg:text-h4 font-bold text-left lg:max-w-none max-w-[80%] leading-relaxed">
            Ready to Start Your Story?
          </h2>
          <p className="text-left max-w-[80%] leading-8">
            Start your journey today—your legacy begins with LoA!
          </p>
        </div>
        <div className="self-start md:self-end">
          <App
        </div>
      </article>
    </motion.section>
  );
};

export default ReadyToStart;
