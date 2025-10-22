'use client'
import { motion } from "framer-motion";
import Image from "next/image";

const story = [
'Most platforms are built for sharing.',
'We built LoA for *remembering* — privately, emotionally, and intelligently.',
'We saw people journaling inconsistently, their photos scattered, their Spotify wrapped forgotten, and their memories buried under feeds.',
'LoA was created to bring it all together — your thoughts, music, photos, posts, and emotions — into one place where your life actually makes sense.',
  'With Eve, your AI companion, journaling becomes effortless. You talk, reflect, or swipe — and your story begins to take shape, chapter by chapter.'
  
  Whether you're writing to understand yourself, process your day, or capture your legacy, LoA is here to make that journey personal and beautifully yours.
  
  **This isn’t just journaling. It’s remembering your life — on your terms.**
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
          <h2 className="text-h2 lg:text-h3 font-bold text-center lg:text-left max-w-[80%]">How We Built LoA</h2>
          <span className="w-16 h-1 mt-3 bg-secondary" />
          <Image src="/mockups/story.webp" alt="LoA Mockup" className="max-w-[50%]" width={500} height={400} />
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
  )
}

export default OurStory;
