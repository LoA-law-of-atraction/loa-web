"use client";
import { motion } from "framer-motion";

const values = [
  {
    id: "01",
    title: "Create Your Legacy & Share it",
    desc: "Your experiences, wisdom, and memories are valuable. LoA helps you preserve your story for future generations—whether for your children, friends, or loved ones.",
    img: "/icons/create.svg",
  },
  {
    id: "02",
    title: "Rediscover Your Life’s Purpose",
    desc: "Life’s meaning often becomes clearer when we reflect on where we’ve been. Through guided journaling and AI-assisted storytelling, LoA helps you uncover patterns, lessons, and the deeper purpose behind your journey.",
    img: "/icons/discover.svg",
  },
  {
    id: "03",
    title: "Effortless Storytelling with AI",
    desc: "Journaling shouldn’t feel like a chore. That’s why Eve, your AI biographer, guides you with thoughtful prompts, organizes your story into chapters, and helps you build a beautifully structured biography—without the overwhelm.",
    img: "/icons/ai.svg",
  },
  {
    id: "04",
    title: "Your Story, Your Control",
    desc: "We believe in privacy and ownership. Every journal entry belongs to you, and you choose what to include in your biography. Whether you keep it private, share it with family, or even publish it, the decision is yours.",
    img: "/icons/control.svg",
  },
  {
    id: "05",
    title: "A Community of Storytellers",
    desc: "AEver Journal is more than an app—it’s a movement that encourages self-reflection, storytelling, and legacy-building. We envision a world where everyone has the chance to reflect on their journey, find meaning, and share their story.",
    img: "/icons/community.svg",
  },
];

const CoreValues = () => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.8 } }}
      className="w-full bg-secondary text-primary"
    >
      <article className="container mx-auto py-14 p-4 px-5 md:px-[5%] 2xl:px-0 max-w-[1200px] gap-4flex flex-col items-center justify-center gap-4">
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-h2 lg:text-h3 font-bold text-center max-w-[80%]">
            Our Core values
          </h2>
          <span className="w-16 h-1 mt-3 bg-bg" />

          <article className="flex flex-col items-center justify-center mt-16">
            <p className="mt-5 text-justify md:max-w-[60%] md:text-center">
              At LoA, we believe that every life is a story worth telling. Our
              values reflect our commitment to helping youdocument, rediscover,
              and share your journey in a meaningful way.
            </p>
          </article>
        </div>
        <div className="mt-16 lg:mt-26 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
          {values.map((paragraph) => (
            <motion.article
              key={paragraph.id}
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              whileInView={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.5 },
              }}
              viewport={{ once: true }}
              className="mt-2 border relative drop-shadow-xl bg-bg text-white lg:drop-shadow-none lg:items-start items-center flex flex-col gap-4 p-4 md:p-6 py-10 rounded-lg"
            >
              <h3 className="text-h3 absolute lg:static top-[-40px] border-2 lg:border-none text-[#505050] lg:text-white lg:bg-black left-[40%] bg-white rounded-full p-4 w-[70px] h-[70px] flex items-center justify-center font-bold">
                {paragraph.id}
              </h3>
              <h4 className="text-[18px] font-bold lg:mt-0 lg:text-left mt-5 text-center">
                {paragraph.title}
              </h4>
              <p className="mt-2 text-center lg:text-left">{paragraph.desc}</p>
            </motion.article>
          ))}
        </div>
      </article>
    </motion.section>
  );
};

export default CoreValues;
