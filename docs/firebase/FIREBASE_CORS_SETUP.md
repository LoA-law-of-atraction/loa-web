# Firebase Storage CORS Setup

## Problem
Firebase Storage is blocking image requests from localhost due to CORS policy.

## Solution

### Option 1: Using Firebase CLI (Recommended)

1. Install Firebase CLI if you haven't:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Apply CORS configuration:
```bash
gsutil cors set cors.json gs://loa-dev-7447a.firebasestorage.app
```

### Option 2: Using Google Cloud Console

1. Go to: https://console.cloud.google.com/storage/browser
2. Find your bucket: `loa-dev-7447a.firebasestorage.app`
3. Click the bucket name
4. Go to "Permissions" tab
5. Add CORS configuration manually

### Option 3: Using gsutil directly

If you have Google Cloud SDK installed:

```bash
gsutil cors set cors.json gs://loa-dev-7447a.firebasestorage.app
```

## Verify CORS is Applied

```bash
gsutil cors get gs://loa-dev-7447a.firebasestorage.app
```

## After Setup

1. Restart your Next.js dev server
2. Clear browser cache
3. Try loading images again

The images should now load without CORS errors!
