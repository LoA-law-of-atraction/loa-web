import {
  getPostBySlug,
  getAllPublishedSlugs,
  getRelatedPosts,
} from "@/utils/blogService";
import {
  generatePostMetadata,
  generateBlogPostingSchema,
  generateBreadcrumbSchema,
  formatDate,
  calculateReadingTime,
} from "@/utils/seoHelpers";
import { BLOG_CONFIG, BLOG_CATEGORIES } from "@/lib/constants/blogConfig";
import BlogPostContent from "@/components/blog/BlogPostContent";
import RelatedPosts from "@/components/blog/RelatedPosts";
import { notFound } from "next/navigation";
import Link from "next/link";

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs();
  return slugs.map((item) => ({
    slug: item.slug,
  }));
}

export async function generateMetadata({ params }) {
  const post = await getPostBySlug(params.slug);
  if (!post) return {};
  return generatePostMetadata(post, BLOG_CONFIG.SITE_URL);
}

export default async function BlogPostPage({ params }) {
  const post = await getPostBySlug(params.slug);

  if (!post || post.status !== "published") {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(
    post.categories,
    post.id,
    BLOG_CONFIG.RELATED_POSTS_COUNT,
  );

  const readingTime = calculateReadingTime(post.content);
  const category = BLOG_CATEGORIES.find((c) => c.slug === post.categories?.[0]);

  const blogPostingSchema = generateBlogPostingSchema(
    post,
    BLOG_CONFIG.SITE_URL,
  );
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: BLOG_CONFIG.SITE_URL },
    { name: "Blog", url: `${BLOG_CONFIG.SITE_URL}/blog` },
    { name: post.title, url: `${BLOG_CONFIG.SITE_URL}/blog/${post.slug}` },
  ]);

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <article className="min-h-screen bg-white pt-32 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Breadcrumbs */}
          <nav className="text-sm text-gray-400 mb-8">
            <Link href="/" className="hover:text-gray-600 transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link
              href="/blog"
              className="hover:text-gray-600 transition-colors"
            >
              Blog
            </Link>
          </nav>

          {/* Category */}
          {category && (
            <div className="mb-4">
              <a
                href={`/blog?category=${category.slug}`}
                className="text-purple-600 text-sm font-medium hover:underline"
              >
                {category.name}
              </a>
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 text-gray-500 text-sm mb-8 pb-8 border-b border-gray-100">
            <span>{post.author?.name || "LoA Team"}</span>
            <span>·</span>
            <time dateTime={post.publishedAt?.toISOString()}>
              {formatDate(post.publishedAt || post.createdAt, "long")}
            </time>
            <span>·</span>
            <span>{readingTime} min read</span>
          </div>

          {/* Featured Image - handle both string URL and object format */}
          {(post.featuredImage?.url || typeof post.featuredImage === "string") && (
            <div className="mb-10 rounded-lg overflow-hidden">
              <img
                src={typeof post.featuredImage === "string" ? post.featuredImage : post.featuredImage.url}
                alt={typeof post.featuredImage === "string" ? post.title : (post.featuredImage.alt || post.title)}
                className="w-full h-auto"
                width={post.featuredImage?.width || 1200}
                height={post.featuredImage?.height || 630}
              />
            </div>
          )}

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* Content */}
          <BlogPostContent content={post.content} />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-100">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <a
                    key={tag}
                    href={`/blog?tag=${tag}`}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-600 transition-colors"
                  >
                    {tag}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Author Bio */}
          {post.author?.bio && (
            <div className="mt-12 p-6 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Written by</p>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {post.author.name}
              </h3>
              <p className="text-gray-600">{post.author.bio}</p>
            </div>
          )}

          {/* Related Posts */}
          {relatedPosts.length > 0 && <RelatedPosts posts={relatedPosts} />}

          {/* Back to Blog */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              All posts
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 60; // Revalidate every 60 seconds
