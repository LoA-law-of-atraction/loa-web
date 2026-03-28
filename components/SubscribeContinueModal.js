"use client";

import Link from "next/link";
import { Lock, X } from "lucide-react";

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   title?: string;
 *   description?: string;
 * }} props
 */
export default function SubscribeContinueModal({ open, onClose, title, description }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscribe-continue-title"
    >
      <div
        className="bg-gradient-to-b from-slate-900 to-black border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 mb-4">
            <Lock className="h-7 w-7" />
          </div>
          <h2 id="subscribe-continue-title" className="text-xl font-semibold text-white mb-2">
            {title || "Subscribe to continue"}
          </h2>
          <p className="text-white/70 text-sm mb-6">
            {description ||
              "This action needs a plan with enough quota. View plans to upgrade or manage your subscription."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard/subscription"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold px-5 py-2.5 text-sm transition-colors"
              onClick={onClose}
            >
              View plans
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 text-white/90 hover:bg-white/10 px-5 py-2.5 text-sm transition-colors"
            >
              <X className="h-4 w-4" />
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
