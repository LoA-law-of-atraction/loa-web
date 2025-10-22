"use client";
import { motion } from "framer-motion";
import Image from "next/image";

const features = [
  {
    id: "01",
    title: "AI-Powered Journaling Companion",
    img: "/features/powered.webp",
    desc: [
      "Convert journal entries into a chronological, well-structured narrative.",
      "Highlight key themes like achievements, family milestones, and life lessons.",
      " Watch your biography evolve seamlessly as you write.",
    ],
  },
  {
    id: "02",
    title: "Connected Memory Hub",
    img: "/features/organize.webp",
    desc: [
      'Dynamic Chapter Creation – Journals are grouped into meaningful phases of your life, such as "College Years," "Parenthood," or "Adventures Abroad."',
      "AI-Powered Structuring – Eve suggests chapter titles and organizes content based on recurring themes and major life events.",
      "Customization – Rename, merge, and reorganize chapters to tell your story, your way.",
    ],
  },
  {
    id: "03",
    title: "Your AI-Built Biography",
    img: "/features/media.webp",
    desc: [
      "Attach photos, voice recordings, and videos to enrich your story.",
      "AI-assisted summaries of uploaded videos/images for deeper storytelling.",
      "Create a truly immersive biography that captures the essence of your life.",
    ],
  },
  {
    id: "04",
    title: "Real-Time Interactive Biography Preview",
    img: "/features/realtime.webp",
    desc: [
      "Get a glimpse of your biography as you write, with real-time updates.",
      "Preview your story in different formats, such as a timeline or a traditional book.",
      "Edit, add, or remove content directly from the preview screen.",
      'AI-generated event-based summaries (like Spotify Wrapped, but for your life)—e.g., "Japan Trip 2025" or "School Graduation".',
    ],
  },
  {
    id: "07",
    title: "Full Customization & Personalization",
    img: "/features/custom.webp",
    desc: [
      "Adjust the tone and writing style (formal, casual, poetic).",
      "Select specific entries or periods to include in your biography.",
    ],
  },
  {
    id: "05",
    title: "AI-Assisted Journaling & Social Integration",
    img: "/features/integrate.png",
    desc: [
      "Real-Time AI Prompts – As you write, Eve suggests prompts to guide deeper self-reflection.",
      "Auto-generate journals & biography content from your social media posts (Instagram, Facebook, X).",
      "Add YouTube Music or Spotify songs to journals and assign a main theme song to each biography chapter.",
    ],
  },
  {
    id: "06",
    title: "Export, Share & Monetize Your Story",
    img: "/features/export.webp",
    desc: [
      "Export your biography as a PDF or hardcover book.",
      "Choose your audience – share publicly, privately, or with selected family/friends.",
      "Sell your biography to the world—monetize your life story!",
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
