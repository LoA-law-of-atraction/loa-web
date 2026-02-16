# Video Generator Guide

## Complete Manual Workflow (No Make.com!)

A step-by-step video creation system with full control at each stage.

---

## Workflow Overview

```
Step 1: Select Topic & Character
    ↓
Step 2: Generate Script (Claude AI)
    ↓ Review & approve
Step 3: Generate Images (Fal AI)
    ↓ Review, regenerate if needed
Step 4: Generate Videos (Fal AI image-to-video)
    ↓ Review videos
Step 5: Assemble Final Video (Shotstack)
    ↓ Download & post to social media
```

---

## Features

✅ **Manual Control** - Review and approve at each step
✅ **Regenerate Images** - Don't like a scene? Regenerate it
✅ **Preview Everything** - See script, images, videos before final assembly
✅ **Social Media Ready** - Post directly to Instagram, YouTube, TikTok
✅ **No Make.com** - Everything runs on your website
✅ **Cost Effective** - Only pay for what you generate

---

## Setup

### 1. Add Environment Variables

```env
# Firebase Admin SDK (already have this)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# API Keys
FAL_API_KEY=your_fal_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
SHOTSTACK_API_KEY=your_shotstack_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Base URL
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# Note: Claude prompts are stored in /prompts directory, not in .env
```

**Prompts are now stored in `/prompts` directory:**
- `/prompts/video-script.txt` - Main video script generation prompt
- See `/prompts/README.md` for details on managing prompts

### 2. Create Characters in Firestore

Create a `characters` collection with documents like:

```javascript
{
  character_id: "char_001", // Can be auto-generated
  gender: "female",
  age_range: "30s",
  image_url: "https://storage.googleapis.com/.../character.png",
  voice_id: "ElevenLabsVoiceId", // Get from ElevenLabs dashboard
  name: "Professional Woman" // Optional
}
```

Add 4-5 characters with different genders and age ranges.

### 3. Deploy

```bash
# Test locally first
npm run dev

# Visit: http://localhost:3000/admin/video-generator

# Deploy to Vercel
vercel deploy
```

---

## Using the Video Generator

### Step 1: Topic & Character Selection

1. Visit `/admin/video-generator`
2. Enter your video topic (e.g., "How I manifested my dream job")
3. Click on a character to select it
4. Click "Generate Script"

**What happens:**
- Calls Claude API with your prompt + topic + character
- Generates 4 scene descriptions with image/motion prompts
- ~10 seconds

### Step 2: Review Script

You'll see:
- Full continuous script (32 seconds of voiceover)
- 4 scene breakdowns with:
  - Voiceover text for each scene
  - Camera angle
  - Mood
  - Image prompt
  - Motion prompt

**Actions:**
- Review the script
- If you like it, click "Generate Images"
- If not, go back and try a different character or topic

### Step 3: Review & Approve Images

You'll see:
- Voiceover audio player (play to hear it)
- 4 scene images in portrait 9:16 format
- Voiceover text for each scene

**Actions:**
- Review each image
- If you don't like an image, click "Regenerate" for that scene
- Once all look good, click "Generate Videos"

**What happens:**
- Generates voiceover with ElevenLabs (~5 seconds)
- Generates 4 images with Fal AI in parallel (~15 seconds)
- Uploads to Cloud Storage
- Total: ~20 seconds

### Step 4: Review Videos

You'll see:
- 4 video clips (8 seconds each)
- Each video plays with animation from the static image
- Voiceover text for each scene

**Actions:**
- Review each video clip
- Make sure they look good
- Click "Assemble Final Video"

**What happens:**
- Generates 4 videos with Fal AI image-to-video (~2 minutes)
- Uploads to Cloud Storage
- Total: ~2 minutes

### Step 5: Final Video & Social Posting

You'll see:
- Final assembled video (32 seconds, 1080x1920)
- Video player to preview
- Download button
- Social media posting buttons

**Actions:**
1. **Preview** - Watch the final video
2. **Download** - Save to your computer
3. **Post to Social** - Click Instagram/YouTube/TikTok button

**What happens:**
- Assembles all clips + voiceover with Shotstack (~30 seconds)
- Polls for completion
- Shows final video when ready
- Total: ~30-60 seconds

---

## API Endpoints

### POST `/api/video-generator/generate-script`

Generate script with Claude.

**Request:**
```json
{
  "topic": "How I manifested my dream job",
  "selected_character": {
    "character_id": "char_001",
    "gender": "female",
    "age_range": "30s",
    "voice_id": "elevenlabs_voice_id"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "topic": "...",
    "script": "Full 32-second script...",
    "selected_character": {...},
    "scenes": [
      {
        "id": 1,
        "duration": "8s",
        "location": "location_1",
        "voiceover": "First 8 seconds...",
        "camera": "medium",
        "mood": "contemplative",
        "image_prompt": "Dark cinematic cartoon style...",
        "motion_prompt": "Slow breathing motion..."
      },
      // ... 3 more scenes
    ]
  }
}
```

---

### POST `/api/video-generator/generate-images`

Generate voiceover + 4 images.

**Request:**
```json
{
  "script_data": {
    "script": "...",
    "scenes": [...]
  },
  "selected_character": {...}
}
```

**Response:**
```json
{
  "success": true,
  "session_id": "video_1738123456789_abc123",
  "voiceover_url": "https://storage.googleapis.com/.../voiceover.mp3",
  "images": [
    {
      "scene_id": 1,
      "image_url": "https://storage.googleapis.com/.../scene_1.png"
    },
    // ... 3 more images
  ]
}
```

---

### POST `/api/video-generator/regenerate-image`

Regenerate a single scene image.

**Request:**
```json
{
  "session_id": "video_1738123456789_abc123",
  "scene_id": 2,
  "image_prompt": "Dark cinematic cartoon style..."
}
```

**Response:**
```json
{
  "success": true,
  "image_url": "https://storage.googleapis.com/.../scene_2_new.png"
}
```

---

### POST `/api/video-generator/generate-videos`

Generate 4 videos from approved images.

**Request:**
```json
{
  "session_id": "video_1738123456789_abc123",
  "images": [
    {"scene_id": 1, "image_url": "..."},
    {"scene_id": 2, "image_url": "..."},
    {"scene_id": 3, "image_url": "..."},
    {"scene_id": 4, "image_url": "..."}
  ],
  "script_data": {
    "scenes": [...]
  }
}
```

**Response:**
```json
{
  "success": true,
  "videos": [
    {
      "scene_id": 1,
      "video_url": "https://storage.googleapis.com/.../scene_1.mp4"
    },
    // ... 3 more videos
  ]
}
```

---

### POST `/api/video-generator/assemble-video`

Assemble final video with Shotstack.

**Request:**
```json
{
  "session_id": "video_1738123456789_abc123",
  "videos": [
    {"scene_id": 1, "video_url": "..."},
    {"scene_id": 2, "video_url": "..."},
    {"scene_id": 3, "video_url": "..."},
    {"scene_id": 4, "video_url": "..."}
  ],
  "voiceover_url": "https://storage.googleapis.com/.../voiceover.mp3"
}
```

**Response:**
```json
{
  "success": true,
  "render_id": "abc-123-def",
  "message": "Video rendering started"
}
```

**Check Status:**
```
GET /api/video-generator/assemble-video?session_id=video_1738123456789_abc123
```

**Response when complete:**
```json
{
  "success": true,
  "status": "completed",
  "final_video_url": "https://shotstack-output.s3.amazonaws.com/.../final.mp4"
}
```

---

### POST `/api/video-generator/post-social`

Upload the rendered video to Instagram, YouTube, or TikTok. Each platform requires the corresponding env vars; if missing, the API returns `success: false` with a clear message.

**Request:**
```json
{
  "session_id": "video_1738123456789_abc123",
  "platform": "instagram", // or "youtube" or "tiktok"
  "video_url": "https://storage.googleapis.com/.../final.mp4",
  "caption": "Full script text..."
}
```

**Response:**
```json
{
  "success": true,
  "post_url": "https://instagram.com/reel/xxx",
  "message": "Posted to Instagram."
}
```

**Environment variables (optional; enable each platform when set):**

| Platform   | Env vars | Notes |
|------------|----------|--------|
| Instagram  | OAuth: `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, `INSTAGRAM_REDIRECT_URI`; or manual: `INSTAGRAM_USER_ID`, `INSTAGRAM_ACCESS_TOKEN` | **OAuth:** Open `/api/auth/instagram` to connect; token stored in Firestore `integrations/instagram`. **Manual:** Set user id + long-lived token. Graph API: create container (Reels) → poll status → publish. |
| YouTube    | `YOUTUBE_ACCESS_TOKEN` | OAuth2 access token with `youtube.upload` scope. Video is downloaded from `video_url` and uploaded via Data API v3 multipart. |
| TikTok     | `TIKTOK_ACCESS_TOKEN` | User access token with `video.upload` scope. Uses PULL_FROM_URL (video URL domain must be [verified](https://developers.tiktok.com/doc/content-posting-api-media-transfer-guide) in TikTok Developer Portal). Video is sent to the user's TikTok inbox to edit and publish in-app. |

---

## Firestore Schema

### Collection: `video_sessions`

```javascript
{
  session_id: "video_1738123456789_abc123",
  script_data: {
    topic: "...",
    script: "...",
    scenes: [...]
  },
  selected_character: {...},
  voiceover_url: "https://...",
  images: [
    {scene_id: 1, image_url: "..."},
    {scene_id: 2, image_url: "..."},
    {scene_id: 3, image_url: "..."},
    {scene_id: 4, image_url: "..."}
  ],
  videos: [
    {scene_id: 1, video_url: "..."},
    {scene_id: 2, video_url: "..."},
    {scene_id: 3, video_url: "..."},
    {scene_id: 4, video_url: "..."}
  ],
  shotstack_render_id: "abc-123-def",
  final_video_url: "https://...",
  status: "completed", // images_generated, videos_generated, rendering, completed, failed
  social_posts: [
    {
      platform: "instagram",
      posted_at: "2026-01-29T...",
      post_url: "https://instagram.com/p/xxx",
      status: "posted"
    }
  ],
  created_at: "2026-01-29T12:00:00.000Z",
  updated_at: "2026-01-29T12:10:00.000Z"
}
```

### Collection: `characters`

```javascript
{
  character_id: "char_001", // Or use doc.id
  gender: "female",
  age_range: "30s",
  image_url: "https://...",
  voice_id: "ElevenLabsVoiceId",
  name: "Professional Woman" // Optional
}
```

---

## Cost Per Video

| Step | Service | Cost | Time |
|------|---------|------|------|
| Script | Claude Sonnet 4 | ~$0.10 | 10s |
| Voiceover | ElevenLabs | ~$0.50 | 5s |
| 4 Images | Fal AI | ~$0.04 | 15s |
| 4 Videos | Fal AI | ~$0.40 | 2min |
| Assembly | Shotstack | ~$0.05 | 30s |
| Storage | Cloud Storage | ~$0.01 | - |
| **Total** | | **~$1.10** | **~3min** |

---

## Social Media Posting

Step 7 posts are implemented in `/api/video-generator/post-social/route.js`. Set the env vars below to enable each platform.

### Instagram

- **OAuth (recommended):** Set `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, and `INSTAGRAM_REDIRECT_URI` (or rely on `NEXT_PUBLIC_BASE_URL`). Open `/api/auth/instagram` in the browser to connect; credentials are stored in Firestore `integrations/instagram` and refreshed when needed. Uses `@microfox/instagram-oauth`.
- **Manual:** Set `INSTAGRAM_USER_ID` and `INSTAGRAM_ACCESS_TOKEN` (long-lived token from Meta Developer).
- Flow: create Reels container with `video_url` → poll container status until `FINISHED` → publish.
- Docs: https://developers.facebook.com/docs/instagram-api/guides/content-publishing

### YouTube

- Set `YOUTUBE_ACCESS_TOKEN` (OAuth2 token with scope `https://www.googleapis.com/auth/youtube.upload`).
- Flow: download video from `video_url`, then multipart upload to YouTube Data API v3.
- Docs: https://developers.google.com/youtube/v3/docs/videos/insert

### TikTok

- Set `TIKTOK_ACCESS_TOKEN` (user token with `video.upload` scope).
- Flow: PULL_FROM_URL to send video to the user’s TikTok inbox; user edits and publishes in the TikTok app. The video URL’s domain must be verified in the TikTok Developer Portal.
- Docs: https://developers.tiktok.com/doc/content-posting-api-get-started

---

## Troubleshooting

### Issue: Characters not loading

**Solution:**
- Check Firestore `characters` collection exists
- Verify Firebase Admin SDK is initialized
- Check Firestore rules allow read access

### Issue: Script generation fails

**Solution:**
- Verify `ANTHROPIC_API_KEY` is set
- Check `CLAUDE_VIDEO_PROMPT` is properly formatted
- Check Claude API quota

### Issue: Image generation fails

**Solution:**
- Verify `FAL_API_KEY` is set
- Check Fal AI quota/credits
- Verify image prompts are < 2000 characters

### Issue: Video generation fails

**Solution:**
- Verify all images are accessible (public URLs)
- Check Fal AI quota for image-to-video
- Verify motion prompts are valid
- Check Cloud Storage has space

### Issue: Final video assembly fails

**Solution:**
- Verify `SHOTSTACK_API_KEY` is set
- Check all video URLs are accessible
- Verify Shotstack quota
- Check video format is MP4
- Verify dimensions match (1080x1920)

### Issue: Voiceover quality issues

**Solution:**
- Adjust `voice_settings` in generate-images endpoint
- Try different voice_id from ElevenLabs
- Check script length (~32 seconds)

---

## Next Steps

1. ✅ Test script generation
2. ✅ Test image generation
3. ✅ Test video generation
4. ✅ Test final assembly
5. ⏳ Implement social media posting (Instagram/YouTube/TikTok)
6. ⏳ Add video preview before assembly
7. ⏳ Add progress indicators for long operations
8. ⏳ Add batch processing for multiple videos
9. ⏳ Add templates/presets for common styles
10. ⏳ Add analytics (views, engagement, etc.)

---

## Benefits vs Make.com

| Feature | Make.com | Our System |
|---------|----------|------------|
| Cost | $9-29/month | $0/month |
| Control | Limited | Full control |
| Debugging | Hard | Easy |
| Speed | Slow (webhooks) | Fast (direct APIs) |
| Customization | Limited | Unlimited |
| Visibility | Black box | Full visibility |
| Version control | No | Yes (all in git) |
| Local testing | No | Yes |
| Dependencies | 2 external | 0 external |

---

## Summary

**Complete video generation system:**

✅ Manual workflow with full control
✅ 5-step wizard interface
✅ Preview at each stage
✅ Regenerate individual scenes
✅ Download final video
✅ Post to social media (placeholders)
✅ No Make.com needed
✅ All code in your repository
✅ ~$1.10 per video
✅ ~3 minutes total generation time

Ready to generate videos!
