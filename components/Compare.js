'use client'
import { motion } from "framer-motion";
import { GiCheckMark } from "react-icons/gi";
import { MdClose } from "react-icons/md";
import { CgDanger } from 'react-icons/cg';

const featuresData = [
  {
    feature: 'AI-Powered Journaling',
    everJournal: 'Yes',
    dayOne: 'No',
    notion: 'No',
    chatGPT: 'Partial',
    memoirServices: 'No',
  },
  {
    feature: 'AI-Generated Biography',
    everJournal: 'Yes',
    dayOne: 'No',
    notion: 'No',
    chatGPT: 'No',
    memoirServices: 'Yes',
  },
  {
    feature: 'Structured Chapter Creation',
    everJournal: 'Yes',
    dayOne: 'No',
    notion: 'No',
    chatGPT: 'No',
    memoirServices: 'Yes',
  },
  {
    feature: 'Interactive AI Prompts',
    everJournal: 'Yes',
    dayOne: 'No',
    notion: 'No',
    chatGPT: 'Partial',
    memoirServices: 'No',
  },
  {
    feature: 'Multimedia Integration',
    everJournal: 'Yes',
    dayOne: 'Yes',
    notion: 'No',
    chatGPT: 'No',
    memoirServices: 'Yes',
  },
  {
    feature: 'User-Generated Biography Sales',
    everJournal: 'Yes',
    dayOne: 'No',
    notion: 'No',
    chatGPT: 'No',
    memoirServices: 'No',
  },
  {
    feature: 'AI-Powered Video & Audio Memories',
    everJournal: 'Yes',
    dayOne: 'No',
    notion: 'No',
    chatGPT: 'No',
    memoirServices: 'Yes',
  },
  {
    feature: 'Export as Print / Digital Legacy',
    everJournal: 'Yes',
    dayOne: 'Yes',
    notion: 'No',
    chatGPT: 'No',
    memoirServices: 'Yes',
  },
  {
    feature: 'Subscription-Based Monetization',
    everJournal: 'Yes',
    dayOne: 'Yes',
    notion: 'Yes',
    chatGPT: 'Yes',
    memoirServices: 'No',
  },
];

const Analysis = () => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.8 } }}
      className="w-full text-secondary bg-primary"
    >
      <article className="container mx-auto py-14 p-4 px-5 md:px-[5%] 2xl:px-0 max-w-[1200px] items-center justify-center gap-4">
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-h2 lg:text-h3 font-bold text-center lg:text-left max-w-[80%]">Why choose Ever Journal</h2>
          <span className="w-16 h-1 mt-3 bg-secondary" />
        </div>
        <div className="overflow-x-auto mt-16">
          <div className="lg:hidden">
            {featuresData.map((featureItem, index) => (
              <div key={index} className="mb-6 p-4 rounded-lg shadow-md bg-secondary text-primary">
                <h3 className="text-lg font-semibold mb-2">{featureItem.feature}</h3>
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-silver">
                    <tr>
                      <th className="py-2 px-3">Service</th>
                      <th className="py-2 px-3">Availability</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white border-b border-gray-700">
                      <th scope="row" className="py-2 px-3 font-medium text-primary whitespace-nowrap">
                        Ever Journal
                      </th>
                      <td className="py-2 px-3 flex gap-2 items-center">
                        {featureItem.everJournal === 'Yes' && <GiCheckMark />}
                        {featureItem.everJournal === 'No' && <MdClose />}
                        {featureItem.everJournal === 'Yes' ? "Yes" : "No"}
                      </td>
                    </tr>
                    <tr className="bg-white border-b border-gray-700">
                      <th scope="row" className="py-2 px-3 font-medium text-primary whitespace-nowrap">
                        Day One
                      </th>
                      <td className="py-2 px-3 flex gap-2 items-center">
                        {featureItem.dayOne === 'Yes' && <GiCheckMark />}
                        {featureItem.dayOne === 'No' && <MdClose />}
                        {featureItem.dayOne === 'Partial' && <CgDanger />}
                        {featureItem.dayOne === 'Yes' ? "Yes" : featureItem.dayOne === 'No' ? "No" : "Partial"}
                      </td>
                    </tr>
                    <tr className="bg-white border-b border-gray-700">
                      <th scope="row" className="py-2 px-3 font-medium text-primary whitespace-nowrap">
                        Notion
                      </th>
                      <td className="py-2 px-3 flex gap-2 items-center">
                        {featureItem.notion === 'Yes' && <GiCheckMark />}
                        {featureItem.notion === 'No' && <MdClose />}
                        {featureItem.notion === 'Partial' && <CgDanger />}
                        {featureItem.notion === 'Yes' ? "Yes" : featureItem.notion === 'No' ? "No" :   "Partial"}
                      </td>
                    </tr>
                    <tr className="bg-white border-b border-gray-700">
                      <th scope="row" className="py-2 px-3 font-medium text-primary whitespace-nowrap">
                        ChatGPT & AI Writers
                      </th>
                      <td className="py-2 px-3 flex gap-2 items-center">
                        {featureItem.chatGPT === 'Yes' && <GiCheckMark />}
                        {featureItem.chatGPT === 'No' && <MdClose />}
                        {featureItem.chatGPT === 'Partial' && <CgDanger />}
                        {featureItem.chatGPT === 'Yes' ? "Yes" : featureItem.chatGPT === 'No' ? "No" : "Partial"}
                      </td>
                    </tr>
                    <tr className="bg-white">
                      <th scope="row" className="py-2 px-3 font-medium text-primary whitespace-nowrap">
                        Memoir Services
                      </th>
                      <td className="py-2 px-3 flex gap-2 items-center">
                        {featureItem.memoirServices === 'Yes' && <GiCheckMark />}
                        {featureItem.memoirServices === 'No' && <MdClose />}
                        {featureItem.memoirServices === 'Partial' && <CgDanger />}
                        {featureItem.memoirServices === 'Yes' ? "Yes" : featureItem.memoirServices === 'No' ? "No" : "Partial"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          <div className="hidden lg:block">
            <table className="w-full rounded-lg text-sm text-left">
              <thead className="text-xs uppercase bg-[#505050]">
                <tr  className="">
                  <th className="py-5 px-3">Feature</th>
                  <th className="py-5 px-3">Ever Journal</th>
                  <th className="py-5 px-3">Day One</th>
                  <th className="py-5 px-3">Notion</th>
                  <th className="py-5 px-3">ChatGPT & AI Writers</th>
                  <th className="py-5 px-3">Memoir Services</th>
                </tr>
              </thead>
              <tbody>
                {featuresData.map((featureItem, index) => (
                  <tr key={index} className="bg-white text-primary border-b border-gray-700">
                    <th scope="row" className="py-4 p-5 font-medium text-left text-primary whitespace-nowrap">
                      {featureItem.feature}
                    </th>
                    <td className="py-5 px-3">
                      {featureItem.everJournal === 'Yes' && <GiCheckMark className="inline pr-1 w-5 h-5" />}
                      {featureItem.everJournal === 'No' && <MdClose className="inline pr-1 w-5 h-5" />}
                      {featureItem.everJournal === 'Yes' ? "Yes" : "No"}
                    </td>
                    <td className="py-5 px-3">
                      {featureItem.dayOne === 'Yes' && <GiCheckMark className="inline pr-1 w-5 h-5" />}
                      {featureItem.dayOne === 'No' && <MdClose className="inline pr-1 w-5 h-5" />}
                      {featureItem.dayOne === 'Partial' && <CgDanger className="inline pr-1 w-5 h-5" />}
                      {featureItem.dayOne === 'Yes' ? "Yes" : featureItem.dayOne === 'No' ? "No" : "Partial"}
                    </td>
                    <td className="py-5 px-3">
                      {featureItem.notion === 'Yes' && <GiCheckMark className="inline pr-1 w-5 h-5" />}
                      {featureItem.notion === 'No' && <MdClose className="inline pr-1 w-5 h-5" />}
                      {featureItem.notion === 'Partial' && <CgDanger className="inline pr-1 w-5 h-5" />}
                      {featureItem.notion === 'Yes' ? "Yes" : featureItem.notion === 'No' ? "No" :  + "Partial"}
                    </td>
                    <td className="py-5 px-3">
                      {featureItem.chatGPT === 'Yes' && <GiCheckMark className="inline pr-1 w-5 h-5" />}
                      {featureItem.chatGPT === 'No' && <MdClose className="inline pr-1 w-5 h-5" />}
                      {featureItem.chatGPT === 'Partial' && <CgDanger className="inline pr-1 w-5 h-5" />}
                      {featureItem.chatGPT === 'Yes' ? "Yes" : featureItem.chatGPT === 'No' ? "No" : "Partial"}
                    </td>
                    <td className="py-5 px-3">
                      {featureItem.memoirServices === 'Yes' && <GiCheckMark className="inline pr-1 w-5 h-5" />}
                      {featureItem.memoirServices === 'No' && <MdClose className="inline pr-1 w-5 h-5" />}
                      {featureItem.memoirServices === 'Partial' && <CgDanger className="inline pr-1 w-5 h-5" />}
                      {featureItem.memoirServices === 'Yes' ? "Yes" : featureItem.memoirServices === 'No' ? "No" : "Partial"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </article>

    </motion.section>
  )
}

export default Analysis;
