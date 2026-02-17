# Copy Firebase (loa-dev → loa-prod) for testing

Two ways to copy Firestore data from **loa-dev** to **loa-prod**.

---

## Option 1: Copy only what you need (e.g. Instagram) – Node script

Use this when you only need specific collections (e.g. `projects`, `topics`). Note: do **not** copy `integrations` — Instagram tokens are app-specific; prod must connect via OAuth.

1. Install dotenv: `npm install dotenv`
2. Create a key file for **loa-prod** (or use `.env.prod` with prod vars).
3. Run the script (see `scripts/copy-firestore-dev-to-prod.js`):

```bash
# From project root. Uses .env for dev and .env.prod for prod by default.
node scripts/copy-firestore-dev-to-prod.js
```

The script copies the listed top-level collections from dev to prod. Edit the `COLLECTIONS` array in the script to choose which ones to copy. **Subcollections** (e.g. `projects/{id}/scenes`) are not copied by this script; use Option 2 for a full clone. `integrations` is excluded by default (prod must connect Instagram separately).

---

## Option 2: Full Firestore clone – gcloud export/import

Use this when you want an exact copy of all Firestore data (all collections and subcollections).

**Prerequisites**

- [Google Cloud SDK (gcloud)](https://cloud.google.com/sdk/docs/install) installed and logged in.
- A GCS bucket (can be in loa-prod or a separate project). Bucket must be in the same location as Firestore (e.g. `us-central1` if your Firestore is there).

**Steps**

1. **Create a bucket in loa-prod** (if you don’t have one):

   ```bash
   gcloud storage buckets create gs://loa-prod-a4834-firestore-export --location=us-central1 --project=loa-prod-a4834
   ```

   Use the same region as your Firestore. Check Firebase Console → Firestore → location.

2. **Export Firestore from loa-dev** to that bucket:

   ```bash
   gcloud firestore export gs://loa-prod-a4834-firestore-export/loa-dev-export-$(date +%Y%m%d) --project=loa-dev-7447a
   ```

   Wait until the export finishes (check Firebase Console → Firestore → Import/export, or the bucket).

3. **Import into loa-prod** (this **overwrites** existing data in loa-prod):

   ```bash
   gcloud firestore import gs://loa-prod-a4834-firestore-export/loa-dev-export-YYYYMMDD --project=loa-prod-a4834
   ```

   Replace `loa-dev-export-YYYYMMDD` with the actual export folder name from step 2.

**Important**

- The import **replaces** data in loa-prod for the same document paths. Back up prod first if needed.
- Firestore **Storage** (files) is separate; this only copies Firestore. To copy Storage files, use `gsutil -m cp -r gs://loa-dev-7447a.appspot.com/* gs://loa-prod-a4834.appspot.com/` (or similar) after checking bucket names and permissions.

---

## Quick test: only Instagram on prod

If you only want to test “Post to Instagram” on prod and don’t need dev data:

1. Deploy the app pointing at **loa-prod** (e.g. Vercel with prod env).
2. Open the video generator on prod → Step 7 → **Connect Instagram** and complete OAuth.

The token is stored in **loa-prod** Firestore (`integrations/instagram`). No copy from dev needed.
