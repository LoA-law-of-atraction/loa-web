/**
 * Server-side Blog Service using Firebase Admin SDK
 * This bypasses Firestore security rules for server-to-server operations
 */

import { adminDb } from "./firebaseAdmin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { slugify, generateUniqueSlug } from "./slugify";

const POSTS_COLLECTION = "blog_posts";
const CATEGORIES_COLLECTION = "blog_categories";
const CONFIG_COLLECTION = "blog_config";

/**
 * Check if a slug already exists (Admin version)
 */
async function slugExistsAdmin(slug, excludeId = null) {
  const snapshot = await adminDb
    .collection(POSTS_COLLECTION)
    .where("slug", "==", slug)
    .get();

  if (excludeId) {
    return snapshot.docs.some((doc) => doc.id !== excludeId);
  }

  return !snapshot.empty;
}

/**
 * Get all blog posts with pagination (Admin version)
 */
export async function getBlogPostsAdmin({
  status = "published",
  category = null,
  page = 1,
  postsPerPage = 9,
  lastDoc = null,
} = {}) {
  try {
    let query = adminDb.collection(POSTS_COLLECTION);

    if (status) {
      query = query.where("status", "==", status);
    }

    if (category) {
      query = query.where("categories", "array-contains", category);
    }

    query = query.orderBy("publishedAt", "desc").limit(postsPerPage);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();

    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      publishedAt: doc.data().publishedAt?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }));

    return {
      posts,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore: snapshot.docs.length === postsPerPage,
    };
  } catch (error) {
    console.error("Error fetching blog posts (Admin):", error);
    throw error;
  }
}

/**
 * Get a single blog post by slug (Admin version)
 */
export async function getPostBySlugAdmin(slug) {
  try {
    const snapshot = await adminDb
      .collection(POSTS_COLLECTION)
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      publishedAt: doc.data().publishedAt?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    };
  } catch (error) {
    console.error("Error fetching post by slug (Admin):", error);
    throw error;
  }
}

/**
 * Get a single blog post by ID (Admin version)
 */
export async function getPostByIdAdmin(id) {
  try {
    const doc = await adminDb.collection(POSTS_COLLECTION).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
      publishedAt: doc.data().publishedAt?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    };
  } catch (error) {
    console.error("Error fetching post by ID (Admin):", error);
    throw error;
  }
}

/**
 * Create a new blog post (Admin version)
 */
export async function createPostAdmin(postData) {
  try {
    const slug = await generateUniqueSlug(postData.title, slugExistsAdmin);

    const now = Timestamp.now();
    const newPost = {
      ...postData,
      slug,
      status: postData.status || "draft",
      publishedAt: postData.status === "published" ? now : null,
      createdAt: now,
      updatedAt: now,
      views: 0,
      likes: 0,
    };

    const docRef = await adminDb.collection(POSTS_COLLECTION).add(newPost);

    return {
      id: docRef.id,
      ...newPost,
      publishedAt: newPost.publishedAt?.toDate(),
      createdAt: newPost.createdAt?.toDate(),
      updatedAt: newPost.updatedAt?.toDate(),
    };
  } catch (error) {
    console.error("Error creating post (Admin):", error);
    throw error;
  }
}

/**
 * Update an existing blog post (Admin version)
 */
export async function updatePostAdmin(id, postData) {
  try {
    const docRef = adminDb.collection(POSTS_COLLECTION).doc(id);

    let updates = { ...postData };

    // If title changed, regenerate slug
    if (postData.title) {
      const currentPost = await getPostByIdAdmin(id);
      if (currentPost && currentPost.title !== postData.title) {
        updates.slug = await generateUniqueSlug(postData.title, (slug) =>
          slugExistsAdmin(slug, id),
        );
      }
    }

    // Update publishedAt if status changed to published
    if (postData.status === "published") {
      const currentPost = await getPostByIdAdmin(id);
      if (currentPost && currentPost.status !== "published") {
        updates.publishedAt = Timestamp.now();
      }
    }

    updates.updatedAt = Timestamp.now();

    await docRef.update(updates);

    return {
      id,
      ...updates,
      updatedAt: updates.updatedAt?.toDate(),
    };
  } catch (error) {
    console.error("Error updating post (Admin):", error);
    throw error;
  }
}

/**
 * Delete a blog post (Admin version)
 */
export async function deletePostAdmin(id) {
  try {
    await adminDb.collection(POSTS_COLLECTION).doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error("Error deleting post (Admin):", error);
    throw error;
  }
}

/**
 * Get all published slugs (Admin version)
 */
export async function getAllPublishedSlugsAdmin() {
  try {
    const snapshot = await adminDb
      .collection(POSTS_COLLECTION)
      .where("status", "==", "published")
      .get();

    return snapshot.docs.map((doc) => ({
      slug: doc.data().slug,
    }));
  } catch (error) {
    console.error("Error fetching slugs (Admin):", error);
    throw error;
  }
}

/**
 * Get related posts by categories (Admin version)
 */
export async function getRelatedPostsAdmin(
  categories,
  currentPostId,
  limitCount = 3,
) {
  try {
    if (!categories || categories.length === 0) {
      return [];
    }

    const snapshot = await adminDb
      .collection(POSTS_COLLECTION)
      .where("status", "==", "published")
      .where("categories", "array-contains-any", categories)
      .orderBy("publishedAt", "desc")
      .limit(limitCount + 1)
      .get();

    const posts = snapshot.docs
      .filter((doc) => doc.id !== currentPostId)
      .slice(0, limitCount)
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        publishedAt: doc.data().publishedAt?.toDate(),
      }));

    return posts;
  } catch (error) {
    console.error("Error fetching related posts (Admin):", error);
    throw error;
  }
}

/**
 * Get all categories (Admin version)
 */
export async function getCategoriesAdmin() {
  try {
    const snapshot = await adminDb.collection(CATEGORIES_COLLECTION).get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching categories (Admin):", error);
    throw error;
  }
}
