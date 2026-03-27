# Video Editor Setup Guide (Simplified)

## Overview

This is a **simplified architecture** where Next.js handles all API calls directly. Make.com only generates the script, then hands off to Next.js.

## Workflow

```
Make.com (LoA Shorts Scenario)
  ↓ Module 28: Claude generates script
  ↓ Module 29: Parse JSON
  ↓ Module 30: POST to Next.js API

Next.js API (/api/video-editor/generate-images)
  ↓ Calls ElevenLabs API (voiceover)
  ↓ Calls Fal AI (4 images)
  ↓ Uploads to Cloud Storage
  ↓ Stores in Firestore
  ↓ Returns editor URL

Admin reviews in /admin/video-editor
  ↓ Approves all 4 scenes
  ↓ Clicks "Generate Final Video"

Next.js API (/api/video-editor/generate-videos)
  ↓ Calls Fal AI (4 videos from images)
  ↓ Uploads to Cloud Storage
  ↓ Calls Shotstack API (assembly)
  ↓ Polls for completion
  ↓ Updates Firestore with final video URL

✅ Done!
```

## Architecture Benefits

✅ **Simpler** - No need to create multiple Make scenarios
✅ **Faster** - Direct API calls from server
✅ **Cheaper** - Fewer Make operations
✅ **Easier to debug** - All logic in one codebase
✅ **Better error handling** - Full control over retries and errors

## Firestore Collection

### Collection: `video_sessions`

```javascript
{
  session_id: "video_1738123456789_abc123",
  topic: "How I manifested my dream job",
  script: "Full continuous voiceover script...",
  selected_character: {
    character_id: "char_001",
    gender: "female",
    age_range: "30s",
    image_url: "https://...",
    voice_id: "elevenlabs_voice_id"
  },
  voiceover_url: "https://storage.googleapis.com/.../voiceover.mp3",
  status: "pending_approval", // or "generating_videos", "rendering", "completed", "failed"
  scenes: [
    {
      id: 1,
      duration: "8s",
      location: "location_1",
      voiceover: "First 8 seconds of script...",
      camera: "medium",
      mood: "contemplative",
      image_prompt: "Dark cinematic cartoon style...",
      motion_prompt: "Slow breathing motion...",
      image_url: "https://storage.googleapis.com/.../scene_1.png",
      video_url: "https://storage.googleapis.com/.../scene_1.mp4",
      approved: true
    },
    // ... 3 more scenes
  ],
  shotstack_render_id: "abc-123-def",
  final_video_url: "https://shotstack-output.s3.amazonaws.com/...",
  created_at: "2026-01-29T12:00:00.000Z",
  updated_at: "2026-01-29T12:05:00.000Z"
}
```

## Make.com Setup

### Update "LoA Shorts" Scenario

Only need to add **ONE module** after Module 29 (Parse JSON):

#### Module 30: HTTP Request to Next.js

**URL:** `https://yourdomain.com/api/video-editor/generate-images`
**Method:** POST
**Headers:**
- Content-Type: `application/json`

**Body:**
```json
{
  "topic": "{{1.topic}}",
  "script": "{{29.script}}",
  "selected_character": {
    "character_id": "{{99.character_id}}",
    "gender": "{{99.gender}}",
    "age_range": "{{99.age_range}}",
    "image_url": "{{99.image_url}}",
    "voice_id": "{{99.voice_id}}"
  },
  "scenes": {{29.scenes}}
}
```

**Response:**
```json
{
  "success": true,
  "session_id": "video_1738123456789_abc123",
  "editor_url": "https://yourdomain.com/admin/video-editor?session=video_1738123456789_abc123",
  "voiceover_url": "https://storage.googleapis.com/.../voiceover.mp3",
  "images": [
    {"scene_id": 1, "image_url": "https://..."},
    {"scene_id": 2, "image_url": "https://..."},
    {"scene_id": 3, "image_url": "https://..."},
    {"scene_id": 4, "image_url": "https://..."}
  ]
}
```

#### Module 31: Send Email (Optional)

Send notification to admin with the editor URL:

```
Subject: New video ready for review

A new video is ready for your approval:
Topic: {{1.topic}}

Review here: {{30.editor_url}}
```

**That's it!** No more Make modules needed.

---

## Environment Variables

Add these to your `.env` file:

```env
# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# Video Generation APIs
FAL_API_KEY=your_fal_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
SHOTSTACK_API_KEY=your_shotstack_api_key

# Base URL
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

---

## API Endpoints

### 1. POST `/api/video-editor/generate-images`

**Purpose:** Generate voiceover + 4 scene images, store in Firestore

**Request:**
```json
{
  "topic": "string",
  "script": "string",
  "selected_character": {...},
  "scenes": [...]
}
```

**Response:**
```json
{
  "success": true,
  "session_id": "string",
  "editor_url": "string",
  "voiceover_url": "string",
  "images": [...]
}
```

**Process:**
1. Calls ElevenLabs API to generate voiceover
2. Uploads voiceover to Cloud Storage
3. Calls Fal AI to generate 4 images in parallel
4. Uploads images to Cloud Storage
5. Creates Firestore document in `video_sessions`
6. Returns editor URL

---

### 2. POST `/api/video-editor/regenerate-scene`

**Purpose:** Regenerate a single scene image

**Request:**
```json
{
  "session_id": "string",
  "scene_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "image_url": "string",
  "data": {...}
}
```

**Process:**
1. Reads scene data from Firestore
2. Calls Fal AI to regenerate image
3. Uploads new image to Cloud Storage
4. Updates Firestore with new image URL
5. Resets approval status

---

### 3. POST `/api/video-editor/generate-videos`

**Purpose:** Generate 4 videos + assemble final video

**Request:**
```json
{
  "session_id": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Video generation started",
  "render_id": "string",
  "videos": [...]
}
```

**Process:**
1. Validates all scenes are approved
2. Updates status to "generating_videos"
3. Calls Fal AI image-to-video for 4 scenes in parallel
4. Uploads videos to Cloud Storage
5. Updates Firestore with video URLs
6. Calls Shotstack API to assemble final video
7. Starts background polling for Shotstack completion
8. When complete, updates Firestore with final video URL

---

### 4. GET `/api/video-editor?session={session_id}`

**Purpose:** Retrieve session data

**Response:**
```json
{
  "success": true,
  "data": {...}
}
```

---

### 5. PATCH `/api/video-editor`

**Purpose:** Update scene approval status

**Request:**
```json
{
  "session_id": "string",
  "scene_id": 1,
  "approved": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {...}
}
```

---

## Testing

### 1. Test Image Generation

```bash
# Start dev server
cd /Users/hawk2/Desktop/development/loa/loa-web
npm run dev

# Trigger Make scenario
# Check Firestore for video_sessions document
# Visit: http://localhost:3000/admin/video-editor?session={session_id}
```

### 2. Test Image Approval

```bash
# In video editor, click "Approve" on each scene
# Verify Firestore updates with approved: true
```

### 3. Test Regeneration

```bash
# Click "Regenerate" on Scene 2
# Wait for new image to load
# Verify Firestore shows new image URL
```

### 4. Test Video Generation

```bash
# Approve all 4 scenes
# Click "Generate Final Video"
# Wait 5-10 minutes
# Refresh page to see "Completed" status
# Click "Download Final Video"
```

---

## Monitoring & Debugging

### Check Firestore

```javascript
// In Firebase Console
video_sessions/{session_id}

// Check:
- status (should progress: pending_approval → generating_videos → rendering → completed)
- all scenes have image_url
- all scenes have approved: true
- all scenes have video_url (after video generation)
- final_video_url (when complete)
```

### Check Cloud Storage

```
video-scenes/{session_id}/
  ├── scene_1.png
  ├── scene_1.mp4
  ├── scene_2.png
  ├── scene_2.mp4
  ├── scene_3.png
  ├── scene_3.mp4
  ├── scene_4.png
  └── scene_4.mp4

voiceovers/{session_id}.mp3
```

### Check Logs

```bash
# Vercel logs (if deployed)
vercel logs

# Or local logs
npm run dev
# Watch console for errors
```

---

## Error Handling

### If voiceover generation fails:
- Check ELEVENLABS_API_KEY is set
- Verify voice_id exists
- Check API quota

### If image generation fails:
- Check FAL_API_KEY is set
- Verify prompt length < 2000 chars
- Check API quota

### If video generation fails:
- Check all scenes have image_url
- Verify motion_prompt is valid
- Check Fal AI quota

### If Shotstack assembly fails:
- Check SHOTSTACK_API_KEY is set
- Verify all video URLs are accessible
- Check Shotstack quota
- Verify video dimensions match (1080x1920)

---

## Cost Estimates (per video)

| Service | Cost | Notes |
|---------|------|-------|
| ElevenLabs | ~$0.50 | 32 seconds audio |
| Fal AI (images) | ~$0.04 | 4 images @ $0.01 each |
| Fal AI (videos) | ~$0.40 | 4 videos @ $0.10 each |
| Shotstack | ~$0.05 | 32 seconds HD video |
| Cloud Storage | ~$0.01 | Storage + bandwidth |
| **Total** | **~$1.00** | Per completed video |

---

## Next Steps

1. ✅ Update Claude prompt (already done)
2. ✅ Create API endpoints (already done)
3. ✅ Create video editor page (already done)
4. ⏳ Add API keys to `.env`
5. ⏳ Update Make.com Module 30 to POST to `/api/video-editor/generate-images`
6. ⏳ Test end-to-end workflow
7. ⏳ Deploy to production

---

## Production Deployment

### Vercel Environment Variables

Add these in Vercel dashboard:

```
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FAL_API_KEY=your_fal_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
SHOTSTACK_API_KEY=your_shotstack_api_key
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### Cloud Storage Permissions

Make sure your service account has:
- Storage Object Creator
- Storage Object Viewer

### Firestore Rules

```javascript
match /video_sessions/{sessionId} {
  allow read, write: if request.auth != null; // Admin only
}
```
