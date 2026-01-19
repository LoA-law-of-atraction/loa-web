# LoA Blog Setup Guide

This guide will help you set up and configure the blog system for your LoA landing page.

## 🚀 Quick Start

### 1. Install Dependencies

First, ensure you're using Node.js 18+ (Node 21 recommended):

```bash
# Switch to Node 21 (if using nvm)
nvm use 21

# Install required packages
npm install react-markdown remark-gfm rehype-raw rehype-sanitize react-quill bcryptjs date-fns gray-matter reading-time
```

### 2. Firebase Setup

#### Enable Required Services

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Enable **Firestore Database** (if not already enabled)
4. Enable **Firebase Storage** for image uploads
5. Enable **Firebase Authentication** (optional, for admin)

#### Create Firestore Collections

Manually create these collections in Firestore:

**Collection: `blog_posts`**
- No initial documents needed (will be created when you add posts)

**Collection: `blog_categories`** (Optional)
- Add categories from `/lib/constants/blogConfig.js` if desired

**Collection: `blog_config`**
- Document ID: `settings`
- Fields:
  ```javascript
  {
    adminPassword: "", // Leave empty for now, will be set programmatically
    postsPerPage: 9,
    defaultAuthor: {
      name: "LoA Team",
      bio: "Bringing Law of Attraction to the digital age"
    },
    updatedAt: [Current Timestamp]
  }
  ```

#### Update Firebase Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Existing rules for waitlist and contacts
    match /waitlist/{document} {
      allow read, write: if request.auth != null;
    }
    match /contacts/{document} {
      allow read, write: if request.auth != null;
    }

    // Blog posts - public read, admin write
    match /blog_posts/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Blog categories - public read, admin write
    match /blog_categories/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Blog config - admin only
    match /blog_config/{document} {
      allow read, write: if request.auth != null;
    }
  }
}

// Firebase Storage rules for blog images
service firebase.storage {
  match /b/{bucket}/o {
    match /blog/{imageId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 3. Set Admin Password

The admin password is hashed using bcrypt and stored in Firestore.

**Option A: Set via Node.js Script**

Create a script `scripts/setAdminPassword.js`:

```javascript
import { setAdminPassword } from './utils/authService.js';

const password = process.argv[2];

if (!password) {
  console.error('Please provide a password');
  console.error('Usage: node scripts/setAdminPassword.js <password>');
  process.exit(1);
}

setAdminPassword(password)
  .then(() => {
    console.log('Admin password set successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error setting password:', error);
    process.exit(1);
  });
```

Run:
```bash
node scripts/setAdminPassword.js your-secure-password
```

**Option B: Set Manually in Firebase Console**

1. Use bcrypt to hash your password: https://bcrypt-generator.com/
2. In Firestore, navigate to `blog_config/settings`
3. Update the `adminPassword` field with the bcrypt hash

### 4. Test the Blog System

#### Start Development Server

```bash
npm run dev
```

#### Access Admin Panel

1. Navigate to `http://localhost:3000/admin/login`
2. Enter your admin password
3. You should be redirected to the admin dashboard

#### Create Your First Post

1. Click "New Post" in the admin panel
2. Fill in:
   - Title (required)
   - Content (required)
   - Excerpt
   - Featured Image (upload from your computer)
   - Categories & Tags
   - SEO metadata
3. Click "Save as Draft" or "Publish Post"

#### View Blog

Navigate to `http://localhost:3000/blog` to see your published posts.

## 📁 File Structure

```
/app
  /admin
    /login/page.js          - Admin login page
    /blog
      /page.js              - Admin dashboard
      /new/page.js          - Create new post
      /edit/[id]/page.js    - Edit existing post
    layout.js               - Admin layout
  /api
    /auth
      /login/route.js       - Login endpoint
      /logout/route.js      - Logout endpoint
    /blog
      /posts/route.js       - GET/POST posts
      /posts/[id]/route.js  - GET/PUT/DELETE by ID
      /upload/route.js      - Image upload
      /generate/route.js    - AI content generation (placeholder)
  /blog
    /page.js                - Public blog list
    /[slug]/page.js         - Individual post page
  sitemap.js                - Dynamic sitemap with blog posts

/components
  /admin
    /BlogEditor.js          - Rich text editor (React Quill)
    /PostMetadataForm.js    - Post metadata fields
    /CategoryManager.js     - Category/tag selector
    /ImageUploader.js       - Image upload component
    /PublishControls.js     - Publish/draft controls
  /blog
    /BlogCard.js            - Blog post card for list view
    /BlogPostContent.js     - Markdown renderer
    /CategoryFilter.js      - Category filter
    /RelatedPosts.js        - Related posts section

/utils
  /firebase.js              - Firebase initialization (updated)
  /blogService.js           - Firestore blog operations
  /storageService.js        - Firebase Storage operations
  /authService.js           - Admin authentication
  /slugify.js               - URL slug generation
  /seoHelpers.js            - SEO metadata generation

/lib/constants
  /blogConfig.js            - Blog configuration

middleware.js               - Admin route protection
```

## 🎨 Customization

### Update Blog Categories

Edit `/lib/constants/blogConfig.js`:

```javascript
export const BLOG_CATEGORIES = [
  {
    name: 'Your Category',
    slug: 'your-category',
    description: 'Category description',
    color: '#HEX_COLOR',
  },
  // Add more categories...
];
```

### Update Site URL

Update the base URL in:
- `/lib/constants/blogConfig.js` - `SITE_URL`
- `/app/sitemap.js` - `baseUrl`

### Customize Styling

Blog components use Tailwind CSS with your existing theme:
- Purple (#6A1B9A) to Indigo (#3949AB) gradients
- Glassmorphism effects (backdrop-blur, transparent backgrounds)
- Existing animation patterns (Framer Motion)

All styling can be customized in the component files.

## 🤖 AI Content Generation (Optional)

The AI generation endpoint is a placeholder. To integrate:

### Using Anthropic Claude API

1. Install SDK:
```bash
npm install @anthropic-ai/sdk
```

2. Add API key to `.env.local`:
```
ANTHROPIC_API_KEY=your_api_key_here
```

3. Update `/app/api/blog/generate/route.js`:
```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const response = await anthropic.messages.create({
  model: 'claude-3-opus-20240229',
  max_tokens: 4096,
  messages: [{
    role: 'user',
    content: generateAIPrompt(topic, keywords, targetLength, category)
  }],
});

const generatedContent = response.content[0].text;
```

### Using OpenAI

Similar process with `openai` npm package and GPT-4.

## 🔧 Troubleshooting

### Issue: Can't access admin panel

- **Solution**: Check that middleware.js is protecting `/admin/*` routes
- Verify admin password is set correctly in Firestore
- Clear browser cookies and try again

### Issue: Images not uploading

- **Solution**: Verify Firebase Storage is enabled
- Check Firebase Storage rules allow writes
- Ensure file size is under 5MB

### Issue: Blog posts not appearing

- **Solution**: Check post status is "published"
- Verify Firestore security rules allow reads
- Check browser console for errors

### Issue: React Quill not loading

- **Solution**: Ensure `react-quill` is installed
- Check that dynamic import is working (SSR disabled)
- Try clearing `.next` folder and rebuilding

## 📊 SEO Optimization

The blog is SEO-optimized with:

- ✅ Dynamic metadata for all pages
- ✅ Open Graph tags for social sharing
- ✅ BlogPosting structured data (schema.org)
- ✅ Dynamic sitemap including all posts
- ✅ Semantic HTML structure
- ✅ Breadcrumb navigation
- ✅ Alt text for images
- ✅ Reading time calculation
- ✅ Related posts for internal linking

### Verify SEO

1. Test structured data: [Google Rich Results Test](https://search.google.com/test/rich-results)
2. Check sitemap: `http://localhost:3000/sitemap.xml`
3. Run Lighthouse audit in Chrome DevTools

## 🚀 Deployment

### Before Deploying

1. ✅ Set production admin password
2. ✅ Update `SITE_URL` in `blogConfig.js`
3. ✅ Update `baseUrl` in `sitemap.js`
4. ✅ Test all admin functions
5. ✅ Create at least 3-5 sample posts
6. ✅ Verify Firebase security rules
7. ✅ Test on mobile devices

### Deploy to Vercel

The blog uses:
- Server Components (for SEO)
- ISR (Incremental Static Regeneration) with 60s revalidation
- Static generation for blog posts

Vercel will automatically handle the build and deployment.

## 📝 Creating Great Blog Posts

### Best Practices

1. **Title**: 50-60 characters, keyword-rich
2. **Excerpt**: 140-160 characters, compelling summary
3. **Content**: 1000-2000 words, well-structured with headings
4. **Images**: High-quality, optimized, with alt text
5. **Categories**: 1-2 relevant categories
6. **Tags**: 3-5 specific tags
7. **SEO**: Unique meta title and description

### Markdown Tips

```markdown
# Main Heading (H1)
## Section Heading (H2)
### Subsection (H3)

**Bold text**
*Italic text*

- Bullet point
1. Numbered list

[Link text](https://url.com)

![Alt text](image-url.jpg)

> Blockquote for emphasis

`Inline code`

\`\`\`
Code block
\`\`\`
```

## 🎯 Next Steps

1. ✅ Install dependencies
2. ✅ Set up Firebase collections
3. ✅ Set admin password
4. ✅ Create first blog post
5. ✅ Test on mobile
6. ✅ Deploy to production
7. ✅ Submit sitemap to Google Search Console
8. ✅ (Optional) Integrate AI content generation

## 📞 Support

If you encounter issues:
1. Check this documentation
2. Review Firebase Console for errors
3. Check browser console for JavaScript errors
4. Verify all environment variables are set

---

**Happy Blogging! 📝✨**

Transform your LoA landing page with powerful, SEO-optimized blog content.
