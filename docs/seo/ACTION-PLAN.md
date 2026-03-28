# SEO Action Plan — loa-lawofattraction.co
**Date:** 2026-03-27
**Health Score:** 41 / 100

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

This is the single highest-leverage E-E-A-T improvement available and requires no technical complexity.

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

---

### M13. Confirm `@anthropic-ai/sdk` is server-only
**File:** `package.json`
**Effort:** 30 minutes (audit)

Grep the codebase for all imports of `@anthropic-ai/sdk` and confirm every usage is inside `app/api/` route handlers or server-only utilities. The SDK must never be imported in client components or shared modules — this would expose API key usage patterns in the browser bundle.

```bash
grep -r "@anthropic-ai/sdk" --include="*.js" --include="*.ts" .
```

---

## Low Priority — Backlog

| # | Issue | Effort |
|---|---|---|
| L1 | Add `SoftwareApplication` + `Offer` schema to `/pricing` page | 20 min |
| L2 | Add `AboutPage` / `ContactPage` WebPage schema to respective pages | 15 min |
| L3 | Create page-specific OG images for `/about-us`, `/features`, `/pricing` | 2 hrs |
| L4 | Add App Store and Google Play Store links to `Organization.sameAs` | 5 min |
| L5 | Convert planet images (`mercury.png` etc.) to WebP | 30 min |
| L6 | Add `Cache-Control: public, max-age=31536000, immutable` for static assets in `next.config.mjs` | 20 min |
| L7 | Remove `changeFrequency` and `priority` from sitemap — Google ignores both | 5 min |
| L8 | Add descriptive alt text to phone mockup images (not just `"LoA App Interface"`) | 15 min |
| L9 | Add `BreadcrumbList` schema to inner pages | 30 min |
| L10 | Throttle `SolarSystemBackground` canvas to 30fps, remove `shadowBlur` | 1 hr |

---

## Summary Checklist

```
CRITICAL (do now)
[x] C1 - Fix StructuredData.js staging URL → production domain
[x] C2 - Remove hardcoded aggregateRating
[x] C3 - Split all public pages to Server Component + Client Component
[x] C4 - Wrap SolarSystemBackground in dynamic() with ssr: false
[x] C5 - Fix base font size to 16px

HIGH (this week)
[x] H1 - Add Disallow rules to robots.txt
[x] H2 - Fix CTA button tap targets to min-h-[48px]
[x] H3 - Fix hamburger to w-12 h-12
[x] H4 - Remove x: -100 from page transition
[ ] H5 - Replace <img> with <Image> in HowItWorks
[ ] H6 - Replace Google Fonts @import with next/font/google
[x] H7 - Add OG image width/height to layout.js
[x] H8 - Fix operatingSystem from array to string
[ ] H9 - Remove/rewrite Legacy.js copy
[ ] H10 - Resolve "50,000 users" vs "Join Waitlist" conflict
[ ] H11 - Add founder/team section to About page
[ ] H12 - Implement IndexNow

MEDIUM (this month)
[ ] M1 - Fix sitemap lastModified dates
[x] M2 - Add /download to sitemap
[ ] M3 - Convert Tiempos Fine to .woff2
[ ] M4 - Fix Ubuntu font (import or remove)
[ ] M5 - Add prefers-reduced-motion to canvas
[ ] M6 - Remove console.log from SolarSystemBackground
[ ] M7 - Fix Meta Pixel click handler re-import
[ ] M8 - Raise text-white/50 contrast to /70
[ ] M9 - Fix double hero padding in ClientLayout
[ ] M10 - Render FAQ answers server-side
[ ] M11 - Add WebSite schema with SearchAction
[ ] M12 - Add physical address to Contact page
[ ] M13 - Audit @anthropic-ai/sdk is server-only
```
