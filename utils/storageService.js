import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload an image to Firebase Storage
 * @param {File} file - The image file to upload
 * @param {string} folder - The folder to upload to (e.g., 'blog', 'avatars')
 * @returns {Promise<{url: string, path: string}>} - The download URL and storage path
 */
export async function uploadImage(file, folder = 'blog') {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 5MB.');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 9);
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}-${randomString}.${extension}`;
    const path = `${folder}/${filename}`;

    // Create storage reference
    const storageRef = ref(storage, path);

    // Upload file
    await uploadBytes(storageRef, file);

    // Get download URL
    const url = await getDownloadURL(storageRef);

    return {
      url,
      path,
      filename,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Delete an image from Firebase Storage
 * @param {string} path - The storage path of the image
 * @returns {Promise<void>}
 */
export async function deleteImage(path) {
  try {
    if (!path) {
      throw new Error('No path provided');
    }

    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    // Ignore if file doesn't exist
    if (error.code === 'storage/object-not-found') {
      console.warn('File not found, skipping deletion:', path);
      return;
    }
    console.error('Error deleting image:', error);
    throw error;
  }
}

/**
 * Upload multiple images
 * @param {File[]} files - Array of image files
 * @param {string} folder - The folder to upload to
 * @returns {Promise<Array<{url: string, path: string}>>}
 */
export async function uploadMultipleImages(files, folder = 'blog') {
  try {
    const uploadPromises = files.map(file => uploadImage(file, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
}

/**
 * Get image dimensions
 * @param {File} file - The image file
 * @returns {Promise<{width: number, height: number}>}
 */
export function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}
