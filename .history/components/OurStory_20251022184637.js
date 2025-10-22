"use client";
import { motion } from "framer-motion";
import Image from "next/image";

const story = [
  "Most platforms are built to showcase your best moments to others.",
  "We built LoA to help you remember all of them — for yourself.",
  "In a world where everything is shared, what’s often missing is a space to reflect on what truly mattered.",
  "We saw how people’s lives were scattered across photos, voice notes, half-written journals, and fleeting posts — but nowhere brought it all together.",
  "So we built a new kind of space. Private by default. Emotionally intelligent.",
  "A quiet home for your thoughts, memories, and daily reflections to naturally become your story.",
  "With Eve, your AI companion, journaling becomes less about writing the perfect entry — and more about making sense of your life, one moment at a time.",
  "LoA is where your life makes sense — not to others, but to you.",
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
          {story.map((paragraph, index) => {
            const isIntro = index === 0;
            const isQuote = paragraph.startsWith("LoA is");

            return (
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 100 }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.5 },
                }}
                viewport={{ once: true }}
                className={`mt-1 ${isIntro ? "font-semibold text-lg" : ""} ${
                  isQuote
                    ? "italic font-bold text-xl mt-6 text-secondary"
                    : "text-base text-secondary/90"
                }`}
              >
                {paragraph}
              </motion.p>
            );
          })}
        </div>
      </article>
    </motion.section>
  );
};

export default OurStory;
