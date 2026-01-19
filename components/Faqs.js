import { useState } from "react";
import { motion } from "framer-motion";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import faqs from "./data/faqs.js";

const Faqs = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAnswer = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

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
              <div
                className={`faq-item border-b border-white/20 rounded-xl p-4 ${
                  activeIndex === index
                    ? "py-6 px-4 bg-white/10 backdrop-blur-sm"
                    : ""
                }`}
              >
                <div className="flex justify-between items-start py-3">
                  <div className="faq-question cursor-pointer max-w-[90%]">
                    <span className="text-lg font-semibold text-white">
                      {faq.question}
                    </span>
                  </div>
                  <button
                    className="toggle-button text-white"
                    onClick={() => toggleAnswer(index)}
                  >
                    {activeIndex === index ? (
                      <MdKeyboardArrowUp className="w-8 h-8" />
                    ) : (
                      <MdKeyboardArrowDown className="w-8 h-8" />
                    )}
                  </button>
                </div>

                <div className="faq-answer mt-2 text-white/80">
                  {activeIndex === index && (
                    <>
                      <p>{faq?.answer}</p>
                      {faq?.list && (
                        <ul className="list-disc pl-6">
                          {faq.list.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      </article>
    </motion.section>
  );
};

export default Faqs;
