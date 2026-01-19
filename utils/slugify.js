/**
 * Convert a string to a URL-friendly slug
 * @param {string} text - The text to slugify
 * @returns {string} - URL-friendly slug
 */
export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

/**
 * Generate a unique slug by appending a number if needed
 * @param {string} baseSlug - The base slug
 * @param {Function} checkExists - Async function to check if slug exists
 * @returns {Promise<string>} - Unique slug
 */
export async function generateUniqueSlug(baseSlug, checkExists) {
  let slug = slugify(baseSlug);
  let counter = 1;

  while (await checkExists(slug)) {
    slug = `${slugify(baseSlug)}-${counter}`;
    counter++;
  }

  return slug;
}
