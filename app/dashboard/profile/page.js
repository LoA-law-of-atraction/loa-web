"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { Calendar, Crown, User } from "lucide-react";
import { motion } from "framer-motion";
import { auth } from "@/utils/firebase";
import {
  DEFAULT_ENTITLEMENT_ID,
  RevenueCatProvider,
  useRevenueCat,
} from "@/contexts/RevenueCatContext";
import { MembershipStatusLink, SubscriptionScreen } from "@/components/SubscriptionPanel";

function formatExpiry(customerInfo, entitlementId = "pro") {
  const entitlements = customerInfo?.entitlements;
  if (!entitlements) return null;
  const ent = entitlements[entitlementId] ?? entitlements.all?.[entitlementId];
  const date = ent?.expirationDate ?? ent?.expiresDate;
  if (!date) return null;
  try {
    const parsed = typeof date === "string" ? new Date(date) : date;
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return null;
  }
}

function ProfileContent({ user, displayName, avatarFallback }) {
  const { isConfigured, loading, customerInfo, isPro } = useRevenueCat();
  const expiry = formatExpiry(customerInfo, DEFAULT_ENTITLEMENT_ID);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border border-white/[0.07] bg-white/[0.025] mb-8"
        >
          <div className="grid grid-cols-1 gap-6 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="flex items-center gap-4 min-w-0">
              {user?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt={displayName}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/8 text-lg font-medium text-white/60">
                  {avatarFallback}
                </div>
              )}
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/60">
                  <User className="h-3.5 w-3.5" />
                  Account
                </div>
                <p className="mt-3 text-xl font-semibold tracking-tight break-all">{displayName}</p>
                {user?.email ? (
                  <p className="mt-1 text-sm text-white/40 break-all">{user.email}</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/35">Membership status</p>
              <div className="mt-2 flex items-center gap-2">
                <Crown className={`h-4 w-4 ${isPro ? "text-emerald-400" : "text-white/40"}`} />
                <p className="text-sm font-medium text-white/85">
                  {loading && isConfigured ? "Checking..." : isPro ? "Premium active" : "Free plan"}
                </p>
              </div>
              {expiry ? (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-white/45">
                  <Calendar className="h-3.5 w-3.5" />
                  Active through {expiry}
                </p>
              ) : null}
            </div>
          </div>
        </motion.section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6"
          >
            <h2 className="text-lg font-semibold tracking-tight text-white">Profile</h2>
            <p className="mt-2 text-sm text-white/45">
              Subscription and billing are handled below. Account deletion stays separate.
            </p>

            <div className="mt-6 space-y-4">
              <MembershipStatusLink />
              <Link
                href="/dashboard/account-deletion"
                className="block text-xs text-white/30 underline decoration-white/15 underline-offset-4 hover:text-white/50 transition-colors"
              >
                Delete account
              </Link>
            </div>
          </motion.section>

          <motion.section
            id="subscription"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6"
          >
            <SubscriptionScreen embedded />
          </motion.section>
        </div>
      </div>
    </div>
  );
}

export default function DashboardProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      try {
        if (!nextUser || nextUser.isAnonymous) {
          setUser(null);
          router.replace("/login");
          return;
        }
        setUser(nextUser);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const displayName = useMemo(() => {
    if (!user) return "";
    return user.displayName || user.email || `Guest ${user.uid.slice(0, 8)}`;
  }, [user]);

  const avatarFallback = useMemo(() => {
    if (!displayName) return "?";
    return displayName.trim().charAt(0).toUpperCase();
  }, [displayName]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t border-white/30" />
      </div>
    );
  }

  return (
    <RevenueCatProvider>
      <ProfileContent user={user} displayName={displayName} avatarFallback={avatarFallback} />
    </RevenueCatProvider>
  );
}
