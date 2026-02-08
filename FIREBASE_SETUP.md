# Firebase Admin SDK Setup Guide

Your application is configured but missing Firebase Admin SDK credentials needed for server-side operations (API routes).

## Error You're Seeing
```
500 Internal Server Error on /api/characters
Firebase Admin SDK requires either FIREBASE_SERVICE_ACCOUNT_KEY or
FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables
```

## Quick Fix: Get Service Account Credentials

### Step 1: Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **loa-dev-7447a**

### Step 2: Generate Service Account Key
1. Click the gear icon ⚙️ (Settings) → **Project settings**
2. Go to the **Service accounts** tab
3. Click **Generate new private key** button
4. Click **Generate key** to download the JSON file

### Step 3: Extract Credentials from JSON
Open the downloaded JSON file. You'll see something like:
```json
{
  "type": "service_account",
  "project_id": "loa-dev-7447a",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@loa-dev-7447a.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

### Step 4: Add to .env File

#### Option A: Use the full JSON (Recommended for Vercel)
Add this to your `.env` file:
```bash
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"loa-dev-7447a",...}'
```
(Paste the entire JSON content as a single-line string in single quotes)

#### Option B: Use individual values (Easier for local development)
Add these three lines to your `.env` file:
```bash
FIREBASE_PROJECT_ID=loa-dev-7447a
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@loa-dev-7447a.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourKeyHere\n-----END PRIVATE KEY-----\n"
```

**Important:**
- Keep the `\n` characters in the FIREBASE_PRIVATE_KEY (they represent newlines)
- Wrap the private key in double quotes
- The client_email should look like `firebase-adminsdk-*@*.iam.gserviceaccount.com`

### Step 5: Restart Your Dev Server
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 6: Test the Setup
1. Navigate to http://localhost:3000/admin/setup
2. Click "Create Sample Characters"
3. You should see 4 sample characters created successfully

## Security Notes
- ⚠️ **NEVER commit the service account key to git**
- The `.env` file is already in `.gitignore`
- Keep your service account credentials secure
- For production (Vercel), add these as environment variables in the Vercel dashboard

## Next Steps After Setup
Once Firebase Admin SDK is configured, you can:
1. Create sample characters using the `/admin/setup` page
2. Start building video content with character voices
3. Manage characters through the admin dashboard at `/admin/characters`
