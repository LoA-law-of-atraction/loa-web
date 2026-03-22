# useSearchParams and Suspense (Next.js 15)

In Next.js 15, **any page or component that uses `useSearchParams()` must be wrapped in a `<Suspense>` boundary**. Otherwise static generation/prerender will fail with:

```
useSearchParams() should be wrapped in a suspense boundary at page "/your-route"
```

## Pattern

1. **Page uses useSearchParams:** Split into a content component + wrapper:
   - `YourPageContent()` – uses `useSearchParams()`, holds the real UI.
   - `YourPageFallback()` – simple loading UI (e.g. spinner).
   - `export default function YourPage()` – returns `<Suspense fallback={<YourPageFallback />}><YourPageContent /></Suspense>`.

2. **Component uses useSearchParams:** Where it’s rendered (e.g. in a page), wrap it in `<Suspense fallback={…}>`.

## Already fixed in this repo

- `/dashboard` – `DashboardContent` + `DashboardPage` with Suspense
- `/login` – `LoginContent` + `LoginPage` with Suspense
- `/signup` – `SignupContent` + `SignupPage` with Suspense
- `/dashboard/preview/[docId]` – `AffirmationPreviewContent` + `AffirmationPreviewPage` with Suspense
- `/admin/login` – `LoginForm` inside Suspense
- `/admin/video-editor` – `VideoEditorContent` inside Suspense
- `/admin/video-generator` – `VideoGeneratorContent` inside Suspense
- `/admin/quote-videos` – `QuoteVideosContent` inside Suspense
- Blog page – `CategoryFilter` wrapped in Suspense

**When adding a new page or component that uses `useSearchParams()`, wrap it in Suspense using the same pattern so the build does not fail.**
