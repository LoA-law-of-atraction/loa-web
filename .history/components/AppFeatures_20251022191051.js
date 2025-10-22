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
      "Track your digital energy patterns and see how mindful phone usage aligns with your manifestation practice.",
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
      className="w-full bg-white py-16 overflow-hidden"
    >
      <div className="container mx-auto p-4 px-5 md:px-[5%] 2xl:px-0 max-w-[1200px]">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0, transition: { duration: 0.8 } }}
            viewport={{ once: true }}
            className="text-h2 lg:text-h1 font-bold mb-4 bg-gradient-to-r from-indigo-900 to-purple-900 bg-clip-text text-transparent"
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
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Discover how LoA transforms every phone interaction into an opportunity 
            for conscious awareness, manifestation practice, and energetic alignment.
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
              className="bg-white p-6 rounded-lg shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="text-blue-500 mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, delay: 0.5 },
          }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Transform Your Phone Usage?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join thousands of users who have already started their journey
              toward more intentional technology use and mindful living.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Download for iOS
              </button>
              <button className="bg-gray-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-900 transition-colors">
                Download for Android
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default AppFeatures;
