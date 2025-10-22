"use client";
import { motion } from "framer-motion";

const values = [
  {
    id: "01",
    title: "Reflection Should Feel Natural",
    desc: `You don’t need to perform or overthink — you just need to show up. Whether it begins with a feeling, a photo, or a quiet moment, LoA meets you where you are and helps you reflect with ease.<br /><span class="italic text-black/70">💡 Your story starts with your truth — not perfection.</span>`,
  },
  {
    id: "02",
    title: "Your Private Life Matters Most",
    desc: `You shouldn’t need an audience to validate your memories. We help you gather the moments that shaped you — even the ones no one else saw — and organize them into something personally meaningful.<br /><span class="italic text-black/70">💡 You don’t share for likes. You reflect for clarity.</span>`,
  },
  {
    id: "03",
    title: "Your Story Builds Over Time",
    desc: `You don’t need to plan your legacy. You just need to write your next entry. With every journal, LoA begins to assemble your biography — quietly, beautifully, and in the background.<br /><span class="italic text-black/70">💡 Let your life tell the story, one reflection at a time.</span>`,
  },
  {
    id: "04",
    title: "Privacy Is the Default. Sharing Is a Choice.",
    desc: `Your entries are fully yours — secure, private, and never shared unless you say so. And when you’re ready, you can choose to share a chapter with someone you trust — or save it for your future self.<br /><span class="italic text-black/70">💡 Your story isn’t content. It’s a gift — and you decide who receives it.</span>`,
  },
  {
    id: "05",
    title: "A Culture of Reflection, Not Just Recording",
    desc: `We’re not building another feed. We’re building a home for memory. LoA invites people to slow down, reflect more often, and grow through self-awareness — not performance.<br /><span class="italic text-black/70">💡 Because your life deserves more than likes — it deserves meaning.</span>`,
  },
];

const CoreValues = () => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.8 } }}
      className="w-full bg-secondary text-primary"
    >
      <article className="container mx-auto py-14 p-4 px-5 md:px-[5%] 2xl:px-0 max-w-[1200px] flex flex-col items-center justify-center gap-10">
        <div className="flex flex-col items-center justify-center text-center">
          <h2 className="text-h2 lg:text-h3 font-bold max-w-[80%]">
            LoA – Our Core Values
          </h2>
          <span className="w-16 h-1 mt-3 bg-bg" />
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
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {values.map((item) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              whileInView={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.5 },
              }}
              viewport={{ once: true }}
              className="relative flex flex-col gap-4 border border-primary/20 bg-white text-primary rounded-xl p-6 md:p-8 shadow-lg"
            >
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-[50px] h-[50px] rounded-full border-2 bg-white text-[#505050] flex items-center justify-center font-bold text-md shadow-md">
                {item.id}
              </div>
              <h4 className="mt-6 text-lg font-semibold text-center lg:text-left">
                {item.title}
              </h4>
              <p
                className="text-base text-center lg:text-left text-black/90"
                dangerouslySetInnerHTML={{ __html: item.desc }}
              />
            </motion.article>
          ))}
        </div>
      </article>
    </motion.section>
  );
};

export default CoreValues;
