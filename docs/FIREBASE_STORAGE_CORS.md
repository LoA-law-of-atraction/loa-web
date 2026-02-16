# Firebase Storage CORS Setup

The timeline editor now proxies Firebase Storage URLs via `/api/video-generator/proxy-media` to avoid CORS. If you still see CORS errors (e.g. when loading videos directly elsewhere), or for direct loads:

- `Access to video at 'https://firebasestorage.googleapis.com/...' from origin 'http://localhost:3000' has been blocked by CORS policy`

## Fix

Apply the CORS config to your Firebase Storage bucket:

```bash
gsutil cors set cors.json gs://loa-dev-7447a.firebasestorage.app
```

Or if using the default bucket:

```bash
gsutil cors set cors.json gs://loa-dev-7447a.appspot.com
```

To find your bucket name: Firebase Console → Storage → bucket URL (e.g. `loa-dev-7447a.firebasestorage.app`).

## Verify

```bash
gsutil cors get gs://loa-dev-7447a.firebasestorage.app
```

You should see the `cors.json` contents. The timeline editor will then load Firebase videos/audio without CORS errors.
