"use client";
import { motion } from "framer-motion";

const values = [
  {
    id: "01",
    title: "Reflection Should Feel Natural",
    desc: "You don’t need to perform or overthink — you just need to show up. Whether it begins with a feeling, a photo, or a quiet moment, LoA meets you where you are and helps you reflect with ease. 💡 *Your story starts with your truth — not perfection.*",
    img: "/icons/create.svg",
  },
  {
    id: "02",
    title: "Your Private Life Matters Most",
    desc: "You shouldn’t need an audience to validate your memories. We help you gather the moments that shaped you — even the ones no one else saw — and organize them into something personally meaningful. 💡 *You don’t share for likes. You reflect for clarity.*",
    img: "/icons/discover.svg",
  },
  {
    id: "03",
    title: "Your Story Builds Over Time",
    desc: "You don’t need to plan your legacy. You just need to write your next entry. With every journal, LoA begins to assemble your biography — quietly, beautifully, and in the background. 💡 *Let your life tell the story, one reflection at a time.*",
    img: "/icons/ai.svg",
  },
  {
    id: "04",
    title: "Privacy Is the Default. Sharing Is a Choice.",
    desc: "Your entries are fully yours — secure, private, and never shared unless you say so. And when you’re ready, you can choose to share a chapter with someone you trust — or save it for your future self. *Your story isn’t content. It’s a gift — and you decide who receives it.*",
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
              At <strong>LoA</strong>, we believe your life isn’t meant to be
              curated for others — it’s meant to be understood by{" "}
              <strong>you</strong>. Our values reflect our commitment to helping
              you{" "}
              <strong>
                slow down, reflect deeply, and preserve what truly matters
              </strong>
              , one journal at a time.
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
