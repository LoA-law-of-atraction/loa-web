"use client";

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ReactTyped } from 'react-typed';

const TypewriterHeader = ({ text }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <article className="relative flex items-center justify-center w-full md:mt-14">
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.5 } }}
        className="absolute top-0 w-fit text-h1 h-auto py-4 flex bg-gradient-to-r items-center from-[#505050] via-white to-[#f2f2f2] bg-clip-text text-5xl leading-[60px] lg:leading-[100px] max-w-[80%] lg:max-w-[90%] mx-auto font-extrabold text-transparent text-center select-auto"
      >
        <ReactTyped
          strings={[
            "Rediscover Your Life’s Purpose",
            "Create Your Legacy & Share It",
            "Reconnect with the True Self",
            `${text}`
          ]}
          typeSpeed={80}
          backSpeed={50}
          backDelay={500}
        />
      </motion.h1>
    </article>
  );
};

export default TypewriterHeader;