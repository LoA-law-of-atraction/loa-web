# SEO Action Plan — loa-lawofattraction.co
**Last updated:** 2026-03-28
**Health Score:** ~52 / 100 *(directional; re-score after GSC stabilizes post-deploy)*

## Recent Investigations (2026-03-28)
- [Competitor Analysis](competitor-analysis-2026-03-28.md) — Only 2 ranking keywords; competitor data unreliable at this traffic level
- [Ranked Keywords](ranked-keywords-2026-03-28.md) — Ranking for "loa love" (#38) and "loa coach" (#53) only; no target keywords ranking
- [Content Analysis: /resources](content-analysis-resources-2026-03-28.md) — Original audit: thin content; **superseded by on-site expansion** (see C6 / M14 below)
- [**DataForSEO keyword research**](DATAFORSEO-KEYWORD-RESEARCH-2026-03-28.md) — Labs data for primary keywords (e.g. “law of attraction app” KD ~2); **live SERP top-10** not retrieved (API 402/credits—retry later)

---

---

## Critical — Fix Immediately

### C1. Fix `StructuredData.js` staging URL
**File:** `components/StructuredData.js:12-13`
**Effort:** < 5 minutes

Change both `url` and `logo` from `https://loa-web-landing.vercel.app` to `https://www.loa-lawofattraction.co`. Every structured data block Google parses currently attributes the site to the wrong domain. This actively blocks Knowledge Panel eligibility and entity association.

```js
// Before
url: "https://loa-web-landing.vercel.app",
logo: "https://loa-web-landing.vercel.app/app_logo.svg",

// After
url: "https://www.loa-lawofattraction.co",
logo: {
  "@type": "ImageObject",
  "url": "https://www.loa-lawofattraction.co/app_logo.svg",
  "width": 512,
  "height": 512
},
```

---

### C2. Remove hardcoded `aggregateRating` from structured data
**File:** `components/StructuredData.js`
**Effort:** < 5 minutes

Remove the `aggregateRating` block entirely until real verified review counts are available from the App Store or Google Play API. Hardcoded unverifiable ratings are grounds for a manual quality action under the September 2025 QRG.

---

### C3. Convert all public page files to Server Component + Client Component split
**Files:** `app/page.js`, `app/features/page.js`, `app/about-us/page.js`, `app/pricing/page.js`, `app/download/page.js`, `app/updates/page.js`
**Effort:** 2–4 hours

This is the single highest-impact architectural change. It fixes:
- JS rendering (Googlebot currently sees empty HTML)
- Missing page-specific metadata (title, description, canonical)
- LCP (enables SSR so content paints before JS executes)

**Pattern to follow** (already used in `app/privacy-policy/page.js`):

```js
// app/features/page.js — Server Component (no "use client")
import FeaturesClient from "./FeaturesClient";

export const metadata = {
  title: "Features | LoA - Law of Attraction",
  description: "Explore LoA's affirmation screens, mindful pause tools, and consciousness-building features for the digital age.",
  alternates: { canonical: "https://www.loa-lawofattraction.co/features" },
};

export default function FeaturesPage() {
  return <FeaturesClient />;
}
```

```js
// app/features/FeaturesClient.js — Client Component
"use client";
// All existing page.js content moves here unchanged
```

Repeat for: `page.js`, `about-us`, `pricing`, `download`, `updates`.

**Suggested metadata per page:**

| Page | Title | Description |
|---|---|---|
| `/` | LoA - Law of Attraction for the Digital Age | Transform your phone into a tool for conscious living. Practice the Law of Attraction with personalized affirmations and mindful interruptions. |
| `/features` | Features \| LoA App | Affirmation screens, conscious app interruption, energy redirection, and momentum streaks — every LoA feature explained. |
| `/about-us` | About Us \| LoA App | Meet the team behind LoA and learn how the Law of Attraction inspired a new kind of digital wellness app. |
| `/pricing` | Pricing \| LoA App | Start for free or unlock the full Law of Attraction experience with LoA Premium. |
| `/download` | Download LoA \| App Store & Google Play | Get LoA on iOS and Android. Start practicing the Law of Attraction on your phone today. |
| `/updates` | What's New \| LoA App | The latest features, improvements, and updates from the LoA team. |

---

### C4. Wrap `SolarSystemBackground` in `dynamic()` with `ssr: false`
**File:** `app/page.js` (or wherever it's imported)
**Effort:** 15 minutes

This removes the canvas animation from the critical render path, allowing the hero content to paint immediately on the server-rendered HTML.

```js
// In the server component that renders the homepage
import dynamic from "next/dynamic";

const SolarSystemBackground = dynamic(
  () => import("@/components/SolarSystemBackground"),
  {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-[#050508]" />,
  }
);
```

---

### C6. Add target keywords to /resources page
**File:** `app/resources/ResourcesClient.js`
**Effort:** 30 minutes
**Source:** content-analysis-resources-2026-03-28.md

The /resources page has ~230 words (target: 500+) and contains zero target keywords. Quick wins:

1. Update H1 from "Guides, support, and product pages" to "Law of Attraction Resources: Guides, Tools & Support"
2. Add an intro paragraph (~60 words) below the H1:

```jsx
<p className="max-w-[620px] text-base leading-relaxed text-white/55 sm:text-lg">
  Everything you need to understand and use LoA — the Law of Attraction app
  built for your digital life. Explore how affirmations, mindful pauses, and
  conscious reflection tools work together to shift your daily phone use into
  a manifestation practice. Browse guides, product info, and support pages below.
</p>
```

3. Update meta title in `app/resources/page.js` from "Resources | LoA App" to "Law of Attraction Resources | LoA App"

**Status:** ✅ **Done (2026-03-28).** H1 and body copy expanded (500+ words), primer + internal links, FAQ (`<details>`) + **FAQPage** JSON-LD (`app/resources/resourcesFaq.js`), meta title **Law of Attraction Resources & Guides \| LoA App**. See also M14.

---

### C5. Fix base font size to 16px on mobile
**File:** `app/globals.css:36`
**Effort:** 2 minutes

```css
/* Before */
body {
  font-size: 0.875rem; /* 14px */
}

/* After */
body {
  font-size: 1rem; /* 16px */
}
```

Use smaller font sizes selectively for labels and captions only.

---

## High Priority — Fix Within 1 Week

### H1. Fix `robots.txt` — block authenticated and admin routes
**File:** `public/robots.txt`
**Effort:** 5 minutes

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /dashboard/
Disallow: /login
Disallow: /signup
Disallow: /profile

User-agent: Googlebot-Image
Allow: /favicon/

Sitemap: https://www.loa-lawofattraction.co/sitemap.xml
```

---

### H2. Fix CTA button tap targets
**Files:** `AppStoreDownloadButton.js:43-49`, `GooglePlayDownloadButton.js:31-38`
**Effort:** 10 minutes

Add `min-h-[48px]` to each button wrapper to meet the 48×48px minimum touch target:

```jsx
// Before
<button style={{ padding: 0, border: "none" }}>

// After
<button className="min-h-[48px] flex items-center" style={{ border: "none" }}>
```

---

### H3. Fix hamburger button tap target
**File:** `components/NavBar.js:87`
**Effort:** 2 minutes

```jsx
// Before
<button className="flex flex-col justify-center items-center gap-[5px] w-9 h-9">

// After
<button className="flex flex-col justify-center items-center gap-[5px] w-12 h-12">
```

---

### H4. Fix page transition — remove `x` offset (CLS)
**File:** `components/ClientLayout.js`
**Effort:** 5 minutes

```js
// Before
const pageVariants = {
  initial: { opacity: 0, x: -100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100 },
};

// After
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};
```

---

### H5. Replace `<img>` with `<Image>` in `HowItWorks`
**File:** `components/HowItWorks.js:74`
**Effort:** 10 minutes

```jsx
import Image from "next/image";

// Before
<img
  src="/mock/mock6.png"
  alt="LoA App Interface"
  className="w-full max-w-sm lg:max-w-md h-auto drop-shadow-2xl"
/>

// After
<Image
  src="/mock/mock6.png"
  alt="LoA app affirmation screen shown mid-scroll on Android"
  width={400}
  height={720}
  loading="lazy"
  sizes="(max-width: 640px) 100vw, 400px"
  className="w-full max-w-sm lg:max-w-md h-auto drop-shadow-2xl"
/>
```

---

### H6. Replace Google Fonts `@import` with `next/font/google`
**Files:** `app/globals.css:1`, `app/layout.js`
**Effort:** 20 minutes

Remove the `@import` from `globals.css`. Add to `layout.js`:

```js
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      ...
    </html>
  );
}
```

Remove `Open Sans` from the import if it is unused (it does not appear to be applied anywhere in the codebase).

---

### H7. Fix OG image dimensions
**File:** `app/layout.js:44`
**Effort:** 2 minutes

```js
images: [
  {
    url: "https://www.loa-lawofattraction.co/og.png",
    width: 1200,
    height: 630,
    type: "image/png",
    alt: "LoA - Law of Attraction for the Digital Age",
  },
],
```

---

### H8. Fix `MobileApplication.operatingSystem` type
**File:** `components/StructuredData.js`
**Effort:** 2 minutes

```json
// Before
"operatingSystem": ["iOS", "Android"]

// After
"operatingSystem": "iOS, Android"
```

---

### H9. Remove or rewrite `Legacy.js` on About page
**File:** `components/Legacy.js`
**Effort:** 30 minutes

Current copy: "Want to leave a legacy but don't know how? LoA makes capturing your life story both effortless and insightful." — This describes a journaling product, not a Law of Attraction affirmation app. Either remove the component or rewrite it to describe the LoA brand mission.

---

### H10. Resolve the "50,000 users" vs "Join the Waitlist" conflict
**File:** `components/UserTestimonials.js`
**Effort:** 30 minutes

These two claims cannot coexist on the same site. Options:
- If 50,000 is accurate: remove the Waitlist page and CTA
- If the app is pre-launch: remove or replace the "50,000 users" claim with something verifiable
- Replace with a softer claim that doesn't require verification (e.g., "Join thousands of conscious creators")

---

### H11. Add founder/team section to About page
**File:** `app/about-us/page.js`
**Effort:** 1–2 hours

Add a team section with:
- Founder names and photos
- 2–3 sentence bios with relevant background
- LinkedIn profile links
- Founding year and mission statement

This is the single highest-leverage E-E-A-T improvement and requires no technical complexity.

**Status:** ⚠️ **Partial (2026-03-28).** “Who builds LoA” + trust copy (pricing/privacy transparency, contact) added in `AboutUsClient.js`. **Env-driven founder cards** (`components/FounderTeam.js` + `NEXT_PUBLIC_FOUNDER_*` in `.env.example`) render when `NEXT_PUBLIC_FOUNDER_1_NAME` is set—add names, bios, LinkedIn, optional `/public` or HTTPS headshots, and optional `NEXT_PUBLIC_FOUNDING_YEAR`.

---

### H13. Add "law of attraction" to all page meta titles
**Files:** All `page.js` metadata exports
**Effort:** 15 minutes
**Source:** ranked-keywords-2026-03-28.md

The site currently ranks for zero target keywords. The primary keyword "law of attraction" must appear in meta titles to signal relevance to Google. Update all page metadata titles to include the keyword naturally:

| Page | Suggested Title |
|------|----------------|
| `/` | LoA — Law of Attraction App for the Digital Age |
| `/features` | Features \| LoA Law of Attraction App |
| `/about-us` | About Us \| LoA Law of Attraction App |
| `/pricing` | Pricing \| LoA Law of Attraction App |
| `/download` | Download \| LoA Law of Attraction App |
| `/resources` | Law of Attraction Resources \| LoA App |

**Status:** ✅ **Done (2026-03-28)** for main marketing routes (`/`, `/features`, `/about-us`, `/pricing`, `/download`, `/updates`, `/resources`, etc.). Login/signup remain client-only without `metadata` exports.

---

### H14. Run SERP research on target keywords
**Effort:** 1 hour (research only)
**Source:** competitor-analysis-2026-03-28.md, ranked-keywords-2026-03-28.md

The competitor analysis returned only podcast platforms and irrelevant sites because the site has too few rankings. Run SERP analysis on real target keywords to map the competitive landscape:

```
/seo dataforseo serp "law of attraction app"
/seo dataforseo serp "manifestation app"
/seo dataforseo keywords "law of attraction app"
```

Use results to identify true competitors and inform content strategy.

**Status:** ⚠️ **Partial (2026-03-28).** Keyword Overview / difficulty / intent captured in [**DATAFORSEO-KEYWORD-RESEARCH-2026-03-28.md**](DATAFORSEO-KEYWORD-RESEARCH-2026-03-28.md). **Live organic SERP** (top URLs) **not** pulled—retries (including 2026-03-28) returned HTTP **402**—**retry** `serp_organic_live_advanced` when DataForSEO credits/billing are active.

---

### H12. Implement IndexNow
**Effort:** 30 minutes

1. Generate a UUID key (e.g., `abc123def456`)
2. Create `/public/abc123def456.txt` containing only the key string
3. Submit all 9 sitemap URLs to IndexNow once:

```js
// app/api/indexnow/route.js
const KEY = process.env.INDEXNOW_KEY;
const urls = [
  "https://www.loa-lawofattraction.co/",
  "https://www.loa-lawofattraction.co/features",
  // ... all sitemap URLs
];

await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ host: "www.loa-lawofattraction.co", key: KEY, urlList: urls }),
});
```

**Status:** ✅ **Done** — key file in `public/`, `app/api/indexnow/route.js`, `INDEXNOW_KEY` / optional `INDEXNOW_SUBMIT_SECRET` in `.env.example`.

---

## Medium Priority — Fix Within 1 Month

### M1. Fix sitemap `lastModified` dates
**File:** `app/sitemap.js`
**Effort:** 10 minutes

Replace `new Date()` with real ISO date strings reflecting when each page was last meaningfully updated. Only update a page's date when content genuinely changes.

---

### M2. Add `/download` to sitemap
**File:** `app/sitemap.js`
**Effort:** 2 minutes

Add `{ url: "${baseUrl}/download", lastModified: "2026-01-19" }` to the returned array.

---

### M3. Convert Tiempos Fine to `.woff2`
**File:** `app/globals.css:21-29`
**Effort:** 1 hour

**Status:** ✅ **Done (2026-03-28).** `TiemposFine-Regular.woff2` and `TiemposFine-Semibold.woff2` in `public/fonts/`; `@font-face` uses family `"Tiempos Fine"` with weights 400 / 600. OTF sources retained in repo for design handoff.

Convert `/public/fonts/TiemposFine-Regular.otf` and `TiemposFine-Semibold.otf` to `.woff2` using `fonttools` or an online converter. Update `@font-face` declarations:

```css
@font-face {
  font-family: "TiemposFine";
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/TiemposFine-Regular.woff2") format("woff2");
}

@font-face {
  font-family: "TiemposFine";
  font-weight: 600;
  font-display: swap;
  src: url("/fonts/TiemposFine-Semibold.woff2") format("woff2");
}
```

---

### M4. Fix Ubuntu font — import or remove
**Files:** `app/globals.css`, `tailwind.config.mjs`, `components/NavBar.js:49`
**Effort:** 15 minutes

**Status:** ✅ **Done (2026-03-28).** `Ubuntu` from `next/font/google` in `app/layout.js` (`--font-ubuntu`); `tailwind.config.mjs` uses `var(--font-ubuntu)`.

Either add Ubuntu to the Google Fonts import via `next/font/google`, or remove the `font-ubuntu` class from NavBar and remove the `ubuntu` entry from `tailwind.config.mjs`.

---

### M5. Add `prefers-reduced-motion` to canvas animation
**File:** `components/SolarSystemBackground.js`
**Effort:** 20 minutes

```js
useEffect(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return; // skip animation entirely
  // ... existing animation setup
}, []);
```

---

### M6. Remove `console.log` from production code
**File:** `components/SolarSystemBackground.js:13,16,29,32,302`
**Effort:** 5 minutes

Delete all 6 `console.log` calls. They add measurable overhead on every render cycle and expose internal implementation details.

---

### M7. Fix Meta Pixel click handler — avoid dynamic re-import
**Files:** `AppStoreDownloadButton.js`, `GooglePlayDownloadButton.js`
**Effort:** 15 minutes

The Pixel is already initialized by `MetaPixelEvents` on page load. Use `window.fbq()` directly in click handlers instead of re-importing the module:

```js
// Before
const handleClick = () => {
  import("react-facebook-pixel").then((module) => {
    module.default.track("InitiateCheckout", { ... });
  });
};

// After
const handleClick = () => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "InitiateCheckout", { ... });
  }
};
```

---

### M8. Raise low-contrast text
**File:** `app/page.js:189-193`
**Effort:** 5 minutes

```jsx
// Before (fails WCAG AA)
<p className="text-white/50 leading-relaxed">

// After (passes WCAG AA)
<p className="text-white/70 leading-relaxed">
```

---

### M9. Fix double hero padding
**Files:** `components/ClientLayout.js:52`, `app/page.js:28`
**Effort:** 10 minutes

Remove `py-8` from the `<motion.main>` wrapper in `ClientLayout.js`, or replace with `pb-8` only. The homepage hero already has its own top padding (`pt-20`). The combined 112px of top spacing before the navbar height pushes the H1 below the fold on 375px viewports.

---

### M10. Render FAQ answers server-side
**File:** `components/Faqs.js`
**Effort:** 30 minutes

Replace the `activeIndex === index` conditional render with CSS-based show/hide (e.g., `max-height` transition or `hidden` class). This ensures all FAQ answer text is present in the initial HTML for Googlebot to index, regardless of user interaction.

---

### M11. Add `WebSite` schema with `SearchAction`
**File:** `components/StructuredData.js`
**Effort:** 10 minutes

Add a third JSON-LD block (see `FULL-AUDIT-REPORT.md` for the complete schema).

---

### M12. Add physical address to Contact page
**File:** `app/contact-us/page.js`
**Effort:** 30 minutes

Add legal entity name, registered business address, and company registration number. Required for full Trustworthiness (E-E-A-T) compliance for a subscription app.

**Status:** ⚠️ **Partial (2026-03-28).** `ContactClient.js` shows legal name (default **Banana Sapience**) + optional `NEXT_PUBLIC_COMPANY_ADDRESS` / `NEXT_PUBLIC_COMPANY_REGISTRATION_NUMBER` (see `.env.example`). **Set values in production** for full display.

---

### M14. Expand /resources page content depth
**File:** `app/resources/ResourcesClient.js`
**Effort:** 1–2 hours
**Source:** content-analysis-resources-2026-03-28.md

Beyond the C6 quick win, add substantive content to bring the page to 500+ words:
- Short "What is the Law of Attraction?" section (~100 words)
- FAQ section with 3–5 common LOA questions (AI citation opportunity)
- Link to 1–2 external authoritative sources on LOA/manifestation research

**Status:** ✅ **Done (2026-03-28)** — rolled into C6 (same release). Optional: add 1–2 external citations in primer for extra E-E-A-T.

---

### M15. Re-run competitor analysis after technical fixes
**Effort:** 30 minutes (DataForSEO)
**Source:** competitor-analysis-2026-03-28.md

Target: 30–60 days after C3 (server component fix) is deployed. Once the site ranks for 20+ keywords, DataForSEO competitor overlap data becomes reliable and will surface true LOA niche competitors.

```
/seo dataforseo competitors loa-lawofattraction.co
/seo dataforseo ranked loa-lawofattraction.co
```

Baseline to beat: 50+ ranking keywords.

---

### M13. Confirm `@anthropic-ai/sdk` is server-only
**File:** `package.json`
**Effort:** 30 minutes (audit)

Grep the codebase for all imports of `@anthropic-ai/sdk` and confirm every usage is inside `app/api/` route handlers or server-only utilities. The SDK must never be imported in client components or shared modules — this would expose API key usage patterns in the browser bundle.

```bash
grep -r "@anthropic-ai/sdk" --include="*.js" --include="*.ts" .
```

**Status:** ✅ **Verified (2026-03-28)** — all imports under `app/api/**` only; none in client components.

---

## Low Priority — Backlog

| # | Issue | Effort | Status |
|---|---|---|-----|
| L1 | Add `SoftwareApplication` + `Offer` schema to `/pricing` page | 20 min | ✅ Done — `components/PricingJsonLd.js` |
| L2 | Add `AboutPage` / `ContactPage` WebPage schema to respective pages | 15 min | ✅ Done — `components/WebPageJsonLd.js` on `/about-us`, `/contact-us` |
| L3 | Create page-specific OG images for `/about-us`, `/features`, `/pricing` | 2 hrs | ✅ Done — `opengraph-image.js` per route (`next/og` ImageResponse) |
| L4 | Add App Store and Google Play Store links to `Organization.sameAs` | 5 min | ✅ Done |
| L5 | Convert planet images (`mercury.png` etc.) to WebP | 30 min | ✅ Done — `public/*.webp` + canvas loads `.webp` |
| L6 | Add `Cache-Control: public, max-age=31536000, immutable` for static assets in `next.config.mjs` | 20 min | ✅ Done — `_next/static`, fonts, favicon, mock, bg, icons, extension match |
| L7 | Remove `changeFrequency` and `priority` from sitemap — Google ignores both | 5 min | ✅ Done |
| L8 | Add descriptive alt text to phone mockup images (not just `"LoA App Interface"`) | 15 min | ✅ Done — Start, OurStory, OurPhilosophy, Features grid, Updates, etc. |
| L9 | Add `BreadcrumbList` schema to inner pages | 30 min | ✅ Done — `components/BreadcrumbJsonLd.js` on marketing routes |
| L10 | Throttle `SolarSystemBackground` canvas to 30fps, remove `shadowBlur` | 1 hr | ✅ Done |

### Additional content shipped (not in original checklist)
- **`/features`** — SEO intro + H1 in `FeaturesClient.js`; expanded blurb in `components/Features.js`; metadata **Law of Attraction App Features \| LoA**.
- **`/download`** — richer hero + “Why download…” section; metadata refresh.

---

## Summary Checklist

*Updated 2026-03-28. `[~]` = partial.*

```
CRITICAL (do now)
[x] C1 - Fix StructuredData.js staging URL → production domain
[x] C2 - Remove hardcoded aggregateRating
[x] C3 - Split all public pages to Server Component + Client Component
[x] C4 - Wrap SolarSystemBackground in dynamic() with ssr: false
[x] C5 - Fix base font size to 16px
[x] C6 - Target keywords + expanded content + FAQ + JSON-LD on /resources

HIGH (this week)
[x] H1 - Add Disallow rules to robots.txt
[x] H2 - Fix CTA button tap targets to min-h-[48px]
[x] H3 - Fix hamburger to w-12 h-12
[x] H4 - Remove x: -100 from page transition
[x] H5 - Replace <img> with <Image> in HowItWorks
[x] H6 - Replace Google Fonts @import with next/font/google
[x] H7 - Add OG image width/height to layout.js
[x] H8 - Fix operatingSystem from array to string
[x] H9 - Remove/rewrite Legacy.js copy
[x] H10 - Resolve "50,000 users" vs "Join Waitlist" conflict
[~] H11 - Founder/team on About (short “Who builds LoA” + trust copy; bios/photos TBD)
[x] H12 - Implement IndexNow
[x] H13 - “Law of attraction” in marketing page meta titles
[~] H14 - Keyword research report (see DATAFORSEO-*); live SERP URLs retry when credits OK

MEDIUM (this month)
[x] M1 - Sitemap lastModified (SITE_REFRESH + legal page dates)
[x] M2 - /download in sitemap
[x] M3 - Convert Tiempos Fine to .woff2
[x] M4 - Fix Ubuntu font (import or remove)
[x] M5 - Add prefers-reduced-motion to canvas
[x] M6 - Remove console.log from SolarSystemBackground
[x] M7 - Fix Meta Pixel click handler re-import
[x] M8 - Raise text-white/50 contrast to /70
[x] M9 - Fix double hero padding in ClientLayout
[x] M10 - Render FAQ answers server-side
[x] M11 - Add WebSite schema with SearchAction
[~] M12 - Contact legal block + env vars; set address in prod for full E-E-A-T (see `.env.example`; `ContactClient.js` already renders block when `NEXT_PUBLIC_COMPANY_*` set)
[x] M13 - @anthropic-ai/sdk server-only (all under app/api)
[x] M14 - /resources 500+ words + FAQ (with C6)
[~] M15 - Re-run competitor analysis after more rankings / GSC data (scheduled; needs DataForSEO + traction)

LOW (backlog L1–L10)
[x] L1–L10 — see table above (all shipped 2026-03-28)
```

### Production rollout (manual — 2026-03-28)

1. **Vercel / hosting env:** Copy the SEO block from `.env.prod` (or `.env.example`) into project settings: `NEXT_PUBLIC_COMPANY_*`, `NEXT_PUBLIC_FOUNDER_*`, `NEXT_PUBLIC_FOUNDING_YEAR`, `INDEXNOW_KEY` / `INDEXNOW_SUBMIT_SECRET`. Fill **legal name, registered address, and registration number** for M12; fill **founder fields** for H11 when ready.
2. **IndexNow:** `INDEXNOW_KEY` must match the key file under `public/` (see H12).
3. **DataForSEO (H14 / M15):** Add account credits; re-run live SERP and ranked-keywords/competitor endpoints — retries still returned HTTP **402** as of 2026-03-28.
