"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";

export default function ContactFAB() {
  return (
    <Link
      href="/contact-us"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-black"
      aria-label="Contact us"
    >
      <MessageCircle className="h-6 w-6" aria-hidden />
    </Link>
  );
}
