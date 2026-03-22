/**
 * Generate BreadcrumbList structured data
 * @param {Array} breadcrumbs - Array of breadcrumb items [{name, url}]
 * @returns {object} - Structured data object
 */
export function generateBreadcrumbSchema(breadcrumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

/**
 * Format date for display
 * @param {Date} date - Date object
 * @param {string} format - Format type ('short', 'long', 'relative')
 * @returns {string} - Formatted date string
 */
export function formatDate(date, format = 'long') {
  if (!date) return '';

  const dateObj = date instanceof Date ? date : new Date(date);

  if (format === 'short') {
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  if (format === 'long') {
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  if (format === 'relative') {
    const now = new Date();
    const diffMs = now - dateObj;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  return dateObj.toLocaleDateString();
}

/**
 * Calculate reading time for content
 * @param {string} content - Markdown or text content
 * @param {number} wordsPerMinute - Average reading speed
 * @returns {number} - Reading time in minutes
 */
export function calculateReadingTime(content, wordsPerMinute = 200) {
  if (!content) return 0;

  // Remove markdown syntax for accurate word count
  const text = content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]*`/g, '')         // Remove inline code
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Keep link text
    .replace(/#+ /g, '')              // Remove heading markers
    .replace(/[*_~]/g, '');          // Remove emphasis markers

  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);

  return Math.max(1, minutes); // At least 1 minute
}
