"use client";
import { motion } from "framer-motion";
import Image from "next/image";

export export const features = [
  {
    id: "01",
    title: "Effortless Journaling, Guided by AI",
    img: "/features/powered.webp",
    desc: "No pressure. No blank pages. Just thoughtful prompts, mood detection, and emotionally intelligent feedback",
  },
  {
    id: "02",
    title: "Your Life, All in One Place",
    img: "/features/organize.webp",
    desc: "Collect your thoughts, photos, emotions, and moments in a private timeline. LoA becomes the center of your story",
  },
  {
    id: "03",
    title: "Your Biography, Built Over Time",
    img: "/features/media.webp",
    desc: "You don’t have to write a book — just write a little at a time. Eve organizes your reflections into chapters like “Healing,” “Becoming a Parent,” or “Finding My Voice.”",
  },
  {
    id: "04",
    title: "Reflect with Depth, Not Just Text",
    img: "/features/realtime.webp",
    desc: "Add photos, locations, or moods to your entries. Your memories are more than words — they’re visual, emotional, and deeply felt.",
  },
  {
    id: "05",
    title: "See the Patterns That Shape You",
    img: "/features/custom.webp",
    desc: "Track emotional themes, personal growth, and recurring reflections. Eve connects the dots across time — helping you understand your journey.",
  },
  {
    id: "06",
    title: "Share Only When It Feels Right",
    img: "/features/integrate.png",
    desc: "Everything stays private unless you choose otherwise. Share chapters with someone you love, save entries for your future self, or export your story as a personal legacy.",
  },
];

const Feature = () => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.8 } }}
      className="w-full bg-secondary text-primary"
    >
      <article className="container mx-auto py-14 p-4 px-5 md:px-[5%] 2xl:px-0 max-w-[1200px] gap-4flex flex-col items-center justify-center gap-4">
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-h2 lg:text-h3 font-bold text-center max-w-[80%]">
            Features & Benefits
          </h2>
          <span className="w-16 h-1 mt-3 bg-bg" />

          <article className="flex flex-col items-center justify-center mt-16">
            <p className="mt-5 text-justify md:max-w-[60%] md:text-center">
              LoA isn’t just about capturing memories — it’s about
              making sense of them. With AI guidance, emotional awareness, and a
              beautifully organized timeline, your life story unfolds as you
              live it.
            </p>
          </article>
        </div>
        <div className="mt-16 lg:mt-26 max-w-[1000px] mx-auto grid grid-cols-1 gap-5">
          {features.map((paragraph, index) => (
            <motion.article
              key={paragraph.id}
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
              viewport={{ once: true }}
              className={`mt-2 items-center flex flex-col mx-auto md:justify-between gap-4 p-4 py-10 border-b-2 last:border-b-0 border-silver ${
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              }`}
            >
              <Image
                src={paragraph.img}
                alt={paragraph.title}
                className="w-[50%] md:w-[20%]"
                width={500}
                height={200}
              />
              <div className="flex flex-col items-start">
                <h4 className="text-h5 font-bold mt-5 lg:mt0 lg:text-left text-center">
                  {paragraph.title}
                </h4>
                <ul className="mt-2 px-4 text-center lg:text-left">
                  {paragraph.desc.map((item, index) => (
                    <li key={index} className="text-left list-disc">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.article>
          ))}
        </div>
      </article>
    </motion.section>
  );
};

export default Feature;
