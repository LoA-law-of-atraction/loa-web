"use client";

import "../globals.css";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Testimonial from "@/components/Testimonial";
import Faqs from "@/components/Faqs";
import Feature from "@/components/Features";
import Analysis from "@/components/Compare";
import ReadyToStart from "@/components/Ready";
import AppStoreDownloadButton from "@/components/AppStoreDownloadButton";
import GooglePlayDownloadButton from "@/components/GooglePlayDownloadButton";

export default function Features() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0, transition: { duration: 0.8 } }}
        viewport={{ once: true }}
        className="pt-28 lg:pt-64 lg:pb-32 flex bg-primary flex-col items-center justify-items-center overflow-x-hidden"
      >
        <section className="w-full container px-5 md:px-[5%] 2xl:px-0 max-w-[1200px] mx-auto flex flex-col lg:flex-row-reverse items-center lg:items-start justify-center lg:gap-5 gap-8">
          <article className="py-4 mx-auto lg:mx-0 lg:relative lg:left-[-100px] w-full flex flex-col gap-5 items-start justify-center">
            <motion.h1
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-white text-h2 md:max-w-[70%] lg:max-w-[100%] lg:text-h4 font-bold text-left"
            >
              Powerful Features for Mindful Phone Usage
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, scale: 1.25 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-white max-w-[85%] md:max-w-[70%] lg:max-w-[100%] md:leading-8 text-left"
            >
              MindfulUsage combines app usage tracking, affirmation screens, and
              mindfulness practices to help you build a healthier relationship
              with your phone. Discover features designed to create awareness
              and intention in every digital interaction.
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
            className="flex py-4 mx-auto items-center w-full justify-center pb-10"
          >
            <div className="max-w-sm bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-6 shadow-lg">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl text-white">🌟</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Features Integration
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Seamlessly integrate the Law of Attraction into your daily
                  digital habits.
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <span className="text-purple-600">✨ Affirmations</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <span className="text-indigo-600">🎯 Focus</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <span className="text-green-600">🧘 Mindfulness</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <span className="text-pink-600">💫 Manifestation</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.article>
        </section>
      </motion.article>
      <Feature />
      <Analysis />
      <ReadyToStart />
      <Testimonial />
      <div className="relative top-[500px] mb-[500px]">
        <Faqs />
      </div>
    </>
  );
}
