# Firestore rules for LoA dashboard

The dashboard uses these Firestore paths under the signed-in user:

- `users/{uid}/affirmations` – affirmations (create/edit/delete)
- `users/{uid}/affirmation_templates` – affirmation templates (create/edit/delete)
- `users/{uid}/streak/current` – streak data
- `users/{uid}/intercept/settings` – intercept settings
- `users/{uid}/intercept/appLimits` – app limits
- `users/{uid}/intercept/schedules` – schedules

If you see **"Missing or insufficient permissions"**, your Firestore rules need to allow read/write for the authenticated user on these paths.

## Option 1: Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com) → your project → **Firestore Database** → **Rules**.
2. Replace (or merge) your rules with the contents of `firestore.rules` in this repo:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **Publish**.

This allows any authenticated user to read and write only their own `users/{uid}/...` documents and subcollections (affirmations, affirmation_templates, streak, intercept, etc.).

## Option 2: Firebase CLI

If you use Firebase CLI and have run `firebase init firestore`:

```bash
firebase deploy --only firestore:rules
```

Ensure `firestore.rules` in the project root is the file referenced in `firebase.json` (e.g. `"firestore": { "rules": "firestore.rules" }`).
