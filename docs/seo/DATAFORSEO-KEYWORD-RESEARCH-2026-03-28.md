# DataForSEO keyword & SERP research — LoA (loa-lawofattraction.co)

**Date:** 2026-03-28  
**Market:** United States, English (Google)  
**Property:** https://www.loa-lawofattraction.co — Law of Attraction / manifestation / affirmations app (iOS & Android)

---

## Data sources

**Successful (this run):**

- DataForSEO Labs — Google Keyword Overview (`dataforseo_labs_google_keyword_overview`)
- DataForSEO Labs — Bulk Keyword Difficulty (`dataforseo_labs_bulk_keyword_difficulty`)
- DataForSEO Labs — Search Intent (`dataforseo_labs_search_intent`)
- Keywords Data — Google Trends Explore (`kw_data_google_trends_explore`) — `past_12_months`, `type: web`, US

**Failed or blocked (no live SERP URL lists in this run):**

- `serp_organic_live_advanced` — API 500 (Internal Server Error) on first attempt; retry returned HTTP **402** (payment / credits)
- `dataforseo_labs_google_serp_competitors` — HTTP **402**
- `dataforseo_labs_google_related_keywords` — HTTP **402**
- `kw_data_google_ads_search_volume` (long-tail batch) — HTTP **402**

**Retry (2026-03-28, MCP `serp_organic_live_advanced`, keyword `law of attraction app`, US / en / mobile):** HTTP **402** — credits still required.

**Retry (same day, MCP `dataforseo_labs_google_ranked_keywords`, target `loa-lawofattraction.co`):** HTTP **402** — same billing constraint.

**Action:** Re-run SERP and related-keyword endpoints after confirming **billing / credits** on the DataForSEO account.

---

## 1. Primary keywords

| Keyword | Monthly volume (Google, US) | Paid competition | CPC (USD) | Organic KD (0–100) | Intent (Labs) |
|---------|---------------------------:|------------------|-----------|---------------------|-----------------|
| law of attraction | 40,500 | LOW (0.06) | 2.06 | 33 | Informational (~0.74) |
| manifestation app | 590 | LOW (0.10) | 4.04 | **4** | Informational (~0.66) |
| affirmation app | 720 | LOW (0.13) | 3.13 | **50** | Informational (~0.70) |
| law of attraction app | 260 | LOW (0.02) | 0.27 | **2** | Informational (~0.63) |
| loa app | 40 | LOW (0.07) | — | 7 | **Navigational (~0.77)** |

**Notes:**

- Google Ads “competition” reflects **auction** competition, not organic difficulty. Use **Keyword Difficulty** from Labs for SEO prioritization.
- **“law of attraction app”** and **“manifestation app”** show **very low organic KD (2 and 4)** — relatively easier to compete for page one than **“affirmation app” (50)** or the head term **“law of attraction” (33)** at much higher volume.
- **“loa app”** is **navigational** with **~40/mo** volume — many searches likely target **a specific app by name**, not generic education. Optimize **brand + full product name** on-site.

---

## 2. SERP landscape (limitations + indirect signals)

**Live top-10 domains:** **Not retrieved** in this session (SERP API errors + 402 on SERP competitors).

**Indirect signal — average backlink profile of URLs in the organic top group** (DataForSEO aggregate per keyword, not row-by-row SERP):

| Keyword | Avg referring domains (top results) | Avg backlinks |
|---------|-------------------------------------|---------------|
| law of attraction app | 6.3 | 8.9 |
| manifestation app | 3.9 | 22.6 |
| affirmation app | 108.5 | 274.5 |

**Interpretation:** For **“law of attraction app”** and **“manifestation app”**, typical top-ranking URLs often use **relatively thin link profiles**, which often correlates with **app stores, small brands, and review/listicle pages** competing — not only large publishers. **“Affirmation app”** appears **more link-competitive**.

**Tactical takeaways for a small site:**

1. **Target app-intent clusters** with dedicated landing pages (features, screenshots, “vs” comparisons). **KD 2–4** suggests **on-page quality + internal links + reviews** can matter before enterprise-scale links.
2. **Do not rely only on the homepage.** App queries often surface **store listings and third-party reviews**; **citations, reviews, and comparison content** matter alongside blog posts.

---

## 3. Long-tail / question-style opportunities

**From seed terms + Labs Keyword Ideas (noise filtered):**

Adjacent phrases with strong volume (content / UGC funnel, not pure install intent):

| Phrase | Volume | KD | Intent |
|--------|-------:|---:|--------|
| daily affirmations | 368,000 | 37 | Informational |
| inspirational quotes | 450,000 | 46 | Informational |

**Recommended FAQ / blog targets** (re-validate volume with Keyword Overview or Google Ads when credits allow):

1. How to practice the law of attraction (daily routine)
2. Best law of attraction app / best manifestation app (comparison framing)
3. Law of attraction for beginners
4. Does the law of attraction work (trust / objection handling)
5. Manifestation techniques (list + link to app features)
6. Positive affirmations for [goal] (clusters with “daily affirmations”)
7. 369 method / scripting / vision board (method explainers → product tie-in)
8. Difference between affirmations and manifestation (education → soft CTA)

---

## 4. Gaps / risks

| Topic | Detail |
|--------|--------|
| **“LoA” vs “law of attraction”** | **“loa app”** is **navigational** and low volume — optimize for **brand + full name** on-site; generic queries use the **full phrase**. |
| **Trademark / brand collision** | Keyword maps can associate **“affirmation app”** / **“manifestation app”** with **other named apps** — avoid implying third-party brands; keep copy distinct. |
| **Seasonal trends** | Google Trends (past 12 months, US web): relative interest varies; **summer 2025** and **Jan 2026** showed peaks on the indexed scale; **treat the most recent week as potentially incomplete** if `missing_data` appears. |
| **Volume volatility** | **“law of attraction app”** monthly estimates can swing (e.g. high in one month, lower in another) — **anchor strategy on stable head terms** + evergreen pages, not only the “app” tail. |

---

## 5. Heuristic priority scores

| Area | Score | Note |
|------|------:|------|
| Win potential on **“law of attraction app” / “manifestation app”** (KD + thinner avg links) | **78/100** | Strong for a focused small site |
| **Head term** “law of attraction” | **55/100** | High volume, KD 33, broader competition |
| **“Affirmation app”** | **45/100** | KD 50 + higher avg referring domains |
| **Data completeness this run** | **40/100** | SERP + extra volume calls blocked (402) |

---

## 6. Bottom line

- DataForSEO Labs indicates **app-specific keywords are comparatively easy (KD 2–4)** with **modest backlink bars** for top results, while **“affirmation app”** is tougher.
- **Live SERP competitor lists** were not exported — **retry** `serp_organic_live_advanced` or `dataforseo_labs_google_serp_competitors` after resolving **billing/credits (402)**.

---

## 7. Next steps (checklist)

- [ ] Confirm DataForSEO account credit balance; re-run **organic SERP** for `law of attraction app` and `manifestation app`.
- [ ] Export **top 10 URLs** and note **domain types** (store, blog, YouTube, etc.).
- [ ] Map **2–3** landing pages to **primary** targets (features, download, comparison).
- [ ] Plan **1–2** informational articles** from long-tail list with internal links to `/features` and `/download`.
