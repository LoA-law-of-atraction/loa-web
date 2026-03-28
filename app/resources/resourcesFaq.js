/**
 * Shared FAQ copy for /resources — page body + FAQPage JSON-LD (keep in sync).
 */
export const RESOURCES_FAQ_ITEMS = [
  {
    question: "What is a Law of Attraction app?",
    answer:
      "A Law of Attraction app helps you practice intention and affirmation in one place—often with daily prompts, reflection, and reminders—so your phone supports focus instead of distraction. LoA is built for that: affirmations and mindful pauses live inside the app, without monitoring how you use other apps.",
  },
  {
    question: "How do affirmations support manifestation?",
    answer:
      "Affirmations are short, present-tense statements that reinforce what you want to feel and move toward. They do not replace action; they complement it by keeping your attention aligned with your goals. In LoA, you can write affirmations yourself or use AI generation on paid plans, with clear monthly limits.",
  },
  {
    question: "Is LoA only for meditation or mindfulness?",
    answer:
      "LoA blends Law of Attraction practice with digital wellbeing: you get affirmation screens and streaks for consistency, plus space to pause and reflect. It is not generic meditation software—it is focused on manifestation-minded routines on your phone.",
  },
  {
    question: "Where can I read privacy and terms?",
    answer:
      "Use the Support and policy links on this page to open the privacy policy and terms and conditions. They explain how LoA handles data, subscriptions, and usage for the mobile app and website.",
  },
];

export function resourcesFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: RESOURCES_FAQ_ITEMS.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}
