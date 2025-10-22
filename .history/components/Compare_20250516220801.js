"use client";
import { motion } from "framer-motion";
import { GiCheckMark } from "react-icons/gi";
import { MdClose } from "react-icons/md";
import { CgDanger } from "react-icons/cg";

const featuresData = [
  {
    feature: "Private-First by Design",
    everJournal: "Yes",
    instagram: "No",
    dayOne: "No",
    notion: "No",
    chatGPT: "No",
    memoirServices: "Yes",
  },
  {
    feature: "AI-Powered Journaling Companion",
    everJournal: "Yes",
    instagram: "No",
    dayOne: "No",
    notion: "No",
    chatGPT: "Partial",
    memoirServices: "No",
  },
  {
    feature: "Emotion & Mood-Aware Journaling",
    everJournal: "Yes",
    instagram: "No",
    dayOne: "No",
    notion: "No",
    chatGPT: "Partial",
    memoirServices: "No",
  },
  {
    feature: "Interactive Reflection Prompts",
    everJournal: "Yes",
    instagram: "No",
    dayOne: "No",
    notion: "No",
    chatGPT: "Partial",
    memoirServices: "No",
  },
  {
    feature: "Smart Chapter Organization",
    everJournal: "Yes",
    instagram: "No",
    dayOne: "No",
    notion: "No",
    chatGPT: "No",
    memoirServices: "Yes",
  },
  {
    feature: "AI-Generated Biography",
    everJournal: "Yes",
    instagram: "No",
    dayOne: "No",
    notion: "No",
    chatGPT: "No",
    memoirServices: "Yes",
  },
  {
    feature: "Multimedia-Aware Journaling",
    everJournal: "Yes",
    instagram: "Yes",
    dayOne: "Yes",
    notion: "No",
    chatGPT: "No",
    memoirServices: "Yes",
  },
  {
    feature: "Memory Timeline & Life Patterns",
    everJournal: "Yes",
    instagram: "No",
    dayOne: "No",
    notion: "No",
    chatGPT: "No",
    memoirServices: "No",
  },
  {
    feature: "Digital Footprint Integration",
    everJournal: "Yes",
    instagram: "Partial",
    dayOne: "No",
    notion: "No",
    chatGPT: "No",
    memoirServices: "No",
  },
  {
    feature: "Export as Book / Legacy Capsule",
    everJournal: "Yes",
    instagram: "No",
    dayOne: "Yes",
    notion: "No",
    chatGPT: "No",
    memoirServices: "Yes",
  },
  {
    feature: "User-Generated Biography Sales",
    everJournal: "Yes",
    instagram: "No",
    dayOne: "No",
    notion: "No",
    chatGPT: "No",
    memoirServices: "No",
  },
  {
    feature: "Built for Self-Reflection",
    everJournal: "Yes",
    instagram: "No",
    dayOne: "Partial",
    notion: "No",
    chatGPT: "No",
    memoirServices: "Partial",
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
          {/* Table for larger screens */}
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
                  <tr
                    key={index}
                    className={`${
                      index % 2 === 0 ? "bg-[#2a2a2a]" : "bg-[#1a1a1a]"
                    } border-b border-gray-700`}
                  >
                    <td className="py-4 px-3 font-medium">
                      {featureItem.feature}
                    </td>
                    <td className="py-4 px-3 text-center">
                      {featureItem.everJournal}
                    </td>
                    <td className="py-4 px-3 text-center">
                      {featureItem.dayOne}
                    </td>
                    <td className="py-4 px-3 text-center">
                      {featureItem.notion}
                    </td>
                    <td className="py-4 px-3 text-center">
                      {featureItem.chatGPT}
                    </td>
                    <td className="py-4 px-3 text-center">
                      {featureItem.memoirServices}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Fallback for smaller screens */}
          <div className="block lg:hidden">
            {featuresData.map((featureItem, index) => (
              <div
                key={index}
                className={`p-4 mb-4 rounded-lg ${
                  index % 2 === 0 ? "bg-[#2a2a2a]" : "bg-[#1a1a1a]"
                }`}
              >
                <h3 className="font-bold text-white">{featureItem.feature}</h3>
                <p className="text-sm text-gray-300">
                  <strong>LoA:</strong> {featureItem.everJournal}
                </p>
                <p className="text-sm text-gray-300">
                  <strong>Day One:</strong> {featureItem.dayOne}
                </p>
                <p className="text-sm text-gray-300">
                  <strong>Notion:</strong> {featureItem.notion}
                </p>
                <p className="text-sm text-gray-300">
                  <strong>ChatGPT & AI Writers:</strong> {featureItem.chatGPT}
                </p>
                <p className="text-sm text-gray-300">
                  <strong>Memoir Services:</strong> {featureItem.memoirServices}
                </p>
              </div>
            ))}
          </div>
        </div>
      </article>
    </motion.section>
  );
};

export default Analysis;
