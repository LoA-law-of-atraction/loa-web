/**
 * Opt-in auth/pricing flow logging. Enable any of:
 * - NODE_ENV=development (on by default in dev)
 * - NEXT_PUBLIC_DEBUG_LOA_AUTH=1 (rebuild required)
 * - Add ?debug_loa_auth=1 to the page URL (any page), then navigate
 * - localStorage.setItem("DEBUG_LOA_AUTH", "1") then refresh
 */
export function debugLoaAuth(scope, ...args) {
  if (typeof window === "undefined") return;
  let enabled =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEBUG_LOA_AUTH === "1";
  try {
    if (window.localStorage?.getItem("DEBUG_LOA_AUTH") === "1") enabled = true;
    if (window.sessionStorage?.getItem("DEBUG_LOA_AUTH") === "1") enabled = true;
    if (window.location?.search?.includes("debug_loa_auth=1")) {
      window.sessionStorage.setItem("DEBUG_LOA_AUTH", "1");
      enabled = true;
    }
  } catch {
    /* ignore */
  }
  if (!enabled) return;
  const t = new Date().toISOString();
  console.log(`[LoA:${scope}]`, t, ...args);
}
