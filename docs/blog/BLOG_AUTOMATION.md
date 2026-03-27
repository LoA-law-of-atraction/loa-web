# Blog Automation Guide

This document explains how to programmatically create and manage blog posts for the LoA website.

## Overview

Blog posts are stored in **Firebase Firestore** under the `blog_posts` collection. You can create posts via:

1. Firebase Admin SDK (recommended for automation)
2. Direct Firestore client SDK (requires auth)
3. REST API endpoints

---

## Blog Post Schema

```javascript
{
  // Required
  title: string,           // Post title
  content: string,         // Post content (Markdown supported)
  slug: string,            // URL-friendly slug (auto-generated from title)

  // Optional (with defaults)
  excerpt: string,         // Short description (default: first 160 chars of content)
  status: "draft" | "published",  // (default: "draft")

  // Media
  featuredImage: {
    url: string,           // Image URL
    alt: string,           // Alt text
    width: number,         // Image width
    height: number         // Image height
  } | null,

  // Categorization
  categories: string[],    // e.g., ["manifestation", "mindset"]
  tags: string[],          // e.g., ["law-of-attraction", "visualization"]
  keywords: string[],      // SEO keywords

  // Author
  author: {
    name: string,          // e.g., "LoA Team"
    avatar: string,        // Avatar URL
    bio: string            // Short bio
  },

  // SEO
  metaTitle: string,       // SEO title (default: title)
  metaDescription: string, // SEO description (default: excerpt)

  // AI Generation metadata (optional)
  aiGenerated: boolean,    // Was this AI-generated?
  aiPrompt: string,        // The prompt used
  aiModel: string,         // e.g., "gpt-4", "claude-3"

  // Timestamps (auto-managed)
  createdAt: Timestamp,
  updatedAt: Timestamp,
  publishedAt: Timestamp | null,  // Set when status = "published"

  // Stats (auto-managed)
  views: number,
  likes: number
}
```

---

## Method 1: Firebase Admin SDK (Recommended)

Best for server-side automation, cron jobs, or CI/CD pipelines.

### Setup

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the JSON file securely

### Install Dependencies

```bash
npm install firebase-admin
```

### Example: Create a Post

```javascript
const admin = require("firebase-admin");

// Initialize with service account
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();

async function createBlogPost(postData) {
  const { title, content, status = "draft", ...rest } = postData;

  // Generate slug from title
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // Check for duplicate slug
  const existing = await db
    .collection("blog_posts")
    .where("slug", "==", slug)
    .get();

  const finalSlug = existing.empty ? slug : `${slug}-${Date.now()}`;

  const post = {
    title,
    content,
    slug: finalSlug,
    excerpt: rest.excerpt || content.substring(0, 160),
    status,
    featuredImage: rest.featuredImage || null,
    categories: rest.categories || [],
    tags: rest.tags || [],
    keywords: rest.keywords || [],
    author: rest.author || {
      name: "LoA Team",
      avatar: "/icons/logo.svg",
      bio: "The Law of Attraction App Team",
    },
    metaTitle: rest.metaTitle || title,
    metaDescription:
      rest.metaDescription || rest.excerpt || content.substring(0, 160),
    aiGenerated: rest.aiGenerated || false,
    aiPrompt: rest.aiPrompt || null,
    aiModel: rest.aiModel || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    publishedAt:
      status === "published"
        ? admin.firestore.FieldValue.serverTimestamp()
        : null,
    views: 0,
    likes: 0,
  };

  const docRef = await db.collection("blog_posts").add(post);

  return { id: docRef.id, ...post };
}

// Usage
createBlogPost({
  title: "How to Manifest Your Dreams",
  content: "# Introduction\n\nManifestation is the practice of...",
  status: "draft",
  categories: ["manifestation"],
  tags: ["beginner", "visualization"],
  aiGenerated: true,
  aiModel: "gpt-4",
  aiPrompt: "Write a beginner guide to manifestation",
});
```

### Example: Update a Post

```javascript
async function updateBlogPost(postId, updates) {
  const postRef = db.collection("blog_posts").doc(postId);

  await postRef.update({
    ...updates,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    // If publishing, set publishedAt
    ...(updates.status === "published" && {
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
    }),
  });

  return { id: postId, ...updates };
}

// Publish a draft
updateBlogPost("abc123", { status: "published" });
```

### Example: Bulk Create Posts

```javascript
async function bulkCreatePosts(posts) {
  const batch = db.batch();
  const results = [];

  for (const postData of posts) {
    const docRef = db.collection("blog_posts").doc();
    const slug = postData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const post = {
      ...postData,
      slug: `${slug}-${docRef.id.slice(0, 6)}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      publishedAt:
        postData.status === "published"
          ? admin.firestore.FieldValue.serverTimestamp()
          : null,
      views: 0,
      likes: 0,
    };

    batch.set(docRef, post);
    results.push({ id: docRef.id, ...post });
  }

  await batch.commit();
  return results;
}
```

---

## Method 2: REST API

Use the existing API endpoints (requires admin session cookie).

### Create Post

```bash
POST /api/blog/posts
Content-Type: application/json
Cookie: admin_session=<session_token>

{
  "title": "My New Post",
  "content": "Post content here...",
  "status": "draft",
  "categories": ["manifestation"]
}
```

### Update Post

```bash
PUT /api/blog/posts/{postId}
Content-Type: application/json
Cookie: admin_session=<session_token>

{
  "title": "Updated Title",
  "status": "published"
}
```

### Get Posts

```bash
GET /api/blog/posts?status=draft&limit=10&page=1
```

---

## Method 3: Direct Firestore (Client SDK)

For browser-based automation tools. Requires Firebase Auth.

```javascript
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/utils/firebase";

async function createPost(postData) {
  const docRef = await addDoc(collection(db, "blog_posts"), {
    ...postData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    publishedAt: postData.status === "published" ? Timestamp.now() : null,
    views: 0,
    likes: 0,
  });

  return docRef.id;
}
```

---

## Image Uploads

Images should be uploaded to Firebase Storage before creating posts.

### Upload via API

```bash
POST /api/blog/upload
Content-Type: multipart/form-data
Cookie: admin_session=<session_token>

image: <file>
alt: "Image description"
```

Response:

```json
{
  "url": "https://firebasestorage.googleapis.com/...",
  "alt": "Image description",
  "width": 1200,
  "height": 630
}
```

### Upload via Admin SDK

```javascript
const { getStorage } = require("firebase-admin/storage");

async function uploadImage(buffer, filename) {
  const bucket = getStorage().bucket();
  const file = bucket.file(`blog/${Date.now()}-${filename}`);

  await file.save(buffer, {
    metadata: { contentType: "image/jpeg" },
  });

  await file.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${file.name}`;
}
```

---

## Automation Examples

### Scheduled Publishing

Create as draft, then publish later:

```javascript
// Create draft with scheduled publish date in metadata
await createBlogPost({
  title: "Scheduled Post",
  content: "...",
  status: "draft",
  scheduledPublishAt: new Date("2026-02-01T09:00:00Z"),
});

// Cron job to publish scheduled posts
async function publishScheduledPosts() {
  const now = new Date();
  const posts = await db
    .collection("blog_posts")
    .where("status", "==", "draft")
    .where("scheduledPublishAt", "<=", now)
    .get();

  for (const doc of posts.docs) {
    await doc.ref.update({
      status: "published",
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}
```

### AI Content Pipeline

```javascript
async function generateAndCreatePost(topic) {
  // 1. Generate content with AI
  const aiResponse = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are a Law of Attraction expert..." },
      { role: "user", content: `Write a blog post about: ${topic}` },
    ],
  });

  const content = aiResponse.choices[0].message.content;

  // 2. Generate title
  const titleResponse = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: `Generate a title for: ${content.slice(0, 500)}`,
      },
    ],
  });

  const title = titleResponse.choices[0].message.content;

  // 3. Create draft post
  const post = await createBlogPost({
    title,
    content,
    status: "draft", // Review before publishing
    aiGenerated: true,
    aiModel: "gpt-4",
    aiPrompt: topic,
    categories: ["manifestation"], // Or use AI to categorize
  });

  return post;
}
```

---

## Environment Variables

For automation scripts, you'll need:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Optional: OpenAI for AI content
OPENAI_API_KEY=sk-...
```

---

## Firestore Security Rules

Current rules require authentication for writes:

```javascript
match /blog_posts/{postId} {
  allow read: if true;
  allow write: if request.auth != null;
}
```

**Note:** Firebase Admin SDK bypasses these rules, so automation scripts using Admin SDK don't need user authentication.

---

## Best Practices

1. **Always create as draft first** - Review before publishing
2. **Generate unique slugs** - Append timestamp or ID if duplicate
3. **Validate content** - Ensure title and content are not empty
4. **Track AI-generated content** - Set `aiGenerated: true` for compliance
5. **Batch operations** - Use Firestore batches for bulk creates (max 500 per batch)
6. **Error handling** - Implement retries for network failures
7. **Rate limiting** - Firestore has limits; don't create thousands of posts per second

---

## Support

Questions? Contact the development team or check the Firebase documentation:

- [Firestore Admin SDK](https://firebase.google.com/docs/firestore/quickstart#node.js)
- [Firebase Storage](https://firebase.google.com/docs/storage/admin/start)
