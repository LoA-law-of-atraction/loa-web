# Ranked Keywords Report — loa-lawofattraction.co
**Date:** 2026-03-28
**Tool:** DataForSEO (live)
**Market:** United States / English

---

## Summary

The site ranks for **2 keywords** in the US. Both point to the homepage `/`. No inner pages are ranking.

| Metric | Value |
|--------|-------|
| Total ranking keywords | 2 |
| Pages ranking | 1 (homepage only) |
| Combined estimated traffic value | $0.13/mo |
| Keywords in top 10 | 0 |
| Keywords in top 30 | 0 |
| Keywords trending up | 0 |
| Keywords trending down | 2 |

---

## Ranking Keywords

| Keyword | Position | Abs. Position | Search Vol | Trend | Intent | Change |
|---------|----------|---------------|------------|-------|--------|--------|
| loa love | #38 | 47 | 30/mo | -33% YoY | Informational | Down (was #42) |
| loa coach | #53 | 61 | 30/mo | -33% YoY | Informational | New |

### loa love
- **URL ranking:** https://www.loa-lawofattraction.co/
- **Search volume:** 30/mo (declining)
- **SERP features:** Organic, People Also Ask, Video, Discussions & Forums, Images
- **Note:** DataForSEO detects this as a **French-language keyword** (`is_another_language: true`). "LOA" has a different meaning in French contexts. Traffic from this keyword may not be relevant to the app.
- **Snippet shown:** *"LoA transformed my relationship with my phone from mindless scrolling to conscious manifestation practice. I've set affirmations for abundance and love..."*

### loa coach
- **URL ranking:** https://www.loa-lawofattraction.co/
- **Search volume:** 30/mo (declining)
- **SERP features:** **AI Overview**, Organic, People Also Ask, Images
- **Note:** New keyword (not previously ranking). The presence of an AI Overview in this SERP is a GEO opportunity, but the site is at position 53 — far from being cited.
- **Snippet shown:** *"Manifestation Coach. This app perfectly bridges ancient wisdom with modern... LoALoA brings the Law of Attraction to your digital life."*

---

## Key Findings

### 1. No target keywords are ranking
The site does not rank for any high-value target keywords:

| Target Keyword | Est. Volume | Site Ranking |
|----------------|-------------|--------------|
| law of attraction app | Unknown | Not ranking |
| manifestation app | Unknown | Not ranking |
| loa app | Unknown | Not ranking |
| law of attraction | High | Not ranking |
| manifestation journal app | Unknown | Not ranking |

### 2. Only the homepage is indexed/ranking
All 2 keywords point to `/`. No product pages, feature pages, or blog content is ranking. This is consistent with the critical `"use client"` technical issue documented in the SEO audit — Google cannot render JavaScript-only pages and has only managed to index the homepage.

### 3. Both keywords are trending downward
Neither keyword is growing. Combined YoY trend is -33%, meaning even the minimal rankings the site has are in declining keyword categories.

### 4. "loa love" may be irrelevant traffic
The keyword is flagged as French-language. If users searching "loa love" are French speakers using LOA in a different context, this ranking provides zero business value.

### 5. "loa coach" SERP has an AI Overview
This is a future GEO opportunity. Once the site reaches page 1 for this keyword, it could be cited in the AI Overview. Current position (53) is too low to be considered.

---

## Root Cause

The lack of rankings is a direct consequence of the technical issues identified in `audit-2026-03-27.md`:

1. **`"use client"` on all public pages** → Google receives empty HTML → pages not indexed
2. **No inner page content visible to crawlers** → only homepage gets any ranking signal
3. **No target keyword optimization** → homepage content not structured around high-value keywords

---

## Recommended Actions

| Priority | Action | Expected Impact |
|----------|--------|-----------------|
| Critical | Fix `"use client"` rendering on all public pages | Enables indexation of all pages |
| Critical | Add server-side metadata targeting "law of attraction app", "manifestation app" | Enables ranking for target keywords |
| High | Run SERP analysis on target keywords to map the competitive landscape | Informs content strategy |
| High | Create dedicated landing pages for key features (affirmations, vision board, etc.) | Expands keyword footprint |
| Medium | Add blog/content targeting informational LOA queries | Drives top-of-funnel traffic |
| Medium | Monitor "loa coach" for AI Overview citation eligibility as rankings improve | GEO opportunity |

---

## Next Steps

Once technical fixes are deployed, re-run this report to measure improvement:
```
/seo dataforseo ranked loa-lawofattraction.co
```

Target baseline after fixes: **50+ ranking keywords within 60 days**.

---

*Data source: DataForSEO Labs — Google Organic, US/English*
*Re-run recommended: 30 days after technical fixes are deployed*
