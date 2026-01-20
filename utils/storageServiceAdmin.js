/**
 * Server-side Storage Service using Firebase Admin SDK
 * For uploading images from URLs (like Fal.ai generated images)
 */

import { getAdminStorage } from "./firebaseAdmin";
import { v4 as uuidv4 } from "uuid";

/**
 * Download an image from URL and upload to Firebase Storage
 * @param {string} imageUrl - The URL of the image to download
 * @param {string} folder - The folder to upload to (e.g., 'blog')
 * @returns {Promise<{url: string, path: string}>} - The permanent Firebase Storage URL
 */
export async function uploadImageFromUrl(imageUrl, folder = "blog") {
  try {
    if (!imageUrl) {
      throw new Error("No image URL provided");
    }

    console.log("[Storage] Starting image upload from URL:", imageUrl);

    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`,
      );
    }

    console.log("[Storage] Image fetched successfully");

    // Get the content type
    const contentType = response.headers.get("content-type") || "image/png";
    console.log("[Storage] Content type:", contentType);

    // Determine file extension
    let extension = "png";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) {
      extension = "jpg";
    } else if (contentType.includes("webp")) {
      extension = "webp";
    } else if (contentType.includes("gif")) {
      extension = "gif";
    }

    // Get image buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const timestamp = Date.now();
    const uniqueId = uuidv4().slice(0, 8);
    const filename = `${timestamp}-${uniqueId}.${extension}`;
    const path = `${folder}/${filename}`;

    // Get Firebase Admin Storage bucket
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const file = bucket.file(path);

    // Upload to Firebase Storage with public read access
    await file.save(buffer, {
      metadata: {
        contentType: contentType,
        metadata: {
          firebaseStorageDownloadTokens: uniqueId,
        },
      },
      public: true, // Make public on upload
    });

    // Try to make file public (may fail if bucket doesn't allow, but we have fallback URL)
    try {
      await file.makePublic();
    } catch (err) {
      // Ignore - we'll use the Firebase download URL format instead
    }

    // Use Firebase Storage download URL format (works even without public access)
    const bucketName = bucket.name;
    const encodedPath = encodeURIComponent(path);
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${uniqueId}`;
    console.log("[Storage] Upload complete! Public URL:", publicUrl);

    return {
      url: publicUrl,
      path,
      filename,
    };
  } catch (error) {
    console.error("Error uploading image from URL:", error);
    throw error;
  }
}

/**
 * Delete an image from Firebase Storage (Admin)
 * @param {string} path - The storage path of the image
 */
export async function deleteImageAdmin(path) {
  try {
    if (!path) {
      return;
    }

    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const file = bucket.file(path);

    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
    }
  } catch (error) {
    console.error("Error deleting image:", error);
  }
}
