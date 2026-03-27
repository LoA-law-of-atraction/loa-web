# LoA cloud sync — mobile implementation guide

This document describes how the **LoA web dashboard** reads and writes user data in **Firebase (Firestore + Storage)** so native apps can stay compatible. The canonical client-side logic on web lives in `utils/loaCloudSync.js`.

## Authentication

- Use **Firebase Auth** with the same project as web (`NEXT_PUBLIC_*` Firebase config in web env).
- All user-owned data is scoped by **`uid`**: paths are `users/{uid}/...`.
- Firestore rules require `request.auth.uid == uid` for reads/writes under `users/{uid}` (see `firestore.rules` and `docs/FIRESTORE_RULES_LOA_DASHBOARD.md`).

### Sign-in screen vs anonymous sessions (Flutter / mobile)

The web dashboard uses **anonymous sign-in** so users can use the app before creating an account (`signInAnonymously` in `app/dashboard/page.js`). The same pattern is common on mobile.

**Problem:** If you listen to `authStateChanges()` (or equivalent) and navigate away from the sign-in screen whenever `user != null`, you will **immediately pop or redirect** as soon as the anonymous session is active — the user never gets to enter email/Google. This matches “Account → Sign in → screen flashes → back to Account” on Android/iOS.

**Fix (mirror web `app/login/page.js`):**

- Treat **only non-anonymous** users as “already signed in” for auto-navigation, e.g. `user != null && !user.isAnonymous` (Firebase: `user.isAnonymous` on `User`).
- Do **not** auto-close the sign-in route based on `user != null` alone.

**Optional product flows:**

- **Link credentials:** Use `linkWithCredential` / `linkWithPopup` so the anonymous `uid` is preserved when the user adds email or Google (avoids orphan data under the old anonymous uid).
- **Sign out before sign-in:** Signing out anonymous users when opening “Sign in” is possible but **drops** the anonymous uid unless you’ve migrated data — usually avoid unless you explicitly want a clean slate.

## Firestore layout (per user)

| Path | Purpose |
|------|---------|
| `users/{uid}/affirmations/{docId}` | Affirmation documents (main sync surface) |
| `users/{uid}/affirmation_templates/{templateId}` | User-saved templates |
| `users/{uid}/streak/current` | Streak stats |
| `users/{uid}/intercept/settings` | Intercept settings (`data` field holds JSON) |
| `users/{uid}/intercept/appLimits` | App limits (`data` field) |
| `users/{uid}/intercept/schedules` | Schedules (`data` field) |
| `affirmation_templates` (root collection) | **Read-only** default templates (public read in rules) |

## Affirmations — document ID

Web generates IDs as:

`{createdAtMs}_{base64url(normalizedContentPrefix)}`

- `createdAtMs`: milliseconds when the affirmation was created (number).
- `normalizedContent`: trimmed, collapsed whitespace, lowercased content, first **40** characters used for the hash segment.

Mobile **must use the same `docId` scheme** when creating documents intended to match web, or use web-created IDs from the server. If mobile generates IDs differently, treat them as separate documents (no conflict with web algorithm unless content/time collide by design).

Reference: `buildAffirmationDocId` in `utils/loaCloudSync.js`.

## Affirmations — fields (schema)

Read paths should accept **both** legacy web-only fields and the newer cross-client fields.

### Content

| Field | Type | Notes |
|-------|------|--------|
| `content` | string | Affirmation text |
| `category` | string | Optional |
| `isFavorite` | bool | |
| `affirmCount` | number | Counter (e.g. user “affirmed” taps) |

### Images

| Field | Type | Notes |
|-------|------|--------|
| `cloudImagePaths` | array of strings | Preferred; ordered list of **Storage object paths** |
| `cloudImagePath` | string or null | Legacy single path; first image; may mirror `cloudImagePaths[0]` |

Resolve download URLs with Firebase Storage using each path (web uses `getDownloadURL`).

### Timestamps (Firestore)

| Field | Type | Notes |
|-------|------|--------|
| `createdAt` | Timestamp | Document creation |
| `updatedAt` | Timestamp | Last update (web sets `serverTimestamp()` on writes) |
| `deletedAt` | Timestamp or null | If set, document is **soft-deleted** (legacy web tombstone) |

### Cross-client sync (required for LWW / mobile parity)

| Field | Type | Notes |
|-------|------|--------|
| `updated_at` | **number** (int) | **Unix time in milliseconds** at last logical update. Used for **last-write-wins** vs other devices. Web sets this on create/update/delete/image changes. |
| `is_deleted` | bool | **`true`** = tombstone (aligns with common mobile patterns). Web sets `false` on create, `true` on soft delete. |
| `deletedAt` | Timestamp or null | Still set on soft delete on web; mobile may rely on **`is_deleted`** and/or **`deletedAt`**. |

**Tombstone rule:** Treat a document as deleted if **`is_deleted == true`** OR **`deletedAt` is non-null** (either is sufficient; web writes both on delete).

**LWW rule:** When merging two copies of the same `docId`, prefer the revision with the **larger `updated_at`** (milliseconds). If `updated_at` is missing (old docs), fall back to `updatedAt` / `createdAt` as in `readAffirmationUpdatedAtMs` in `loaCloudSync.js`.

### Listing / queries

Web uses:

```text
collection: users/{uid}/affirmations
orderBy: createdAt descending
```

Mobile should use the same ordering for parity with dashboard lists, unless product requires a different sort.

## Firebase Storage — affirmation images

- Object paths are **stored in Firestore** on the affirmation (`cloudImagePaths`).
- Typical pattern (web):

```text
users/{uid}/affirmations/{docId}/image-{n}.{ext}
```

`n` is 1-based index. Extensions come from uploaded files (often `jpg`, `png`, etc.).

- Storage security rules must allow authenticated users to read/write their own prefix (match your project’s rules).

## Sync strategies (recommended)

1. **Realtime (matches web dashboard)**  
   - Listen to `users/{uid}/affirmations` with `orderBy('createdAt', 'desc')`.  
   - On each snapshot, map documents and **filter out tombstones** (`is_deleted` / `deletedAt`).  
   - Web helper name: `subscribeLoAAffirmations` (see `loaCloudSync.js`).

2. **Full pull**  
   - One-shot `getDocs` with the same query, or use the same mapping as web’s `fetchLoACloudData`.  
   - Web also loads streak + intercept docs in parallel; mobile can do the same if those features are in scope.

3. **Offline / conflict resolution**  
   - Keep local rows keyed by `docId`.  
   - When reconciling with server, use **LWW on `updated_at`**.  
   - Web exports `mergeAffirmationsByLWW(localList, remoteList)` as a reference; reimplement in Kotlin/Swift as needed.

## User templates (`users/{uid}/affirmation_templates`)

Web uses `createdAt` / `updatedAt` as Timestamps and fields `name`, `content`, `category`. Mobile should mirror these field names if sharing templates with web.

## Streak and intercept

These are **single documents** or small JSON blobs under `users/{uid}/intercept/*` and `users/{uid}/streak/current`. Web reads/writes them as opaque blobs (`data` wrapper for intercept). Coordinate with product if mobile should edit the same JSON shape as web.

## Reference implementation

| Concern | File |
|---------|------|
| Firestore + Storage calls, LWW, subscriptions | `utils/loaCloudSync.js` |
| Dashboard usage (initial load + realtime affirmations) | `app/dashboard/page.js` |
| Rules | `firestore.rules` |

## Versioning

- **2025-03:** Web writes `updated_at`, `is_deleted`, and uses soft-delete fields consistently for cross-platform sync. Older documents may lack `updated_at`; clients should fall back per `readAffirmationUpdatedAtMs` logic.

If the schema changes, update this document and the `loaCloudSync.js` exports in the same PR.
