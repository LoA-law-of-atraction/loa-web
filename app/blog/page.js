import { getBlogPosts } from "@/utils/blogService";
import {
  generateBlogListMetadata,
  generateBlogSchema,
} from "@/utils/seoHelpers";
import { BLOG_CONFIG } from "@/lib/constants/blogConfig";
import BlogCard from "@/components/blog/BlogCard";
import CategoryFilter from "@/components/blog/CategoryFilter";

export async function generateMetadata({ searchParams }) {
  const category = searchParams?.category || null;
  const page = parseInt(searchParams?.page || "1");
  return generateBlogListMetadata(category, page, BLOG_CONFIG.SITE_URL);
}

export default async function BlogPage({ searchParams }) {
  const category = searchParams?.category || null;
  const page = parseInt(searchParams?.page || "1");

  const { posts } = await getBlogPosts({
    status: "published",
    category,
    page,
    postsPerPage: BLOG_CONFIG.POSTS_PER_PAGE,
  });

  const blogSchema = generateBlogSchema(BLOG_CONFIG.SITE_URL);

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />

      <div className="min-h-screen bg-white pt-32 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              Blog
            </h1>
            <p className="text-lg text-gray-500">
              Insights on manifestation, mindfulness, and conscious living
            </p>
          </div>

          {/* Category Filter */}
          <CategoryFilter />

          {/* Blog Posts List */}
          {posts && posts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {posts.map((post, index) => (
                <BlogCard key={post.id} post={post} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No posts yet
              </h3>
              <p className="text-gray-500">
                {category
                  ? "No posts in this category. Try a different one."
                  : "Check back soon for new content."}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 60; // Revalidate every 60 seconds
