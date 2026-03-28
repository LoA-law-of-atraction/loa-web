"use client";

import { motion } from "framer-motion";
import faqs from "./data/faqs.js";

const FaqsWhite = () => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.8 } }}
      className="relative z-10 w-full bg-white overflow-hidden"
    >
      <article className="container mx-auto py-14 p-4 px-5 md:px-[5%] 2xl:px-0 max-w-5xl flex flex-col items-center justify-center gap-4">
        <div className="flex flex-col items-center justify-center w-full">
          <h2 className="text-h2 lg:text-h3 font-bold text-center max-w-[80%]">
            Frequently Asked Questions (FAQs)
          </h2>
          <span className="w-16 h-1 mt-3 bg-bg" />
        </div>
        <ul className="space-y-4 mt-14 w-full">
          {faqs.map((faq, index) => (
            <li key={index}>
              <details className="group border-b-2 border-gray-300 p-4 open:py-6 open:px-4">
                <summary className="flex cursor-pointer list-none justify-between items-start gap-3 py-3 [&::-webkit-details-marker]:hidden">
                  <span className="text-lg font-semibold max-w-[90%] pr-2">
                    {faq.question}
                  </span>
                  <span
                    className="shrink-0 transition-transform group-open:rotate-180"
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
                <div className="faq-answer mt-2 pb-2">
                  <p className="text-gray-500">{faq?.answer}</p>
                  {faq?.list && (
                    <ul className="list-disc pl-6 mt-2">
                      {faq.list.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            </li>
          ))}
        </ul>
      </article>
    </motion.section>
  );
};

export default FaqsWhite;
