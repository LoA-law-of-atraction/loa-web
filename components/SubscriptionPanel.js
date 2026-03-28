"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, Check, Crown, ExternalLink, Loader2, Minus, Sparkles, Zap } from "lucide-react";
import { DEFAULT_ENTITLEMENT_ID, useRevenueCat } from "@/contexts/RevenueCatContext";
import { debugLoaAuth } from "@/utils/debugLoaAuth";
import { getPaidPlanPurchaseLabel } from "@/utils/revenuecatCta";
import { getAllOfferingsWithPackages } from "@/utils/revenuecatOfferings";

const MONTHLY = "monthly";
const YEARLY = "yearly";

const PLAN_CONTENT = {
  free: {
    id: "free",
    title: "Manifest Starter",
    price: "$0",
    billing: "Free forever",
    saveLabel: null,
    bestFor: "Local practice",
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
  basic: {
    id: "basic",
    title: "Manifest Creator",
    popular: true,
    saveLabel: "Save 50%",
    bestFor: "Daily manifesting",
    cta: "Subscribe to Creator",
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
  pro: {
    id: "pro",
    title: "Manifest Master",
    saveLabel: "Save 33%",
    bestFor: "Power users",
    cta: "Subscribe to Master",
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
};

function calculateYearlySavingsLabel(monthlyPkg, yearlyPkg) {
  const monthly = getPackagePriceAmount(monthlyPkg);
  const yearly = getPackagePriceAmount(yearlyPkg);
  if (monthly == null || yearly == null || monthly <= 0) return null;
  const fullYear = monthly * 12;
  if (yearly >= fullYear) return null;
  return `Save ${Math.round(((fullYear - yearly) / fullYear) * 100)}%`;
}

function getPackagePrice(pkg) {
  if (!pkg) return null;
  const product = pkg.webBillingProduct || pkg.rcBillingProduct;
  return product?.price?.formattedPrice ?? product?.currentPrice?.formattedPrice ?? null;
}

function getPackageCurrencySymbol(pkg) {
  const formatted = getPackagePrice(pkg);
  if (!formatted || typeof formatted !== "string") return null;
  const match = formatted.trim().match(/^([^\d\s.,]+)/);
  return match ? match[1] : null;
}

function formatYearlyBillingText(pkg) {
  const formatted = getPackagePrice(pkg);
  if (!formatted) return "Billed yearly";
  return `Billed ${formatted}/year`;
}

function getPackagePriceAmount(pkg) {
  if (!pkg) return null;
  const product = pkg.webBillingProduct || pkg.rcBillingProduct;
  const price = product?.price ?? product?.currentPrice;
  const amount = price?.amount ?? price?.value;
  if (amount == null) return null;
  const num = Number(amount);
  if (Number.isNaN(num)) return null;
  return num >= 100 ? num / 100 : num;
}

function formatExpiry(customerInfo, entitlementId = "pro") {
  const entitlements = customerInfo?.entitlements;
  if (!entitlements) return null;
  const ent = entitlements[entitlementId] ?? entitlements.all?.[entitlementId];
  const date = ent?.expirationDate ?? ent?.expiresDate;
  if (!date) return null;
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return null;
  }
}

export function SubscriptionScreen({ embedded = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    isConfigured,
    customerInfo,
    loading,
    isPro,
    isVip,
    getOfferings,
    purchase,
    error,
  } = useRevenueCat();
  const [offerings, setOfferings] = useState(null);
  const [offeringsLoading, setOfferingsLoading] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState(MONTHLY);
  const [purchasingPackageId, setPurchasingPackageId] = useState(null);

  useEffect(() => {
    const period = searchParams.get("period");
    if (period === "yearly") setBillingPeriod(YEARLY);
    else if (period === "monthly") setBillingPeriod(MONTHLY);
  }, [searchParams]);

  useEffect(() => {
    debugLoaAuth("subscription", "screen state", {
      plan: searchParams.get("plan"),
      period: searchParams.get("period"),
      isConfigured,
      loading,
      isPro,
      isVip,
      error: error || null,
      rcKeyPresent: Boolean(
        typeof process !== "undefined" && process.env.NEXT_PUBLIC_REVENUECAT_WEB_API_KEY
      ),
    });
  }, [searchParams, isConfigured, loading, isPro, isVip, error]);

  useEffect(() => {
    debugLoaAuth("subscription", "offerings", {
      offeringsLoading,
      hasOfferings: !!offerings,
    });
  }, [offeringsLoading, offerings]);

  useEffect(() => {
    if (searchParams.get("checkout") === "1") return;
    const plan = searchParams.get("plan");
    if (!plan || (plan !== "basic" && plan !== "pro")) return;
    if (offeringsLoading || isPro) return;
    const t = window.setTimeout(() => {
      document.getElementById(`subscription-plan-${plan}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 120);
    return () => window.clearTimeout(t);
  }, [searchParams, offeringsLoading, isPro]);

  const manageUrl = customerInfo?.managementURL;
  const showManageBlock = !!manageUrl;

  useEffect(() => {
    if (!isConfigured) return;
    let mounted = true;
    setOfferingsLoading(true);
    getOfferings({ currency: "USD" })
      .then((off) => { if (mounted) setOfferings(off); })
      .catch(() => { if (mounted) setOfferings(null); })
      .finally(() => { if (mounted) setOfferingsLoading(false); });
    return () => { mounted = false; };
  }, [isConfigured, getOfferings]);

  const handlePurchase = useCallback(async (rcPackage) => {
    setPurchasingPackageId(rcPackage?.identifier ?? null);
    try {
      await purchase({ rcPackage, skipSuccessPage: true });
    } catch {
    } finally {
      setPurchasingPackageId(null);
    }
  }, [purchase]);

  /** From pricing “Get Creator/Master”: after login, open RevenueCat checkout immediately (no extra Subscribe tap). */
  useEffect(() => {
    if (embedded) return;
    if (searchParams.get("checkout") !== "1") return;
    if (!isConfigured || offeringsLoading || !offerings || isPro) return;

    const planKey = searchParams.get("plan");
    if (planKey !== "basic" && planKey !== "pro") return;

    const offeringGroups = getAllOfferingsWithPackages(offerings);
    const group = offeringGroups.find((o) => o.identifier === planKey);
    if (!group) return;

    const pkg =
      billingPeriod === YEARLY
        ? group.yearlyPkg ?? group.monthlyPkg
        : group.monthlyPkg ?? group.yearlyPkg;

    if (!pkg) return;

    /** Do not call router.replace before purchase(): changing the URL re-renders and destroys RevenueCat’s checkout element (“Element has already been destroyed”). */
    const stripCheckoutFromUrl = () => {
      const qs = new URLSearchParams(searchParams.toString());
      qs.delete("checkout");
      const nextUrl = qs.toString() ? `${pathname}?${qs}` : pathname;
      router.replace(nextUrl, { scroll: false });
    };

    void handlePurchase(pkg).finally(() => {
      stripCheckoutFromUrl();
    });
  }, [
    embedded,
    searchParams,
    isConfigured,
    offeringsLoading,
    offerings,
    isPro,
    billingPeriod,
    pathname,
    router,
    handlePurchase,
  ]);

  const hasRcWebKey = Boolean(String(process.env.NEXT_PUBLIC_REVENUECAT_WEB_API_KEY || "").trim());

  /** `isConfigured` is false until uid + sdkReady; with a valid env key that window is "still loading", not "missing config". */
  if (!isConfigured) {
    if (!hasRcWebKey) {
      return (
        <div className={embedded ? "py-6" : "max-w-2xl mx-auto px-4 py-12"}>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
            <p className="text-amber-200/90 mb-2">Subscriptions are not configured.</p>
            <p className="text-white/60 text-sm mb-3">
              Add <code className="bg-white/10 px-1 rounded">NEXT_PUBLIC_REVENUECAT_WEB_API_KEY</code> to
              <code className="bg-white/10 px-1 rounded ml-1">.env</code> and configure your products in{" "}
              <a href="https://app.revenuecat.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">
                RevenueCat
              </a>.
            </p>
          </div>
        </div>
      );
    }
    if (error) {
      return (
        <div className={embedded ? "py-6" : "max-w-2xl mx-auto px-4 py-12"}>
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-red-300 text-sm">{error}</div>
        </div>
      );
    }
    return (
      <div
        className={
          embedded
            ? "py-8 flex flex-col items-center justify-center gap-3"
            : "max-w-2xl mx-auto px-4 py-12 flex flex-col items-center justify-center gap-3"
        }
      >
        <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
        <p className="text-white/40 text-sm text-center">Preparing subscription options…</p>
      </div>
    );
  }

  if (loading && !customerInfo) {
    return (
      <div className={embedded ? "py-8 flex justify-center" : "max-w-2xl mx-auto px-4 py-12 flex justify-center"}>
        <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`relative mx-auto ${embedded ? "px-0 py-0" : "px-4 py-8 sm:py-12"} ${!isPro ? "max-w-6xl" : "max-w-2xl"}`}>

      {/* Background atmosphere (only on full page) */}
      {!embedded && (
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.022]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
              backgroundSize: "36px 36px",
            }}
          />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-loa-indigo/[0.08] blur-[150px]" />
          <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] rounded-full bg-loa-purple/[0.06] blur-[120px]" />
        </div>
      )}

      {/* Page heading */}
      <motion.div
        className={embedded ? "mb-6" : "mb-10"}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        {embedded ? (
          <h2 className="font-tiempos text-xl sm:text-2xl font-semibold tracking-tight text-white">Subscription</h2>
        ) : (
          <h1 className="font-tiempos text-2xl sm:text-3xl font-semibold tracking-tight text-white">Subscription</h1>
        )}
        <p className="mt-1.5 text-white/40 text-sm">Manage your plan and billing</p>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-red-300 text-sm mb-6"
        >
          {error}
        </motion.div>
      )}

      {/* Current plan card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: "easeOut" }}
      >
        {isPro ? (
          /* Subscribed — gradient border */
          <div className="relative rounded-2xl p-[1.5px] bg-gradient-to-r from-loa-indigo via-loa-purple to-loa-indigo/60 shadow-[0_0_60px_rgba(57,73,171,0.18)]">
            <div className="rounded-[14px] bg-[#080810] p-5 sm:p-6 backdrop-blur-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-loa-indigo/30 to-loa-purple/30 border border-loa-indigo/30">
                    <Crown className="h-5 w-5 text-loa-indigo" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/90">
                      {isVip ? "Pro (VIP)" : "Active plan"}
                    </p>
                    <p className="text-sm text-emerald-400/90">Subscribed</p>
                  </div>
                </div>
                {(() => {
                  const expiry = formatExpiry(customerInfo, DEFAULT_ENTITLEMENT_ID);
                  return expiry ? (
                    <div className="flex items-center gap-2 text-white/40 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>Through {expiry}</span>
                    </div>
                  ) : null;
                })()}
              </div>
              {showManageBlock && (
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <a
                    href={manageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Manage subscription
                  </a>
                  <p className="text-white/30 text-xs mt-1">Cancel or update payment from your store billing page</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Free plan status */
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-5 sm:p-6 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.08]">
                  <Crown className="h-5 w-5 text-white/30" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">Current plan</p>
                  <p className="text-sm text-white/40">Free</p>
                </div>
              </div>
              <span className="text-xs text-white/30 border border-white/[0.08] rounded-full px-3 py-1">No active subscription</span>
            </div>
            {showManageBlock && (
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <a
                  href={manageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Manage subscription
                </a>
                <p className="text-white/30 text-xs mt-1">Cancel or update payment from your store billing page</p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Plan picker (free users only) */}
      {!isPro && (
        <div className="mt-12">
          {offeringsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-7 h-7 text-white/30 animate-spin" />
            </div>
          ) : (() => {
            const offeringGroups = getAllOfferingsWithPackages(offerings);
            const basicOffering = offeringGroups.find((o) => o.identifier === "basic");
            const proOffering = offeringGroups.find((o) => o.identifier === "pro");
            let basicPkg = billingPeriod === YEARLY ? basicOffering?.yearlyPkg : basicOffering?.monthlyPkg;
            let proPkg = billingPeriod === YEARLY ? proOffering?.yearlyPkg : proOffering?.monthlyPkg;

            if (!basicPkg && !proPkg && offeringGroups.length === 1) {
              basicPkg = billingPeriod === YEARLY
                ? offeringGroups[0]?.yearlyPkg ?? offeringGroups[0]?.monthlyPkg
                : offeringGroups[0]?.monthlyPkg ?? offeringGroups[0]?.yearlyPkg;
            }

            const hasPaidPlans = !!(basicPkg || proPkg);
            if (!hasPaidPlans) {
              return (
                <p className="text-white/50 text-sm py-4">
                  No plans available right now. Make sure offerings are configured in{" "}
                  <a href="https://app.revenuecat.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">
                    RevenueCat
                  </a>.
                </p>
              );
            }

            const freePlan = PLAN_CONTENT.free;
            const basicPlan = PLAN_CONTENT.basic;
            const proPlan = PLAN_CONTENT.pro;
            const packageSymbol = getPackageCurrencySymbol(basicPkg ?? proPkg ?? basicOffering?.monthlyPkg ?? proOffering?.monthlyPkg);
            const defaultCurrencySymbol = packageSymbol ?? "$";

            const cardVariants = {
              hidden: { opacity: 0, y: 28 },
              visible: (i) => ({
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] },
              }),
            };

            const renderCard = (planKey, plan, pkg, isPurchasing, index) => {
              const isFree = planKey === "free";
              const isPopular = !!plan.popular;
              const savingsLabel = planKey === "basic"
                ? calculateYearlySavingsLabel(basicOffering?.monthlyPkg, basicOffering?.yearlyPkg)
                : planKey === "pro"
                  ? calculateYearlySavingsLabel(proOffering?.monthlyPkg, proOffering?.yearlyPkg)
                  : null;

              const showYearlyPerMonth = !isFree && billingPeriod === YEARLY && pkg;
              const yearlyAmount = showYearlyPerMonth ? getPackagePriceAmount(pkg) : null;
              const yearlyPerMonth = yearlyAmount != null ? (yearlyAmount / 12).toFixed(2) : null;
              const currencySymbol = (pkg ? getPackageCurrencySymbol(pkg) : null) ?? defaultCurrencySymbol;

              const displayPrice = isFree
                ? `${currencySymbol}0`
                : showYearlyPerMonth && yearlyPerMonth != null
                  ? `${currencySymbol}${yearlyPerMonth}`
                  : (pkg ? getPackagePrice(pkg) : "—");

              const billingText = isFree
                ? "Free forever"
                : billingPeriod === YEARLY && pkg
                  ? formatYearlyBillingText(pkg)
                  : "per month";

              const cardBody = (
                <div className={`relative flex flex-col rounded-[14px] p-6 lg:p-7 h-full ${isPopular ? "bg-[#080810]" : "bg-white/[0.02] border border-white/[0.07] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300"}`}>
                  {/* Popular badge */}
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide text-white bg-gradient-to-r from-loa-indigo to-loa-purple shadow-[0_0_24px_rgba(57,73,171,0.6)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                        Most popular
                      </span>
                    </div>
                  )}

                  {/* Plan name + price */}
                  <div className="mb-6">
                    <p className="text-xs font-bold tracking-widest uppercase text-white/35 mb-3">{plan.title}</p>
                    <div className="flex items-baseline gap-1.5 mb-1.5">
                      <span className="text-4xl font-bold tabular-nums text-white">{displayPrice}</span>
                      {!isFree && <span className="text-white/35 text-sm">/mo</span>}
                    </div>
                    <div className="flex items-center gap-2 min-h-[1.5rem]">
                      <p className="text-white/35 text-sm">{billingText}</p>
                      {billingPeriod === YEARLY && savingsLabel && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-[10px] font-bold tracking-wide text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded-md"
                        >
                          {savingsLabel}
                        </motion.span>
                      )}
                    </div>
                    <p className="mt-3 text-[13px] text-white/30">
                      Best for <span className="text-white/55">{plan.bestFor}</span>
                    </p>
                  </div>

                  {/* CTA */}
                  {isFree ? (
                    <div className={`block w-full text-center py-2.5 px-4 rounded-xl text-sm font-semibold mb-6 bg-white/[0.05] text-white/65 border border-white/[0.07]`}>
                      Current plan
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => pkg && handlePurchase(pkg)}
                      disabled={!pkg || isPurchasing || purchasingPackageId != null}
                      className={`w-full text-center py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 mb-6 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                        isPopular
                          ? "bg-gradient-to-r from-loa-indigo to-loa-purple text-white shadow-[0_0_28px_rgba(57,73,171,0.4)] hover:shadow-[0_0_40px_rgba(57,73,171,0.6)] hover:opacity-90"
                          : "bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.1]"
                      }`}
                    >
                      {isPurchasing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {isPurchasing ? "Opening…" : getPaidPlanPurchaseLabel(pkg)}
                    </button>
                  )}

                  {/* Divider */}
                  <div className="border-t border-white/[0.06] mb-5" />

                  {/* Feature list */}
                  <ul className="flex flex-col gap-3">
                    {plan.features.map((feature, fi) => (
                      <li key={fi} className="flex items-start gap-3">
                        <span className={`mt-[1px] flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                          feature.included
                            ? isPopular ? "bg-loa-indigo/20 text-loa-indigo" : "bg-white/[0.07] text-white/55"
                            : "bg-transparent text-white/15"
                        }`}>
                          {feature.included
                            ? <Check className="w-2.5 h-2.5" strokeWidth={3} />
                            : <Minus className="w-2.5 h-2.5" strokeWidth={2.5} />}
                        </span>
                        <span className={`text-[13px] leading-snug ${feature.included ? "text-white/65" : "text-white/20"}`}>
                          {feature.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );

              return (
                <motion.div
                  key={planKey}
                  id={planKey === "free" ? undefined : `subscription-plan-${planKey}`}
                  custom={index}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className={`relative${isPopular ? " md:-translate-y-3" : ""}`}
                >
                  {isPopular ? (
                    <div className="relative rounded-2xl p-[1.5px] bg-gradient-to-b from-loa-indigo via-loa-purple/80 to-loa-purple/10 shadow-[0_0_80px_rgba(57,73,171,0.22)]">
                      {cardBody}
                    </div>
                  ) : cardBody}
                </motion.div>
              );
            };

            return (
              <div>
                {/* Section header */}
                <motion.div
                  className="mb-14 text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase text-loa-indigo border border-loa-indigo/30 bg-loa-indigo/[0.07] mb-5">
                    <Sparkles className="w-3 h-3" />
                    Upgrade
                  </span>
                  <h2 className="font-tiempos text-h3 lg:text-h4 font-semibold tracking-tight text-white">Choose a plan</h2>
                  <p className="mt-3 text-white/50 text-base max-w-sm mx-auto">Unlock AI affirmations, cloud sync, and more.</p>

                  {/* Billing toggle */}
                  <div className="mt-8 inline-flex p-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setBillingPeriod(MONTHLY)}
                      className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        billingPeriod === MONTHLY ? "bg-white text-black shadow-sm" : "text-white/50 hover:text-white"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingPeriod(YEARLY)}
                      className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        billingPeriod === YEARLY ? "bg-white text-black shadow-sm" : "text-white/50 hover:text-white"
                      }`}
                    >
                      Yearly
                      <span className="text-[10px] font-bold tracking-wide text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-md">
                        Save 50%
                      </span>
                    </button>
                  </div>
                </motion.div>

                {/* Plan cards — identical layout to /pricing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 items-start">
                  {renderCard("free", freePlan, null, false, 0)}
                  {renderCard(
                    "basic", basicPlan,
                    basicPkg ?? basicOffering?.monthlyPkg ?? basicOffering?.yearlyPkg,
                    purchasingPackageId != null && basicPkg && purchasingPackageId === basicPkg.identifier,
                    1
                  )}
                  {renderCard(
                    "pro", proPlan,
                    proPkg ?? proOffering?.monthlyPkg ?? proOffering?.yearlyPkg,
                    purchasingPackageId != null && proPkg && purchasingPackageId === proPkg.identifier,
                    2
                  )}
                </div>

                <motion.p
                  className="text-center text-white/20 text-xs mt-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Prices in USD. Subscription managed on the App Store. Change or cancel anytime.
                </motion.p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

/** Compact CTA showing Free / Premium; links to /dashboard/subscription. Must render inside RevenueCatProvider. */
export function MembershipStatusLink() {
  const { isConfigured, loading, customerInfo, isPro } = useRevenueCat();
  const busy = isConfigured && loading && !customerInfo;

  const statusText = (() => {
    if (!isConfigured) return "Not configured";
    if (busy) return "Checking…";
    if (isPro) return "Premium";
    return "Manifest Starter";
  })();

  return (
    <Link
      href="/dashboard/subscription"
      className="group flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition-all duration-200 hover:border-loa-indigo/30 hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-loa-indigo/40"
    >
      <span className="flex items-center gap-3 min-w-0">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-loa-indigo/10 border border-loa-indigo/20">
          <Crown className={`h-4 w-4 ${isPro ? "text-emerald-400" : "text-white/40"}`} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-white">Membership</span>
          <span className="block text-xs text-white/40 truncate">{statusText}</span>
        </span>
      </span>
      <span className="text-xs font-medium text-loa-indigo/70 group-hover:text-loa-indigo shrink-0 transition-colors">
        Plans & billing
      </span>
    </Link>
  );
}

function SubscriptionScreenFallback({ embedded = false }) {
  return (
    <div className={embedded ? "py-8 flex justify-center" : "max-w-2xl mx-auto px-4 py-12 flex justify-center"}>
      <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
    </div>
  );
}

export default function SubscriptionPanel({ embedded = false }) {
  /** Single provider comes from `app/dashboard/layout.js`; nesting a second provider reconfigured Purchases and broke web checkout (destroyed element). */
  return (
    <Suspense fallback={<SubscriptionScreenFallback embedded={embedded} />}>
      <SubscriptionScreen embedded={embedded} />
    </Suspense>
  );
}
