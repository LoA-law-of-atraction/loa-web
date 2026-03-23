"use client";
import { motion } from "framer-motion";
import {
  Clock,
  Heart,
  Target,
  BarChart3,
  Smartphone,
  Brain,
} from "lucide-react";

const features = [
  {
    icon: <Heart className="w-8 h-8" />,
    title: "Manifestation Affirmations",
    description:
      "Create personalized affirmations aligned with your desires. Practice the Law of Attraction with every phone interaction.",
  },
  {
    icon: <Target className="w-8 h-8" />,
    title: "Conscious Interruption",
    description:
      "Transform digital impulses into moments of awareness. Pause, breathe, and align with your highest intentions.",
  },
  {
    icon: <Brain className="w-8 h-8" />,
    title: "Energy Redirection",
    description:
      "Redirect scattered attention toward what you want to attract. Turn distractions into opportunities for conscious living.",
  },
  {
    icon: <Clock className="w-8 h-8" />,
    title: "Awareness Insights",
    description:
      "Track your digital energy patterns and see how conscious technology use aligns with your manifestation practice.",
  },
  {
    icon: <Smartphone className="w-8 h-8" />,
    title: "Selective Monitoring",
    description:
      "Choose which apps serve your highest good and which ones need conscious boundaries for optimal energy flow.",
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: "Vibration Tracking",
    description:
      "Visualize how your digital habits affect your energetic state and alignment with your manifestation goals.",
  },
];

const AppFeatures = () => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.8 } }}
      className="relative z-10 w-full bg-[#050508] py-16 overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      <div className="container mx-auto p-4 px-5 md:px-[5%] 2xl:px-0 max-w-[1200px]">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0, transition: { duration: 0.8 } }}
            viewport={{ once: true }}
            className="text-h2 lg:text-h1 font-bold mb-4 text-white"
          >
            Features That Align Your Digital Life with the Law of Attraction
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{
              opacity: 1,
              y: 0,
              transition: { duration: 0.8, delay: 0.2 },
            }}
            viewport={{ once: true }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            Discover how LoA transforms every phone interaction into an
            opportunity for conscious awareness, manifestation practice, and
            energetic alignment.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, delay: index * 0.1 },
              }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 hover:border-purple-400/40 hover:bg-white/8 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-white/60 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default AppFeatures;
