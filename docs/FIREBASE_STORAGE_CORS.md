# Firebase Storage CORS Setup

The timeline editor loads videos/audio directly from Firebase Storage when CORS is configured. Apply CORS to **both** dev and prod buckets.

## Apply CORS

**Dev bucket:**
```bash
gsutil cors set cors.json gs://loa-dev-7447a.firebasestorage.app
```

**Prod bucket (required for timeline editor on prod):**
```bash
gsutil cors set cors.json gs://loa-prod-a4834.firebasestorage.app
```

`cors.json` allows: localhost, loa-dev-7447a.web.app, www.loa-lawofattraction.co, loa-lawofattraction.co.

## Verify

```bash
gsutil cors get gs://loa-prod-a4834.firebasestorage.app
```

You should see the `cors.json` contents. Timeline editor will then load videos/audio on prod without proxy/CORS errors.
