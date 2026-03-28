/**
 * Purchase button copy from RevenueCat package/product.
 * Per purchases-js: products from getOfferings() include trial/intro phases only when the
 * current customer is eligible (dashboard eligibility rules apply).
 *
 * @see https://www.revenuecat.com/docs/web/web-billing/product-setup — Trial / introductory period eligibility
 */

export function getWebBillingProduct(pkg) {
  return pkg?.webBillingProduct || pkg?.rcBillingProduct;
}

/**
 * Primary CTA for a paid subscription package (subscription page & pricing when offerings are loaded).
 */
export function getPaidPlanPurchaseLabel(pkg) {
  const product = getWebBillingProduct(pkg);
  if (!product) return "Subscribe";
  if (product.freeTrialPhase) return "Start free trial";
  if (product.introPricePhase) return "Subscribe";
  return "Subscribe";
}
