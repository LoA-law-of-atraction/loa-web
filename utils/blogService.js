import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { slugify, generateUniqueSlug } from './slugify';

const POSTS_COLLECTION = 'blog_posts';
const CATEGORIES_COLLECTION = 'blog_categories';
const CONFIG_COLLECTION = 'blog_config';

/**
 * Check if a slug already exists
 */
async function slugExists(slug, excludeId = null) {
  const q = query(
    collection(db, POSTS_COLLECTION),
    where('slug', '==', slug)
  );
  const snapshot = await getDocs(q);

  if (excludeId) {
    return snapshot.docs.some(doc => doc.id !== excludeId);
  }

  return !snapshot.empty;
}

/**
 * Get all published blog posts with pagination
 */
export async function getBlogPosts({
  status = 'published',
  category = null,
  page = 1,
  postsPerPage = 9,
  lastDoc = null
} = {}) {
  try {
    let q = collection(db, POSTS_COLLECTION);
    const constraints = [];

    if (status) {
      constraints.push(where('status', '==', status));
    }

    if (category) {
      constraints.push(where('categories', 'array-contains', category));
    }

    constraints.push(orderBy('publishedAt', 'desc'));
    constraints.push(limit(postsPerPage));

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    q = query(q, ...constraints);
    const snapshot = await getDocs(q);

    const posts = snapshot.docs.map(doc => ({
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
    console.error('Error fetching blog posts:', error);
    throw error;
  }
}

/**
 * Get a single blog post by slug
 */
export async function getPostBySlug(slug) {
  try {
    const q = query(
      collection(db, POSTS_COLLECTION),
      where('slug', '==', slug),
      limit(1)
    );
    const snapshot = await getDocs(q);

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
    console.error('Error fetching post by slug:', error);
    throw error;
  }
}

/**
 * Get a single blog post by ID
 */
export async function getPostById(id) {
  try {
    const docRef = doc(db, POSTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
      publishedAt: docSnap.data().publishedAt?.toDate(),
      createdAt: docSnap.data().createdAt?.toDate(),
      updatedAt: docSnap.data().updatedAt?.toDate(),
    };
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    throw error;
  }
}

/**
 * Create a new blog post
 */
export async function createPost(postData) {
  try {
    const slug = await generateUniqueSlug(postData.title, slugExists);

    const newPost = {
      ...postData,
      slug,
      status: postData.status || 'draft',
      publishedAt: postData.status === 'published' ? Timestamp.now() : null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      views: 0,
      likes: 0,
    };

    const docRef = await addDoc(collection(db, POSTS_COLLECTION), newPost);

    return {
      id: docRef.id,
      ...newPost,
    };
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
}

/**
 * Update an existing blog post
 */
export async function updatePost(id, postData) {
  try {
    const docRef = doc(db, POSTS_COLLECTION, id);

    // If title changed, regenerate slug
    let updates = { ...postData };
    if (postData.title) {
      const currentPost = await getPostById(id);
      if (currentPost && currentPost.title !== postData.title) {
        updates.slug = await generateUniqueSlug(
          postData.title,
          (slug) => slugExists(slug, id)
        );
      }
    }

    // Update publishedAt if status changed to published
    if (postData.status === 'published') {
      const currentPost = await getPostById(id);
      if (currentPost && currentPost.status !== 'published') {
        updates.publishedAt = Timestamp.now();
      }
    }

    updates.updatedAt = Timestamp.now();

    await updateDoc(docRef, updates);

    return {
      id,
      ...updates,
    };
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
}

/**
 * Delete a blog post
 */
export async function deletePost(id) {
  try {
    const docRef = doc(db, POSTS_COLLECTION, id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

/**
 * Get all published slugs (for static generation)
 */
export async function getAllPublishedSlugs() {
  try {
    const q = query(
      collection(db, POSTS_COLLECTION),
      where('status', '==', 'published')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      slug: doc.data().slug,
    }));
  } catch (error) {
    console.error('Error fetching slugs:', error);
    throw error;
  }
}

/**
 * Get related posts by categories
 */
export async function getRelatedPosts(categories, currentPostId, limitCount = 3) {
  try {
    if (!categories || categories.length === 0) {
      return [];
    }

    const q = query(
      collection(db, POSTS_COLLECTION),
      where('status', '==', 'published'),
      where('categories', 'array-contains-any', categories),
      orderBy('publishedAt', 'desc'),
      limit(limitCount + 1) // Get one extra to filter out current post
    );

    const snapshot = await getDocs(q);

    const posts = snapshot.docs
      .filter(doc => doc.id !== currentPostId)
      .slice(0, limitCount)
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        publishedAt: doc.data().publishedAt?.toDate(),
      }));

    return posts;
  } catch (error) {
    console.error('Error fetching related posts:', error);
    throw error;
  }
}

/**
 * Get all categories
 */
export async function getCategories() {
  try {
    const snapshot = await getDocs(collection(db, CATEGORIES_COLLECTION));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

/**
 * Get blog configuration
 */
export async function getBlogConfig() {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, 'settings');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        postsPerPage: 9,
        defaultAuthor: {
          name: 'LoA Team',
          bio: 'Bringing Law of Attraction to the digital age',
        },
      };
    }

    return docSnap.data();
  } catch (error) {
    console.error('Error fetching blog config:', error);
    throw error;
  }
}
