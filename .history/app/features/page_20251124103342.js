"use client";

import "../globals.css";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Testimonial from "@/components/Testimonial";
import Faqs from "@/components/Faqs";
import Feature from "@/components/Features";
import ReadyToStart from "@/components/Ready";
import SolarSystemBackground from "@/components/SolarSystemBackground";

export default function Features() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      {/* Solar System Background */}
      <SolarSystemBackground />
      
      <div className="pt-20">
        <Feature />
        <Analysis />
        <ReadyToStart />
        <Testimonial />
        <div className="relative top-[500px] mb-[500px]">
          <Faqs />
        </div>
      </div>
    </>
  );
}
