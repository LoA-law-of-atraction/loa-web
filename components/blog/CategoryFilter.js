"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { BLOG_CATEGORIES } from "@/lib/constants/blogConfig";

export default function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");

  const handleCategoryChange = (categorySlug) => {
    if (categorySlug === currentCategory) {
      router.push("/blog");
    } else {
      router.push(`/blog?category=${categorySlug}`);
    }
  };

  return (
    <div className="mb-8 pb-6 border-b border-gray-100">
      <div className="flex flex-wrap gap-2">
        {/* All Posts */}
        <button
          onClick={() => router.push("/blog")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !currentCategory
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All
        </button>

        {/* Category Filters */}
        {BLOG_CATEGORIES.map((category) => {
          const isActive = currentCategory === category.slug;
          return (
            <button
              key={category.slug}
              onClick={() => handleCategoryChange(category.slug)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
