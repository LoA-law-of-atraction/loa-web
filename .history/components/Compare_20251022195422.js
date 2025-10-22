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
  return null;
};

export default Analysis;
