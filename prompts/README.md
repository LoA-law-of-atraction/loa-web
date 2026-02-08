# Prompts Directory

This directory contains all AI prompts used in the application.

## Why Store Prompts Here?

✅ **Version Control** - Track changes to prompts over time
✅ **Easy Editing** - Edit prompts without redeploying
✅ **Clean Environment** - Keep .env files small and focused
✅ **Better Formatting** - Maintain multi-line prompts with proper formatting
✅ **Reusability** - Share prompts across different endpoints

## Available Prompts

### `video-script.txt`

**Used by:** `/api/video-generator/generate-script`
**Purpose:** Generates 4-scene video script with image and motion prompts
**Variables:**
- `{{topic}}` - The video topic (e.g., "How I manifested my dream job")
- `{{selected_character}}` - JSON object with character details

**Example Usage:**
```javascript
import { getPrompt } from '@/utils/promptService';

const prompt = getPrompt('video-script', {
  topic: 'How I manifested my dream job',
  selected_character: JSON.stringify(characterData, null, 2)
});
```

## Adding New Prompts

1. Create a new `.txt` file in this directory
2. Use `{{variable_name}}` for placeholders
3. Load it using the prompt service:

```javascript
import { getPrompt } from '@/utils/promptService';

const prompt = getPrompt('your-prompt-name', {
  variable_name: 'value'
});
```

## Prompt Service API

### `loadPrompt(promptName)`

Loads a prompt template from file.

```javascript
import { loadPrompt } from '@/utils/promptService';

const template = loadPrompt('video-script');
// Returns the raw template with {{placeholders}}
```

### `fillPromptTemplate(template, variables)`

Replaces placeholders in a template.

```javascript
import { fillPromptTemplate } from '@/utils/promptService';

const filled = fillPromptTemplate(template, {
  topic: 'My topic',
  selected_character: JSON.stringify(char)
});
```

### `getPrompt(promptName, variables)`

Loads and fills a prompt in one step (most common usage).

```javascript
import { getPrompt } from '@/utils/promptService';

const prompt = getPrompt('video-script', {
  topic: 'My topic',
  selected_character: JSON.stringify(char)
});
```

## Prompt Template Syntax

### Variables

Use double curly braces for variables:

```
Topic: {{topic}}
Character: {{selected_character}}
```

### JSON Objects

When passing objects, they're automatically stringified:

```javascript
getPrompt('my-prompt', {
  user: { name: 'John', age: 30 }
});

// In prompt file:
User Info: {{user}}

// Result:
User Info: {
  "name": "John",
  "age": 30
}
```

### Multi-line Content

Prompts can span multiple lines naturally:

```
This is a prompt.

It can have multiple paragraphs.

And proper formatting.
```

## Best Practices

### 1. Use Descriptive Names

✅ `video-script.txt`
✅ `blog-post-generator.txt`
❌ `prompt1.txt`
❌ `test.txt`

### 2. Document Variables

Add a comment at the top of each prompt file:

```
# Variables:
# - {{topic}}: The main topic for the video
# - {{selected_character}}: JSON object with character details
# - {{style}}: Optional style modifier

Your prompt starts here...
```

### 3. Version Control

When making significant changes, consider:
- Adding a comment with the date
- Creating a backup file (e.g., `video-script-v1.txt`)
- Documenting changes in git commit messages

### 4. Test Changes

After editing a prompt:
1. Test locally first
2. Verify all variables are replaced correctly
3. Check output quality
4. Deploy to production

## Examples

### Simple Prompt

**File:** `simple-greeting.txt`
```
Hello {{name}}, welcome to {{app_name}}!
```

**Usage:**
```javascript
const greeting = getPrompt('simple-greeting', {
  name: 'Alice',
  app_name: 'LoA Generator'
});
// Result: "Hello Alice, welcome to LoA Generator!"
```

### Complex Prompt with JSON

**File:** `blog-outline.txt`
```
Create a blog post outline for the following topic:

Topic: {{topic}}

Target Audience:
{{audience}}

Tone: {{tone}}
Length: {{word_count}} words
```

**Usage:**
```javascript
const prompt = getPrompt('blog-outline', {
  topic: 'Law of Attraction Success',
  audience: JSON.stringify({
    demographics: '25-45 years old',
    interests: ['personal development', 'manifestation']
  }),
  tone: 'inspirational and grounded',
  word_count: 1500
});
```

## Troubleshooting

### Prompt Not Found Error

```
Error: Prompt file not found: my-prompt.txt
```

**Solution:** Check that the file exists in `/prompts/my-prompt.txt`

### Variables Not Replaced

If variables aren't being replaced, check:
1. Variable names match exactly (case-sensitive)
2. Using double curly braces: `{{variable}}` not `{variable}`
3. No spaces inside braces: `{{var}}` not `{{ var }}`

### Deployment Issues

On Vercel/production:
1. Ensure `/prompts` directory is committed to git
2. Verify file permissions are correct
3. Check that `fs` module is available (it is in Next.js API routes)

## Future Prompts

Consider adding prompts for:
- Blog post generation
- Social media captions
- Email campaigns
- Character descriptions
- Story outlines
- SEO meta descriptions

Each prompt gets its own `.txt` file for easy management.
