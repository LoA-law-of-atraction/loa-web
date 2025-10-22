"use client";

import "./globals.css";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import TypewriterHeader from "@/components/Heading";
import Button from "@/components/Button";
import OurPhilosophy from "@/components/OurPhilosophy";
import OurStory from "@/components/OurStory";
import Benefits from "@/components/Benefits";
import Legacy from "@/components/Legacy";
import Testimonial from "@/components/Testimonial";
import Start from "@/components/Start";
import Faqs from "@/components/Faqs";
import AppStoreDownloadButton from "@/components/AppStoreDownloadButton";
import GooglePlayDownloadButton from "@/components/GooglePlayDownloadButton";

export default function Home() {
  const { navigate } = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0, transition: { duration: 0.8 } }}
        viewport={{ once: true }}
        className="pt-24 flex bg-primary flex-col items-center justify-items-center arc overflow-x-hidden"
      >
        <section className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center gap-8">
          <article className="relative w-full p-4 mx-auto flex flex-col items-center justify-center">
            <TypewriterHeader text="Transform Mindless Scrolling Into Mindful Moments" />
            <motion.p
              initial={{ opacity: 0, scale: 1.25 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-52 lg:mt-60 text-white w-[80%] md:w-[60%] md:leading-8 text-center"
            >
              Take control of your phone usage with intentional pauses. Track your app usage time, 
              practice daily affirmations, and create mindful moments before opening apps. 
              Turn every phone interaction into an opportunity for reflection and growth.
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
              alt="MindfulUsage App Mockup"
              className="max-w-[90%] md:hidden p-10"
              width={400}
              height={200}
            />
            <Image
              src="/mockups/heroImgDesk.png"
              alt="MindfulUsage App Mockup"
              className="hidden md:block p-20"
              width={500}
              height={200}
            />
          </motion.article>
        </section>
      </motion.article>
      <OurPhilosophy />
      <OurStory />
      <Benefits />
      <Legacy />
      <Testimonial />
      <div className="relative top-[500px]">
        <Start />
      </div>
      <div className="relative top-[500px] mb-[500px]">
        <Faqs />
      </div>
    </>
  );
}
