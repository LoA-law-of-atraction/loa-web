# Image Optimization Audit — loa-lawofattraction.co
**Date:** 2026-03-27

---

## Image Audit Summary

| Metric | Status | Count |
|--------|--------|-------|
| Total Images Found | — | 41 |
| Missing Alt Text | ❌ | 6 |
| Missing Dimensions (no width/height) | ❌ | 8 |
| Wrong Format (PNG/JPG → should be WebP) | ⚠️ | 14 |
| Not Lazy-Loaded (below-fold) | ⚠️ | 8 |
| Using plain `<img>` instead of `next/image` | ⚠️ | 8 |
| Missing Files (404 errors) | ❌ | 3 |
| Oversized SVG Files | ⚠️ | 3 |

---

## All Images in /public/

### Core Assets
| File | Format | Size | Category | Status |
|------|--------|------|----------|--------|
| `/app_logo.svg` | SVG | 2.5MB | Logo | ❌ CRITICAL: Oversized (likely embedded raster data) |
| `/og.png` | PNG | 210KB | Social | ⚠️ Should be WebP |
| `/sun.png` | PNG | 203KB | Canvas BG | ⚠️ Should be WebP |
| `/flame.png` | PNG | 25KB | Icon | ⚠️ Should be WebP |

### Planet Images (Solar System Canvas)
| File | Format | Size | Status |
|------|--------|------|--------|
| `/mercury.png` | PNG | 28KB | ⚠️ Should be WebP |
| `/venus.png` | PNG | 36KB | ⚠️ Should be WebP |
| `/earth.png` | PNG | 29KB | ⚠️ Should be WebP |
| `/mars.png` | PNG | 62KB | ⚠️ Should be WebP |
| `/jupiter.png` | PNG | 289KB | ⚠️ Should be WebP — oversize |
| `/saturn.png` | PNG | 65KB | ⚠️ Should be WebP |
| `/uranus.png` | PNG | 40KB | ⚠️ Should be WebP |
| `/neptune.png` | PNG | 52KB | ⚠️ Should be WebP |

### Mock / Demo Images
| File | Format | Size | Status |
|------|--------|------|--------|
| `/mock/mock5.png` | PNG | 2.6MB | ❌ CRITICAL: Oversized |
| `/mock/mock6.png` | PNG | 1.8MB | ❌ Large |
| `/mock/mock7.png` | PNG | 1.2MB | ❌ Large |
| `/mock/mock9.png` | PNG | 1.8MB | ❌ Large |
| `/mock/mock10.png` | PNG | 2.5MB | ❌ CRITICAL: Oversized |
| `/mock/mock11.png` | PNG | 2.3MB | ❌ CRITICAL: Oversized |
| `/mock/mock12.png` | PNG | 2.0MB | ❌ CRITICAL: Oversized |

### QR Codes
| File | Format | Size | Status |
|------|--------|------|--------|
| `/loa_ios._qrcode.svg` | SVG | 146KB | ⚠️ Oversized — should be <20KB |
| `/loa_android_qrcode.svg` | SVG | 146KB | ⚠️ Oversized — should be <20KB |

### Buttons & Badges
| File | Format | Size | Status |
|------|--------|------|--------|
| `/buttons/google-play-badge.png` | PNG | 4.6KB | OK |
| `/buttons/app-store-badge.svg` | SVG | 11KB | OK |
| `/buttons/app-store-badge_light.svg` | SVG | 10KB | OK |

### Icons (all SVG — OK)
`/icons/list.svg`, `/icons/ai.svg`, `/icons/community.svg`, `/icons/control.svg`, `/icons/discover.svg`, `/icons/exit.svg`, `/icons/menu.svg`

### Favicon Assets — OK
`/favicon/favicon-16x16.png`, `/favicon/favicon-32x32.png`, `/favicon/android-chrome-192x192.png`, `/favicon/android-chrome-512x512.png`, `/favicon/apple-touch-icon.png`

### Legacy / Unused
`/next.svg`, `/vercel.svg` — not referenced anywhere in codebase

---

## Image Usage in Code

### `next/image` Usage (Optimized)

| File | Line | Src | Alt | W | H | Priority | Issues |
|------|------|-----|-----|---|---|----------|--------|
| `components/NavBar.js` | 52 | /app_logo.svg | LoA Logo | 28 | 28 | — | ✅ |
| `components/NavBar.js` | 139 | /app_logo.svg | LoA Logo | 24 | 24 | — | ✅ |
| `components/Footer.js` | 25 | /app_logo.svg | LoA Logo | 32 | 32 | — | ✅ |
| `components/AppStoreDownloadButton.js` | 44 | /buttons/app-store-badge.svg | Download on the App Store | 150 | **10** | — | ❌ Height wrong (should be 45) |
| `components/GooglePlayDownloadButton.js` | 32 | /buttons/google-play-badge.png | Get it on Google Play | 150 | 50 | — | ✅ |
| `app/download/page.js` | 66 | /loa_ios._qrcode.svg | iOS App QR Code | 100 | 100 | — | ✅ |
| `app/download/page.js` | 78 | /loa_android_qrcode.svg | Android App QR Code | 100 | 100 | — | ✅ |
| `app/download/page.js` | 97 | /mock/mock6.png | LoA App | 280 | 560 | — | ⚠️ PNG format |
| `app/updates/page.js` | 28 | /mockups/mockupJournal.png | About LoA | 300 | 300 | — | ❌ File missing (404) |
| `components/OurPhilosophy.js` | 62 | /mockups/workImg.webp | LoA Mockup | 500 | 400 | — | ❌ File missing (404) |
| `components/Success.js` | 40 | /success.gif | Success | 100 | 100 | — | ❌ File missing (404) |

### Plain `<img>` Usage (Not Optimized)

| File | Line | Src | Alt | Dimensions | Loading | Issues |
|------|------|-----|-----|-----------|---------|--------|
| `components/Start.js` | 29 | /loa_android_qrcode.svg | Android QR Code | ❌ None | ❌ None | No dims, no lazy, below-fold |
| `components/Start.js` | 37 | /loa_ios._qrcode.svg | iOS QR Code | ❌ None | ❌ None | No dims, no lazy, below-fold |
| `components/Start.js` | 47 | /mock/mock5.png | Manifest Your Dreams | ❌ None | ❌ None | No dims, no lazy, PNG, below-fold |
| `components/HowItWorks.js` | 74 | /mock/mock6.png | LoA App Interface | ❌ None | ❌ None | No dims, no lazy, PNG, below-fold |
| `components/OurStory.js` | 29 | /mock/mock6.png | LoA App Mockup | ❌ None | ❌ None | No dims, no lazy, PNG, below-fold |
| `app/pricing/page.js` | 63 | /mock/mock5.png | LoA App Mockup | ❌ None | ❌ None | No dims, no lazy, PNG, below-fold |
| `app/dashboard/page.js` | 115 | (dynamic) | **empty** | ❌ None | ❌ None | ❌ Empty alt text |
| `app/dashboard/page.js` | 1590 | (dynamic) | **empty** | ❌ None | ❌ None | ❌ Empty alt text |
| `app/dashboard/preview/[docId]/page.js` | 485 | (dynamic) | **empty** | ❌ None | ❌ None | ❌ Empty alt text |
| `app/dashboard/preview/[docId]/page.js` | 647 | (dynamic) | **empty** | ❌ None | ❌ None | ❌ Empty alt text |

### Canvas Images (SolarSystemBackground)

`components/SolarSystemBackground.js:68-77` — loads 8 planet PNGs via `new Image()`. These bypass Next.js optimization entirely — no WebP conversion, no CDN optimization, no error handling.

### Missing CSS Background Image

`app/globals.css:40` — `.arc` class references `/bg/glowingBg.png` which does not exist (404).

---

## `next.config.mjs` — No Images Config

No `images` configuration block is present. Recommended addition:

```js
images: {
  formats: ['image/avif', 'image/webp'],
  dangerouslyAllowSVG: true,
  contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
},
```

---

## Prioritized Fix List

### Priority 1 — Fix 404 Missing Images (immediate)

Three images are referenced but don't exist — components will render broken:

| File | Missing Asset | Fix |
|------|--------------|-----|
| `app/updates/page.js:28` | `/mockups/mockupJournal.png` | Replace src with `/mock/mock5.png` or add the file |
| `components/OurPhilosophy.js:62` | `/mockups/workImg.webp` | Replace src with `/mock/mock6.png` or add the file |
| `components/Success.js:40` | `/success.gif` | Add the file or replace with a static image |
| `app/globals.css:40` | `/bg/glowingBg.png` | Add the file or remove the `.arc` CSS class |

---

### Priority 2 — Convert Mock Images to WebP (highest bandwidth savings)

Total mock PNG weight: **~14.1MB** → estimated WebP: **~8.8–9.8MB** (~35% savings)

These images are served to every visitor on multiple public pages. Convert all to WebP:

```bash
# Using cwebp (install: brew install webp)
for f in public/mock/*.png; do
  cwebp -q 85 "$f" -o "${f%.png}.webp"
done
```

Then update all references:
- `components/Start.js:47` — `/mock/mock5.png` → `/mock/mock5.webp`
- `components/HowItWorks.js:74` — `/mock/mock6.png` → `/mock/mock6.webp`
- `components/OurStory.js:29` — `/mock/mock6.png` → `/mock/mock6.webp`
- `app/pricing/page.js:63` — `/mock/mock5.png` → `/mock/mock5.webp`
- `app/download/page.js:97` — `/mock/mock6.png` → `/mock/mock6.webp`

---

### Priority 3 — Optimize app_logo.svg (2.5MB → target <50KB)

`/public/app_logo.svg` is 2.5MB — this is loaded on every page via NavBar, Footer, and login. An SVG this large almost certainly contains embedded raster data or unoptimized paths.

```bash
# Check what's inside
file public/app_logo.svg
wc -c public/app_logo.svg

# Optimize with svgo
npx svgo public/app_logo.svg -o public/app_logo.optimized.svg
```

If the SVG contains embedded base64 PNG data, extract it as a separate PNG/WebP and use `<Image>` instead.

---

### Priority 4 — Replace `<img>` with `<Image>` in public-facing components

**`components/HowItWorks.js:74`**
```jsx
import Image from "next/image";

// Before
<img src="/mock/mock6.png" alt="LoA App Interface" className="w-full max-w-sm lg:max-w-md h-auto drop-shadow-2xl" />

// After
<Image
  src="/mock/mock6.webp"
  alt="LoA app affirmation screen on Android"
  width={400}
  height={800}
  loading="lazy"
  decoding="async"
  sizes="(max-width: 640px) 100vw, 400px"
  className="w-full max-w-sm lg:max-w-md h-auto drop-shadow-2xl"
/>
```

**`components/OurStory.js:29`**
```jsx
<Image
  src="/mock/mock6.webp"
  alt="LoA app showing affirmation screen"
  width={400}
  height={800}
  loading="lazy"
  decoding="async"
  sizes="(max-width: 640px) 100vw, 400px"
  className="..."
/>
```

**`components/Start.js:29,37,47`**
```jsx
<Image src="/loa_android_qrcode.svg" alt="Scan to download LoA on Android" width={96} height={96} loading="lazy" decoding="async" className="w-24 h-24 p-2 bg-white rounded-2xl hidden sm:block" />
<Image src="/loa_ios._qrcode.svg"    alt="Scan to download LoA on iOS"     width={96} height={96} loading="lazy" decoding="async" className="w-24 h-24 p-2 bg-white rounded-2xl hidden sm:block" />
<Image src="/mock/mock5.webp"        alt="LoA app manifest your dreams screen" width={400} height={800} loading="lazy" decoding="async" sizes="(max-width: 640px) 100vw, 400px" className="..." />
```

**`app/pricing/page.js:63`**
```jsx
<Image
  src="/mock/mock5.webp"
  alt="LoA app premium features screen"
  width={400}
  height={800}
  loading="lazy"
  decoding="async"
  sizes="(max-width: 640px) 100vw, 400px"
  className="..."
/>
```

---

### Priority 5 — Fix AppStoreDownloadButton height mismatch

**`components/AppStoreDownloadButton.js:44`**
```jsx
// Before
<Image src="/buttons/app-store-badge.svg" alt="Download on the App Store" width={150} height={10} />

// After
<Image src="/buttons/app-store-badge.svg" alt="Download on the App Store" width={150} height={45} />
```

---

### Priority 6 — Fix empty alt text in dashboard

**`app/dashboard/page.js:115,1590`** and **`app/dashboard/preview/[docId]/page.js:485,647`**

```jsx
// Before
<img src={url} alt="" className="..." />

// After — use descriptive dynamic alt or role="presentation" if purely decorative
<img src={url} alt={`Preview image ${index + 1}`} width={600} height={400} loading="lazy" className="..." />
```

---

### Priority 7 — Reduce QR code SVG sizes

`/loa_ios._qrcode.svg` and `/loa_android_qrcode.svg` are 146KB each (should be <20KB):

```bash
npx svgo public/loa_ios._qrcode.svg -o public/loa_ios._qrcode.svg
npx svgo public/loa_android_qrcode.svg -o public/loa_android_qrcode.svg
```

---

### Priority 8 — Convert planet PNGs to WebP for Canvas

**`components/SolarSystemBackground.js:68-77`**

```bash
for f in public/mercury.png public/venus.png public/earth.png public/mars.png public/jupiter.png public/saturn.png public/uranus.png public/neptune.png public/sun.png; do
  cwebp -q 85 "$f" -o "${f%.png}.webp"
done
```

Then update the image loading array in `SolarSystemBackground.js`:
```js
const imagePaths = {
  sun: "/sun.webp",
  mercury: "/mercury.webp",
  venus: "/venus.webp",
  earth: "/earth.webp",
  mars: "/mars.webp",
  jupiter: "/jupiter.webp",
  saturn: "/saturn.webp",
  uranus: "/uranus.webp",
  neptune: "/neptune.webp",
};
```

---

### Priority 9 — Add `next.config.mjs` images configuration

```js
const nextConfig = {
  // ... existing config
  images: {
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};
```

---

## Estimated Impact Summary

| Fix | Current Weight | After | Savings |
|-----|---------------|-------|---------|
| Convert 7 mock PNGs to WebP | 14.1MB | ~9MB | ~35% |
| Optimize app_logo.svg | 2.5MB | ~50KB | ~98% |
| Optimize QR code SVGs (×2) | 292KB | ~40KB | ~86% |
| Convert 8 planet PNGs to WebP | 601KB | ~380KB | ~37% |
| **Total estimated savings** | **~17.5MB** | **~9.5MB** | **~45%** |

Fixing lazy loading on 8 below-fold images will additionally improve FCP and LCP by reducing network contention at page load.
