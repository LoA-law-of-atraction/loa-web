"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Download,
  FileText,
  Heart,
  Shield,
  Sparkles,
} from "lucide-react";

const heroGuide = {
  href: "/features",
  title: "How LoA supports your daily digital practice",
  description:
    "See how affirmation screens, mindful pauses, and reflection tools fit together into one intentional routine.",
  icon: Sparkles,
  tag: "Guide",
  readTime: "5 min read",
};

const guides = [
  {
    href: "/about-us",
    title: "Our philosophy",
    description:
      "The thinking behind LoA: bringing the Law of Attraction into everyday phone use without adding noise.",
    icon: Heart,
    tag: "Guide",
    readTime: "4 min read",
  },
  {
    href: "/features",
    title: "Feature overview",
    description:
      "A practical look at the core experiences inside LoA, from affirmations to conscious interruption moments.",
    icon: BookOpen,
    tag: "Guide",
    readTime: "5 min read",
  },
  {
    href: "/download",
    title: "Get the app",
    description:
      "Download LoA and start building a steadier, more intentional relationship with your digital life.",
    icon: Download,
    tag: "Guide",
    readTime: "2 min read",
  },
  {
    href: "/pricing",
    title: "Plans and access",
    description:
      "Review the current plans and what is included if you want more guidance, sync, or advanced features.",
    icon: FileText,
    tag: "Guide",
    readTime: "3 min read",
  },
];

const support = [
  {
    href: "/updates",
    title: "Product updates",
    description:
      "Track what is new in LoA and what is coming next as the product evolves.",
    icon: Sparkles,
    tag: "Update",
    readTime: "2 min read",
  },
  {
    href: "/privacy-policy",
    title: "Privacy policy",
    description:
      "Understand how LoA handles your information and what data is and is not part of the product experience.",
    icon: Shield,
    tag: "Policy",
    readTime: "4 min read",
  },
  {
    href: "/terms-and-conditions",
    title: "Terms and conditions",
    description:
      "Review the legal terms that apply when using the LoA app and website.",
    icon: Shield,
    tag: "Policy",
    readTime: "4 min read",
  },
];

const related = [
  { href: "/features", label: "Explore features", icon: Sparkles },
  { href: "/download", label: "Download LoA", icon: Download },
  { href: "/updates", label: "Latest updates", icon: FileText },
];

const tagStyles = {
  Guide: "text-purple-300 bg-purple-400/10 border-purple-400/20",
  Update: "text-indigo-300 bg-indigo-400/10 border-indigo-400/20",
  Policy: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  Support: "text-pink-300 bg-pink-400/10 border-pink-400/20",
};

function SectionLabel({ children }) {
  return (
    <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-white/30">
      {children}
    </p>
  );
}

function HeroCard({ item }) {
  const Icon = item.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Link
        href={item.href}
        className="group relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-purple-400/25 bg-gradient-to-br from-purple-500/15 via-indigo-500/10 to-transparent p-7 transition-all duration-300 hover:border-purple-300/40 hover:from-purple-500/20"
      >
        <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-purple-400/10 blur-3xl" />

        <div className="relative flex items-start gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-purple-400/30 bg-purple-400/15 text-purple-300">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2.5 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${tagStyles[item.tag]}`}
              >
                {item.tag}
              </span>
              <span className="text-[11px] text-white/30">{item.readTime}</span>
            </div>
            <h1 className="mb-2.5 text-xl font-bold leading-snug text-white transition-colors group-hover:text-white/90">
              {item.title}
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-white/60">
              {item.description}
            </p>
          </div>
        </div>

        <div className="relative flex items-center gap-1.5 text-sm font-medium text-purple-300">
          Open resource
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </div>
      </Link>
    </motion.div>
  );
}

function SmallCard({ item, index }) {
  const Icon = item.icon;

  return (
    <motion.div
      custom={index}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.35,
        delay: index * 0.07,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <Link
        href={item.href}
        className="group flex h-full items-start gap-4 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.05]"
      >
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.06] text-white/40 transition-colors group-hover:text-white/70">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${tagStyles[item.tag]}`}
            >
              {item.tag}
            </span>
            <span className="text-[11px] text-white/25">{item.readTime}</span>
          </div>
          <h2 className="mb-1 text-sm font-semibold leading-snug text-white/80 transition-colors group-hover:text-white">
            {item.title}
          </h2>
          <p className="line-clamp-2 text-[12px] leading-relaxed text-white/45">
            {item.description}
          </p>
        </div>
        <ChevronRight className="mt-1 hidden h-4 w-4 flex-shrink-0 text-white/20 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-white/50 sm:block" />
      </Link>
    </motion.div>
  );
}

export default function ResourcesClient() {
  return (
    <article className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 pb-24 lg:max-w-3xl">
      <nav className="text-xs text-white/30" aria-label="Breadcrumb">
        <ol className="flex flex-wrap gap-x-2 gap-y-1">
          <li>
            <Link href="/" className="transition-colors hover:text-white/60">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-white/50">Resources</li>
        </ol>
      </nav>

      <motion.header
        className="flex flex-col gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
          Resources
        </p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
          Guides, support, and product pages
        </h1>
        <p className="max-w-[620px] text-base leading-relaxed text-white/55 sm:text-lg">
          A single place for the key LoA pages: product guides, downloads,
          updates, and support information for your daily practice.
        </p>
      </motion.header>

      <section id="featured" className="flex scroll-mt-28 flex-col gap-3">
        <SectionLabel>Featured</SectionLabel>
        <HeroCard item={heroGuide} />
      </section>

      <section id="guides" className="flex scroll-mt-28 flex-col gap-3">
        <SectionLabel>Guides</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {guides.map((item, index) => (
            <SmallCard key={item.href} item={item} index={index} />
          ))}
        </div>
      </section>

      <section id="support-policy" className="flex scroll-mt-28 flex-col gap-3">
        <SectionLabel>Support & policy</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {support.map((item, index) => (
            <SmallCard key={item.href} item={item} index={index} />
          ))}
        </div>
      </section>

      <section id="also-useful" className="flex scroll-mt-28 flex-col gap-3">
        <SectionLabel>Also useful</SectionLabel>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {related.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.05]"
              >
                <Icon className="h-4 w-4 flex-shrink-0 text-white/30 transition-colors group-hover:text-white/60" />
                <span className="text-sm text-white/55 transition-colors group-hover:text-white/85">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </article>
  );
}
