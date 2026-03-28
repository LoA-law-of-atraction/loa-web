"use client";
import { motion } from "framer-motion";
import Image from "next/image";

const features = [
  {
    id: "01",
    title: "Affirmation-First Practice",
    desc: [
      "Build a daily Law of Attraction practice inside LoA—without monitoring or interrupting other apps.",
      "Receive personalized affirmations and reminders aligned with your goals.",
      "Create sacred pauses you choose, whenever you open the app.",
    ],
    mockImage: "/mock/mock6.png",
  },
  {
    id: "02",
    title: "Personalized Affirmation Screens",
    desc: [
      "Access customized Law of Attraction affirmations based on your goals and intentions.",
      "Each affirmation is designed to elevate your vibration and attract abundance.",
      "Practice manifestation principles as part of a routine you control.",
    ],
    mockImage: "/mock/mock10.png",
  },
  {
    id: "03",
    title: "Momentum & Awareness",
    desc: [
      "Track streaks and progress inside LoA to stay consistent with your practice.",
      "Notice how regular check-ins support your energy and alignment over time.",
      "Reflect on what supports your conscious living goals—without tracking other applications.",
    ],
    mockImage: "/mock/mock7.png",
  },
  {
    id: "04",
    title: "Manifestation Goal Integration",
    desc: [
      "Connect your affirmations with your manifestation and life goals.",
      "Use reminders and widgets to return to LoA when you want a conscious reset.",
      "Stay focused on attracting your desires through intentional time in the app.",
    ],
    mockImage: "/mock/mock11.png",
  },
  {
    id: "05",
    title: "Visualization & Vision Board Tools",
    desc: [
      "Access visualization exercises and digital vision boards within your LoA practice.",
      "Reinforce your manifestation goals with imagery you curate.",
      "Turn sessions in the app into opportunities to visualize the life you want.",
    ],
    mockImage: "/mock/mock5.png",
  },
  {
    id: "06",
    title: "Privacy-First Spiritual Practice",
    desc: [
      "Your manifestation journey and affirmations remain completely private on your device.",
      "LoA does not monitor other apps or interrupt them to show your affirmations.",
      "Maintain the energetic integrity of your conscious living path.",
    ],
    mockImage: "/mock/mock12.png",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const Feature = () => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative z-10 w-full bg-transparent text-white overflow-hidden"
    >
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
        <div className="absolute top-24 left-[15%] w-[500px] h-[500px] bg-[#3949AB]/12 rounded-full blur-[100px]" />
        <div className="absolute top-[35%] right-[10%] w-[400px] h-[400px] bg-[#6A1B9A]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] left-[30%] w-[360px] h-[360px] bg-[#3949AB]/8 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto py-20 px-5 md:px-[5%] 2xl:px-0 max-w-[1200px]">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center mb-20"
        >
          <span className="text-[11px] font-semibold tracking-[0.3em] uppercase text-[#7986CB] mb-4">
            What LoA Offers
          </span>
          <h2 className="text-h2 lg:text-h3 font-bold leading-tight max-w-[680px]">
            Features &amp; benefits
          </h2>
          <div className="flex items-center gap-3 mt-5">
            <div className="w-14 h-px bg-gradient-to-r from-transparent to-[#3949AB]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#3949AB]" />
            <div className="w-14 h-px bg-gradient-to-l from-transparent to-[#3949AB]" />
          </div>
          <p className="mt-6 text-white/50 max-w-[640px] leading-relaxed text-[15px]">
            LoA turns time in the app into a{" "}
            <strong className="font-semibold text-white/65">manifestation</strong>{" "}
            opportunity:{" "}
            <strong className="font-semibold text-white/65">affirmations</strong>
            , streaks, vision board moments, and reflection you control. Whether
            you follow the Law of Attraction as daily ritual or occasional reset,
            the same idea applies—align attention, repeat what supports you, and
            let the app hold your practice without surveilling the rest of your
            phone. Your journey stays intentional, local-first on the free tier,
            with optional cloud sync on paid plans.
          </p>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="flex flex-col gap-5"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              variants={itemVariants}
              className={`group relative flex flex-col ${
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              } items-center gap-8 md:gap-12 p-6 md:p-10 rounded-2xl
                border border-white/[0.06]
                bg-white/[0.025]
                hover:bg-white/[0.05]
                hover:border-[#3949AB]/35
                transition-all duration-500`}
            >
              {/* Decorative large number */}
              <div
                className="absolute top-3 right-6 text-[7rem] font-bold leading-none
                  text-white/[0.025] font-tiempos select-none pointer-events-none"
                aria-hidden
              >
                {feature.id}
              </div>

              {/* Mock image */}
              <div className="relative flex-shrink-0 w-[180px] md:w-[240px]">
                <div
                  className="relative w-full rounded-2xl overflow-hidden"
                  style={{ height: "300px" }}
                >
                  <div
                    className="absolute w-full"
                    style={{
                      height: "560px",
                      top: index % 2 === 0 ? "0" : "-170px",
                    }}
                  >
                    <Image
                      src={feature.mockImage}
                      alt={`${feature.title} — LoA Law of Attraction app screen`}
                      fill
                      className="object-contain object-top"
                    />
                  </div>
                  {/* Fade edge */}
                  <div
                    className={`absolute left-0 right-0 h-20 pointer-events-none ${
                      index % 2 === 0
                        ? "bottom-0 bg-gradient-to-t from-[#050508] via-[#050508]/60 to-transparent"
                        : "top-0 bg-gradient-to-b from-[#050508] via-[#050508]/60 to-transparent"
                    }`}
                  />
                </div>
                {/* Glow behind image on hover */}
                <div
                  className="absolute inset-0 bg-[#3949AB]/15 rounded-2xl blur-2xl
                    -z-10 scale-90 opacity-0 group-hover:opacity-100
                    transition-opacity duration-700"
                />
              </div>

              {/* Text content */}
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-[11px] tracking-[0.2em] text-[#7986CB]/80">
                    {feature.id}
                  </span>
                  <div className="w-8 h-px bg-[#3949AB]/50" />
                </div>
                <h3 className="text-h5 font-bold text-white mb-5 leading-tight">
                  {feature.title}
                </h3>
                <ul className="space-y-3.5">
                  {feature.desc.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/55 text-[14px] leading-relaxed">
                      <span className="mt-2 flex-shrink-0 w-1 h-1 rounded-full bg-[#3949AB]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
};

export default Feature;
