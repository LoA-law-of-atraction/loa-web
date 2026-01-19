"use client";

import { formatDate } from "@/utils/seoHelpers";
import { BLOG_CATEGORIES } from "@/lib/constants/blogConfig";

export default function RelatedPosts({ posts }) {
  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 pt-12 border-t border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Related Posts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.slice(0, 2).map((post) => {
          const category = BLOG_CATEGORIES.find(
            (c) => c.slug === post.categories?.[0],
          );

          return (
            <article key={post.id} className="group">
              <a href={`/blog/${post.slug}`} className="block">
                {/* Featured Image */}
                {post.featuredImage?.url && (
                  <div className="mb-3 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={post.featuredImage.url}
                      alt={post.featuredImage.alt || post.title}
                      className="w-full h-40 object-cover"
                    />
                  </div>
                )}

                {/* Category */}
                {category && (
                  <p className="text-purple-600 text-sm font-medium mb-1">
                    {category.name}
                  </p>
                )}

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors line-clamp-2">
                  {post.title}
                </h3>

                {/* Date */}
                <p className="text-sm text-gray-400">
                  {formatDate(post.publishedAt || post.createdAt, "short")}
                </p>
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}
