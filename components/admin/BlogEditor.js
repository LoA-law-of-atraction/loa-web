"use client";

import { useState } from "react";

export default function BlogEditor({
  value,
  onChange,
  placeholder = "Write your blog post content here...",
}) {
  const [preview, setPreview] = useState(false);

  return (
    <div className="blog-editor">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setPreview(false)}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            !preview
              ? "bg-gray-100 text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setPreview(true)}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            preview
              ? "bg-gray-100 text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Preview
        </button>
        <span className="text-xs text-gray-400 ml-auto">Supports Markdown</span>
      </div>

      {preview ? (
        <div
          className="prose prose-gray max-w-none min-h-[400px] p-4 border border-gray-200 rounded-lg bg-gray-50"
          dangerouslySetInnerHTML={{
            __html: value
              ? value
                  .replace(/^### (.*$)/gim, "<h3>$1</h3>")
                  .replace(/^## (.*$)/gim, "<h2>$1</h2>")
                  .replace(/^# (.*$)/gim, "<h1>$1</h1>")
                  .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
                  .replace(/\*(.*)\*/gim, "<em>$1</em>")
                  .replace(/\n/gim, "<br />")
              : '<p class="text-gray-400">Nothing to preview</p>',
          }}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[400px] px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y font-mono text-sm"
        />
      )}
    </div>
  );
}
