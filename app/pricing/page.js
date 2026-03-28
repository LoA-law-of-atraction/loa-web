"use client";

import "../globals.css";
import { useEffect } from "react";

import Testimonial from "@/components/Testimonial";
import Faqs from "@/components/Faqs";
import ReadyToStart from "@/components/Ready";
import PricingPlans from "@/components/PricingPolicy";
import { RevenueCatProvider } from "@/contexts/RevenueCatContext";

export default function Pricing() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-black min-h-screen">
      <RevenueCatProvider>
        <PricingPlans />
      </RevenueCatProvider>
      <ReadyToStart dark />
      <div className="[&_.bg-bg]:!bg-gradient-to-r [&_.bg-bg]:!from-loa-indigo [&_.bg-bg]:!to-loa-purple">
        <Testimonial />
      </div>
      <Faqs />
    </div>
  );
}
