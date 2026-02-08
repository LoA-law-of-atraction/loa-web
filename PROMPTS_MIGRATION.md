# Prompts Migration

## What Changed?

✅ Moved Claude prompts from environment variables to dedicated files
✅ Created `/prompts` directory for all AI prompts
✅ Added prompt service utility for loading and managing prompts
✅ Better version control and editing experience

---

## File Structure

```
/prompts
├── README.md                  # Documentation
├── video-script.txt          # Main video generation prompt
└── example-blog-post.txt     # Example template

/utils
└── promptService.js          # Utility for loading prompts
```

---

## Before (Old Way)

**In `.env`:**
```env
CLAUDE_VIDEO_PROMPT="A TOPIC is provided externally...
[1000+ lines of prompt text]"
```

**In code:**
```javascript
const prompt = `${process.env.CLAUDE_VIDEO_PROMPT}

Topic: ${topic}
Selected Character: ${JSON.stringify(character)}`;
```

**Problems:**
❌ Hard to edit (escape quotes, handle newlines)
❌ Not version controlled well
❌ Difficult to maintain formatting
❌ Clutters .env file
❌ Can't easily share prompts

---

## After (New Way)

**In `/prompts/video-script.txt`:**
```
A TOPIC is provided externally...

Topic: {{topic}}
Selected Character: {{selected_character}}

[Rest of prompt with proper formatting]
```

**In code:**
```javascript
import { getPrompt } from '@/utils/promptService';

const prompt = getPrompt('video-script', {
  topic,
  selected_character: JSON.stringify(character, null, 2)
});
```

**Benefits:**
✅ Easy to edit (plain text file)
✅ Version controlled (git tracks changes)
✅ Clean formatting (no escaping needed)
✅ Clean .env file
✅ Reusable and shareable
✅ Can add comments and documentation

---

## How to Use

### Load a Prompt

```javascript
import { getPrompt } from '@/utils/promptService';

// Simple usage
const prompt = getPrompt('video-script', {
  topic: 'My topic',
  selected_character: JSON.stringify(characterData)
});

// Send to AI
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  })
});
```

### Create a New Prompt

1. Create `/prompts/my-new-prompt.txt`
2. Add your prompt with `{{variable}}` placeholders
3. Load in your code:

```javascript
const prompt = getPrompt('my-new-prompt', {
  variable: 'value'
});
```

---

## Migration Checklist

✅ Created `/prompts` directory
✅ Moved video-script prompt to `video-script.txt`
✅ Created `promptService.js` utility
✅ Updated API endpoint to use prompt service
✅ Removed `CLAUDE_VIDEO_PROMPT` from `.env.example`
✅ Created documentation (`README.md`)
✅ Created example prompt template

---

## Files Changed

### New Files
- `/prompts/video-script.txt`
- `/prompts/README.md`
- `/prompts/example-blog-post.txt`
- `/utils/promptService.js`
- `PROMPTS_MIGRATION.md` (this file)

### Modified Files
- `/app/api/video-generator/generate-script/route.js`
- `/.env.example`
- `/VIDEO_GENERATOR_GUIDE.md`

---

## Testing

```bash
# Test prompt loading
npm run dev

# Visit video generator
http://localhost:3000/admin/video-generator

# Generate a script - should work the same as before
```

---

## Adding More Prompts

**Example: Blog Post Generator**

1. Create `/prompts/blog-post.txt`:
```
Write a blog post about {{topic}}.

Tone: {{tone}}
Word count: {{word_count}}

[Rest of prompt...]
```

2. Use in your API:
```javascript
// app/api/blog/generate/route.js
import { getPrompt } from '@/utils/promptService';

export async function POST(request) {
  const { topic, tone, word_count } = await request.json();

  const prompt = getPrompt('blog-post', {
    topic,
    tone,
    word_count
  });

  // Send to Claude API...
}
```

---

## Best Practices

### ✅ Do This
- Use descriptive file names (`video-script.txt`, not `prompt1.txt`)
- Add variable documentation as comments in prompt files
- Test prompts locally before deploying
- Commit prompt files to git
- Keep related prompts in `/prompts` directory

### ❌ Don't Do This
- Don't store prompts in environment variables
- Don't hardcode prompts in API routes
- Don't forget to document variables
- Don't use special characters in file names

---

## Troubleshooting

### Prompt Not Found

```
Error: Prompt file not found: my-prompt.txt
```

**Fix:** Check file exists at `/prompts/my-prompt.txt`

### Variables Not Replaced

**Fix:**
- Use `{{variable}}` not `{variable}`
- Variable names are case-sensitive
- Check spelling matches exactly

### Works Locally, Fails on Vercel

**Fix:**
- Ensure `/prompts` directory is committed to git
- Check file paths are correct
- Verify Next.js has access to `fs` module (it does in API routes)

---

## Benefits Summary

| Aspect | Before (env) | After (files) |
|--------|-------------|---------------|
| Editing | Hard (escape quotes) | Easy (plain text) |
| Version Control | Poor (big env vars) | Excellent (git diff) |
| Formatting | Difficult | Natural |
| Sharing | Copy/paste | File share |
| Maintenance | Tedious | Simple |
| Documentation | None | Built-in |
| Reusability | No | Yes |

---

## Future Ideas

Potential prompts to add:
- `/prompts/social-caption.txt` - Social media captions
- `/prompts/blog-outline.txt` - Blog post outlines
- `/prompts/character-description.txt` - Character creation
- `/prompts/email-newsletter.txt` - Email content
- `/prompts/seo-meta.txt` - Meta descriptions

Each gets its own file for easy management!
