"use client";

import Script from "next/script";
import { isAnalyticsEnabled } from "@/utils/analytics";

function getValidatedGaId() {
  const raw = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  return raw && /^G-[A-Z0-9]+$/i.test(raw) ? raw : null;
}

/** Client-only GA4; uses JSON.stringify so the measurement ID cannot break inline script syntax. */
export default function GoogleAnalyticsLoader() {
  if (!isAnalyticsEnabled()) return null;

  const gaId = getValidatedGaId();
  if (!gaId) return null;

  const init = [
    "window.dataLayer = window.dataLayer || [];",
    "function gtag(){dataLayer.push(arguments);}",
    "gtag('js', new Date());",
    `gtag('config', ${JSON.stringify(gaId)});`,
  ].join("\n");

  return (
    <>
      <Script
        id="_next-ga-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: init }}
      />
      <Script
        id="_next-ga"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
      />
    </>
  );
}
