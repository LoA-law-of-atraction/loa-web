"use client";

import { SEO_LIMITS } from "@/lib/constants/blogConfig";

export default function PostMetadataForm({ post, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...post, [field]: value });
  };

  const titleLength = post.metaTitle?.length || post.title?.length || 0;
  const descLength = post.metaDescription?.length || post.excerpt?.length || 0;

  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Title
        </label>
        <input
          type="text"
          value={post.title || ""}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Enter post title..."
          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          required
        />
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Excerpt
          <span className="text-gray-400 text-xs ml-2">
            ({post.excerpt?.length || 0}/{SEO_LIMITS.DESCRIPTION_MAX})
          </span>
        </label>
        <textarea
          value={post.excerpt || ""}
          onChange={(e) => handleChange("excerpt", e.target.value)}
          placeholder="Brief summary of the post..."
          rows={3}
          maxLength={SEO_LIMITS.DESCRIPTION_MAX}
          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
        />
      </div>

      {/* SEO Section */}
      <div className="border-t border-gray-100 pt-5">
        <h3 className="text-sm font-medium text-gray-500 mb-4">SEO Settings</h3>

        {/* Meta Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Meta Title
            <span
              className={`text-xs ml-2 ${titleLength > SEO_LIMITS.TITLE_MAX ? "text-red-500" : "text-gray-400"}`}
            >
              ({titleLength}/{SEO_LIMITS.TITLE_MAX})
            </span>
          </label>
          <input
            type="text"
            value={post.metaTitle || ""}
            onChange={(e) => handleChange("metaTitle", e.target.value)}
            placeholder={post.title || "Defaults to post title..."}
            maxLength={60}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        {/* Meta Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Meta Description
            <span
              className={`text-xs ml-2 ${descLength > SEO_LIMITS.DESCRIPTION_MAX ? "text-red-500" : "text-gray-400"}`}
            >
              ({descLength}/{SEO_LIMITS.DESCRIPTION_MAX})
            </span>
          </label>
          <textarea
            value={post.metaDescription || ""}
            onChange={(e) => handleChange("metaDescription", e.target.value)}
            placeholder={post.excerpt || "Defaults to excerpt..."}
            rows={2}
            maxLength={SEO_LIMITS.DESCRIPTION_MAX}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
          />
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Keywords
            <span className="text-gray-400 text-xs ml-2">
              (comma-separated)
            </span>
          </label>
          <input
            type="text"
            value={post.keywords?.join(", ") || ""}
            onChange={(e) => {
              const keywords = e.target.value
                .split(",")
                .map((k) => k.trim())
                .filter((k) => k);
              handleChange("keywords", keywords);
            }}
            placeholder="law of attraction, manifestation, mindfulness..."
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
      </div>

      {/* Author Section */}
      <div className="border-t border-gray-100 pt-5">
        <h3 className="text-sm font-medium text-gray-500 mb-4">
          Author Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Author Name
            </label>
            <input
              type="text"
              value={post.author?.name || ""}
              onChange={(e) =>
                handleChange("author", { ...post.author, name: e.target.value })
              }
              placeholder="LoA Team"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Author Bio
            </label>
            <input
              type="text"
              value={post.author?.bio || ""}
              onChange={(e) =>
                handleChange("author", { ...post.author, bio: e.target.value })
              }
              placeholder="Short bio..."
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
