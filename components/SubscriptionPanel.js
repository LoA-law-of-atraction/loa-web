"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Check, Crown, ExternalLink, Loader2 } from "lucide-react";
import {
  DEFAULT_ENTITLEMENT_ID,
  RevenueCatProvider,
  useRevenueCat,
} from "@/contexts/RevenueCatContext";

const MONTHLY = "monthly";
const YEARLY = "yearly";

const PLAN_CONTENT = {
  free: {
    id: "free",
    title: "Free",
    price: "$0",
    billing: "Free forever",
    benefits: [
      "No AI affirmations",
      "Unlimited manual affirmations",
      "Basic streak tracking",
      "Supported media: Images",
      "No cloud backup",
      "No advanced templates",
      "No premium insights",
    ],
    bestFor: "Manual practice",
    freeTierCheckmarks: [
      "Unlimited manual affirmations",
      "Basic streak tracking",
      "Supported media: Images",
    ],
  },
  basic: {
    id: "basic",
    title: "Creator",
    popular: true,
    billing: "Per month",
    billingYearly: "Save 18%",
    benefits: [
      "50 AI affirmations/month",
      "Unlimited manual affirmations",
      "Advanced templates",
      "Cloud backup and restore",
      "1GB storage",
      "Priority support",
      "Cross-device sync",
    ],
    bestFor: "Daily manifesting",
  },
  pro: {
    id: "pro",
    title: "Master",
    billing: "Per month",
    billingYearly: "Save 20%",
    benefits: [
      "150 AI affirmations/month",
      "Unlimited manual affirmations",
      "Advanced templates",
      "Cloud backup and restore",
      "5GB storage",
      "Priority support",
      "Cross-device sync",
    ],
    bestFor: "Power users",
  },
};

function isYearlyPackage(pkg) {
  const id = (pkg?.identifier || "").toLowerCase();
  return id.includes("year") || id.includes("annual") || id === "$rc_annual";
}

function getMonthlyYearlyPackages(packages) {
  let monthly = null;
  let yearly = null;
  for (const pkg of packages || []) {
    if (isYearlyPackage(pkg)) yearly = pkg;
    else monthly = pkg;
  }
  return { monthly, yearly };
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

function getAllOfferingsWithPackages(offerings) {
  if (!offerings) return [];
  const all = offerings.all ?? {};
  const entries = Object.keys(all).length > 0
    ? Object.entries(all)
    : offerings.current
      ? [[offerings.current.identifier || "default", offerings.current]]
      : [];
  return entries
    .map(([id, offering]) => {
      const packages = offering?.availablePackages ?? [];
      if (packages.length === 0) return null;
      const { monthly, yearly } = getMonthlyYearlyPackages(packages);
      return {
        identifier: (offering?.identifier ?? id).toLowerCase(),
        monthlyPkg: monthly,
        yearlyPkg: yearly,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const order = { basic: 0, pro: 1 };
      return (order[a.identifier] ?? 2) - (order[b.identifier] ?? 2);
    });
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
  const [purchaseError, setPurchaseError] = useState(null);

  const manageUrl = customerInfo?.managementURL;
  const showManageBlock = !!manageUrl;

  useEffect(() => {
    if (!isConfigured) return;
    let mounted = true;
    setOfferingsLoading(true);
    getOfferings({ currency: "USD" })
      .then((off) => {
        if (mounted) setOfferings(off);
      })
      .catch(() => {
        if (mounted) setOfferings(null);
      })
      .finally(() => {
        if (mounted) setOfferingsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [isConfigured, getOfferings]);

  const handlePurchase = async (rcPackage) => {
    setPurchaseError(null);
    setPurchasingPackageId(rcPackage?.identifier ?? null);
    try {
      await purchase({
        rcPackage,
        skipSuccessPage: true,
      });
    } catch (e) {
      const msg = e?.message || "";
      if (/cancelled|canceled|user cancelled/i.test(msg)) {
        setPurchaseError(null);
      } else {
        setPurchaseError(msg || "Purchase failed.");
      }
    } finally {
      setPurchasingPackageId(null);
    }
  };

  if (!isConfigured) {
    return (
      <div className={embedded ? "py-6" : "max-w-2xl mx-auto px-4 py-12"}>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
          <p className="text-amber-200/90 mb-2">Subscriptions are not configured.</p>
          <p className="text-white/60 text-sm mb-3">
            Add <code className="bg-white/10 px-1 rounded">NEXT_PUBLIC_REVENUECAT_WEB_API_KEY</code> to
            <code className="bg-white/10 px-1 rounded ml-1">.env</code> and configure your products in{" "}
            <a
              href="https://app.revenuecat.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:underline"
            >
              RevenueCat
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  if (loading && !customerInfo) {
    return (
      <div className={embedded ? "py-8 flex justify-center" : "max-w-2xl mx-auto px-4 py-12 flex justify-center"}>
        <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={`mx-auto ${embedded ? "px-0 py-0" : "px-4 py-8 sm:py-12"} ${!isPro ? "max-w-6xl" : "max-w-2xl"}`}
    >
      <div className={embedded ? "mb-6" : "mb-8"}>
        {embedded ? (
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">Subscription</h2>
        ) : (
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">Subscription</h1>
        )}
        <p className="mt-1 text-white/50 text-sm">Manage your plan and billing</p>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-red-300 text-sm mb-6">
          {error}
        </div>
      )}

      {purchaseError && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-red-300 text-sm mb-6">
          {purchaseError}
        </div>
      )}

      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 sm:p-6 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isPro ? "bg-emerald-500/20" : "bg-white/5"}`}>
              <Crown className={`h-5 w-5 ${isPro ? "text-emerald-400" : "text-white/40"}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-white/90">
                {isPro ? (isVip ? "Pro (VIP)" : "Active") : "Current plan"}
              </p>
              <p className={`text-sm ${isPro ? "text-emerald-400/90" : "text-white/50"}`}>
                {isPro ? "Subscribed" : "Free"}
              </p>
            </div>
          </div>
          {isPro && (() => {
            const expiry = formatExpiry(customerInfo, DEFAULT_ENTITLEMENT_ID);
            return expiry ? (
              <div className="flex items-center gap-2 text-white/50 text-sm">
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
              className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Manage subscription
            </a>
            <p className="text-white/40 text-xs mt-1">Cancel or update payment from your store billing page</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <Link href="/pricing" className="text-sm text-white/60 hover:text-white/80 transition-colors">
            Compare all plans →
          </Link>
        </div>
      </div>

      {!isPro && (
        <div className="mt-10">
          {offeringsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
            </div>
          ) : (() => {
            const offeringGroups = getAllOfferingsWithPackages(offerings);
            const basicOffering = offeringGroups.find((o) => o.identifier === "basic");
            const proOffering = offeringGroups.find((o) => o.identifier === "pro");
            const hasPaidPlans = (basicOffering?.monthlyPkg || basicOffering?.yearlyPkg) || (proOffering?.monthlyPkg || proOffering?.yearlyPkg);
            if (!hasPaidPlans) {
              return (
                <p className="text-white/60 text-sm py-4">
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
            const basicPkg = billingPeriod === YEARLY ? basicOffering?.yearlyPkg : basicOffering?.monthlyPkg;
            const proPkg = billingPeriod === YEARLY ? proOffering?.yearlyPkg : proOffering?.monthlyPkg;
            const packageSymbol = getPackageCurrencySymbol(basicPkg ?? proPkg ?? basicOffering?.monthlyPkg ?? proOffering?.monthlyPkg);
            const defaultCurrencySymbol = packageSymbol ?? "$";
            const benefitCount = freePlan.benefits.length;

            const renderBenefitCell = (benefit, isFree) => {
              const showCheck = !isFree || freePlan.freeTierCheckmarks.includes(benefit);
              return (
                <div className="flex items-start gap-2.5 py-2.5 px-3 sm:px-4 border-b border-white/[0.06] min-h-[2.75rem]">
                  <span className="mt-0.5 flex-shrink-0">
                    {showCheck ? (
                      <Check className="h-4 w-4 text-emerald-400/90" strokeWidth={2.5} />
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </span>
                  <span className="text-sm text-white/70">{benefit}</span>
                </div>
              );
            };

            const renderPlanCard = (planKey, plan, pkg, isPurchasing, index) => {
              const isFree = planKey === "free";
              const priceStr = isFree ? plan.price : (pkg ? getPackagePrice(pkg) : "—");
              const billingText = isFree
                ? plan.billing
                : billingPeriod === YEARLY && pkg
                  ? `Billed annually · ${plan.billingYearly}`
                  : plan.billing;
              const showYearlyPerMonth = !isFree && billingPeriod === YEARLY && pkg;
              const yearlyAmount = showYearlyPerMonth ? getPackagePriceAmount(pkg) : null;
              const yearlyPerMonth = yearlyAmount != null ? (yearlyAmount / 12).toFixed(2) : null;
              const currencySymbol = (pkg ? getPackageCurrencySymbol(pkg) : null) ?? defaultCurrencySymbol;
              const isPopular = plan.popular;

              return (
                <motion.article
                  key={planKey}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  className={`relative flex flex-col rounded-2xl border p-6 sm:p-7 transition-all duration-200 ${
                    isPopular
                      ? "bg-white/[0.07] border-violet-500/30 shadow-[0_0_40px_-12px_rgba(139,92,246,0.25)]"
                      : "bg-white/[0.03] border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="min-h-[2.5rem] flex items-center justify-center mb-4">
                    {isPopular && (
                      <span className="inline-flex w-fit px-3 py-1 rounded-full bg-violet-500/90 text-white text-xs font-medium">
                        Most popular
                      </span>
                    )}
                  </div>
                  <div className="mb-5">
                    <p className="text-sm font-medium text-white/50 uppercase tracking-wider">{plan.title}</p>
                    <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
                      <span className="text-3xl font-semibold tracking-tight text-white">
                        {showYearlyPerMonth && yearlyPerMonth != null
                          ? `${currencySymbol}${yearlyPerMonth}`
                          : isFree
                            ? `${currencySymbol}0`
                            : priceStr}
                      </span>
                      {(showYearlyPerMonth && yearlyPerMonth != null) || (!isFree && billingPeriod === MONTHLY) ? (
                        <span className="text-white/45 text-sm">/mo</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-white/50">{billingText}</p>
                  </div>
                  {plan.bestFor && (
                    <p className="mt-2 pt-4 border-t border-white/[0.06] text-xs text-white/45">Best for: {plan.bestFor}</p>
                  )}
                  {!isFree && pkg && (
                    <div className="mt-5 pt-5 border-t border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => handlePurchase(pkg)}
                        disabled={isPurchasing}
                        className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                          isPopular
                            ? "bg-violet-500 hover:bg-violet-400 text-white"
                            : "bg-violet-600 hover:bg-violet-500 text-white border border-violet-500/50"
                        }`}
                      >
                        {isPurchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {isPurchasing ? "Opening…" : "Subscribe"}
                      </button>
                    </div>
                  )}
                </motion.article>
              );
            };

            return (
              <div className="mt-10">
                <div className="mb-8 text-center">
                  <h2 className="text-lg font-semibold tracking-tight text-white">Choose a plan</h2>
                  <p className="mt-1 text-sm text-white/50">Upgrade to unlock AI affirmations, sync, and more.</p>
                </div>
                <div className="flex justify-center mb-8">
                  <div className="inline-flex p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => setBillingPeriod(MONTHLY)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        billingPeriod === MONTHLY
                          ? "bg-white/10 text-white shadow-sm"
                          : "text-white/60 hover:text-white/80"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingPeriod(YEARLY)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        billingPeriod === YEARLY
                          ? "bg-white/10 text-white shadow-sm"
                          : "text-white/60 hover:text-white/80"
                      }`}
                    >
                      Yearly
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto -mx-2 px-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-0 min-w-0">
                    {renderPlanCard("free", freePlan, null, false, 0)}
                    {renderPlanCard(
                      "basic",
                      basicPlan,
                      basicPkg ?? basicOffering?.monthlyPkg ?? basicOffering?.yearlyPkg,
                      purchasingPackageId != null && basicPkg && purchasingPackageId === basicPkg.identifier,
                      1
                    )}
                    {renderPlanCard(
                      "pro",
                      proPlan,
                      proPkg ?? proOffering?.monthlyPkg ?? proOffering?.yearlyPkg,
                      purchasingPackageId != null && proPkg && purchasingPackageId === proPkg.identifier,
                      2
                    )}
                  </div>
                  <div className="mt-0 rounded-b-2xl overflow-hidden border border-t-0 border-white/[0.08] bg-white/[0.02]">
                    <div className="grid grid-cols-1 md:grid-cols-3" role="table" aria-label="Plan comparison">
                      {Array.from({ length: benefitCount }, (_, i) => (
                        <div key={i} className="contents" role="row">
                          <div role="cell" className="bg-white/[0.02]">{renderBenefitCell(freePlan.benefits[i], true)}</div>
                          <div role="cell" className="bg-white/[0.02]">{renderBenefitCell(basicPlan.benefits[i], false)}</div>
                          <div role="cell" className="bg-white/[0.02]">{renderBenefitCell(proPlan.benefits[i], false)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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
    return "Free";
  })();

  return (
    <Link
      href="/dashboard/subscription"
      className="group flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition-colors hover:border-purple-500/30 hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40"
    >
      <span className="flex items-center gap-3 min-w-0">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 border border-purple-500/25">
          <Crown className={`h-4 w-4 ${isPro ? "text-emerald-400" : "text-white/45"}`} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-white">Membership</span>
          <span className="block text-xs text-white/45 truncate">{statusText}</span>
        </span>
      </span>
      <span className="text-xs font-medium text-purple-300/80 group-hover:text-purple-200 shrink-0">
        Plans & billing
      </span>
    </Link>
  );
}

export default function SubscriptionPanel({ embedded = false }) {
  return (
    <RevenueCatProvider>
      <SubscriptionScreen embedded={embedded} />
    </RevenueCatProvider>
  );
}
