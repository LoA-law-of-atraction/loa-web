"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronRight, Download, Link2, Menu, X } from "lucide-react";

const resourceNav = [
  { href: "/resources", label: "Overview" },
  { href: "/features", label: "Features" },
  { href: "/about-us", label: "About LoA" },
  { href: "/pricing", label: "Pricing" },
  { href: "/updates", label: "Updates" },
];

const pageAnchors = {
  "/resources": [
    { id: "featured", label: "Featured" },
    { id: "guides", label: "Guides" },
    { id: "support-policy", label: "Support & policy" },
    { id: "also-useful", label: "Also useful" },
  ],
};

export default function ResourcesLayoutClient({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState(null);
  const anchors = useMemo(() => pageAnchors[pathname] ?? [], [pathname]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (anchors.length === 0) return;

    const observers = [];
    anchors.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveAnchor(id);
        },
        { rootMargin: "-20% 0px -70% 0px" }
      );

      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, [anchors, pathname]);

  const currentPage =
    resourceNav.find((page) => page.href === pathname)?.label ?? "Resources";

  return (
    <div className="min-h-screen bg-black pb-28 pt-24 text-white antialiased">
      <div className="mx-auto flex max-w-7xl px-4 sm:px-6 lg:px-8">
        <aside className="hidden w-56 flex-shrink-0 self-start pt-10 lg:flex lg:flex-col">
          <div className="sticky top-28 flex max-h-[calc(100vh-8.5rem)] flex-col gap-7 overflow-y-auto pr-1">
            <div>
              <div className="mb-3 flex items-center gap-2 px-2">
                <Link2 className="h-3.5 w-3.5 text-white/30" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
                  Resources
                </span>
              </div>
              <ul className="space-y-0.5">
                {resourceNav.map((page) => {
                  const active = pathname === page.href;

                  return (
                    <li key={page.href}>
                      <Link
                        href={page.href}
                        className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-all duration-150 ${
                          active
                            ? "bg-white/[0.06] font-medium text-white"
                            : "text-white/40 hover:bg-white/[0.03] hover:text-white/80"
                        }`}
                      >
                        {active && (
                          <span className="h-1 w-1 flex-shrink-0 rounded-full bg-purple-300" />
                        )}
                        {page.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="border-t border-white/[0.06] pt-5">
              <Link
                href="/download"
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-white/30 transition-all duration-150 hover:bg-white/[0.03] hover:text-white/70"
              >
                <Download className="h-3.5 w-3.5 flex-shrink-0" />
                Download app
              </Link>
              <Link
                href="/contact-us"
                className="mt-1 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-white/30 transition-all duration-150 hover:bg-white/[0.03] hover:text-white/70"
              >
                <BookOpen className="h-3.5 w-3.5 flex-shrink-0" />
                Contact support
              </Link>
            </div>

            {anchors.length > 0 && (
              <div className="border-t border-white/[0.06] pt-5">
                <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-widest text-white/30">
                  On this page
                </p>
                <ul className="ml-2 space-y-0.5 border-l border-white/[0.07]">
                  {anchors.map((item) => {
                    const active = activeAnchor === item.id;

                    return (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className={`-ml-px block border-l-2 py-1.5 pl-3 pr-2 text-[13px] transition-all duration-150 ${
                            active
                              ? "border-purple-300 text-white"
                              : "border-transparent text-white/30 hover:text-white/70"
                          }`}
                        >
                          {item.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </aside>

        <div className="fixed left-0 right-0 top-[68px] z-30 border-b border-white/[0.06] bg-black/90 px-4 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            className="flex items-center gap-2 py-3 text-sm text-white/60 transition-colors hover:text-white"
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
            <span>{currentPage}</span>
            <ChevronRight
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                sidebarOpen ? "rotate-90" : ""
              }`}
            />
          </button>
        </div>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              className="fixed left-4 right-4 top-[110px] z-40 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d0d0d] shadow-2xl lg:hidden"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <div className="max-h-[70vh] overflow-y-auto p-3">
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                  Resources
                </p>
                {resourceNav.map((page) => {
                  const active = pathname === page.href;

                  return (
                    <Link
                      key={page.href}
                      href={page.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        active
                          ? "bg-white/[0.07] font-medium text-white"
                          : "text-white/50 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      {active && (
                        <span className="h-1 w-1 flex-shrink-0 rounded-full bg-purple-300" />
                      )}
                      {page.label}
                    </Link>
                  );
                })}

                <div className="my-2 border-t border-white/[0.06]" />
                <Link
                  href="/download"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download app
                </Link>
                <Link
                  href="/contact-us"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Contact support
                </Link>

                {anchors.length > 0 && (
                  <>
                    <div className="my-2 border-t border-white/[0.06]" />
                    <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                      On this page
                    </p>
                    {anchors.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={() => setSidebarOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-white/45 transition-colors hover:bg-white/[0.04] hover:text-white"
                      >
                        {item.label}
                      </a>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full pt-12 lg:pt-0">{children}</div>
      </div>
    </div>
  );
}
