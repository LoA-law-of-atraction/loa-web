# Replace Make.com Completely

## Current Make.com Flow (LoA Shorts)

1. **Module 8**: `google-sheets:watchUpdatedCells` - Trigger when sheet updates
2. **Module 1**: `google-sheets:filterRows` - Get rows with specific status
3. **Module 89**: `util:SetVariable2` - Set variable
4. **Module 97**: `google-cloud-firestore:GetDocuments` - Get random character
5. **Module 99**: `json:CreateJSON` - Create character JSON
6. **Module 28**: `anthropic-claude:createAMessage` - Generate script
7. **Module 29**: `json:ParseJSON` - Parse script
8. **Module 77**: `util:SetVariable2` - Set variable
9. **Module 30**: `builtin:BasicFeeder` - Loop through scenes
10. **Module 93**: `util:SetVariable2` - Set variable
11. **Module 79**: `util:GetVariable2` - Get variable
12. **Module 33**: `http:MakeRequest` - ElevenLabs API (voiceover)
13. **Module 46**: `google-cloud-storage:objectsInsert` - Upload voiceover
14. **Module 85**: `google-cloud-firestore:createDocument` - Store in Firestore
15. **Module 34**: `http:MakeRequest` - Fal AI or other API
16. **Module 94**: `google-cloud-firestore:UpdateADocument` - Update Firestore
17. **Module 78**: `util:SetVariable2` - Set variable
18. **Module 53**: `builtin:BasicAggregator` - Aggregate results
19. **Module 87**: `google-sheets:updateRow` - Update sheet

## ✅ YES! We Can Replace ALL of This

Every single step can be done in Next.js:

| Make.com | Next.js Alternative | Complexity |
|----------|-------------------|------------|
| Google Sheets Trigger | Vercel Cron Job + Google Sheets API | Easy |
| Firestore Queries | Firebase Admin SDK (already have) | Easy |
| Claude API | Anthropic SDK | Easy |
| ElevenLabs API | Direct HTTP call (already doing) | Easy |
| Fal AI API | Direct HTTP call (already doing) | Easy |
| Cloud Storage | Firebase Storage (already doing) | Easy |
| Google Sheets Updates | Google Sheets API | Easy |

## New Architecture (No Make.com)

```
Vercel Cron Job (runs every 15 minutes)
    ↓
/api/cron/generate-videos
    ↓ Read Google Sheets (pending topics)
    ↓ Get random character (Firestore)
    ↓ Generate script (Claude API)
    ↓ Generate voiceover (ElevenLabs)
    ↓ Generate images (Fal AI)
    ↓ Store session (Firestore)
    ↓ Update Google Sheet (processing)
    ↓
Admin reviews in /admin/video-editor
    ↓ Approves all scenes
    ↓
/api/video-editor/generate-videos
    ↓ Generate videos (Fal AI)
    ↓ Assemble (Shotstack)
    ↓ Update Firestore
    ↓ Update Google Sheet (completed)
```

## Benefits of Removing Make.com

✅ **No Make.com costs** ($9-299/month saved)
✅ **Faster execution** (no webhook delays)
✅ **All code in one place** (easier to maintain)
✅ **Better error handling** (full control)
✅ **Better logging** (Vercel logs)
✅ **Easier debugging** (local development)
✅ **More flexible** (can add features easily)
✅ **Version control** (all logic in git)

## Implementation Cost

⚠️ **Additional services needed:**
- None! Everything is already available in Next.js/Vercel

⚠️ **Development time:**
- 2-3 hours to implement Google Sheets integration
- 1 hour to set up Vercel Cron
- 1 hour to connect everything

**Total: ~4-5 hours of work**

## Cost Comparison

### Current (with Make.com):
- Make.com: $9-29/month (operations limit)
- Vercel: Free or Pro ($20/month)
- **Total: $9-49/month**

### Without Make.com:
- Vercel: Free or Pro ($20/month)
- **Total: $0-20/month**

**Savings: $9-29/month**

---

# Implementation Plan

## Phase 1: Google Sheets Integration

### Install Dependencies
```bash
npm install googleapis
```

### Create Google Sheets Service

```javascript
// utils/googleSheetsService.js
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function getGoogleAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

  return new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });
}

export async function getSheetRows(spreadsheetId, range) {
  const auth = await getGoogleAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return response.data.values;
}

export async function updateSheetRow(spreadsheetId, range, values) {
  const auth = await getGoogleAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [values],
    },
  });
}

export async function getPendingTopics(spreadsheetId) {
  const rows = await getSheetRows(spreadsheetId, 'Sheet1!A2:Z');

  // Assuming columns: A=Topic, B=Status, C=Video URL, etc.
  return rows
    .map((row, index) => ({
      rowNumber: index + 2, // +2 because header is row 1, data starts at row 2
      topic: row[0],
      status: row[1] || 'pending',
      videoUrl: row[2] || null,
    }))
    .filter(row => row.status === 'pending' || row.status === '');
}
```

---

## Phase 2: Cron Job for Auto-Generation

### Create Cron API Endpoint

```javascript
// app/api/cron/generate-videos/route.js
import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";
import { getPendingTopics, updateSheetRow } from "@/utils/googleSheetsService";

export async function GET(request) {
  // Verify cron secret (security)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    // Step 1: Get pending topics from Google Sheets
    const pendingTopics = await getPendingTopics(spreadsheetId);

    if (pendingTopics.length === 0) {
      return NextResponse.json({
        message: 'No pending topics',
        processed: 0
      });
    }

    // Step 2: Process first pending topic (one at a time)
    const topic = pendingTopics[0];

    // Update status to "processing"
    await updateSheetRow(
      spreadsheetId,
      `Sheet1!B${topic.rowNumber}`,
      ['processing']
    );

    // Step 3: Get random character from Firestore
    const db = getAdminDb();
    const charactersSnapshot = await db.collection('characters').get();
    const characters = charactersSnapshot.docs.map(doc => ({
      character_id: doc.id,
      ...doc.data()
    }));

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
          content: `[Your full prompt here with topic: ${topic.topic}]`
        }]
      })
    });

    const claudeResult = await claudeResponse.json();
    const scriptData = JSON.parse(claudeResult.content[0].text);

    // Step 5: Call our existing generate-images endpoint
    const generateResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/video-editor/generate-images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: topic.topic,
        script: scriptData.script,
        selected_character: randomCharacter,
        scenes: scriptData.scenes,
      })
    });

    const result = await generateResponse.json();

    if (result.success) {
      // Update Google Sheet with editor URL
      await updateSheetRow(
        spreadsheetId,
        `Sheet1!B${topic.rowNumber}:C${topic.rowNumber}`,
        ['pending_approval', result.editor_url]
      );

      return NextResponse.json({
        message: 'Video generation started',
        session_id: result.session_id,
        editor_url: result.editor_url,
      });
    } else {
      throw new Error('Failed to generate images');
    }
  } catch (error) {
    console.error('Cron job error:', error);

    return NextResponse.json({
      error: 'Cron job failed',
      message: error.message,
    }, { status: 500 });
  }
}
```

---

## Phase 3: Set Up Vercel Cron

### Create `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-videos",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

This runs every 15 minutes.

---

## Phase 4: Update Video Completion Flow

### Modify `/api/video-editor/generate-videos/route.js`

Add at the end of `pollShotstackStatus()` when video is complete:

```javascript
// After updating Firestore with final video URL
const sessionDoc = await db.collection('video_sessions').doc(sessionId).get();
const sessionData = sessionDoc.data();

// Update Google Sheet with final video URL
if (sessionData.metadata?.sheetRow) {
  await updateSheetRow(
    process.env.GOOGLE_SHEETS_ID,
    `Sheet1!B${sessionData.metadata.sheetRow}:C${sessionData.metadata.sheetRow}`,
    ['completed', finalVideoUrl]
  );
}
```

And update the generate-images endpoint to store sheet row number in metadata:

```javascript
// In /api/video-editor/generate-images/route.js
const sessionData = {
  // ... existing fields
  metadata: {
    sheetRow: data.sheetRow, // Pass from cron job
  }
};
```

---

## Environment Variables

Add these to `.env`:

```env
# Google Sheets
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_SHEETS_ID=your_sheet_id

# Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key

# Cron Secret (generate with: openssl rand -hex 32)
CRON_SECRET=your_random_secret

# ... existing vars
FAL_API_KEY=your_fal_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
SHOTSTACK_API_KEY=your_shotstack_api_key
```

---

## Manual Trigger Alternative

If you don't want to use cron, create a manual trigger button in admin:

```javascript
// app/admin/video-generator/page.js
"use client";

export default function VideoGeneratorPage() {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/cron/generate-videos', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET}`
        }
      });

      const result = await response.json();
      alert('Video generation started! Check the editor.');
    } catch (error) {
      alert('Failed to start generation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Generate Videos</h1>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg"
      >
        {loading ? 'Generating...' : 'Generate Next Video'}
      </button>
    </div>
  );
}
```

---

## Testing

### 1. Test Google Sheets Integration

```bash
# Create test endpoint
# app/api/test/sheets/route.js

export async function GET() {
  const { getPendingTopics } = await import('@/utils/googleSheetsService');
  const topics = await getPendingTopics(process.env.GOOGLE_SHEETS_ID);

  return NextResponse.json({ topics });
}

# Visit: http://localhost:3000/api/test/sheets
```

### 2. Test Cron Job Locally

```bash
# Call the cron endpoint manually
curl -X GET http://localhost:3000/api/cron/generate-videos \
  -H "Authorization: Bearer your_cron_secret"
```

### 3. Test Full Flow

1. Add a topic to Google Sheets with status "pending"
2. Trigger cron job (manually or wait for schedule)
3. Check Firestore for video_sessions document
4. Visit editor URL
5. Approve scenes
6. Generate video
7. Check Google Sheets updated with "completed" status

---

## Migration Steps

1. ✅ Keep Make.com running (as backup)
2. ⏳ Implement Google Sheets service
3. ⏳ Create cron endpoint
4. ⏳ Test with 1-2 videos
5. ⏳ Run both systems in parallel for 1 week
6. ⏳ Verify Next.js system is working correctly
7. ⏳ Disable Make.com scenario
8. ✅ Delete Make.com account (save $9-29/month)

---

## Monitoring & Logs

### Vercel Dashboard
- Cron executions
- Function logs
- Error tracking

### Firestore
- All video sessions
- Status tracking
- Error logs

### Google Sheets
- Topic status
- Video URLs
- Timestamps

---

## Recommendation

**YES - Replace Make.com completely!**

**Reasons:**
1. You're already calling most APIs from Next.js
2. Make.com is just orchestrating (which Next.js can do)
3. Saves $9-29/month
4. Easier to maintain
5. Faster execution
6. Better debugging
7. All code in one place

**Start with:**
1. Implement Google Sheets integration (2 hours)
2. Create cron endpoint (1 hour)
3. Test with manual trigger first (safer)
4. Once working, set up Vercel Cron
5. Run both systems in parallel for a week
6. Disable Make.com

**Total time investment: 4-5 hours**
**Monthly savings: $9-29**
**ROI: Positive after first month**
