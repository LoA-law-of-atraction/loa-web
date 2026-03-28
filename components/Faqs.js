"use client";

import { motion } from "framer-motion";
import faqs from "./data/faqs.js";

const Faqs = () => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.8 } }}
      className="relative z-10 w-full bg-black text-white overflow-hidden"
    >
      <article className="container mx-auto py-14 p-4 px-5 md:px-[5%] 2xl:px-0 max-w-5xl flex flex-col items-center justify-center gap-4">
        <div className="flex flex-col items-center justify-center w-full">
          <h2 className="text-h2 lg:text-h3 font-bold text-center max-w-[80%] text-white">
            Frequently Asked Questions (FAQs)
          </h2>
          <span className="w-16 h-1 mt-3 bg-white" />
        </div>
        <ul className="space-y-4 mt-14 w-full">
          {faqs.map((faq, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <details className="faq-item group border-b border-white/20 rounded-xl p-4 open:bg-white/10 open:backdrop-blur-sm open:py-6 open:px-4">
                <summary className="flex cursor-pointer list-none justify-between items-start gap-3 py-3 [&::-webkit-details-marker]:hidden">
                  <span className="text-lg font-semibold text-white max-w-[90%] pr-2">
                    {faq.question}
                  </span>
                  <span
                    className="shrink-0 text-white transition-transform group-open:rotate-180"
                    aria-hidden
                  >
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </summary>
                <div className="faq-answer mt-2 pb-2 text-white/80">
                  <p>{faq?.answer}</p>
                  {faq?.list && (
                    <ul className="list-disc pl-6 mt-2">
                      {faq.list.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            </motion.li>
          ))}
        </ul>
      </article>
    </motion.section>
  );
};

export default Faqs;
