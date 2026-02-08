# Complete Video Generation System (Firebase Only)

## Architecture - Zero External Dependencies

```
Firestore (video_topics collection)
    ↓
Vercel Cron Job (every 15 min)
    ↓
/api/cron/generate-videos
    ↓ Read pending topics from Firestore
    ↓ Get random character from Firestore
    ↓ Call Claude API
    ↓ Call ElevenLabs API
    ↓ Call Fal AI (images)
    ↓ Store in video_sessions collection
    ↓
Admin reviews /admin/video-editor
    ↓ Approves all scenes
    ↓
/api/video-editor/generate-videos
    ↓ Call Fal AI (videos)
    ↓ Call Shotstack API
    ↓ Update video_topics & video_sessions
```

**All data in Firestore. No Google Sheets. No Make.com. Just Next.js + Firebase!**

---

## Firestore Collections

### 1. Collection: `video_topics`

Manages the queue of videos to generate.

```javascript
{
  id: "topic_001", // Auto-generated document ID
  topic: "How I manifested my dream job",
  status: "pending", // pending, processing, completed, failed
  priority: 1, // Higher = process first (optional)
  created_at: "2026-01-29T12:00:00.000Z",
  updated_at: "2026-01-29T12:00:00.000Z",

  // Populated after generation
  session_id: null, // Links to video_sessions
  editor_url: null,
  final_video_url: null,

  // Metadata
  source: "manual", // manual, bulk_import, api
  tags: ["manifestation", "career"],
  notes: "Optional notes about this topic"
}
```

### 2. Collection: `video_sessions`

Same as before - stores the actual video generation data.

```javascript
{
  session_id: "video_1738123456789_abc123",
  topic_id: "topic_001", // Links back to video_topics
  topic: "How I manifested my dream job",
  script: "Full continuous voiceover script...",
  selected_character: {...},
  voiceover_url: "https://storage.googleapis.com/...",
  status: "pending_approval",
  scenes: [...],
  final_video_url: null,
  created_at: "2026-01-29T12:00:00.000Z",
  updated_at: "2026-01-29T12:05:00.000Z"
}
```

### 3. Collection: `characters`

Already exists - stores character data.

```javascript
{
  character_id: "char_001",
  gender: "female",
  age_range: "30s",
  image_url: "https://...",
  voice_id: "elevenlabs_voice_id",
  name: "Character Name (optional)",
  tags: ["professional", "calm"]
}
```

---

## Implementation

### 1. Cron Job Endpoint

```javascript
// app/api/cron/generate-videos/route.js
import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function GET(request) {
  // Verify cron secret (security)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getAdminDb();

    // Step 1: Get one pending topic (ordered by priority, then created_at)
    const topicsSnapshot = await db
      .collection('video_topics')
      .where('status', '==', 'pending')
      .orderBy('priority', 'desc')
      .orderBy('created_at', 'asc')
      .limit(1)
      .get();

    if (topicsSnapshot.empty) {
      return NextResponse.json({
        message: 'No pending topics',
        processed: 0
      });
    }

    const topicDoc = topicsSnapshot.docs[0];
    const topicId = topicDoc.id;
    const topicData = topicDoc.data();

    // Step 2: Update status to "processing"
    await db.collection('video_topics').doc(topicId).update({
      status: 'processing',
      updated_at: new Date().toISOString(),
    });

    // Step 3: Get random character
    const charactersSnapshot = await db.collection('characters').get();
    const characters = charactersSnapshot.docs.map(doc => ({
      character_id: doc.id,
      ...doc.data()
    }));

    if (characters.length === 0) {
      throw new Error('No characters found in database');
    }

    const randomCharacter = characters[Math.floor(Math.random() * characters.length)];

    // Step 4: Generate script with Claude
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `${process.env.CLAUDE_PROMPT}

Topic:
${topicData.topic}

Selected Character (JSON):
${JSON.stringify(randomCharacter)}`
        }]
      })
    });

    if (!claudeResponse.ok) {
      throw new Error(`Claude API error: ${claudeResponse.statusText}`);
    }

    const claudeResult = await claudeResponse.json();
    const scriptText = claudeResult.content[0].text;

    // Extract JSON from Claude's response (remove markdown code blocks if present)
    const jsonMatch = scriptText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Claude response');
    }

    const scriptData = JSON.parse(jsonMatch[0]);

    // Step 5: Call our existing generate-images endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const generateResponse = await fetch(`${baseUrl}/api/video-editor/generate-images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: topicData.topic,
        script: scriptData.script,
        selected_character: randomCharacter,
        scenes: scriptData.scenes,
        topic_id: topicId, // Pass topic_id to link back
      })
    });

    const result = await generateResponse.json();

    if (result.success) {
      // Step 6: Update video_topics with session info
      await db.collection('video_topics').doc(topicId).update({
        status: 'pending_approval',
        session_id: result.session_id,
        editor_url: result.editor_url,
        updated_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: 'Video generation started',
        topic_id: topicId,
        session_id: result.session_id,
        editor_url: result.editor_url,
      });
    } else {
      throw new Error('Failed to generate images: ' + result.error);
    }
  } catch (error) {
    console.error('Cron job error:', error);

    // Update topic status to failed
    try {
      const db = getAdminDb();
      if (topicId) {
        await db.collection('video_topics').doc(topicId).update({
          status: 'failed',
          error: error.message,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    return NextResponse.json({
      error: 'Cron job failed',
      message: error.message,
    }, { status: 500 });
  }
}
```

---

### 2. Update Generate Images Endpoint

Add topic_id tracking:

```javascript
// app/api/video-editor/generate-images/route.js

// In the existing file, add topic_id to sessionData:
const sessionData = {
  session_id: sessionId,
  topic_id: data.topic_id || null, // Track which topic this came from
  topic: data.topic,
  // ... rest of existing fields
};
```

---

### 3. Update Generate Videos Endpoint

Update video_topics when complete:

```javascript
// app/api/video-editor/generate-videos/route.js

// In pollShotstackStatus(), when status === "done":
if (status === "done") {
  const finalVideoUrl = statusResult.response.url;

  // Update video_sessions
  const db = getAdminDb();
  await db.collection("video_sessions").doc(sessionId).update({
    status: "completed",
    final_video_url: finalVideoUrl,
    updated_at: new Date().toISOString(),
  });

  // Get session data to find topic_id
  const sessionDoc = await db.collection("video_sessions").doc(sessionId).get();
  const sessionData = sessionDoc.data();

  // Update video_topics if linked
  if (sessionData.topic_id) {
    await db.collection("video_topics").doc(sessionData.topic_id).update({
      status: "completed",
      final_video_url: finalVideoUrl,
      updated_at: new Date().toISOString(),
    });
  }

  console.log(`Video completed for session ${sessionId}: ${finalVideoUrl}`);
  return;
}
```

---

### 4. Admin Interface for Topics

Create a simple admin page to manage topics:

```javascript
// app/admin/topics/page.js
"use client";

import { useEffect, useState } from "react";

export default function TopicsPage() {
  const [topics, setTopics] = useState([]);
  const [newTopic, setNewTopic] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const response = await fetch("/api/topics");
      const result = await response.json();
      if (result.success) {
        setTopics(result.topics);
      }
    } catch (error) {
      console.error("Failed to load topics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!newTopic.trim()) return;

    try {
      const response = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: newTopic }),
      });

      if (response.ok) {
        setNewTopic("");
        loadTopics();
      }
    } catch (error) {
      console.error("Failed to add topic:", error);
    }
  };

  const handleDelete = async (topicId) => {
    if (!confirm("Delete this topic?")) return;

    try {
      await fetch(`/api/topics?id=${topicId}`, { method: "DELETE" });
      loadTopics();
    } catch (error) {
      console.error("Failed to delete topic:", error);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { bg: "bg-gray-100", text: "text-gray-800" },
      processing: { bg: "bg-blue-100", text: "text-blue-800" },
      pending_approval: { bg: "bg-yellow-100", text: "text-yellow-800" },
      completed: { bg: "bg-green-100", text: "text-green-800" },
      failed: { bg: "bg-red-100", text: "text-red-800" },
    };
    const c = config[status] || config.pending;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${c.bg} ${c.text}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Video Topics Queue</h1>

      {/* Add New Topic */}
      <div className="bg-white border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Topic</h2>
        <form onSubmit={handleAddTopic} className="flex gap-4">
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="e.g., How I manifested my dream job"
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Topic
          </button>
        </form>
      </div>

      {/* Topics List */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Topic
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {topics.map((topic) => (
              <tr key={topic.id}>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {topic.topic}
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(topic.status)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(topic.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    {topic.editor_url && (
                      <a
                        href={topic.editor_url}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </a>
                    )}
                    {topic.final_video_url && (
                      <a
                        href={topic.final_video_url}
                        target="_blank"
                        className="text-green-600 hover:underline"
                      >
                        Download
                      </a>
                    )}
                    {topic.status === "pending" && (
                      <button
                        onClick={() => handleDelete(topic.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Total: {topics.length} topics | Pending: {topics.filter(t => t.status === 'pending').length}
      </div>
    </div>
  );
}
```

---

### 5. Topics API Endpoint

```javascript
// app/api/topics/route.js
import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

// GET - List all topics
export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection("video_topics")
      .orderBy("created_at", "desc")
      .limit(100)
      .get();

    const topics = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      topics,
    });
  } catch (error) {
    console.error("Topics GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics", message: error.message },
      { status: 500 }
    );
  }
}

// POST - Add new topic
export async function POST(request) {
  try {
    const { topic, priority = 1 } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const docRef = await db.collection("video_topics").add({
      topic,
      status: "pending",
      priority,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      session_id: null,
      editor_url: null,
      final_video_url: null,
      source: "manual",
    });

    return NextResponse.json({
      success: true,
      id: docRef.id,
    });
  } catch (error) {
    console.error("Topics POST error:", error);
    return NextResponse.json(
      { error: "Failed to create topic", message: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove topic
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get("id");

    if (!topicId) {
      return NextResponse.json(
        { error: "Topic ID is required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    await db.collection("video_topics").doc(topicId).delete();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Topics DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete topic", message: error.message },
      { status: 500 }
    );
  }
}
```

---

### 6. Update Admin Layout

Add Topics link to navigation:

```javascript
// app/admin/layout.js

<a
  href="/admin/topics"
  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    pathname.startsWith("/admin/topics")
      ? "bg-gray-100 text-gray-900"
      : "text-gray-600 hover:text-gray-900"
  }`}
>
  Topics
</a>
```

---

### 7. Store Claude Prompt in Environment

```env
# .env

# Claude Prompt for Video Script Generation
CLAUDE_PROMPT="A TOPIC is provided externally. Do NOT repeat or restate it.

A SELECTED CHARACTER is provided externally as JSON with:
- character_id
- gender (male/female)
- age_range (e.g., 20s/30s)
- image_url (reference image)
- voice_id (ElevenLabs voice ID)

[... rest of your full prompt ...]"
```

---

## Environment Variables

Complete list:

```env
# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# Video Generation APIs
FAL_API_KEY=your_fal_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
SHOTSTACK_API_KEY=your_shotstack_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Cron Secret (generate with: openssl rand -hex 32)
CRON_SECRET=your_random_secret

# Base URL
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# Claude Prompt (or store in file)
CLAUDE_PROMPT="[Your full prompt here]"
```

---

## Vercel Cron Setup

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/generate-videos",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Or for testing, run every 5 minutes:
```json
"schedule": "*/5 * * * *"
```

---

## Complete Workflow

### 1. Admin adds topics

Visit `/admin/topics` and add topics manually:
- "How I manifested my dream job"
- "Attracting my soulmate"
- "Manifesting wealth and abundance"

### 2. Cron job runs (every 15 min)

1. Reads one `pending` topic from Firestore
2. Updates status to `processing`
3. Gets random character
4. Calls Claude API
5. Calls `/api/video-editor/generate-images`
6. Updates topic with `session_id` and `editor_url`
7. Status changes to `pending_approval`

### 3. Admin reviews

1. Visit `/admin/topics`
2. Click "Edit" link to open video editor
3. Approve all 4 scene images
4. Click "Generate Final Video"

### 4. Video generation

1. Calls `/api/video-editor/generate-videos`
2. Generates 4 videos with Fal AI
3. Assembles with Shotstack
4. Updates both collections:
   - `video_sessions`: `status: "completed"`, `final_video_url`
   - `video_topics`: `status: "completed"`, `final_video_url`

### 5. Download

Visit `/admin/topics` and click "Download" to get final video

---

## Benefits vs Make.com + Google Sheets

| Feature | Make.com + Sheets | Firebase Only |
|---------|------------------|---------------|
| Monthly cost | $9-29 | $0 |
| External deps | 2 (Make, Sheets) | 0 |
| Setup time | 2-3 hours | 1 hour |
| Maintenance | Complex | Simple |
| Debugging | Hard | Easy |
| Speed | Slow (webhooks) | Fast (direct) |
| Scalability | Limited | Unlimited |
| Version control | No | Yes |

---

## Testing

### 1. Add test topic

```bash
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"topic": "Test topic for video"}'
```

### 2. Trigger cron manually

```bash
curl -X GET http://localhost:3000/api/cron/generate-videos \
  -H "Authorization: Bearer your_cron_secret"
```

### 3. Check Firestore

```javascript
// Firebase Console
video_topics/{id}
  - status: "processing" → "pending_approval" → "completed"

video_sessions/{session_id}
  - status: "pending_approval" → "generating_videos" → "completed"
```

### 4. Visit admin

```
http://localhost:3000/admin/topics
http://localhost:3000/admin/video-editor?session={session_id}
```

---

## Migration from Make.com

### Phase 1: Build Firebase System (1-2 hours)
- ✅ Create `/api/topics` endpoint
- ✅ Create `/admin/topics` page
- ✅ Create `/api/cron/generate-videos` endpoint
- ✅ Update existing endpoints to link topic_id

### Phase 2: Import Topics (10 minutes)
- Export topics from Google Sheets
- Bulk import to Firestore `video_topics` collection

### Phase 3: Test (1 hour)
- Add test topic
- Trigger cron
- Verify full flow works

### Phase 4: Deploy (30 minutes)
- Deploy to Vercel
- Set up Vercel Cron
- Add all environment variables

### Phase 5: Monitor (1 week)
- Run both systems in parallel
- Verify Firebase system works correctly
- Compare results

### Phase 6: Sunset Make.com
- Disable Make.com scenario
- Cancel Make.com subscription
- ✅ Save $9-29/month forever

---

## Bulk Topic Import (Optional)

If you have many topics to import:

```javascript
// scripts/import-topics.js
const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Read topics from file
const topics = [
  "How I manifested my dream job",
  "Attracting my soulmate",
  "Manifesting wealth and abundance",
  // ... more topics
];

async function importTopics() {
  const batch = db.batch();

  topics.forEach((topic) => {
    const docRef = db.collection('video_topics').doc();
    batch.set(docRef, {
      topic,
      status: 'pending',
      priority: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      session_id: null,
      editor_url: null,
      final_video_url: null,
      source: 'bulk_import',
    });
  });

  await batch.commit();
  console.log(`Imported ${topics.length} topics`);
}

importTopics();
```

Run: `node scripts/import-topics.js`

---

## Summary

**Complete system with ZERO external dependencies:**

✅ Firestore for topics queue
✅ Firestore for video sessions
✅ Firestore for characters
✅ Vercel Cron for automation
✅ Next.js APIs for all logic
✅ Admin UI for management

**No Make.com. No Google Sheets. Just Firebase + Vercel.**

**Total savings: $9-29/month**
**Setup time: 2-3 hours**
**Maintenance: Minimal**
