# Pricing And Subscription Feature Spec

This document is for the subscription feature development team.

It describes:

- the current public pricing page
- the intended feature limitations for each tier
- the expected gating behavior in product flows
- the relationship between marketing pricing and RevenueCat billing

## Scope

Pricing-related implementation currently spans:

- [app/pricing/page.js](/Users/yosukesakurai/Desktop/development/loa/loa-web/app/pricing/page.js)
- [components/PricingPolicy.js](/Users/yosukesakurai/Desktop/development/loa/loa-web/components/PricingPolicy.js)
- [app/dashboard/subscription/page.js](/Users/yosukesakurai/Desktop/development/loa/loa-web/app/dashboard/subscription/page.js)
- [components/SubscriptionPanel.js](/Users/yosukesakurai/Desktop/development/loa/loa-web/components/SubscriptionPanel.js)
- [contexts/RevenueCatContext.js](/Users/yosukesakurai/Desktop/development/loa/loa-web/contexts/RevenueCatContext.js)

## Product tiers

There are 3 customer-facing tiers:

1. `Free`
2. `Manifest Creator`
3. `Manifest Master`

## Pricing

### Free

- Monthly: `$0`
- Yearly: `$0`
- Billing label: `Free forever`

### Manifest Creator

- Monthly: `$4.99`
- Yearly: `$29.99`
- Effective annual monthly equivalent: `$2.50/mo`
- Billing label in yearly mode: `Billed $29.99/year`
- Savings chip: `Save 50%`

### Manifest Master

- Monthly: `$9.99`
- Yearly: `$79.99`
- Effective annual monthly equivalent: `$6.67/mo`
- Billing label in yearly mode: `Billed $79.99/year`
- Savings chip: `Save 33%`

## Current pricing page

Route:

- `/pricing`

Current section order:

1. Pricing cards on dark background
2. Ready CTA on white background
3. Testimonials on dark background
4. FAQ on white background

The public pricing page is marketing-facing and currently uses hardcoded copy from [components/PricingPolicy.js](/Users/yosukesakurai/Desktop/development/loa/loa-web/components/PricingPolicy.js).

This page is not the source of truth for purchasable products.

## Billing source of truth

The source of truth for actual subscription packages is RevenueCat on:

- `/dashboard/subscription`

The dashboard subscription page:

- loads offerings from RevenueCat
- renders real purchasable packages
- shows exact yearly billing text from package prices
- uses RevenueCat package metadata to classify monthly vs yearly plans

Important:

- marketing pricing and billing text must stay aligned with RevenueCat
- if prices are changed, update both the marketing page and RevenueCat configuration

## RevenueCat mapping

Current `loa-web` mapping logic in [components/SubscriptionPanel.js](/Users/yosukesakurai/Desktop/development/loa/loa-web/components/SubscriptionPanel.js):

- offering identifiers containing `creator` are treated as the Creator tier
- offering identifiers containing `master` are treated as the Master tier
- identifiers containing `basic` map to Creator
- identifiers containing `pro` map to Master

This means RevenueCat naming should stay consistent with either:

- `basic` / `pro`
- `creator` / `master`

Recommended:

- standardize offering IDs to one naming scheme
- do not rely on typo variants long-term

## Detailed feature limitations

This section should be treated as the implementation spec for feature gating.

If engineering needs to decide whether a user can access a feature, this table should drive that decision.

### Free tier limitations

Free users are intended to use LoA for manual, non-premium practice.

Platform distinction:

- Free web users are restricted to a lightweight trial-style experience
- Free mobile users may create many affirmations locally on-device, but do not get backup or sync

Allowed:

- create and edit 1 manual affirmation total on web
- attach 1 image to that affirmation on web
- create many manual affirmations locally on mobile
- keep local-only affirmation data on mobile without backup
- view and manage affirmation content locally
- use basic streak tracking
- use image support where no premium processing is required

Restricted:

- no more than 1 affirmation on web
- no more than 1 image attached on web
- no cloud backup for free mobile users
- no cross-device sync for free mobile users
- no AI affirmation generation
- no premium templates
- no cloud backup
- no cross-device sync
- no premium insights
- no additional paid storage
- no priority support

Implementation expectation:

- if a feature requires backend cost, account sync, paid infrastructure, or premium-only UX, Free should not receive it
- web creation flow must enforce both:
  - affirmation count limit = 1
  - image count limit = 1 total image attached to that single affirmation
- mobile local storage does not need the same count restriction as web
- free mobile users should remain local-only unless upgraded

### Manifest Creator limitations

Manifest Creator is the first paid tier and should unlock the core premium workflow.

Allowed:

- 50 AI affirmation generations per billing cycle
- unlimited manual affirmations
- advanced templates
- cloud backup
- cross-device sync
- restore across devices
- 1 GB total cloud storage allocation
- image support

Restricted:

- no premium insights
- no priority support
- storage must not exceed 1 GB
- AI generation must not exceed 50 per billing cycle

Implementation expectation:

- Creator is the baseline paid entitlement
- any feature considered "premium core" should be available here unless it is explicitly reserved for Master

### Manifest Master limitations

Manifest Master is the higher paid tier for heavier usage and deeper premium features.

Allowed:

- 150 AI affirmation generations per billing cycle
- unlimited manual affirmations
- advanced templates
- cloud backup
- cross-device sync
- restore across devices
- premium insights
- priority support
- 5 GB total cloud storage allocation
- image support

Restricted:

- AI generation must not exceed 150 per billing cycle
- storage must not exceed 5 GB

Implementation expectation:

- Master includes everything in Creator plus higher limits and premium-only capabilities

## Feature-by-feature gating matrix

### AI affirmation generation

- Free: not allowed
- Manifest Creator: allowed up to 50 per billing cycle
- Manifest Master: allowed up to 150 per billing cycle

Engineering notes:

- this requires usage tracking per billing period
- limits should reset by billing cycle, not by calendar month, unless product explicitly chooses calendar-month behavior
- UI should show remaining quota if implemented

### Manual affirmations

- Free: limited to 1 affirmation total on web
- Free mobile: unlimited local affirmations allowed on-device
- Manifest Creator: unlimited
- Manifest Master: unlimited

Engineering notes:

- web manual content creation should be blocked for Free users after the first affirmation
- edit/update of the existing free affirmation should still be allowed
- mobile free users can continue creating local affirmations without subscription
- once backup/sync is involved, free users should be blocked

### Affirmation image attachments

- Free: limited to 1 image total on web
- Manifest Creator: allowed
- Manifest Master: allowed

Engineering notes:

- Free users should be able to attach 1 image to their single affirmation
- once that image exists, additional image uploads should be blocked on web
- replacing the existing image may be allowed, but increasing total attached images beyond 1 should not be allowed

### Templates

- Free: basic only
- Manifest Creator: advanced templates enabled
- Manifest Master: advanced templates enabled

Engineering notes:

- if template taxonomy exists, templates need a tier field such as `free` or `premium`
- Creator and Master should both satisfy `premium`

### Cloud backup

- Free: disabled
- Free mobile: disabled even if local affirmations exist
- Manifest Creator: enabled
- Manifest Master: enabled

Engineering notes:

- backup-related UI should be hidden or disabled for Free users
- backend storage writes tied to premium sync should be blocked for Free
- mobile local persistence is allowed, but remote backup is not

### Cross-device sync

- Free: disabled
- Free mobile: disabled
- Manifest Creator: enabled
- Manifest Master: enabled

Engineering notes:

- Free users can still authenticate, but premium sync features should not activate
- paid tiers should use the signed-in Firebase user identity consistently
- local-only mobile data should not be treated as synced entitlement-backed storage

### Restore across devices

- Free: disabled
- Manifest Creator: enabled
- Manifest Master: enabled

Engineering notes:

- this is effectively part of the sync/backup feature family

### Premium insights

- Free: disabled
- Manifest Creator: disabled
- Manifest Master: enabled

Engineering notes:

- any analytics-derived or premium interpretation UI should be gated to Master

### Priority support

- Free: disabled
- Manifest Creator: disabled
- Manifest Master: enabled

Engineering notes:

- if implemented operationally rather than technically, still maintain clear tier labeling in UI/admin tools

### Storage quota

- Free: no paid cloud storage allocation
- Manifest Creator: 1 GB
- Manifest Master: 5 GB

Engineering notes:

- quota enforcement must be server-trustworthy, not purely client-side
- uploads should be rejected once tier quota is exceeded
- UI should show used storage vs total if that capability exists

## Recommended entitlement model

Recommended internal access model:

- `free`
- `creator`
- `master`

Recommended access checks:

- `isPaid`: Creator or Master
- `hasAdvancedTemplates`: Creator or Master
- `hasCloudSync`: Creator or Master
- `hasPremiumInsights`: Master only
- `hasPrioritySupport`: Master only

Recommended limit checks:

- `aiGenerationLimit`
- `cloudStorageLimitBytes`

## Recommended implementation fields

If subscription state is stored in app/backend logic, these fields are enough to drive most product behavior:

- `tier`: `free | creator | master`
- `aiGenerationLimit`
- `aiGenerationsUsedThisPeriod`
- `cloudStorageLimitBytes`
- `cloudStorageUsedBytes`
- `billingPeriodStart`
- `billingPeriodEnd`
- `isPaid`

## CTA behavior

Public pricing page:

- Free CTA:
  - currently routes to `/login`
- Paid CTA while signed out:
  - routes to `/login?redirect=%2Fdashboard%2Fsubscription`
- Paid CTA while signed in:
  - routes to `/dashboard/subscription`

Dashboard subscription page:

- purchase buttons open RevenueCat checkout
- failure messaging is intentionally suppressed from the customer UI

## Team notes

Current state:

- pricing page content is a product/marketing layer
- dashboard subscription page is the billing integration layer

For future subscription feature work:

- do not treat the pricing page as the system of record for entitlements
- do treat this document as the intended feature-limit spec unless product changes it
- if a new premium feature is added, update:
  - this document
  - the pricing page copy if customer-facing
  - the subscription gating logic
  - RevenueCat entitlements or offerings if needed
