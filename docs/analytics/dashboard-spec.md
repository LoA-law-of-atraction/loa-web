# LoA GA4 Dashboard Spec

## Purpose
- Provide a weekly and monthly view of acquisition quality, pricing intent, auth conversion, and lead conversion.

## Dashboard Sections

### 1) Acquisition Snapshot
- **Metric cards**
  - Sessions
  - Users
  - New users
  - Engaged sessions
- **Breakdown table**
  - Rows: `Session source / medium`
  - Columns: Sessions, Engaged sessions, Key events
  - Filter: include only web data stream

### 2) Campaign Performance
- **Table**
  - Rows: `utm_campaign` (custom dimension)
  - Secondary dimension: `utm_source` or `utm_medium`
  - Metrics: Users, `app_download_clicked`, `pricing_plan_cta_clicked`, `signup_completed`, `contact_form_submitted`
- **Use**
  - Identify campaigns driving intent and conversion, not just clicks.

### 3) Pricing Intent
- **Funnel exploration**
  1. `page_view` where `page_location` contains `/pricing`
  2. `pricing_plan_cta_clicked`
  3. `signup_completed` OR `login_completed`
- **Breakdowns**
  - `plan_id`
  - `billing_period`
  - `is_authenticated`

### 4) Signup & Login Health
- **Time series**
  - `signup_completed`, `signup_failed`
  - `login_completed`, `login_failed`
- **Failure diagnostics table**
  - Rows: `error_code`
  - Metrics: Event count
  - Filter: event name in (`signup_failed`, `login_failed`)

### 5) Download Intent
- **Time series**
  - `app_download_clicked`
- **Breakdown table**
  - Rows: `destination_store`
  - Secondary: `button_name`
  - Metrics: Event count, Users

### 6) Contact Lead Performance
- **Metric cards**
  - `contact_form_submitted`
  - `contact_form_failed`
- **Table**
  - Rows: `selected_interests`
  - Metrics: Event count
  - Secondary metric: share of leads with `has_comment = true`

## Required Custom Dimensions (Event Scope)
- `button_name`
- `destination_store`
- `plan_id`
- `billing_period`
- `is_authenticated`
- `cta_href`
- `method`
- `error_code`
- `selected_interests`
- `has_comment`
- `error_type`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`

## Key Events / Conversions to Enable
- `signup_completed`
- `contact_form_submitted`
- `pricing_plan_cta_clicked` (intent conversion)

## Suggested Date Ranges
- Weekly ops: last 7 days vs previous 7 days
- Monthly strategy: last 30 days vs previous 30 days

## QA Before Sharing Dashboard
- Verify events appear in DebugView for each route.
- Verify custom dimensions populate in standard reports/explorations.
- Confirm no PII in parameter values.
- Confirm no duplicate events per user action.
