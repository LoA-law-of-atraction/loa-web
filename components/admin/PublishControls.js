"use client";

import { POST_STATUS } from "@/lib/constants/blogConfig";

export default function PublishControls({
  post,
  onChange,
  onSave,
  onPublish,
  saving = false,
}) {
  const isDraft = post.status === POST_STATUS.DRAFT || !post.status;
  const isPublished = post.status === POST_STATUS.PUBLISHED;

  return (
    <div className="border border-gray-200 rounded-lg p-5 sticky top-24 bg-white">
      <h3 className="text-sm font-medium text-gray-500 mb-4">
        Publish Settings
      </h3>

      {/* Status */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...post, status: POST_STATUS.DRAFT })}
            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
              isDraft
                ? "bg-gray-100 border border-gray-300 text-gray-900"
                : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            Draft
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...post, status: POST_STATUS.PUBLISHED })}
            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
              isPublished
                ? "bg-gray-100 border border-gray-300 text-gray-900"
                : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            Published
          </button>
        </div>
      </div>

      {/* Status Info */}
      <div className="mb-6 p-3 bg-gray-50 rounded-lg">
        {isDraft ? (
          <p className="text-sm text-gray-600">
            This post is saved as a draft.
          </p>
        ) : isPublished ? (
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              This post is live on the blog.
            </p>
            {post.publishedAt && (
              <p className="text-xs text-gray-500">
                Published: {new Date(post.publishedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        ) : null}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onSave(POST_STATUS.DRAFT)}
          disabled={saving}
          className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save as Draft"}
        </button>

        <button
          type="button"
          onClick={() => onPublish()}
          disabled={saving || !post.title || !post.content}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 px-4 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPublished ? "Update Post" : "Publish"}
        </button>
      </div>

      {/* Meta Info */}
      {post.id && (
        <div className="mt-6 pt-4 border-t border-gray-200 space-y-2 text-xs text-gray-500">
          {post.createdAt && (
            <div>Created: {new Date(post.createdAt).toLocaleString()}</div>
          )}
          {post.updatedAt && post.updatedAt !== post.createdAt && (
            <div>Updated: {new Date(post.updatedAt).toLocaleString()}</div>
          )}
          {post.slug && (
            <div className="flex items-center gap-2">
              <span>URL:</span>
              <code className="text-gray-700 break-all">/blog/{post.slug}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
