"use client";
import { motion } from "framer-motion";
import Image from "next/image";

const features = [
  {
    id: "01",
    title: "AI-Powered Journaling Companion",
    img: "/features/powered.webp",
    desc: [
      "Write or speak freely — Eve helps you reflect with thoughtful prompts and emotional intelligence.",
      "Every entry becomes part of a structured timeline powered by your own thoughts and memories.",
      "Watch your life story unfold — chapter by chapter, moment by moment.",
    ],
  },
  {
    id: "02",
    title: "Connected Memory Hub",
    img: "/features/organize.webp",
    desc: [
      "Connect your digital life — journal from your Spotify songs, Instagram posts, Google Photos, and more.",
      "Automatically link your reflections to real-life memories, places, and media.",
      "Your scattered digital footprint becomes one cohesive story.",
    ],
  },
  {
    id: "03",
    title: "Your AI-Built Biography",
    img: "/features/media.webp",
    desc: [
      "Your journal entries — not algorithms — are the foundation of your biography.",
      "AI organizes your reflections into themed chapters like 'Becoming a Parent' or 'Leaving Home'.",
      "Your biography grows with you, shaped entirely by what you choose to write.",
    ],
  },
  {
    id: "04",
    title: "Multimedia-Aware Journaling",
    img: "/features/realtime.webp",
    desc: [
      "Attach photos, songs, or locations to any journal — and bring your memories to life.",
      "See your reflections visually organized as a timeline or printable storybook.",
      "Relive moments like 'Japan Trip 2025' or 'Graduation Week' — automatically grouped by event and emotion.",
    ],
  },
  {
    id: "05",
    title: "AI-Driven Insights from Your Digital Life",
    img: "/features/custom.webp",
    desc: [
      "Eve helps surface recurring patterns, emotional shifts, and life themes from your entries and media.",
      "Journal smarter — reflect on what matters, when it matters.",
    ],
  },
  {
    id: "06",
    title: "Preserve or Share Your Story",
    img: "/features/integrate.png",
    desc: [
      "Keep your biography completely private — or share chapters with people you love.",
      "Export your story as a printed book, digital time capsule, or private timeline.",
      "Turn your life into something lasting — not just remembered, but beautifully documented.",
    ],
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
              Journaling isn’t about trying to remember everything — it’s about
              reflecting meaningfully. LoA helps you capture your thoughts,
              connect your digital life, and build your story effortlessly.
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
