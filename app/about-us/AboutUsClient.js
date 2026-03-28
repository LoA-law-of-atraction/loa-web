"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { FiSmartphone, FiStar, FiLock } from "react-icons/fi";
import OurStory from "@/components/OurStory";
import Legacy from "@/components/Legacy";
import Testimonial from "@/components/Testimonial";
import FaqsWhite from "@/components/FaqsWhite";
import CoreValues from "@/components/CoreValue";
import AppStoreDownloadButton from "@/components/AppStoreDownloadButton";
import GooglePlayDownloadButton from "@/components/GooglePlayDownloadButton";

const SolarSystemBackground = dynamic(
  () => import("@/components/SolarSystemBackground"),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-[#050508] z-0" aria-hidden />
    ),
  }
);

const values = [
  {
    id: 1,
    title: "Conscious Digital Living",
    desc: "We believe technology should serve your highest good, not scatter your energy. LoA helps you build intentional pauses into your day so you can align your attention with your manifestation practice and conscious awareness.",
    icon: <FiSmartphone className="w-6 h-6 text-[#505050]" />,
  },
  {
    id: 2,
    title: "Manifestation Through Action",
    desc: "Every affirmation screen is an opportunity to align your actions with your aspirations. By practicing the Law of Attraction as you move through your day, you turn ordinary moments into conscious manifestation.",
    icon: <FiStar className="w-6 h-6 text-[#505050]" />,
  },
  {
    id: 3,
    title: "Privacy-First Approach",
    desc: "Your manifestation journey and personal affirmations are yours alone. LoA is local-first by default, with optional secure sync when you use LoA across devices—so your practice stays private and under your control.",
    icon: <FiLock className="w-6 h-6 text-[#505050]" />,
  },
];
export default function AboutUsClient() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <SolarSystemBackground />
      <motion.article
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0, transition: { duration: 0.8 } }}
        viewport={{ once: true }}
        className="relative z-10 pt-24 flex bg-transparent min-h-[100vh] flex-col items-center justify-items-center overflow-x-hidden"
      >
        <section className="w-full px-5 md:px-[5%] 2xl:px-0 max-w-5xl mx-auto flex flex-col items-center justify-center gap-8">
          <article className="relative w-full py-4 mx-auto flex flex-col items-center justify-center">
            <motion.h1
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-white text-h2 md:max-w-[70%] lg:mt-12 font-bold text-center"
            >
              Transforming Intention Into Manifestation Moments
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, scale: 1.25 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="my-4 mb-6 text-white w-[80%] md:w-[60%] md:leading-8 text-center"
            >
              We believe technology should serve your highest good, not scatter
              your energy. LoA is a space for manifestation on your terms—so time
              with your phone can become opportunity for alignment instead of
              autopilot.
            </motion.p>

            <div className="mt-8 flex space-x-4">
              <div className="flex flex-col md:flex-row gap-4">
                <GooglePlayDownloadButton />
                <AppStoreDownloadButton />
              </div>
            </div>
          </article>
        </section>
      </motion.article>

      <motion.article className="relative z-10 bg-white overflow-hidden">
        <article className="container mx-auto py-20 pb-32 p-4 px-5 md:px-[5%] 2xl:px-0 max-w-[1200px] flex flex-col items-center justify-center gap-12">
          <div className="flex flex-col items-center md:items-start md:self-start pt-8">
            <h2 className="text-h2 lg:text-h3 font-bold text-center ">
              Our Mission: Help People Build Intentional Relationships with
              Technology
            </h2>
            <span className="w-16 h-1 mt-3 bg-bg" />
          </div>
          <div className="text-left w-full max-w-3xl mt-8 space-y-10">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-3">
                <span className="w-1 h-5 bg-primary rounded-full shrink-0" />
                Conscious Digital Alignment
              </h3>
              <p className="mt-2 pl-4">
                No judgment, just awareness. LoA does not monitor other apps or
                interrupt them. Your practice lives inside LoA—affirmations,
                streaks, and reflection—so you can pause and align with your
                goals on your own terms.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold flex items-center gap-3">
                <span className="w-1 h-5 bg-primary rounded-full shrink-0" />
                Mindfulness Meets Manifestation
              </h3>
              <p className="mt-2 pl-4">
                Transform time with your phone into an opportunity for conscious
                growth. Our affirmation screens help you practice the Law of
                Attraction and mindfulness whenever you open LoA—moments of
                manifestation and energetic alignment, without surveilling other
                apps.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold flex items-center gap-3">
                <span className="w-1 h-5 bg-primary rounded-full shrink-0" />
                Insights Without Shame
              </h3>
              <p className="mt-2 pl-4">
                Knowledge is power, but only when it&apos;s used with
                compassion. LoA surfaces streaks, progress, and reflection
                inside the app—without tracking how you use other
                applications—so you can steer your manifestation practice with
                clarity, not shame.
              </p>
              <p className="mt-2 pl-4 font-semibold">
                Because awareness is the first step toward conscious
                transformation.
              </p>
            </div>
          </div>

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
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full bg-white py-20 border-t border-gray-100"
      >
        <div className="mx-auto max-w-3xl px-5 text-center md:px-[5%]">
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="h-px w-8 bg-primary/40" />
            <span className="text-xs font-semibold tracking-widest uppercase text-primary/70">
              The Team
            </span>
            <span className="h-px w-8 bg-primary/40" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Who builds LoA
          </h2>
          <p className="mt-5 text-left text-base leading-relaxed text-gray-600 md:text-center">
            LoA is developed by a small team that cares about the Law of
            Attraction and digital wellbeing. We ship thoughtfully, listen to
            feedback from the community, and keep your practice private by
            design—local-first by default, with optional sync when you want it
            across devices.
          </p>
          <p className="mt-4 text-left text-sm leading-relaxed text-gray-500 md:text-center">
            Pricing, privacy, and terms are published on this site so you can
            verify how the product works before you subscribe. For press,
            partnerships, or business questions, reach out—we read every message
            from users and partners.
          </p>
          <Link
            href="/contact-us"
            className="mt-8 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Contact us →
          </Link>
        </div>
      </motion.section>
      <Legacy />
      <Testimonial />
      <FaqsWhite />
    </>
  );
}
