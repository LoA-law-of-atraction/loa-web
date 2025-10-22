"use client";

import "../globals.css";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { RiSecurePaymentFill } from "react-icons/ri";
import { MdOutlineWifiFind } from "react-icons/md";
import { TbClockRecord } from "react-icons/tb";
import OurStory from "@/components/OurStory";
import Legacy from "@/components/Legacy";
import Testimonial from "@/components/Testimonial";
import Faqs from "@/components/Faqs";
import CoreValues from "@/components/CoreValue";
import AppStoreDownloadButton from "@/components/AppStoreDownloadButton";
import GooglePlayDownloadButton from "@/components/GooglePlayDownloadButton";

const values = [
  {
    id: 1,
    title: "Mindful Technology Use",
    desc: "We believe technology should enhance your life, not control it. MindfulUsage creates intentional pauses that help you use your phone with awareness and purpose, not out of habit or impulse.",
    icon: <RiSecurePaymentFill className="w-8 h-8 text-[#505050]" />,
  },
  {
    id: 2,
    title: "Manifestation Through Action",
    desc: "Every affirmation screen is an opportunity to align your actions with your aspirations. By practicing manifestation before app usage, you transform routine interactions into moments of personal growth.",
    icon: <MdOutlineWifiFind className="w-8 h-8 text-[#505050]" />,
  },
  {
    id: 3,
    title: "Privacy-First Approach",
    desc: "Your digital habits and personal affirmations are yours alone. MindfulUsage keeps all data on your device, ensuring your journey toward mindful phone usage remains completely private and secure.",
    icon: <TbClockRecord className="w-8 h-8 text-[#505050]" />,
  },
];export default function About() {
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
              Transforming Phone Habits Through Mindful Awareness
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, scale: 1.25 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="my-4 mb-6 text-white w-[80%] md:w-[60%] md:leading-8 text-center"
            >
              We believe technology should serve your intentions, not hijack them. 
              MindfulUsage helps you create conscious moments between impulse and action, 
              transforming mindless scrolling into opportunities for reflection and growth.
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
            <h2 className="text-h2 lg:text-h3 font-bold text-center text-primary">
              Our Mission: Help People Reflect on Their Lives — Honestly and
              Intentionally.
            </h2>
            <span className="w-16 h-1 mt-3 bg-bg" />
          </div>
          <div className="text-primary text-left w-full max-w-3xl mt-8 space-y-10">
            <div>
              <h3 className="text-xl font-bold">📘 Reflect with Ease</h3>
              <p>
                No blank pages. No pressure. With Eve, your AI companion, you
                can write, chat, or simply tap how you’re feeling — and Ever
                Journal helps you turn moments into meaning.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold">
                🌐 Center Your Life, Not Your Feed
              </h3>
              <p>
                Instead of curating for others, you collect memories for
                yourself. LoA helps you organize the thoughts, images, and
                emotions that actually matter — and keeps them safe in a private
                timeline you control.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold">
                📖 Let Your Story Unfold Naturally
              </h3>
              <p>
                You don’t need to write a memoir all at once. Just journal — and
                LoA gently shapes your life into chapters over time. Because
                your story isn’t a highlight reel.
              </p>
              <p className="mt-2 font-semibold">
                It’s everything you’ve lived through — and it deserves to be
                remembered
              </p>
            </div>
          </div>
          <Image
            src="/mockups/mockupJournal.png"
            alt="LoA Mockup"
            className="w-[60%] hidden md:block p-28"
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
      <CoreValues />
      <Legacy />
      <Testimonial />
      <div className="relative top-[500px] mb-[500px]">
        <Faqs />
      </div>
    </>
  );
}
