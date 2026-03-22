"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const plans = [
  {
    id: "01",
    title: "Manifest Starter",
    priceMonthly: 0,
    priceYearly: 0,
    benefits: [
      "Basic affirmations",
      "Vision board",
      "Basic streak tracking",
      "Local only – no cloud backup",
    ],
  },
  {
    id: "02",
    title: "Manifest Creator",
    priceMonthly: 4.99,
    priceYearly: 29.99,
    benefits: [
      "Everything in Manifest Starter",
      "50 AI affirmation generations per month",
      "1 GB storage for images & content",
      "Cloud backup – sync & restore",
      "Unlimited manual affirmations",
    ],
  },
  {
    id: "03",
    title: "Manifest Master",
    priceMonthly: 9.99,
    priceYearly: 79.99,
    benefits: [
      "Everything in Manifest Creator",
      "150 AI affirmation generations per month",
      "5 GB storage for images & content",
      "Cloud backup – sync & restore",
      "Priority support",
    ],
  },
];

function formatPrice(n) {
  return n === 0 ? "$0" : `$${n.toFixed(2)}`;
}

function yearlyDiscountPercent(monthly, yearly) {
  if (monthly <= 0) return 0;
  const fullYear = monthly * 12;
  return Math.round(((fullYear - yearly) / fullYear) * 100);
}

const PricingPlans = () => {
  const [yearly, setYearly] = useState(true);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.8 } }}
      className="relative z-10 w-full bg-white "
    >
      <article className="container mx-auto py-14 p-4 px-5 md:px-[5%] 2xl:px-0 max-w-[1200px] flex flex-col gap-4 items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-h2 lg:text-h3 font-bold text-center tracking-tight w-full px-4">
            <span className="block sm:inline">Affordable</span>
            <span className="relative text-[#505050] inline-block">
              <svg
                aria-hidden="true"
                viewBox="0 0 418 42"
                className="absolute top-2/3 left-0 h-[0.58em] w-full fill-black/50 dark:fill-black/30"
                preserveAspectRatio="none"
              >
                <path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.780 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.540-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.810 23.239-7.825 27.934-10.149 28.304-14.005 .417-4.348-3.529-6-16.878-7.066Z"></path>
              </svg>
              <span className="relative text-[#505050]"> Plans & Pricing</span>
            </span>
          </h2>

          <article className="flex flex-col items-center justify-center mt-16">
            <p className="text-justify md:max-w-[60%] md:text-center text-gray-600">
              Manifest Starter, Manifest Creator, and Manifest Master—plans that
              grow with your practice. Clear limits on AI and storage keep pricing fair and sustainable.
            </p>
          </article>

          {/* Billing toggle */}
          <div className="mt-10 flex items-center gap-3">
            <span className={`text-sm font-medium ${!yearly ? "text-gray-900" : "text-gray-400"}`}>
              Monthly
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={yearly}
              onClick={() => setYearly((v) => !v)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 ${
                yearly ? "bg-gray-900" : "bg-gray-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${
                  yearly ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${yearly ? "text-gray-900" : "text-gray-400"}`}>
              Yearly
            </span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              Save up to 50%
            </span>
          </div>
        </div>

        <div className="mt-12 lg:mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {plans.map((plan) => {
            const isFree = plan.priceMonthly === 0 && plan.priceYearly === 0;
            const discount = !isFree ? yearlyDiscountPercent(plan.priceMonthly, plan.priceYearly) : 0;
            const priceMonthlyDisplay = yearly && !isFree ? plan.priceYearly / 12 : plan.priceMonthly;
            const priceYearlyDisplay = plan.priceYearly;

            return (
              <motion.article
                key={plan.id}
                initial={{ opacity: 0, y: 100 }}
                whileInView={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
                viewport={{ once: true }}
                className="my-2 border shadow-lg flex flex-col gap-4 lg:p-10 p-10 rounded-xl relative"
              >
                {!isFree && yearly && discount > 0 && (
                  <span className="absolute top-4 right-4 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white">
                    Save {discount}%
                  </span>
                )}
                <h3 className="text-h2 font-bold">
                  {isFree ? "Free" : formatPrice(priceMonthlyDisplay)}
                  {!isFree && <span className="text-h5 font-inter">/month</span>}
                </h3>
                {yearly && !isFree && (
                  <p className="text-sm text-[#505050] -mt-2">
                    {formatPrice(priceYearlyDisplay)}/year billed annually
                  </p>
                )}
                <h4 className="text-h4 font-bold font-inter mt-3 lg:mt-0">
                  {plan.title}
                </h4>
                {(isFree || !yearly) && (
                  <p className="text-[#505050]">
                    {isFree ? "Free forever" : "Billed monthly"}
                  </p>
                )}
                <ul className="mt-2 grid grid-cols-1 gap-4 mb-5">
                  {plan.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-6 h-6 mr-3 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            );
          })}
        </div>
      </article>
    </motion.section>
  );
};

export default PricingPlans;
