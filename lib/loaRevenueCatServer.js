const RC_BASE = "https://api.revenuecat.com/v1";

const cache = new Map();
const CACHE_MS = 60_000;

function entitlementIds() {
  return {
    pro: process.env.REVENUECAT_ENTITLEMENT_PRO || "pro",
    basic: process.env.REVENUECAT_ENTITLEMENT_BASIC || "basic",
  };
}

/**
 * @param {string | null | undefined} expiresDate ISO date from RevenueCat or null
 */
function entitlementActive(expiresDate) {
  if (expiresDate == null || expiresDate === "") return true;
  const t = new Date(expiresDate).getTime();
  if (!Number.isFinite(t)) return false;
  return t > Date.now();
}

/**
 * @param {import("@/lib/loaPlanLimits").LoaTier} tier
 */
export function tierFromSubscriberJson(data) {
  if (!data?.subscriber?.entitlements) return "free";
  const { pro, basic } = entitlementIds();
  const ent = data.subscriber.entitlements;
  const proEnt = ent[pro];
  const basicEnt = ent[basic];
  if (proEnt && entitlementActive(proEnt.expires_date)) return "master";
  if (basicEnt && entitlementActive(basicEnt.expires_date)) return "creator";
  return "free";
}

/**
 * Fetch RevenueCat subscriber (server-side). Returns null if unconfigured or request fails.
 * @param {string} appUserId Firebase uid
 */
export async function fetchRevenueCatSubscriber(appUserId) {
  const secret = String(process.env.REVENUECAT_API_SECRET || "").trim();
  if (!secret) return null;

  const cached = cache.get(appUserId);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return cached.data;
  }

  try {
    const res = await fetch(`${RC_BASE}/subscribers/${encodeURIComponent(appUserId)}`, {
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      console.warn("[RevenueCat] subscriber fetch failed:", res.status, appUserId);
      return null;
    }
    const data = await res.json();
    cache.set(appUserId, { at: Date.now(), data });
    return data;
  } catch (e) {
    console.warn("[RevenueCat] subscriber fetch error:", e?.message || e);
    return null;
  }
}

/**
 * Resolve tier for uid. Without REVENUECAT_API_SECRET, returns "free" (strict).
 * @param {string} uid
 * @returns {Promise<import("@/lib/loaPlanLimits").LoaTier>}
 */
export async function resolveSubscriberTier(uid) {
  const json = await fetchRevenueCatSubscriber(uid);
  if (!json) return "free";
  return tierFromSubscriberJson(json);
}

/**
 * @param {string} uid
 */
export async function resolveTierAndLimits(uid) {
  const tier = await resolveSubscriberTier(uid);
  return { tier, limits: limitsForTier(tier) };
}
