/**
 * Blog Configuration Constants
 */

export const BLOG_CONFIG = {
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://loa.vercel.app',
  POSTS_PER_PAGE: 9,
  RELATED_POSTS_COUNT: 3,
  EXCERPT_LENGTH: 160,
  READING_WORDS_PER_MINUTE: 200,
};

export const DEFAULT_AUTHOR = {
  name: 'LoA Team',
  bio: 'Bringing Law of Attraction to the digital age',
  avatar: null,
};

export const BLOG_CATEGORIES = [
  {
    name: 'Manifestation',
    slug: 'manifestation',
    description: 'Learn techniques and practices for manifesting your desires',
    color: '#6A1B9A', // Purple
  },
  {
    name: 'Mindfulness',
    slug: 'mindfulness',
    description: 'Develop conscious awareness in your daily life',
    color: '#3949AB', // Indigo
  },
  {
    name: 'Digital Wellness',
    slug: 'digital-wellness',
    description: 'Transform your relationship with technology',
    color: '#8E24AA', // Deep Purple
  },
  {
    name: 'Affirmations',
    slug: 'affirmations',
    description: 'Powerful affirmations to reprogram your mindset',
    color: '#5E35B1', // Deep Purple
  },
  {
    name: 'App Updates',
    slug: 'app-updates',
    description: 'Latest features and updates for the LoA mobile app',
    color: '#1E88E5', // Blue
  },
  {
    name: 'Success Stories',
    slug: 'success-stories',
    description: 'Real stories from our community',
    color: '#43A047', // Green
  },
];

export const POPULAR_TAGS = [
  'law-of-attraction',
  'manifestation',
  'mindfulness',
  'affirmations',
  'visualization',
  'gratitude',
  'meditation',
  'positive-thinking',
  'goal-setting',
  'self-improvement',
  'productivity',
  'habits',
  'digital-detox',
  'app-blocking',
  'conscious-living',
];

export const POST_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  SCHEDULED: 'scheduled',
};

export const IMAGE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  FEATURED_IMAGE_DIMENSIONS: {
    width: 1200,
    height: 630, // OG image standard
  },
};

export const SEO_LIMITS = {
  TITLE_MAX: 60,
  DESCRIPTION_MAX: 160,
  KEYWORDS_MAX: 10,
};
