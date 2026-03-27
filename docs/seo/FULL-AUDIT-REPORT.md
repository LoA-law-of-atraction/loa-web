# Full SEO Audit Report — loa-lawofattraction.co
**Date:** 2026-03-27
**Platform:** Next.js 15 (App Router) · Vercel
**Business Type:** Lifestyle / Wellness Mobile App (SaaS-adjacent)
**Pages crawled:** 9 (full public surface)

---

## Executive Summary

### SEO Health Score: 41 / 100

| Category | Weight | Score | Weighted |
|---|---|---|---|
| Technical SEO | 25% | 58/100 | 14.5 |
| Content Quality (E-E-A-T) | 25% | 41/100 | 10.25 |
| On-Page SEO | 20% | 35/100 | 7.0 |
| Schema / Structured Data | 10% | 30/100 | 3.0 |
| Core Web Vitals | 10% | 25/100 | 2.5 |
| Images | 5% | 50/100 | 2.5 |
| AI Search Readiness | 5% | 22/100 | 1.1 |
| **TOTAL** | | | **41 / 100** |

### Top 5 Critical Issues
1. Every public page is `"use client"` — Googlebot receives empty HTML on every route
2. `StructuredData.js` points to `loa-web-landing.vercel.app` (staging) instead of production domain
3. `aggregateRating` (4.8 / 1,000 reviews) is hardcoded and unverifiable — manual action risk
4. No named founders or authors anywhere on the site — critical E-E-A-T gap
5. LCP estimated 3.5–5s+ due to client-only rendering + 60fps canvas blocking main thread

### Top 5 Quick Wins
1. Fix `components/StructuredData.js:12-13` — change staging URL to production (< 5 minutes)
2. Add `Disallow` rules to `public/robots.txt` for `/admin`, `/dashboard`, `/login`, `/signup`
3. Add `width: 1200, height: 630` to OG image in `app/layout.js:44`
4. Fix `MobileApplication.operatingSystem` from array to string in `StructuredData.js`
5. Replace `lastModified: new Date()` with real dates in `app/sitemap.js`

---

## Technical SEO
**Score: 58 / 100**

### Crawlability

| Check | Status | Severity |
|---|---|---|
| `robots.txt` present and valid | PASS | — |
| Sitemap declared in `robots.txt` | PASS | — |
| `/admin/*`, `/dashboard/*`, `/login`, `/signup` not blocked | FAIL | High |
| `lastModified: new Date()` on 5 sitemap entries | FAIL | Medium |

**robots.txt fix:**
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

### Indexability

| Check | Status | Severity |
|---|---|---|
| Root `robots` metadata set to `index: true` | PASS | — |
| Canonical on `/`, `/privacy-policy`, `/terms`, `/contact-us` | PASS | — |
| `/features`, `/about-us`, `/pricing`, `/download`, `/updates` — no metadata export | FAIL | Critical |
| All public pages are `"use client"` — metadata exports silently ignored | FAIL | Critical |

**Root cause:** In Next.js App Router, `export const metadata` only works in Server Components. Pages marked `"use client"` cannot export metadata — Next.js silently falls back to the root layout's generic title and description on every page.

**Pattern to implement (from `app/privacy-policy/page.js`):**
```js
// app/features/page.js — Server Component
export const metadata = {
  title: "Features | LoA - Law of Attraction",
  description: "Explore LoA's affirmation screens, mindful pause tools, and consciousness-building features.",
  alternates: { canonical: "https://www.loa-lawofattraction.co/features" },
};
export default function FeaturesPage() {
  return <FeaturesClient />;  // "use client" component with animations
}
```

### Security

| Check | Status | Severity |
|---|---|---|
| HTTPS enforced | PASS | — |
| Non-www → www 301 redirect | PASS | — |
| `X-Content-Type-Options: nosniff` | PASS | — |
| `X-Frame-Options: SAMEORIGIN` | PASS | — |
| `Referrer-Policy` set | PASS | — |
| `Permissions-Policy` set | PASS | — |
| Content Security Policy (CSP) | MISSING | High |
| `X-XSS-Protection` | MISSING | Low |
| HSTS delegated to Vercel | INFO | — |

### URL Structure

| Check | Status |
|---|---|
| Clean readable slugs (`/features`, `/about-us`, etc.) | PASS |
| No URL parameter pollution | PASS |
| All lowercase | PASS |
| Legacy `/premium` → `/pricing` 301 | PASS |

### Mobile Optimization

| Check | Status | Severity |
|---|---|---|
| Viewport meta tag (injected by Next.js) | PASS | — |
| Responsive Tailwind breakpoints throughout | PASS | — |
| Mobile navigation drawer with accessible aria labels | PASS | — |
| Hamburger button: 36×36px (below 48px minimum) | FAIL | High |
| CTA download buttons: 45px tall (below 48px minimum) | FAIL | Critical |
| Base font size 14px on mobile (below 16px minimum) | FAIL | Critical |

### Core Web Vitals

| Metric | Predicted | Status | Severity |
|---|---|---|---|
| LCP | ~3.5–5s+ | FAIL | Critical |
| CLS | ~0.15–0.25 | FAIL | High |
| INP | ~200–400ms | AT RISK | High |
| TTFB | <400ms | PASS | — |

**LCP root causes:**
- `app/page.js` has `"use client"` — browser receives empty HTML, full JS parse required before any paint
- `SolarSystemBackground` runs 60fps canvas with `shadowBlur` on main thread from page load
- H1 has `transition={{ delay: 0.3, duration: 0.8 }}` — additional 300ms delay after JS hydration
- Google Fonts loaded via CSS `@import` — render-blocking, 2–4 serial network round-trips

**CLS root causes:**
- `ClientLayout` uses `initial={{ opacity: 0, x: -100 }}` — 100px horizontal shift on every route transition
- `<img>` in `HowItWorks.js` has no `width`/`height` — browser can't reserve space, causing reflow

**INP root causes:**
- `requestAnimationFrame` loop at 60fps with `shadowBlur` monopolizes main thread
- All 6 public pages are CSR — full Framer Motion hydration, Firebase init, Meta Pixel all compete on startup

### JavaScript Rendering

**Status: FAIL (Critical)**

Every public-facing page has `"use client"` at line 1:
- `app/page.js`
- `app/features/page.js`
- `app/about-us/page.js`
- `app/pricing/page.js`
- `app/updates/page.js`
- `app/download/page.js`

Googlebot's initial HTML response contains no indexable content. While Google eventually renders JavaScript, this introduces indexation delays of days to weeks and provides zero guarantee of full content being weighted.

### IndexNow

**Status: NOT IMPLEMENTED (High)**

No IndexNow key file in `/public/`, no submission calls anywhere in the codebase. IndexNow enables instant crawl notification to Bing, Yandex, and Naver. Particularly valuable for a new domain with a small backlink profile.

---

## Content Quality (E-E-A-T)
**Score: 41 / 100 | E-E-A-T Composite: 33 / 100**

| E-E-A-T Factor | Score |
|---|---|
| Experience | 18/100 |
| Expertise | 35/100 |
| Authoritativeness | 30/100 |
| Trustworthiness | 45/100 |

### Critical Content Issues

**Fabricated aggregate rating in structured data**
`ratingValue: "4.8"` / `ratingCount: "1000"` are hardcoded strings in `components/StructuredData.js`. The `/updates` page shows a "Join the Waitlist" CTA, suggesting the app is pre-launch or early stage. A claim of 1,000 reviews averaging 4.8 stars with no connection to a real review source is a deceptive signal under the September 2025 QRG. Remove or replace with dynamically pulled values from the App Store / Google Play APIs.

**No named founders or authors**
The "Birth of LoA" story in `components/OurStory.js` is written in anonymous first-person plural. The About page has no team section, no photos, no LinkedIn links, no founding date. For a wellness app requesting system-level phone permissions and charging subscriptions, this is a fundamental trust failure.

**No real author identity anywhere on site** (`app/about-us/page.js`)

### High Content Issues

| Issue | File |
|---|---|
| "50,000 users" claim contradicts "Join the Waitlist" CTA | `components/UserTestimonials.js` |
| Testimonials are hardcoded, unverified, undated — all 5-star, roles suspiciously uniform | `components/UserTestimonials.js`, `components/data/reviews.js` |
| `Legacy.js` copy describes a journaling/life-documentation product, not a Law of Attraction app | `components/Legacy.js` |
| `/updates` page is a single CTA with one image — effectively empty | `app/updates/page.js` |

### Medium Content Issues

| Issue | File |
|---|---|
| No blog, resource hub, or topical content — zero expertise signals over time | (missing) |
| No external citations, research references, or expert quotes | Site-wide |
| Repetitive generic phrasing across all sections — hallmark of low-quality content per Sept 2025 QRG | Site-wide |
| FAQ answers rendered behind JS state — may not be fully indexed | `components/Faqs.js` |
| No publication or last-updated dates on any content | Site-wide |
| Contact page has no physical address or legal entity name | `app/contact-us/page.js` |

### AI Citation Readiness Score: 22 / 100

No named authors, no cited sources, no statistical claims with methodology, no structured data types (Article, Person) that would make content quotable by AI Overviews or LLMs.

---

## On-Page SEO
**Score: 35 / 100**

| Page | Has Unique Title | Has Meta Description | Has Canonical | Has H1 |
|---|---|---|---|---|
| `/` | NO (falls back to root layout) | NO | YES | YES |
| `/features` | NO | NO | NO | Unknown — CSR |
| `/about-us` | NO | NO | NO | Unknown — CSR |
| `/pricing` | NO | NO | NO | Unknown — CSR |
| `/download` | NO | NO | NO | Unknown — CSR |
| `/updates` | NO | NO | NO | Unknown — CSR |
| `/contact-us` | YES | YES | YES | — |
| `/privacy-policy` | YES | YES | YES | — |
| `/terms-and-conditions` | YES | YES | YES | — |

> Note: Pages marked `"use client"` at the page level cannot export `metadata` in Next.js App Router. Even if metadata was defined, it would be silently ignored. The correct fix is splitting each page into a server wrapper + client component.

### Heading Structure

- Homepage has a valid, unique H1: "Attract What You / Focus On"
- H1 is wrapped in `motion.div` with opacity 0 initial state — Google must render JS to see it
- Heading hierarchy on interior pages cannot be confirmed without SSR

### Internal Linking

- Navigation links to all 8 main routes
- No breadcrumb navigation on inner pages
- No internal linking from content sections to related pages

---

## Schema & Structured Data
**Score: 30 / 100**

### Current Implementation

Two JSON-LD blocks in `components/StructuredData.js`, rendered globally via `app/layout.js`.

**Organization — FAIL**

```json
{
  "@type": "Organization",
  "url": "https://loa-web-landing.vercel.app",  ← WRONG: staging domain
  "logo": "https://loa-web-landing.vercel.app/app_logo.svg"  ← WRONG: staging domain
}
```

**MobileApplication — FAIL**

```json
{
  "@type": "MobileApplication",
  "operatingSystem": ["iOS", "Android"],  ← WRONG: must be string, not array
  "aggregateRating": {
    "ratingValue": "4.8",   ← unverifiable, should be number
    "ratingCount": "1000"   ← unverifiable, should be number
  }
}
```

### Open Graph / Twitter Card

| Property | Status |
|---|---|
| `og:title`, `og:description`, `og:url`, `og:image` | PASS |
| `og:image:width`, `og:image:height` | MISSING — High |
| `twitter:card: summary_large_image` | PASS |

### Recommended Fixes

**Organization (corrected):**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "LoA - Law of Attraction",
  "alternateName": "LoA App",
  "url": "https://www.loa-lawofattraction.co",
  "logo": {
    "@type": "ImageObject",
    "url": "https://www.loa-lawofattraction.co/app_logo.svg",
    "width": 512,
    "height": 512
  },
  "description": "LoA transforms your phone into a tool for conscious living.",
  "sameAs": [
    "https://twitter.com/LoAApp",
    "https://play.google.com/store/apps/details?id=com.loa.lawofattraction.prod"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "url": "https://www.loa-lawofattraction.co/contact-us"
  }
}
```

**MobileApplication (corrected — remove hardcoded rating):**
```json
{
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  "name": "LoA - Law of Attraction",
  "url": "https://www.loa-lawofattraction.co",
  "operatingSystem": "iOS, Android",
  "applicationCategory": "LifestyleApplication",
  "downloadUrl": "https://play.google.com/store/apps/details?id=com.loa.lawofattraction.prod",
  "featureList": [
    "Personalized manifestation affirmations",
    "Conscious app interruption",
    "Energy redirection tools",
    "Awareness insights and tracking"
  ],
  "screenshot": "https://www.loa-lawofattraction.co/mock/mock6.png",
  "offers": { "@type": "Offer", "price": 0, "priceCurrency": "USD" }
}
```

**WebSite (add — enables Sitelinks Searchbox):**
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "LoA - Law of Attraction",
  "url": "https://www.loa-lawofattraction.co",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://www.loa-lawofattraction.co/resources?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

> **Note:** Do NOT add FAQPage schema. Google restricted FAQ rich results to government and healthcare authority sites (August 2023). Adding it here will not generate rich results and may trigger a manual review.

---

## Performance (Core Web Vitals)
**Score: 25 / 100**

### LCP — FAIL (~3.5–5s+)

Root causes ranked by impact:

| Cause | File | Fix |
|---|---|---|
| `"use client"` on `page.js` — no SSR, LCP element requires full JS hydration | `app/page.js:1` | Remove `"use client"`, move `useEffect` to child component |
| `SolarSystemBackground` — 60fps canvas with `shadowBlur` on every planet, blocks main thread | `components/SolarSystemBackground.js` | Wrap in `dynamic(..., { ssr: false })`, throttle to 30fps, remove `shadowBlur` |
| H1 behind `transition={{ delay: 0.3, duration: 0.8 }}` | `app/page.js:57-70` | Remove animation delay from H1 or use CSS animation |
| Google Fonts via CSS `@import` — render-blocking | `app/globals.css:1` | Replace with `next/font/google` in `layout.js` |
| Tiempos Fine served as `.otf` — 2–3× larger than `.woff2` | `app/globals.css:21-29` | Convert to `.woff2` format |
| `<img>` in `HowItWorks` — no format optimization, no priority hint | `components/HowItWorks.js:74` | Replace with `<Image>` from `next/image` |

### CLS — LIKELY FAIL (~0.15–0.25)

| Cause | File | Fix |
|---|---|---|
| `initial={{ x: -100 }}` in page transition — layout shift on every navigation | `components/ClientLayout.js` | Use `opacity` only: `initial={{ opacity: 0 }} animate={{ opacity: 1 }}` |
| `<img>` without `width`/`height` in `HowItWorks` | `components/HowItWorks.js:74` | Add explicit dimensions via `<Image>` |
| `SolarSystemBackground` two-phase mount (`null` → `<canvas>`) | `components/SolarSystemBackground.js` | Wrap in `dynamic()` with static placeholder |

### INP — AT RISK (~200–400ms)

| Cause | File | Fix |
|---|---|---|
| 60fps `requestAnimationFrame` loop with `shadowBlur` monopolizes main thread | `components/SolarSystemBackground.js` | Throttle to 30fps; remove `shadowBlur`; defer with `requestIdleCallback` |
| Full CSR on all pages — Framer Motion hydration + Firebase init + Meta Pixel on startup | Site-wide | Remove `"use client"` from page files; split interactivity to child components |
| Meta Pixel re-imported inside click handler — 50–200ms added per click | `AppStoreDownloadButton.js`, `GooglePlayDownloadButton.js` | Use `window.fbq()` directly — Pixel already initialized by `MetaPixelEvents` |

### Bundle Weight Concerns

| Package | Issue |
|---|---|
| `framer-motion` ^12.4.10 | ~140KB gzipped, loaded on every route via `ClientLayout` |
| `firebase` ^11.4.0 | Full SDK; should only import the specific modules needed |
| `@anthropic-ai/sdk` ^0.72.1 | Must be server-side only — confirm it never enters the client bundle |
| `@shotstack/shotstack-studio` ^1.10.1 | Should be behind `dynamic()` if only used on dashboard |

---

## Images
**Score: 50 / 100**

| Check | Status | Severity |
|---|---|---|
| `next/image` used for App Store / Play Store badges | PASS | — |
| `<img>` used for primary phone mockup in `HowItWorks` | FAIL | High |
| No `width`/`height` on `<img>` — CLS risk | FAIL | High |
| No lazy loading on `<img>` — loads greedily | FAIL | Medium |
| Planet images loaded via `new Image()` in Canvas — bypass Next.js optimization | INFO | Medium |
| Alt text on mockup images is generic (`"LoA App Interface"`, `"LoA App Mockup"`) | FAIL | Medium |
| OG image missing `width`/`height` metadata | FAIL | Medium |

**Fix for `HowItWorks.js:74`:**
```jsx
// Before
<img src="/mock/mock6.png" alt="LoA App Interface" className="w-full max-w-sm lg:max-w-md h-auto" />

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

## Sitemap
**Score: 65 / 100**

| Check | Status | Severity |
|---|---|---|
| Sitemap present at `/sitemap.xml` | PASS | — |
| Sitemap referenced in `robots.txt` | PASS | — |
| `lastModified: new Date()` on 5 pages | FAIL | High |
| `/download` missing from sitemap | FAIL | High |
| `changeFrequency` and `priority` present (Google ignores both) | INFO | Low |

**Recommended `app/sitemap.js`:**
```js
export default function sitemap() {
  const baseUrl = "https://www.loa-lawofattraction.co";
  return [
    { url: baseUrl,                           lastModified: "2026-01-19" },
    { url: `${baseUrl}/about-us`,             lastModified: "2026-01-19" },
    { url: `${baseUrl}/features`,             lastModified: "2026-01-19" },
    { url: `${baseUrl}/pricing`,              lastModified: "2026-01-19" },
    { url: `${baseUrl}/download`,             lastModified: "2026-01-19" },
    { url: `${baseUrl}/updates`,              lastModified: "2026-01-19" },
    { url: `${baseUrl}/contact-us`,           lastModified: "2025-10-22" },
    { url: `${baseUrl}/privacy-policy`,       lastModified: "2025-10-22" },
    { url: `${baseUrl}/terms-and-conditions`, lastModified: "2025-10-22" },
  ];
}
```

---

## Visual / Mobile Rendering
**Note:** Screenshots unavailable (Playwright not configured). Analysis based on HTML/CSS source.

| Check | Score | Status |
|---|---|---|
| Above-the-fold structure | 6/10 | Double padding pushes hero below fold on 375px viewport |
| Mobile responsiveness | 7/10 | Responsive grid in place; specific tap target failures |
| Tap target sizes | 5/10 | Hamburger 36px, CTA buttons 45px — both below 48px minimum |
| Font sizes | 6/10 | 14px base on mobile |
| SEO / Metadata | 9/10 | Well structured in layout.js |
| Performance risk | 4/10 | Canvas animation heavy on mobile CPUs |

**Additional visual issues:**
- Active nav link state is harder to read than inactive (lower contrast) — `components/NavBar.js:63-71`
- `text-white/50` on dark background in Philosophy section fails WCAG AA contrast — `app/page.js:189-193`
- Ubuntu font class applied in NavBar but Ubuntu is not imported — falls back to OS default — `components/NavBar.js:49`
- Page transition `x: -100` causes horizontal scroll artifacts on narrow mobile — `components/ClientLayout.js`
