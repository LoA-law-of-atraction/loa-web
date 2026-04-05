"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { CircleUserRound } from "lucide-react";
import { auth } from "@/utils/firebase";

const NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/resources", label: "Resources" },
  { href: "/about-us", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/download", label: "Download" },
  { href: "/contact-us", label: "Contact" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userLabel, setUserLabel] = useState("");
  const [userPhotoUrl, setUserPhotoUrl] = useState("");
  const pathname = usePathname();

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user || user.isAnonymous) {
        setUserLabel("");
        setUserPhotoUrl("");
        return;
      }
      const label = user.displayName || user.email || `user:${user.uid.slice(0, 8)}`;
      setUserLabel(label);
      setUserPhotoUrl(user.photoURL || "");
    });
    return () => unsub();
  }, []);

  const navbarVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 w-full h-[68px] z-50 border-b flex items-center bg-black/40 backdrop-blur-xl border-white/10"
        variants={navbarVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="px-5 md:px-[5%] w-full mx-auto flex items-center justify-between h-full">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 cursor-pointer font-ubuntu font-bold text-white text-lg"
            onClick={() => setIsOpen(false)}
          >
            <Image src="/app_logo.svg" alt="LoA Logo" width={28} height={28} priority />
            LoA
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-10">
            <ul className="flex space-x-10">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={
                      pathname === href
                        ? "text-silver transition-colors duration-300"
                        : "text-white hover:text-gray-300 transition-colors duration-300"
                    }
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            {userLabel ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 border border-white/15 bg-white/5 text-white/90 hover:bg-white/10 transition-colors max-w-[240px]"
                title={userLabel}
              >
                {userPhotoUrl ? (
                  <img
                    src={userPhotoUrl}
                    alt={userLabel}
                    className="w-5 h-5 rounded-full shrink-0 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <CircleUserRound className="w-4 h-4 shrink-0 text-white/80" />
                )}
                <span className="text-sm truncate">{userLabel}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 font-medium transition-colors bg-white text-black hover:bg-gray-100"
              >
                Sign in
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(true)}
              aria-label="Open menu"
              className="flex flex-col justify-center items-center gap-[5px] w-12 h-12"
            >
              <span className="block w-6 h-[1.5px] bg-white rounded-full" />
              <span className="block w-6 h-[1.5px] bg-white rounded-full" />
              <span className="block w-6 h-[1.5px] bg-white rounded-full" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-[28px] overflow-hidden"
              style={{
                background:
                  "linear-gradient(160deg, #0d0d0d 0%, #0a0a14 60%, #0d0014 100%)",
                borderTop: "1px solid rgba(105, 27, 154, 0.25)",
                boxShadow: "0 -20px 60px rgba(57, 73, 171, 0.15)",
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-[3px] rounded-full bg-white/20" />
              </div>

              {/* Header row */}
              <div className="flex items-center justify-between px-6 pt-3 pb-5 border-b border-white/[0.06]">
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 font-ubuntu font-bold text-white text-base"
                >
                  <Image src="/app_logo.svg" alt="LoA Logo" width={24} height={24} priority />
                  LoA
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Nav links */}
              <ul className="px-4 pt-4 pb-2">
                {NAV_LINKS.map(({ href, label }, i) => {
                  const active = pathname === href;
                  return (
                    <motion.li
                      key={href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.06 + i * 0.055, duration: 0.28 }}
                    >
                      <Link
                        href={href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center justify-between w-full px-3 py-[14px] rounded-xl transition-all duration-200 group ${
                          active
                            ? "bg-white/[0.05]"
                            : "hover:bg-white/[0.04]"
                        }`}
                      >
                        <span
                          className={`text-[17px] font-medium tracking-wide ${
                            active
                              ? "bg-gradient-to-r from-[#7986CB] to-[#CE93D8] bg-clip-text text-transparent"
                              : "text-white/75 group-hover:text-white transition-colors"
                          }`}
                        >
                          {label}
                        </span>
                        {active && (
                          <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[#3949AB] to-[#6A1B9A]" />
                        )}
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>

              {/* CTA */}
              <div className="px-6 pt-3 pb-10">
                {userLabel ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-white/90 hover:bg-white/10 transition-colors inline-flex items-center justify-center gap-2"
                    title={userLabel}
                  >
                    {userPhotoUrl ? (
                      <img
                        src={userPhotoUrl}
                        alt={userLabel}
                        className="w-[18px] h-[18px] rounded-full shrink-0 object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <CircleUserRound className="w-4 h-4 shrink-0 text-white/80" />
                    )}
                    <span className="truncate">{userLabel}</span>
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center py-[14px] rounded-2xl font-semibold text-[15px] text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
                    style={{
                      background:
                        "linear-gradient(135deg, #3949AB 0%, #6A1B9A 100%)",
                      boxShadow: "0 4px 24px rgba(57, 73, 171, 0.35)",
                    }}
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
