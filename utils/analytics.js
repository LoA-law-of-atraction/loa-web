const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
];

/** GA / Meta / trackEvent are off in `next dev`; production builds still send data. */
export function isAnalyticsEnabled() {
  return process.env.NODE_ENV === "production";
}

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeValue(value) {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value.trim().slice(0, 200);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    const filtered = value
      .map((v) => normalizeValue(v))
      .filter((v) => v !== undefined)
      .slice(0, 20);
    return filtered.length ? filtered : undefined;
  }
  return undefined;
}

function getUtmParams() {
  if (!isBrowser()) return {};

  const searchParams = new URLSearchParams(window.location.search || "");
  const entries = UTM_KEYS.map((key) => [key, normalizeValue(searchParams.get(key))]);
  return Object.fromEntries(entries.filter(([, value]) => value !== undefined));
}

export function trackEvent(eventName, properties = {}) {
  if (!isAnalyticsEnabled() || !isBrowser() || !eventName) return;

  const normalizedProps = Object.fromEntries(
    Object.entries(properties)
      .map(([key, value]) => [key, normalizeValue(value)])
      .filter(([, value]) => value !== undefined)
  );

  const payload = {
    ...normalizedProps,
    page_path: normalizeValue(window.location.pathname),
    ...getUtmParams(),
  };

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, payload);
  }

  if (typeof window.fbq === "function") {
    window.fbq("trackCustom", eventName, payload);
  }
}
