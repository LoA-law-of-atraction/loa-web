"use client";
import { motion } from "framer-motion";
import Image from "next/image";

const story = [
  "LoA was born from a simple yet profound realization: we spend our lives collecting experiences, but rarely do we pause to reflect on their meaning.",
  "We saw people struggling to write their life stories, overwhelmed by where to start. We knew there had to be a way to make the process effortless, insightful, and deeply personal.",
  "That’s why we created Eve, your AI biographer. More than just an AI, Eve acts as a thoughtful guide, helping you uncover memories, structure your journey, and craft a biography that truly reflects who you are.",
  "Whether you're journaling to gain perspective, pass down a legacy, or simply document your experiences, LoA is here to make your story come to life, one chapter at a time.",
  "This isn’t just journaling. It’s storytelling with purpose.",
];

const OurStory = () => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.8 } }}
      className="w-full text-secondary bg-primary"
    >
      <article className="container mx-auto py-14 p-4 px-5 md:px-[5%] 2xl:px-0 max-w-[1200px] lg:grid lg:grid-cols-2 items-center justify-center gap-4">
        <div className="flex flex-col items-center lg:items-start justify-center">
          <h2 className="text-h2 lg:text-h3 font-bold text-center lg:text-left max-w-[80%]">
            How We Built LoA
          </h2>
          <span className="w-16 h-1 mt-3 bg-secondary" />
          <Image
            src="/mockups/story.webp"
            alt="LoA Mockup"
            className="max-w-[50%]"
            width={500}
            height={400}
          />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 text-justify self-start">
          {story.map((paragraph, index) => (
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
              viewport={{ once: true }}
              className="mt-2"
            >
              {paragraph}
            </motion.p>
          ))}
        </div>
      </article>
    </motion.section>
  );
};

export default OurStory;
