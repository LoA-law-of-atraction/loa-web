# Content Quality & E-E-A-T Analysis — /resources
**URL:** https://www.loa-lawofattraction.co/resources
**Date:** 2026-03-28
**Tool:** DataForSEO (live) + source code analysis

---

## Content Quality Score: 28 / 100

---

## E-E-A-T Breakdown

| Factor | Score | Key Signals |
|--------|-------|-------------|
| Experience | 2/25 | No first-hand content, no original insights |
| Expertise | 3/25 | No author attribution, no expertise signals, no depth |
| Authoritativeness | 5/25 | Links to internal pages; no external citations or brand mentions |
| Trustworthiness | 18/25 | HTTPS, breadcrumb nav, links to privacy policy & T&C |
| **Total** | **28/100** | |

---

## AI Citation Readiness: 8 / 100

No quotable facts, no statistics, no structured Q&A, no original data. AI systems have nothing to extract or cite from this page.

---

## Page Content Audit

### What the page is
A navigation hub — 8 cards linking to other pages, each with a 1–2 sentence description. No substantive content of its own.

### Word Count

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Total words | ~230 | 500+ (hub page) | FAIL |
| Unique content | ~80 words | — | Critical |
| Navigation labels | ~150 words | — | Not content |

### Heading Structure

```
H1: "Guides, support, and product pages"              ← generic, no target keyword
  H2: "How LoA supports your daily digital practice"  ← card title (nav label)
  H2: "Our philosophy"                                 ← card title (nav label)
  H2: "Feature overview"                               ← card title (nav label)
  H2: "Get the app"                                    ← card title (nav label)
  H2: "Product updates"                                ← card title (nav label)
  H2: "Privacy policy"                                 ← card title (nav label)
  H2: "Terms and conditions"                           ← card title (nav label)
```

H2s are navigation labels, not content headings. No semantic depth.

### Keyword Optimization

| Keyword | Present |
|---------|---------|
| "law of attraction" | No |
| "manifestation" | No |
| "LOA app" | No |
| "affirmations" | Once (hero card desc.) |
| "LoA" (brand) | 3× |

Primary target keywords are completely absent from this page.

### Technical (Positive)

- `page.js` correctly exports `metadata` as a server component — the proper Next.js pattern
- Breadcrumb navigation present (`<nav aria-label="Breadcrumb">`)
- Canonical tag set: `/resources`
- OpenGraph tags present

### Meta Tags

| Tag | Current Value | Assessment |
|-----|---------------|------------|
| Title | "Resources \| LoA App" | Weak — no target keyword |
| Description | "Explore LoA guides, product pages, updates, and support resources for building a more conscious digital practice." | Generic — missing "law of attraction", "manifestation" |
| Canonical | /resources | Correct |

---

## Issues Found

### Critical
1. **Thin content (~230 words)** — Page is a sitemap disguised as content. No substantive text for Google to evaluate or AI to cite.
2. **No target keywords** — "Law of attraction", "manifestation", "LOA app" appear nowhere on the page.
3. **H1 is generic** — "Guides, support, and product pages" has zero keyword value and provides no topical signal.

### High
4. **Zero E-E-A-T signals** — No author, no expertise, no first-hand insights, no external references.
5. **AI citation readiness near zero** — Nothing quotable, no statistics, no structured answers for AI systems to extract.
6. **Meta title misses keyword opportunity** — "Resources | LoA App" wastes the title tag.

### Medium
7. **H2s are nav labels, not content headings** — No descriptive headings that could rank for informational queries.
8. **No FAQ or structured Q&A** — Missed opportunity for "loa coach", "law of attraction app", "how does loa work" queries.

---

## Recommendations

| Priority | Action |
|----------|--------|
| Critical | Rewrite H1 — e.g. "Law of Attraction Resources: Guides, Tools & Support" |
| Critical | Add 400+ words of real content — what is LOA, what the app does, why it helps |
| Critical | Include target keywords naturally: "law of attraction", "manifestation app", "affirmations" |
| High | Add a short intro paragraph explaining the LOA philosophy (boosts Experience signal) |
| High | Update meta title — e.g. "Law of Attraction Resources \| LoA App" |
| High | Add a FAQ section covering common LOA questions (AI citation opportunity) |
| Medium | Add author/team attribution with a short bio to signal Expertise |
| Medium | Link to 1–2 external authoritative sources on LOA or manifestation research |

---

## Suggested H1 & Intro Rewrite

**Current H1:** Guides, support, and product pages

**Suggested H1:** Law of Attraction Resources: Guides, Tools & Support

**Suggested intro (add below H1):**
> Everything you need to understand and use LoA — the Law of Attraction app built for your digital life. Explore how affirmations, mindful pauses, and conscious reflection tools work together to shift your daily phone use into a manifestation practice. Browse guides, product info, and support pages below.

This adds ~50 words with natural keyword density and sets topical context for the whole page.

---

*Source: DataForSEO on_page_content_parsing + app/resources/ResourcesClient.js*
*Re-analysis recommended after content updates are deployed*
