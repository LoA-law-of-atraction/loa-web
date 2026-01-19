/**
 * Generate BlogPosting structured data for individual blog posts
 * @param {object} post - Blog post data
 * @param {string} siteUrl - Base URL of the site
 * @returns {object} - Structured data object
 */
export function generateBlogPostingSchema(post, siteUrl = 'https://loa.vercel.app') {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.metaDescription,
    image: post.featuredImage?.url || `${siteUrl}/og-image.jpg`,
    datePublished: post.publishedAt?.toISOString() || post.createdAt?.toISOString(),
    dateModified: post.updatedAt?.toISOString() || post.createdAt?.toISOString(),
    author: {
      '@type': post.author?.name ? 'Person' : 'Organization',
      name: post.author?.name || 'LoA Team',
      ...(post.author?.bio && { description: post.author.bio }),
      ...(post.author?.avatar && { image: post.author.avatar }),
    },
    publisher: {
      '@type': 'Organization',
      name: 'LoA',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${post.slug}`,
    },
    keywords: post.keywords?.join(', ') || post.tags?.join(', ') || '',
    articleSection: post.categories?.[0] || 'Uncategorized',
  };
}

/**
 * Generate Blog structured data for blog list page
 * @param {string} siteUrl - Base URL of the site
 * @returns {object} - Structured data object
 */
export function generateBlogSchema(siteUrl = 'https://loa.vercel.app') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'LoA Blog',
    description: 'Insights on Law of Attraction, manifestation, mindfulness, and conscious digital living',
    url: `${siteUrl}/blog`,
    publisher: {
      '@type': 'Organization',
      name: 'LoA',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
  };
}

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
 * Generate metadata for blog post page
 * @param {object} post - Blog post data
 * @param {string} siteUrl - Base URL of the site
 * @returns {object} - Next.js metadata object
 */
export function generatePostMetadata(post, siteUrl = 'https://loa.vercel.app') {
  const title = post.metaTitle || `${post.title} - LoA Blog`;
  const description = post.metaDescription || post.excerpt;
  const image = post.featuredImage?.url || `${siteUrl}/og-image.jpg`;
  const url = `${siteUrl}/blog/${post.slug}`;

  return {
    title,
    description,
    keywords: post.keywords?.join(', ') || post.tags?.join(', '),
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
      authors: [post.author?.name || 'LoA Team'],
      tags: post.tags || [],
      images: [
        {
          url: image,
          width: post.featuredImage?.width || 1200,
          height: post.featuredImage?.height || 630,
          alt: post.featuredImage?.alt || post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: url,
    },
  };
}

/**
 * Generate metadata for blog list page
 * @param {string} category - Optional category filter
 * @param {number} page - Page number
 * @param {string} siteUrl - Base URL of the site
 * @returns {object} - Next.js metadata object
 */
export function generateBlogListMetadata(category = null, page = 1, siteUrl = 'https://loa.vercel.app') {
  const title = category
    ? `${category} Articles${page > 1 ? ` - Page ${page}` : ''} - LoA Blog`
    : `Law of Attraction Blog${page > 1 ? ` - Page ${page}` : ''} - LoA`;

  const description = category
    ? `Explore ${category} articles on Law of Attraction, manifestation, and conscious living`
    : 'Discover insights on manifestation, mindfulness, and conscious digital living with the Law of Attraction';

  const url = category
    ? `${siteUrl}/blog?category=${category}${page > 1 ? `&page=${page}` : ''}`
    : `${siteUrl}/blog${page > 1 ? `?page=${page}` : ''}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: [
        {
          url: `${siteUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: 'LoA Blog',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/og-image.jpg`],
    },
    alternates: {
      canonical: url,
    },
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
