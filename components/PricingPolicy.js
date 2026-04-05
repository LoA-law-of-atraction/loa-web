"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Minus, Zap, Shield, RefreshCw, Smartphone } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/utils/firebase";
import { debugLoaAuth } from "@/utils/debugLoaAuth";
import { trackEvent } from "@/utils/analytics";
import { useRevenueCat } from "@/contexts/RevenueCatContext";
import { getPaidPlanPurchaseLabel } from "@/utils/revenuecatCta";
import { getAllOfferingsWithPackages } from "@/utils/revenuecatOfferings";

function subscribeFirebaseAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

function getNonAnonymousUserSnapshot() {
  const u = auth.currentUser;
  return u && !u.isAnonymous ? u : null;
}

function getNonAnonymousUserServerSnapshot() {
  return null;
}

const MONTHLY = "monthly";
const YEARLY = "yearly";

/** Purchase / subscribe flow lives on the dashboard subscription page (RevenueCat). */
const PURCHASE_BASE = "/dashboard/subscription";

function buildPurchasePath(planId, billingPeriod) {
  const period = billingPeriod === YEARLY ? "yearly" : "monthly";
  if (planId === "basic" || planId === "pro") {
    /** Opens RevenueCat checkout immediately after auth (no extra “Subscribe” tap). */
    return `${PURCHASE_BASE}?plan=${planId}&period=${period}&checkout=1`;
  }
  return PURCHASE_BASE;
}

function getPlanCtaHref(plan, user, billingPeriod) {
  if (plan.price.monthly === 0) {
    return user ? "/dashboard" : `/login?redirect=${encodeURIComponent("/dashboard")}`;
  }
  const purchasePath = buildPurchasePath(plan.id, billingPeriod);
  if (user) return purchasePath;
  return `/login?redirect=${encodeURIComponent(purchasePath)}`;
}

/** When offerings are loaded, labels match RevenueCat trial / intro eligibility for this user. */
function resolvePaidPlanCtaLabel(planId, billingPeriod, offerings, loading) {
  if (!offerings || loading) return null;
  const groups = getAllOfferingsWithPackages(offerings);
  const group = groups.find((g) => g.identifier === planId);
  if (!group) return null;
  const pkg =
    billingPeriod === YEARLY
      ? group.yearlyPkg ?? group.monthlyPkg
      : group.monthlyPkg ?? group.yearlyPkg;
  if (!pkg) return null;
  return getPaidPlanPurchaseLabel(pkg);
}

const plans = [
  {
    id: "free",
    title: "Manifest Starter",
    price: { monthly: 0, yearly: 0 },
    billing: { monthly: "Free forever", yearly: "Free forever" },
    saveLabel: null,
    bestFor: "Local practice",
    popular: false,
    cta: "Get started free",
    features: [
      { label: "Basic affirmations", included: true },
      { label: "Vision board", included: true },
      { label: "Basic streak tracking", included: true },
      { label: "Image support (on device)", included: true },
      { label: "AI affirmation generation", included: false },
      { label: "Cloud backup & sync", included: false },
      { label: "Advanced templates", included: false },
      { label: "Premium insights", included: false },
      { label: "Priority support", included: false },
    ],
  },
  {
    id: "basic",
    title: "Manifest Creator",
    price: { monthly: 4.99, yearly: 29.99 },
    billing: { monthly: "per month", yearly: "per year" },
    saveLabel: "Save 50%",
    yearlyMonthly: (29.99 / 12).toFixed(2),
    bestFor: "Daily manifesting",
    popular: true,
    cta: "Get Creator",
    features: [
      { label: "50 AI affirmations / month", included: true },
      { label: "Unlimited manual affirmations", included: true },
      { label: "Basic streak tracking", included: true },
      { label: "Image support", included: true },
      { label: "1 GB cloud storage & backup", included: true },
      { label: "Advanced templates", included: true },
      { label: "Cross-device sync", included: true },
      { label: "Premium insights", included: false },
      { label: "Priority support", included: false },
      { label: "Restore across devices", included: true },
    ],
  },
  {
    id: "pro",
    title: "Manifest Master",
    price: { monthly: 9.99, yearly: 79.99 },
    billing: { monthly: "per month", yearly: "per year" },
    saveLabel: "Save 33%",
    yearlyMonthly: (79.99 / 12).toFixed(2),
    bestFor: "Power users",
    popular: false,
    cta: "Get Master",
    features: [
      { label: "150 AI affirmations / month", included: true },
      { label: "Unlimited manual affirmations", included: true },
      { label: "Basic streak tracking", included: true },
      { label: "Image support", included: true },
      { label: "5 GB cloud storage & backup", included: true },
      { label: "Advanced templates", included: true },
      { label: "Cross-device sync", included: true },
      { label: "Premium insights", included: true },
      { label: "Priority support", included: true },
      { label: "Restore across devices", included: true },
    ],
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.12, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

const trustItems = [
  { icon: Shield, label: "Secure payments" },
  { icon: RefreshCw, label: "Cancel anytime" },
  { icon: Smartphone, label: "iOS included" },
];

const PricingPlans = () => {
  const [billingPeriod, setBillingPeriod] = useState(MONTHLY);
  const [rcOfferings, setRcOfferings] = useState(null);
  const [rcOfferingsLoading, setRcOfferingsLoading] = useState(false);
  const { isConfigured, getOfferings } = useRevenueCat();
  /** Avoid login href flash: useEffect runs after paint; this syncs before paint and matches Firebase’s current user. */
  const user = useSyncExternalStore(
    subscribeFirebaseAuth,
    getNonAnonymousUserSnapshot,
    getNonAnonymousUserServerSnapshot
  );

  useEffect(() => {
    if (!user || !isConfigured) {
      setRcOfferings(null);
      setRcOfferingsLoading(false);
      return;
    }
    let cancelled = false;
    setRcOfferingsLoading(true);
    getOfferings({ currency: "USD" })
      .then((o) => {
        if (!cancelled) setRcOfferings(o);
      })
      .catch(() => {
        if (!cancelled) setRcOfferings(null);
      })
      .finally(() => {
        if (!cancelled) setRcOfferingsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, isConfigured, getOfferings]);

  useEffect(() => {
    const cu = auth.currentUser;
    const basic = plans.find((p) => p.id === "basic");
    const pro = plans.find((p) => p.id === "pro");
    debugLoaAuth("pricing", {
      syncUser: user ? { uid: user.uid, email: user.email } : null,
      authCurrentUser: cu
        ? { uid: cu.uid, isAnonymous: cu.isAnonymous, email: cu.email }
        : null,
      billingPeriod,
      hrefBasic: basic ? getPlanCtaHref(basic, user, billingPeriod) : null,
      hrefPro: pro ? getPlanCtaHref(pro, user, billingPeriod) : null,
    });
  }, [user, billingPeriod]);

  const getPrice = (plan) => {
    if (plan.price.monthly === 0) return "$0";
    if (billingPeriod === YEARLY) return `$${plan.yearlyMonthly}`;
    return `$${plan.price.monthly.toFixed(2)}`;
  };

  const getBilling = (plan) => {
    if (plan.price.monthly === 0) return "Free forever";
    if (billingPeriod === YEARLY) {
      return `Billed $${plan.price.yearly.toFixed(2)}/year`;
    }
    return "per month";
  };

  return (
    <section className="relative w-full text-white overflow-hidden pt-24 md:pt-32 pb-24">
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* Dot grid texture */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)",
            backgroundSize: "36px 36px",
          }}
        />
        {/* Nebula glows — on-brand indigo/purple */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-loa-indigo/[0.09] blur-[160px]" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-loa-purple/[0.07] blur-[130px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] rounded-full bg-loa-indigo/[0.05] blur-[100px]" />
      </div>

      <div className="mx-auto px-5 md:px-[5%] max-w-[1200px]">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase text-loa-indigo border border-loa-indigo/30 bg-loa-indigo/[0.08] mb-6">
            <Zap className="w-3 h-3" />
            Pricing
          </span>

          <h1 className="font-tiempos text-h2 lg:text-h3 font-semibold tracking-tight leading-tight text-white">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-white/50 text-base md:text-lg max-w-[480px] mx-auto leading-relaxed">
            Start free. Upgrade when you&apos;re ready to unlock AI and advanced features.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex p-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setBillingPeriod(MONTHLY)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                billingPeriod === MONTHLY
                  ? "bg-white text-black shadow-sm"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod(YEARLY)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                billingPeriod === YEARLY
                  ? "bg-white text-black shadow-sm"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Yearly
              <span className="text-[10px] font-bold tracking-wide text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-md">
                Save 50%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              className={`relative${plan.popular ? " md:-translate-y-3" : ""}`}
            >
              {/* Gradient border wrapper for popular card */}
              {plan.popular ? (
                <div className="relative rounded-2xl p-[1.5px] bg-gradient-to-b from-loa-indigo via-loa-purple/80 to-loa-purple/10 shadow-[0_0_80px_rgba(57,73,171,0.22)]">
                  <div className="relative flex flex-col rounded-[14px] p-6 lg:p-7 bg-[#080810]">
                    <PopularBadge />
                    <CardContent
                      plan={plan}
                      billingPeriod={billingPeriod}
                      getPrice={getPrice}
                      getBilling={getBilling}
                      ctaHref={getPlanCtaHref(plan, user, billingPeriod)}
                      paidCtaLabel={
                        plan.id === "basic" || plan.id === "pro"
                          ? resolvePaidPlanCtaLabel(plan.id, billingPeriod, rcOfferings, rcOfferingsLoading)
                          : null
                      }
                      user={user}
                      popular
                    />
                  </div>
                </div>
              ) : (
                <div className="relative flex flex-col rounded-2xl p-6 lg:p-7 bg-white/[0.02] border border-white/[0.07] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300">
                  <CardContent
                    plan={plan}
                    billingPeriod={billingPeriod}
                    getPrice={getPrice}
                    getBilling={getBilling}
                    ctaHref={getPlanCtaHref(plan, user, billingPeriod)}
                    paidCtaLabel={
                      plan.id === "basic" || plan.id === "pro"
                        ? resolvePaidPlanCtaLabel(plan.id, billingPeriod, rcOfferings, rcOfferingsLoading)
                        : null
                    }
                    user={user}
                    popular={false}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Trust strip */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-6 mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {trustItems.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-white/30 text-xs">
              <Icon className="w-3.5 h-3.5 text-white/20" strokeWidth={1.5} />
              {label}
            </div>
          ))}
        </motion.div>

        <motion.p
          className="text-center text-white/20 text-xs mt-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
        >
          Prices in USD. Subscription managed on the App Store. Change or cancel anytime.
        </motion.p>
      </div>
    </section>
  );
};

function PopularBadge() {
  return (
    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide text-white bg-gradient-to-r from-loa-indigo to-loa-purple shadow-[0_0_24px_rgba(57,73,171,0.6)]">
        <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
        Most popular
      </span>
    </div>
  );
}

function CardContent({ plan, billingPeriod, getPrice, getBilling, ctaHref, paidCtaLabel, user, popular }) {
  return (
    <>
      {/* Plan info */}
      <div className="mb-6">
        <p className="text-xs font-bold tracking-widest uppercase text-white/35 mb-3">
          {plan.title}
        </p>

        <div className="flex items-baseline gap-1.5 mb-1.5">
          <span className="text-4xl font-bold tabular-nums text-white">
            {getPrice(plan)}
          </span>
          {plan.price.monthly !== 0 && (
            <span className="text-white/35 text-sm">/mo</span>
          )}
        </div>

        <div className="flex items-center gap-2 min-h-[1.5rem]">
          <p className="text-white/35 text-sm">{getBilling(plan)}</p>
          {billingPeriod === "yearly" && plan.saveLabel && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[10px] font-bold tracking-wide text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded-md"
            >
              {plan.saveLabel}
            </motion.span>
          )}
        </div>

        <p className="mt-3 text-[13px] text-white/30">
          Best for <span className="text-white/55">{plan.bestFor}</span>
        </p>
      </div>

      {/* CTA button — prefetch off: href depends on auth; avoids caching /login when user is signed in */}
      <Link
        prefetch={false}
        href={ctaHref}
        onClick={() => {
          trackEvent("pricing_plan_cta_clicked", {
            plan_id: plan.id,
            billing_period: billingPeriod,
            is_authenticated: !!user,
            cta_href: ctaHref,
          });

          debugLoaAuth("pricing-click", {
            planId: plan.id,
            ctaHref,
            label: plan.price.monthly === 0 ? "free" : user ? plan.cta : "guest",
          });
        }}
        className={`block w-full text-center py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 mb-6 ${
          popular
            ? "bg-gradient-to-r from-loa-indigo to-loa-purple text-white shadow-[0_0_28px_rgba(57,73,171,0.4)] hover:shadow-[0_0_40px_rgba(57,73,171,0.6)] hover:opacity-90"
            : plan.id === "pro"
              ? "bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.1]"
              : "bg-white/[0.05] hover:bg-white/[0.09] text-white/65 hover:text-white border border-white/[0.07]"
        }`}
      >
        {plan.price.monthly === 0
          ? "Get started free"
          : user
            ? paidCtaLabel ?? plan.cta
            : "Sign in to continue"}
      </Link>

      {/* Divider */}
      <div className="border-t border-white/[0.06] mb-5" />

      {/* Feature list */}
      <ul className="flex flex-col gap-3">
        {plan.features.map((feature, fi) => (
          <li key={fi} className="flex items-start gap-3">
            <span
              className={`mt-[1px] flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                feature.included
                  ? popular
                    ? "bg-loa-indigo/20 text-loa-indigo"
                    : "bg-white/[0.07] text-white/55"
                  : "bg-transparent text-white/15"
              }`}
            >
              {feature.included ? (
                <Check className="w-2.5 h-2.5" strokeWidth={3} />
              ) : (
                <Minus className="w-2.5 h-2.5" strokeWidth={2.5} />
              )}
            </span>
            <span
              className={`text-[13px] leading-snug ${
                feature.included ? "text-white/65" : "text-white/20"
              }`}
            >
              {feature.label}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

export default PricingPlans;
