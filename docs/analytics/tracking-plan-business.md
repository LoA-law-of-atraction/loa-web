# LoA Web Tracking Plan (Business View)

## Why this tracking exists
- Understand which channels drive high-intent users.
- See where users drop off between pricing, auth, and contact.
- Prioritize growth work based on conversion impact, not vanity traffic.

## Key Decisions This Data Supports
- Which campaigns and channels should get more budget.
- Which pricing plan messaging drives more purchase intent.
- Whether signup/login friction is hurting activation.
- Whether contact traffic is qualified and worth follow-up effort.

## Core KPIs
- **Download Intent Rate**: `app_download_clicked` / landing sessions.
- **Pricing Intent Rate**: `pricing_plan_cta_clicked` / pricing page sessions.
- **Signup Completion Rate**: `signup_completed` / signup starts.
- **Login Success Rate**: `login_completed` / login attempts.
- **Contact Lead Rate**: `contact_form_submitted` / contact page sessions.

## Conversion Events
- `signup_completed`
- `contact_form_submitted`
- `pricing_plan_cta_clicked` (intent conversion)

## Funnel (Recommended)
1. Landing or campaign entry
2. Pricing page viewed
3. Pricing CTA clicked (`pricing_plan_cta_clicked`)
4. Signup completed (`signup_completed`) or login completed (`login_completed`)
5. Contact submitted (`contact_form_submitted`) where applicable

## Segments to Review Weekly
- By `utm_source` / `utm_medium` / `utm_campaign`
- By plan (`plan_id`) and billing period (`billing_period`)
- New vs returning/authenticated behavior (`is_authenticated`)

## Guardrails
- No PII in analytics payloads.
- Investigate high failure events (`signup_failed`, `login_failed`, `contact_form_failed`).
- Validate tracking in GA4 DebugView after major releases.

## Reporting Cadence
- **Weekly growth check**: KPI trends + top campaigns.
- **Monthly strategy review**: channel ROI, pricing CTA performance, auth friction trends.
