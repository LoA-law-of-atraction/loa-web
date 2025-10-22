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
    loa: "Yes",
    instagram: "No",
    screenTime: "Partial",
    notion: "No",
    meditationApps: "No",
    habitTrackers: "Partial",
  },
  {
    feature: "Conscious App Interruption",
    loa: "Yes",
    instagram: "No",
    screenTime: "No",
    notion: "No",
    meditationApps: "No",
    habitTrackers: "No",
  },
  {
    feature: "Personalized Affirmation Screens",
    loa: "Yes",
    instagram: "No",
    screenTime: "No",
    notion: "No",
    meditationApps: "Partial",
    habitTrackers: "No",
  },
  {
    feature: "Law of Attraction Integration",
    loa: "Yes",
    instagram: "No",
    screenTime: "No",
    notion: "No",
    meditationApps: "Partial",
    habitTrackers: "No",
  },
  {
    feature: "Digital Energy Pattern Analysis",
    loa: "Yes",
    instagram: "No",
    screenTime: "Partial",
    notion: "No",
    meditationApps: "No",
    habitTrackers: "No",
  },
  {
    feature: "Manifestation Goal Setting",
    loa: "Yes",
    instagram: "No",
    screenTime: "No",
    notion: "Partial",
    meditationApps: "Partial",
    habitTrackers: "Yes",
  },
  {
    feature: "Privacy-First Data Storage",
    loa: "Yes",
    instagram: "No",
    screenTime: "Yes",
    notion: "No",
    meditationApps: "Yes",
    habitTrackers: "Partial",
  },
  {
    feature: "Conscious Digital Living Focus",
    loa: "Yes",
    instagram: "No",
    screenTime: "No",
    notion: "No",
    meditationApps: "Partial",
    habitTrackers: "No",
  },
  {
    feature: "Visualization & Vision Board Tools",
    loa: "Yes",
    instagram: "Partial",
    screenTime: "No",
    notion: "Partial",
    meditationApps: "Partial",
    habitTrackers: "No",
  },
  {
    feature: "Mindful Usage Insights",
    loa: "Yes",
    instagram: "No",
    screenTime: "Partial",
    notion: "No",
    meditationApps: "No",
    habitTrackers: "Partial",
  },
  {
    feature: "Custom Manifestation Reminders",
    loa: "Yes",
    instagram: "No",
    screenTime: "No",
    notion: "Partial",
    meditationApps: "Yes",
    habitTrackers: "Partial",
  },
  {
    feature: "Spiritual Growth Tracking",
    loa: "Yes",
    instagram: "No",
    screenTime: "No",
    notion: "No",
    meditationApps: "Partial",
    habitTrackers: "Yes",
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
                      {renderStatusIcon(item.loa)}
                    </td>
                    <td className="py-4 px-3 text-center">
                      {renderStatusIcon(item.instagram)}
                    </td>
                    <td className="py-4 px-3 text-center">
                      {renderStatusIcon(item.screenTime)}
                    </td>
                    <td className="py-4 px-3 text-center">
                      {renderStatusIcon(item.notion)}
                    </td>
                    <td className="py-4 px-3 text-center">
                      {renderStatusIcon(item.meditationApps)}
                    </td>
                    <td className="py-4 px-3 text-center">
                      {renderStatusIcon(item.habitTrackers)}
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
                      {renderStatusIcon(item.loa)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Instagram</span>
                    <span className="text-right">
                      {renderStatusIcon(item.instagram)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Screen Time</span>
                    <span className="text-right">
                      {renderStatusIcon(item.screenTime)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Notion</span>
                    <span className="text-right">
                      {renderStatusIcon(item.notion)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Meditation Apps</span>
                    <span className="text-right">
                      {renderStatusIcon(item.meditationApps)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Habit Trackers</span>
                    <span className="text-right">
                      {renderStatusIcon(item.habitTrackers)}
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
