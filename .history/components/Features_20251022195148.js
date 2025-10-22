"use client";
import { motion } from "framer-motion";
import Image from "next/image";

const features = [
  {
    id: "01",
    title: "Conscious App Interruption",
    desc: [
      "Transform mindless scrolling into mindful moments with gentle app interruptions.",
      "Receive personalized affirmations and manifestation reminders aligned with your goals.",
      "Create sacred pauses that help you choose consciousness over distraction.",
    ],
  },
  {
    id: "02",
    title: "Personalized Affirmation Screens",
    desc: [
      "Access customized Law of Attraction affirmations based on your unique energy patterns.",
      "Each affirmation is designed to elevate your vibration and attract abundance.",
      "Practice manifestation principles seamlessly integrated into your daily digital routine.",
    ],
  },
  {
    id: "03",
    title: "Your Biography, Built Over Time",
    img: "/features/media.webp",
    desc: [
      "You don’t need to write a book — you just need to keep showing up.",
      "Eve helps organize your reflections into life chapters like 'Healing' or 'Becoming a Parent.'",
      "Your biography builds naturally, one honest entry at a time.",
    ],
  },
  {
    id: "04",
    title: "Reflect with Depth, Not Just Text",
    img: "/features/realtime.webp",
    desc: [
      "Enhance your journals with photos, locations, or moods that shaped the moment.",
      "Visuals and context make your story richer, more emotional, and easier to revisit.",
      "It’s not just what you wrote — it’s how you lived it.",
    ],
  },
  {
    id: "05",
    title: "See the Patterns That Shape You",
    img: "/features/custom.webp",
    desc: [
      "Eve surfaces recurring themes, emotional shifts, and life patterns across your timeline.",
      "Reflect more intentionally — on what matters, when it matters.",
      "Discover who you're becoming through the story you're already living.",
    ],
  },
  {
    id: "06",
    title: "Share Only When It Feels Right",
    img: "/features/integrate.png",
    desc: [
      "Your journal is private by default — and always under your control.",
      "Share a chapter with someone you love, or schedule entries for your future self.",
      "Turn your reflections into a printed biography, digital time capsule, or quiet legacy.",
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
              LoA isn’t just about capturing memories — it’s about making sense
              of them. With AI guidance, emotional awareness, and a beautifully
              organized timeline, your life story unfolds as you live it.
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
