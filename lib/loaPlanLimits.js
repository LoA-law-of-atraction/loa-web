/**
 * LoA subscription limits (aligned with docs/features/PREMIUM_LIMITS.md and pricing).
 * Tier keys: free | creator | master
 */

export const LOA_TIERS = /** @type {const} */ (["free", "creator", "master"]);

/** @typedef {'free'|'creator'|'master'} LoaTier */

const GB = 1024 * 1024 * 1024;

/** @type {Record<LoaTier, { aiMonthly: number, storageBytes: number }>} */
export const TIER_LIMITS = {
  free: {
    aiMonthly: 0,
    storageBytes: 100 * 1024 * 1024,
  },
  creator: {
    aiMonthly: 50,
    storageBytes: 1 * GB,
  },
  master: {
    aiMonthly: 150,
    storageBytes: 5 * GB,
  },
};

export function limitsForTier(tier) {
  const t = tier === "creator" || tier === "master" ? tier : "free";
  return TIER_LIMITS[t];
}

/** Next calendar month start (UTC) for “resets on” copy */
export function nextUtcMonthStartIso() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const next = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0, 0));
  return next.toISOString();
}

export function currentUsageMonthKey() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
