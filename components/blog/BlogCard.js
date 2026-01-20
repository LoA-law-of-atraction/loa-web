"use client";

import { formatDate, calculateReadingTime } from "@/utils/seoHelpers";
import { BLOG_CATEGORIES } from "@/lib/constants/blogConfig";

export default function BlogCard({ post, index = 0 }) {
  const readingTime = calculateReadingTime(post.content);
  const category = BLOG_CATEGORIES.find((c) => c.slug === post.categories?.[0]);

  return (
    <article className="py-8">
      <a href={`/blog/${post.slug}`} className="block group">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Category & Reading Time */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              {category && (
                <>
                  <span className="text-purple-600 font-medium">
                    {category.name}
                  </span>
                  <span>·</span>
                </>
              )}
              <span>{readingTime} min read</span>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors line-clamp-2">
              {post.title}
            </h2>

            {/* Excerpt */}
            <p className="text-gray-600 line-clamp-2 mb-3">{post.excerpt}</p>

            {/* Date & Author */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{post.author?.name || "LoA Team"}</span>
              <span>·</span>
              <time>
                {formatDate(post.publishedAt || post.createdAt, "short")}
              </time>
            </div>
          </div>

          {/* Thumbnail - handle both string URL and object format */}
          {(post.featuredImage?.url ||
            typeof post.featuredImage === "string") && (
            <div className="sm:w-40 sm:h-28 w-full h-48 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={
                  typeof post.featuredImage === "string"
                    ? post.featuredImage
                    : post.featuredImage.url
                }
                alt={
                  typeof post.featuredImage === "string"
                    ? post.title
                    : post.featuredImage.alt || post.title
                }
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </a>
    </article>
  );
}
