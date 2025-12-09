"use client";
import { motion } from "framer-motion";

const plans = [
  {
    id: "01",
    title: "Free Tier",
    price: "$0",
    billing: "Free",
    benefits: [
      "Basic mindful pause before opening blocked apps",
      "Basic streak tracking",
    ],
  },
  {
    id: "02",
    title: "Premium Tier",
    price: "$4.99",
    billing: "Billed Annually at $29.99",
    benefits: ["Unlimited Affirmation"],
  },
];

const PricingPlans = () => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.8 } }}
      className="relative z-10 w-full bg-white "
    >
      <article className="container mx-auto py-14 p-4 px-5 md:px-[5%] 2xl:px-0 max-w-[1200px] gap-4flex flex-col items-center justify-center gap-4">
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-h2 lg:text-h3 font-bold text-center tracking-tight w-full px-4">
            Affordable
            <span className="relative whitespace-nowrap text-[#505050]">
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
            <p className="text-justify md:max-w-[60%] md:text-center">
              Compare our Basic and Premium plans to find the perfect fit for
              your journaling and biography goals. Start your free trial now.
            </p>
          </article>
        </div>
        <div className="mt-16 lg:mt-26 grid grid-cols-1 md:grid-cols-2 gap-16">
          {plans.map((paragraph) => (
            <motion.article
              key={paragraph.id}
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
              viewport={{ once: true }}
              className="my-2 border shadow-lg flex flex-col gap-4 lg:p-10 p-10 rounded-xl"
            >
              <h3 className="text-h2 font-bold">
                {paragraph.price}
                <span className="text-h5 font-inter">/Month</span>
              </h3>
              <h4 className="text-h4 font-bold font-inter mt-3 lg:mt-0">
                {paragraph.title}
              </h4>
              <p className="text-[#505050]">{paragraph.billing}</p>
              <ul className="mt-2 grid grid-cols-1 gap-4 mb-5">
                {paragraph.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6 mr-3"
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
          ))}
        </div>
      </article>
    </motion.section>
  );
};

export default PricingPlans;
