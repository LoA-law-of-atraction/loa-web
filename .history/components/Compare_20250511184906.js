"use client";
import { motion } from "framer-motion";
import { GiCheckMark } from "react-icons/gi";
import { MdClose } from "react-icons/md";
import { CgDanger } from "react-icons/cg";

const featuresData = [
  {
    feature: "AI-Powered Journaling",
    everJournal: "Yes",
    dayOne: "No",
    notion: "No",
    chatGPT: "Partial",
    memoirServices: "No",
  },
  {
    feature: "Connected Digital Footprint Integration",
    everJournal: "Yes",
    dayOne: "No",
    notion: "No",
    chatGPT: "No",
    memoirServices: "No",
  },
  {
    feature: "Interactive AI Prompts",
    everJournal: "Yes",
    dayOne: "No",
    notion: "No",
    chatGPT: "Partial",
    memoirServices: "No",
  },
  {
    feature: "Smart Chapter Organization",
    everJournal: "Yes",
    dayOne: "No",
    notion: "No",
    chatGPT: "No",
    memoirServices: "Yes",
  },
  {
    feature: "AI-Generated Biography",
    everJournal: "Yes",
    dayOne: "No",
    notion: "No",
    chatGPT: "No",
    memoirServices: "Yes",
  },
  {
    feature: "Multimedia-Aware Journaling",
    everJournal: "Yes",
    dayOne: "Yes",
    notion: "No",
    chatGPT: "No",
    memoirServices: "Yes",
  },
  {
    feature: "AI-Powered Memory Timeline",
    everJournal: "Yes",
    dayOne: "No",
    notion: "No",
    chatGPT: "No",
    memoirServices: "No",
  },
  {
    feature: "Emotion & Mood-Aware Journaling",
    everJournal: "Yes",
    dayOne: "No",
    notion: "No",
    chatGPT: "Partial",
    memoirServices: "No",
  },
  {
    feature: "Export as Print / Digital Legacy",
    everJournal: "Yes",
    dayOne: "Yes",
    notion: "No",
    chatGPT: "No",
    memoirServices: "Yes",
  },
  {
    feature: "User-Generated Biography Sales",
    everJournal: "Yes",
    dayOne: "No",
    notion: "No",
    chatGPT: "No",
    memoirServices: "No",
  },
  {
    feature: "Subscription-Based Monetization",
    everJournal: "Yes",
    dayOne: "Yes",
    notion: "Yes",
    chatGPT: "Yes",
    memoirServices: "No",
  },
];

const Analysis = () => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.8 } }}
      className="w-full text-white bg-primary"
    >
      <article className="container mx-auto py-14 p-4 px-5 md:px-[5%] 2xl:px-0 max-w-[1200px] items-center justify-center gap-4">
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-h2 lg:text-h3 font-bold text-center lg:text-left max-w-[80%]">
            Why choose LoA
          </h2>
          <span className="w-16 h-1 mt-3 bg-secondary" />
        </div>
        <div className="overflow-x-auto mt-16">
          <div className="hidden lg:block">
            <table className="w-full rounded-lg text-sm text-left border border-gray-700 overflow-hidden">
              <thead className="text-xs uppercase bg-[#1e1e1e] text-white">
                <tr>
                  <th className="py-4 px-3 text-left font-semibold">Feature</th>
                  <th className="py-4 px-3 text-center">LoA</th>
                  <th className="py-4 px-3 text-center">Day One</th>
                  <th className="py-4 px-3 text-center">Notion</th>
                  <th className="py-4 px-3 text-center">
                    ChatGPT & AI Writers
                  </th>
                  <th className="py-4 px-3 text-center">Memoir Services</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {featuresData.map((featureItem, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    viewport={{ once: true }}
                    className={`$${
                      index % 2 === 0 ? "bg-[#2a2a2a]" : "bg-[#1a1a1a]"
                    } border-b border-gray-700`}
                  >
                    <td className="py-4 px-3 font-medium">
                      {featureItem.feature}
                    </td>
                    {[
                      "everJournal",
                      "dayOne",
                      "notion",
                      "chatGPT",
                      "memoirServices",
                    ].map((key, idx) => {
                      const value = featureItem[key];
                      const icon =
                        value === "Yes" ? (
                          <GiCheckMark className="text-green-400 w-5 h-5" />
                        ) : value === "No" ? (
                          <MdClose className="text-red-400 w-5 h-5" />
                        ) : (
                          <CgDanger className="text-yellow-400 w-5 h-5" />
                        );
                      return (
                        <motion.td
                          key={idx}
                          className="text-center py-4 px-3"
                          whileHover={{ scale: 1.2 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <span className="flex justify-center">{icon}</span>
                        </motion.td>
                      );
                    })}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </article>
    </motion.section>
  );
};

export default Analysis;
