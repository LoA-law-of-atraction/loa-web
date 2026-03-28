"use client";

import { useEffect } from "react";
import Testimonial from "@/components/Testimonial";
import Faqs from "@/components/Faqs";
import Feature from "@/components/Features";
import ReadyToStart from "@/components/Ready";
import SolarSystemBackground from "@/components/SolarSystemBackground";

export default function FeaturesClient() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <SolarSystemBackground />

      <div className="pt-20">
        <Feature />
        <ReadyToStart dark />
        <Testimonial />
        <Faqs />
      </div>
    </>
  );
}
