"use client";

import "../globals.css";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { RiSecurePaymentFill } from "react-icons/ri";
import { MdOutlineWifiFind } from "react-icons/md";
import { TbClockRecord } from "react-icons/tb";
// import { useRouter } from "next/navigation";
import TypewriterHeader from "@/components/Heading";
import Button from "@/components/Button";
import OurStory from "@/components/OurStory";
import Benefits from "@/components/Benefits";
import Legacy from "@/components/Legacy";
import Testimonial from "@/components/Testimonial";
import Start from "@/components/Start";
import Faqs from "@/components/Faqs";
import Values from "@/components/CoreValue";
import AppStoreDownloadButton from "@/components/AppStoreDownloadButton";
import GooglePlayDownloadButton from "@/components/GooglePlayDownloadButton";

const values = [
  {
    id: 1,
    title: "Preserve Your Legacy",
    desc: "Your life is a collection of moments, lessons, and experiences that deserve to be remembered. LoA transforms scattered memories into a beautifully structured biography, ensuring your story lives on for future generations.",
    icon: <RiSecurePaymentFill className="w-8 h-8 text-[#505050]" />,
  },
  {
    id: 2,
    title: "Rediscover Your Purpose",
    desc: "Reflect on your journey, uncover hidden patterns, and gain new insights. With AI-guided prompts and storytelling, LoA helps you explore your past to better understand your present and future.",
    icon: <MdOutlineWifiFind className="w-8 h-8 text-[#505050]" />,
  },
  {
    id: 3,
    title: "Beyond Journaling, A Biography",
    desc: "More than just a journal—LoA turns your reflections into a meaningful, evolving biography. Whether you keep it private, share it, or publish it, your story is captured, told, and remembered.",
    icon: <TbClockRecord className="w-8 h-8 text-[#505050]" />,
  },
];

export default function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0, transition: { duration: 0.8 } }}
        viewport={{ once: true }}
        className="pt-24 flex bg-primary min-h-[100vh] flex-col items-center justify-items-center arc overflow-x-hidden"
      >
        <section className="w-full px-5 md:px-[5%] 2xl:px-0 max-w-5xl mx-auto flex flex-col items-center justify-center gap-8">
          <article className="relative w-full py-4 mx-auto flex flex-col items-center justify-center">
            <motion.h1
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-white text-h2 md:max-w-[70%] lg:mt-12 font-bold text-center"
            >
              Helping You Capture and Preserve Your Legacy
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, scale: 1.25 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="my-4 mb-6 text-white w-[80%] md:w-[60%] md:leading-8 text-center"
            >
              We believe your thoughts, photos, songs, and digital moments all
              tell a deeper story. LoA was created to help you capture, connect,
              and reflect on what truly matters — so you can build a life story
              only you could live.
            </motion.p>

            <div className="mt-8 flex space-x-4">
              <div className="flex flex-col md:flex-row gap-4">
                <GooglePlayDownloadButton />
                <AppStoreDownloadButton />
              </div>
            </div>
          </article>
          <motion.article
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.5 } }}
            className="flex items-center w-full justify-center"
          >
            <Image
              src="/mockups/heroImgDesk.png"
              alt="LoA Mockup"
              className="max-w-[90%] md:hidden p-10"
              width={400}
              height={200}
            />
            <Image
              src="/mockups/heroImgDesk.png"
              alt="LoA Mockup"
              className="hidden md:block p-32"
              width={500}
              height={200}
            />
          </motion.article>
        </section>
      </motion.article>

      <motion.article className="mt-[-100px] bg-secondary text-primary overflow-hidden">
        <article className="container mx-auto py-14 pb-32 p-4 px-5 md:px-[5%] 2xl:px-0 max-w-[1200px] flex flex-col items-center justify-center gap-12">
          <div className="flex flex-col items-center md:items-start md:self-start">
            <h2 className="text-h2 lg:text-h3 font-bold text-center">
              Our Mission: Help People Remember Their Lives — Meaningfully.
            </h2>
            <span className="w-16 h-1 mt-3 bg-bg" />
          </div>
          <div className="text-primary text-left w-full max-w-3xl mt-8 space-y-10">
            <div>
              <h3 className="text-xl font-bold">📘 Reflect with Ease</h3>
              <p>
                Journaling shouldn’t feel like a task. With Eve, your AI
                companion, you can write, talk, or simply tap how you feel — and
                LoA helps you make sense of it all.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold">
                🌐 Connect Your Digital Life
              </h3>
              <p>
                From the songs you play to the photos you take and the posts you
                share, LoA brings together your digital moments to help you
                reflect, organize, and preserve your story.
              </p>
              <p className="mt-2 italic">
                Or: LoA connects your music, photos, and social activity —
                turning scattered digital traces into a structured, personal
                timeline of your life.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold">
                📖 Let Your Story Emerge Naturally
              </h3>
              <p>
                Your biography isn’t something you sit down and write. It’s
                something you live — and LoA builds it with you, one entry at a
                time.
              </p>
              <p className="mt-2 font-semibold">
                Because your life isn’t just a timeline. It’s a story — and it
                deserves to be remembered.
              </p>
            </div>
          </div>
          <Image
            src="/mockups/mockupJournal.png"
            alt="LoA Mockup"
            className="w-[30%] hidden md:block p-28"
            width={200}
            height={200}
          />
          <article className="grid grid-cols-1 items-center justify-center lg:grid-cols-3 gap-4 mt-10 lg:pb-0 px-6 pb-10 lg:rounded-2xl text-black lg:shadow-xl lg:w-full">
            {values.map((hook) => (
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                viewport={{ once: true }}
                key={hook.id}
                className="rounded-3xl border min-h-[290px] lg:rounded-none lg:border-none flex flex-col items-center gap-5 w-full max-w-[480px] mx-auto lg:max-w-none p-4 pb-8"
              >
                <div className="rounded-full border w-14 h-14 flex justify-center items-center py-2">
                  {hook.icon}
                </div>
                <h4 className="font-bold text-center">{hook.title}</h4>
                <p className="text-center lg:text-base text-black lg:max-w-80">
                  {hook.desc}
                </p>
              </motion.div>
            ))}
          </article>
        </article>
      </motion.article>
      <OurStory />
      <Values />
      <Legacy />
      <Testimonial />
      <div className="relative top-[500px] mb-[500px]">
        <Faqs />
      </div>
    </>
  );
}
