"use client";

import { useState } from "react";
import { BLOG_CATEGORIES, POPULAR_TAGS } from "@/lib/constants/blogConfig";

export default function CategoryManager({ post, onChange }) {
  const [customTag, setCustomTag] = useState("");

  const toggleCategory = (categorySlug) => {
    const categories = post.categories || [];
    const newCategories = categories.includes(categorySlug)
      ? categories.filter((c) => c !== categorySlug)
      : [...categories, categorySlug];
    onChange({ ...post, categories: newCategories });
  };

  const toggleTag = (tag) => {
    const tags = post.tags || [];
    const newTags = tags.includes(tag)
      ? tags.filter((t) => t !== tag)
      : [...tags, tag];
    onChange({ ...post, tags: newTags });
  };

  const addCustomTag = () => {
    if (!customTag.trim()) return;
    const tag = customTag.toLowerCase().trim().replace(/\s+/g, "-");
    const tags = post.tags || [];
    if (!tags.includes(tag)) {
      onChange({ ...post, tags: [...tags, tag] });
    }
    setCustomTag("");
  };

  const removeTag = (tag) => {
    const tags = post.tags || [];
    onChange({ ...post, tags: tags.filter((t) => t !== tag) });
  };

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Categories
          <span className="text-gray-400 text-xs ml-2">
            (select one or more)
          </span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {BLOG_CATEGORIES.map((category) => {
            const isSelected = post.categories?.includes(category.slug);
            return (
              <button
                key={category.slug}
                type="button"
                onClick={() => toggleCategory(category.slug)}
                className={`px-3 py-2 rounded-lg border transition-all text-left ${
                  isSelected
                    ? "border-gray-900 bg-gray-100 text-gray-900"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <div className="font-medium text-sm">{category.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Tags
          <span className="text-gray-400 text-xs ml-2">
            (select or add custom)
          </span>
        </label>

        {/* Popular Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {POPULAR_TAGS.map((tag) => {
            const isSelected = post.tags?.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  isSelected
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Custom Tags */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), addCustomTag())
              }
              placeholder="Add custom tag..."
              className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            <button
              type="button"
              onClick={addCustomTag}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
            >
              Add
            </button>
          </div>

          {/* Selected Custom Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-2">Selected Tags:</div>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-700"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
