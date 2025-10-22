"use client";
import { motion } from "framer-motion";

const values = [
  {
    id: "01",
    title: "Reflection Should Be Effortless",
    desc: "You don’t need the perfect words to start journaling — you just need a moment. Whether it begins with a thought, a song, or a photo, LoA helps you reflect in ways that feel natural and intuitive.",
    img: "/icons/create.svg",
  },
  {
    id: "02",
    title: "Your Digital Life Deserves to Be Remembered",
    desc: "The songs you loop, the photos you take, the posts you share — they’re all part of who you are. LoA brings them together, helping you turn scattered digital moments into lasting personal meaning.\n\n💡 You already live your story. We help you see it clearly.",
    img: "/icons/discover.svg",
  },
  {
    id: "03",
    title: "Your Story Builds Itself, One Entry at a Time",
    desc: "You don’t need to write your whole life all at once. Just journal. Eve, your AI companion, organizes your reflections into chapters and themes — so your biography emerges naturally as you live and write.\n\n💡 You write your truth. We shape it into your story.",
    img: "/icons/ai.svg",
  },
  {
    id: "04",
    title: "Private by Default — Shared When It Matters",
    desc: "Your journal is yours — fully private, secure, and never accessed without your consent. But when you’re ready, you can share your life story with loved ones through a printed book, digital timeline, or time capsule.\n\n💡 Your life isn’t content. It’s a legacy — and it’s yours to choose.",
    img: "/icons/control.svg",
  },
  {
    id: "05",
    title: "A Culture of Reflection, Not Just Recording",
    desc: "We’re not building another feed. We’re building a home for memory. LoA invites people to slow down, reflect more often, and grow through self-awareness — not performance.\n\n💡 Because your life deserves more than likes — it deserves meaning.",
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
            LoA – Our Core Values
          </h2>
          <span className="w-16 h-1 mt-3 bg-bg" />

          <article className="flex flex-col items-center justify-center mt-16">
            <p className="mt-5 text-justify md:max-w-[60%] md:text-center">
              At LoA, we believe your life isn’t just a series of moments — it’s
              a story that deserves to be remembered. Our values reflect our
              commitment to helping you reflect, remember, and reconnect with
              who you are**, one journal at a time.
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
