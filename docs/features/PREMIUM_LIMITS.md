# Plan Limits: AI & Storage

This doc defines the usage limits for **Manifest Starter**, **Manifest Creator**, and **Manifest Master** tiers so we stay profitable and keep the product fair and predictable for users.

## Why limit?

- **AI** – Each affirmation generation (and any future AI features) has a real per-request cost. Unbounded use can erase margin.
- **Storage** – Affirmation images, audio, and backups cost money. Caps prevent abuse and keep infra predictable.

## Chosen limits

| Resource        | Manifest Starter (free) | Manifest Creator ($4.99/mo) | Manifest Master ($9.99/mo) |
|-----------------|--------------------------|-----------------------------|----------------------------|
| **AI generations** | None                     | 50 per month                | 150 per month              |
| **Storage**       | N/A (local only)         | 1 GB per user               | 5 GB per user              |

Limits reset at the start of each billing period (monthly).

## Manifest Starter (free)

- Basic affirmations  
- Vision board  
- Basic streak tracking  
- **No AI features** – AI affirmation generation is paid plans only  
- **Local only** – no cloud backup; data stays on device

## Manifest Creator ($4.99/month, or billed annually at $29.99)

- Everything in Manifest Starter  
- **50 AI affirmation generations per month**  
- **1 GB storage**  
- **Cloud backup** – sync and restore affirmations & settings  
- Unlimited affirmations (manually written); only AI-generated ones count toward the 50

## Manifest Master ($9.99/month, or billed annually at $79.99)

- Everything in Manifest Creator  
- **150 AI affirmation generations per month**  
- **5 GB storage**  
- **Cloud backup** – sync and restore  
- Priority support

## Implementation notes

1. **Store usage server-side**  
   e.g. in Firebase: `users/{uid}/usage` or similar with:
   - `aiGenerationsThisMonth` (number)
   - `storageBytesUsed` (number)
   - `usageMonthStart` (timestamp or YYYY-MM) for monthly reset

2. **Before calling AI**  
   Check `aiGenerationsThisMonth < limit` for the user’s tier. If at limit, return a friendly “Monthly limit reached” and optionally upsell or show reset date.

3. **On upload**  
   Before accepting a new file, check `storageBytesUsed + file.size <= limit`. If over, reject with a clear message or upsell.

4. **Reset**  
   On first use in a new month (or via a scheduled job), reset `aiGenerationsThisMonth` (and optionally recalc `storageBytesUsed` if you don’t update it incrementally).

5. **In-app copy**  
   Show “X of Y used this month” for AI and storage so limits feel transparent.

## Copy for paywall / upsell

- **Manifest Starter (no AI):** “AI affirmation generation is a paid feature. Upgrade to Manifest Creator for 50/month or Manifest Master for 150/month.”
- **Manifest Creator at limit:** “You’ve used your 50 AI affirmations this month. Resets on [date]. Upgrade to Manifest Master for 150/month.”
- **Manifest Master at limit:** “You’ve used your 150 AI affirmations this month. Resets on [date].”

## Updating limits

If costs or usage change, update:

1. This doc  
2. `components/PricingPolicy.js` (marketing pricing) and `components/SubscriptionPanel.js` (dashboard plans)  
3. Backend limit constants and any in-app strings
