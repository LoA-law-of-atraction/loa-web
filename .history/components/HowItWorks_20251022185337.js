"use client";
import { motion } from "framer-motion";
import Image from "next/image";

const steps = [
  "Set up app monitoring to track your daily screen time and usage patterns across all applications.",
  "Create personalized affirmations and manifestation goals that align with your values and aspirations.",
  "When you open tracked apps, pause at the affirmation screen to reflect on your intentions.",
  "Practice mindful decision-making by choosing whether to proceed or redirect your attention.",
  "Review your usage insights and celebrate your progress toward more intentional phone habits.",
];

const HowItWorks = () => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.8 } }}
      className="w-full mt-[-100px] bg-secondary text-primary overflow-hidden"
    >
      <div className="container mx-auto py-14 p-4 px-5 md:px-[5%] 2xl:px-0 max-w-[1200px] flex flex-col items-center justify-center gap-4">
        <article className="">
          <div className="flex flex-col items-center lg:items-start justify-center">
            <h2 className="text-h2 lg:text-h3 font-bold text-center">
              How It Works
            </h2>
            <span className="w-16 h-1 mt-3 bg-bg" />
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-10">
            <article className="flex flex-col justify-center">
              <motion.h3
                initial={{ opacity: 0, y: 100 }}
                whileInView={{ opacity: 1, y: 0, transition: { duration: 0.8 } }}
                viewport={{ once: true }}
                className="text-h4 lg:text-h3 font-bold leading-none"
              >
                Transform Your Phone into a Tool for{" "}
                <span className="text-blue-400">Mindful Living</span>
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0, transition: { duration: 0.8 } }}
                viewport={{ once: true }}
                className="text-p lg:text-lg mt-5 text-gray-600"
              >
                MindfulUsage creates intentional moments throughout your day. 
                By intercepting app launches with affirmation screens, you build 
                awareness around your phone usage while practicing manifestation 
                and mindfulness.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0, transition: { duration: 0.8 } }}
                viewport={{ once: true }}
                className="mt-8"
              >
                <h4 className="text-lg font-semibold mb-4 text-blue-600">
                  Key Features:
                </h4>
                <ul className="space-y-3">
                  {steps.map((step, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0, transition: { delay: index * 0.1, duration: 0.5 } }}
                      viewport={{ once: true }}
                      className="flex items-start gap-3"
                    >
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{step}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </article>
            <motion.article
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1, transition: { duration: 0.8 } }}
              viewport={{ once: true }}
              className="flex items-center justify-center"
            >
              <Image
                src="/mockups/heroImgDesk.png"
                alt="MindfulUsage App Features"
                className="w-full max-w-md"
                width={400}
                height={600}
              />
            </motion.article>
          </div>
        </article>
      </div>
    </motion.section>
  );
};

export default HowItWorks;