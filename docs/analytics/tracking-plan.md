# LoA Web Tracking Plans

## Overview

- Tools: GA4 (`gtag.js`), Meta Pixel (`react-facebook-pixel`)
- Collection layer: client-side `trackEvent(...)` helper in `utils/analytics.js`
- Last updated: 2026-04-05

## Events

| Event Name                 | Description                               | Properties                                                                        | Trigger                                     |
| -------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------- |
| `app_download_clicked`     | User clicks a store download button       | `button_name`, `destination_store`, `page_path`, `utm_*`                          | App Store / Google Play badge click         |
| `pricing_plan_cta_clicked` | User clicks a pricing plan CTA            | `plan_id`, `billing_period`, `is_authenticated`, `cta_href`, `page_path`, `utm_*` | Pricing card CTA click                      |
| `signup_completed`         | Signup succeeds                           | `method`, `page_path`, `utm_*`                                                    | Firebase signup success                     |
| `signup_failed`            | Signup attempt fails                      | `method`, `error_code`, `page_path`, `utm_*`                                      | Firebase signup error                       |
| `signup_redirect_started`  | Google signup falls back to redirect flow | `method`, `page_path`, `utm_*`                                                    | Popup blocked/cancelled and redirect starts |
| `login_completed`          | Login succeeds                            | `method`, `page_path`, `utm_*`                                                    | Firebase login success                      |
| `login_failed`             | Login attempt fails                       | `method`, `error_code`, `page_path`, `utm_*`                                      | Firebase login error                        |
| `login_redirect_started`   | Google login falls back to redirect flow  | `method`, `page_path`, `utm_*`                                                    | Popup blocked/cancelled and redirect starts |
| `contact_form_submitted`   | Contact form sends successfully           | `selected_interests`, `has_comment`, `page_path`, `utm_*`                         | `/api/contact` returns success              |
| `contact_form_failed`      | Contact form submission fails             | `error_type`, `page_path`, `utm_*`                                                | `/api/contact` request failure              |

## Custom Dimensions (GA4)

| Name                 | Scope | Parameter            |
| -------------------- | ----- | -------------------- |
| `button_name`        | Event | `button_name`        |
| `destination_store`  | Event | `destination_store`  |
| `plan_id`            | Event | `plan_id`            |
| `billing_period`     | Event | `billing_period`     |
| `is_authenticated`   | Event | `is_authenticated`   |
| `cta_href`           | Event | `cta_href`           |
| `method`             | Event | `method`             |
| `error_code`         | Event | `error_code`         |
| `selected_interests` | Event | `selected_interests` |
| `has_comment`        | Event | `has_comment`        |
| `error_type`         | Event | `error_type`         |
| `utm_source`         | Event | `utm_source`         |
| `utm_medium`         | Event | `utm_medium`         |
| `utm_campaign`       | Event | `utm_campaign`       |
| `utm_content`        | Event | `utm_content`        |
| `utm_term`           | Event | `utm_term`           |

## Conversions

| Conversion             | Event                      | Counting                                 |
| ---------------------- | -------------------------- | ---------------------------------------- |
| App download intent    | `app_download_clicked`     | Every event                              |
| Pricing CTA intent     | `pricing_plan_cta_clicked` | Every event                              |
| Signup completed       | `signup_completed`         | Once per user (recommended in reporting) |
| Login completed        | `login_completed`          | Every event                              |
| Contact lead submitted | `contact_form_submitted`   | Every event                              |

## Validation Checklist

- Verify events in GA4 DebugView for each flow (download, pricing, signup/login, contact).
- Verify Meta Pixel receives matching custom events through Pixel Helper.
- Confirm no PII is sent in event parameters.
- Confirm UTM values are present when landing with campaign parameters.
- Confirm no duplicate events on single user action.
