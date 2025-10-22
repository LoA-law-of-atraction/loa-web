"use client";
import { motion } from "framer-motion";
import { GiCheckMark } from "react-icons/gi";
import { MdClose } from "react-icons/md";
import { CgDanger } from "react-icons/cg";

const renderStatusIcon = (value) => {
  if (value === "Yes")
    return <GiCheckMark className="text-green-400 mx-auto" />;
  if (value === "No") return <MdClose className="text-red-400 mx-auto" />;
  return <CgDanger className="text-yellow-400 mx-auto" />;
};

const featuresData = [
  {
    feature: "App Usage Tracking & Awareness",
    everJournal: "Yes",
    instagram: "No",
    dayOne: "No",
    notion: "No",
    chatGPT: "No",
    memoirServices: "No",
  },
  {
    feature: "Conscious App Interruption",
    everJournal: "Yes",
    instagram: "No",
    dayOne: "No",
    notion: "No",
    chatGPT: "No",
    memoirServices: "No",
  },
  {
    feature: "Personalized Affirmation Screens",
    everJournal: "Yes",
    instagram: "No",
    dayOne: "No",
    notion: "No",
    chatGPT: "Partial",
    memoirServices: "No",
  },
  {
    feature: "Law of Attraction Integration",
    everJournal: "Yes",
    instagram: "No",
    dayOne: "No",
    notion: "No",
    chatGPT: "Partial",
    memoirServices: "No",
  },
  {
    feature: "Digital Energy Pattern Analysis",
    everJournal: "Yes",
    instagram: "No",
    dayOne: "No",
    notion: "No",
    chatGPT: "No",
    memoirServices: "No",
  },
  {
    feature: "Manifestation Goal Setting",
    everJournal: "Yes",
    instagram: "No",
    dayOne: "No",
    notion: "Partial",
    chatGPT: "No",
    memoirServices: "No",
  },
  {
    feature: "Privacy-First Data Storage",
    everJournal: "Yes",
    instagram: "No",
    dayOne: "Yes",
    notion: "No",
    chatGPT: "No",
    memoirServices: "Partial",
  },
  {
    feature: "Conscious Digital Living Focus",
    everJournal: "Yes",
    instagram: "No",
    dayOne: "No",
    notion: "No",
    chatGPT: "No",
    memoirServices: "No",
  },
  {
    feature: "Visualization & Vision Board Tools",
    everJournal: "Yes",
    instagram: "Partial",
    dayOne: "No",
    notion: "Partial",
    chatGPT: "No",
    memoirServices: "No",
  },
  {
    feature: "Mindful Usage Insights",
    everJournal: "Yes",
    instagram: "No",
    dayOne: "No",
    notion: "No",
    chatGPT: "No",
    memoirServices: "No",
  },
  {
    feature: "Custom Manifestation Reminders",
    everJournal: "Yes",
    instagram: "No",
    dayOne: "No",
    notion: "Partial",
    chatGPT: "No",
    memoirServices: "No",
  },
  {
    feature: "Spiritual Growth Tracking",
    everJournal: "Yes",
    instagram: "No",
    dayOne: "Partial",
    notion: "No",
    chatGPT: "No",
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
      <article className="container mx-auto py-14 p-4 px-5 md:px-[5%] 2xl:px-0 max-w-[1200px]">
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-h2 lg:text-h3 font-bold text-center">
            Why choose LoA
          </h2>
          <span className="w-16 h-1 mt-3 bg-secondary" />
        </div>

        <div className="overflow-x-auto mt-16">
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <table className="w-full rounded-lg text-sm text-left border border-gray-700 overflow-hidden">
              <thead className="text-xs uppercase bg-[#1e1e1e] text-white">
                <tr>
                  <th className="py-4 px-3 text-left font-semibold">Feature</th>
                  <th className="py-4 px-3 text-center">LoA</th>
                  <th className="py-4 px-3 text-center">Instagram</th>
                  <th className="py-4 px-3 text-center">Screen Time</th>
                  <th className="py-4 px-3 text-center">Notion</th>
                  <th className="py-4 px-3 text-center">Meditation Apps</th>
                  <th className="py-4 px-3 text-center">Habit Trackers</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {featuresData.map((item, index) => (
                  <tr
                    key={index}
                    className={`${
                      index % 2 === 0 ? "bg-[#2a2a2a]" : "bg-[#1a1a1a]"
                    } border-b border-gray-700`}
                  >
                    <td className="py-4 px-3 font-medium">{item.feature}</td>
                    <td className="py-4 px-3 text-center">
                      {renderStatusIcon(item.everJournal)}
                    </td>
                    <td className="py-4 px-3 text-center">
                      {renderStatusIcon(item.instagram)}
                    </td>
                    <td className="py-4 px-3 text-center">
                      {renderStatusIcon(item.dayOne)}
                    </td>
                    <td className="py-4 px-3 text-center">
                      {renderStatusIcon(item.notion)}
                    </td>
                    <td className="py-4 px-3 text-center">
                      {renderStatusIcon(item.chatGPT)}
                    </td>
                    <td className="py-4 px-3 text-center">
                      {renderStatusIcon(item.memoirServices)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile Card View */}
          <div className="block lg:hidden mt-10 space-y-6">
            {featuresData.map((item, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  index % 2 === 0 ? "bg-[#2a2a2a]" : "bg-[#1a1a1a]"
                }`}
              >
                <h3 className="font-bold text-white mb-4">{item.feature}</h3>
                <div className="grid grid-cols-1 gap-3 text-sm text-white">
                  <div className="flex justify-between items-center">
                    <span>LoA</span>
                    <span className="text-right">
                      {renderStatusIcon(item.everJournal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Instagram</span>
                    <span className="text-right">
                      {renderStatusIcon(item.instagram)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Day One</span>
                    <span className="text-right">
                      {renderStatusIcon(item.dayOne)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Notion</span>
                    <span className="text-right">
                      {renderStatusIcon(item.notion)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>ChatGPT & AI</span>
                    <span className="text-right">
                      {renderStatusIcon(item.chatGPT)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Memoir Services</span>
                    <span className="text-right">
                      {renderStatusIcon(item.memoirServices)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </article>
    </motion.section>
  );
};

export default Analysis;
