/** Shared helpers for RevenueCat Web Billing offerings / packages (purchases-js). */

export function isYearlyPackage(pkg) {
  const id = (pkg?.identifier || "").toLowerCase();
  const product = pkg?.webBillingProduct || pkg?.rcBillingProduct;
  const periodDuration = String(product?.normalPeriodDuration || product?.period?.periodDuration || "").toUpperCase();
  const title = String(product?.title || "").toLowerCase();
  return (
    periodDuration.includes("Y") ||
    id.includes("year") ||
    id.includes("annual") ||
    id === "$rc_annual" ||
    title.includes("year") ||
    title.includes("annual")
  );
}

export function normalizeOfferingIdentifier(identifier) {
  const id = String(identifier || "").toLowerCase();
  if (id.includes("basic") || id.includes("creator")) return "basic";
  if (id.includes("pro") || id.includes("master")) return "pro";
  return id;
}

export function getMonthlyYearlyPackages(packages) {
  let monthly = null;
  let yearly = null;
  for (const pkg of packages || []) {
    if (isYearlyPackage(pkg)) yearly = pkg;
    else monthly = pkg;
  }
  return { monthly, yearly };
}

/**
 * Flatten offerings into basic/pro (or single-offering) groups with monthly/yearly packages.
 */
export function getAllOfferingsWithPackages(offerings) {
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
        identifier: normalizeOfferingIdentifier(offering?.identifier ?? id),
        rawIdentifier: (offering?.identifier ?? id).toLowerCase(),
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
