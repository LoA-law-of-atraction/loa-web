"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import BlogEditor from "@/components/admin/BlogEditor";
import PostMetadataForm from "@/components/admin/PostMetadataForm";
import CategoryManager from "@/components/admin/CategoryManager";
import ImageUploader from "@/components/admin/ImageUploader";
import PublishControls from "@/components/admin/PublishControls";
import { useToast } from "@/components/admin/Toast";
import { DEFAULT_AUTHOR, POST_STATUS } from "@/lib/constants/blogConfig";
import { createPost } from "@/utils/blogService";

const AUTOSAVE_KEY = "blog_draft_new";

export default function NewBlogPost() {
  const router = useRouter();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [post, setPost] = useState({
    title: "",
    content: "",
    excerpt: "",
    featuredImage: null,
    categories: [],
    tags: [],
    author: DEFAULT_AUTHOR,
    status: POST_STATUS.DRAFT,
    metaTitle: "",
    metaDescription: "",
    keywords: [],
  });

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(AUTOSAVE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.title || parsed.content) {
          const shouldRestore = confirm(
            "You have an unsaved draft. Would you like to restore it?",
          );
          if (shouldRestore) {
            setPost(parsed);
          } else {
            localStorage.removeItem(AUTOSAVE_KEY);
          }
        }
      } catch (e) {
        console.error("Failed to parse draft:", e);
      }
    }
  }, []);

  // Auto-save to localStorage every 30 seconds
  useEffect(() => {
    const hasContent = post.title || post.content;
    if (!hasContent) return;

    const timer = setTimeout(() => {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(post));
      setLastSaved(new Date());
    }, 3000); // Save 3 seconds after last change

    return () => clearTimeout(timer);
  }, [post]);

  // Clear draft after successful save
  const clearDraft = useCallback(() => {
    localStorage.removeItem(AUTOSAVE_KEY);
  }, []);

  const handleSave = async (status = POST_STATUS.DRAFT) => {
    if (!post.title || !post.content) {
      addToast("Please fill in title and content", "error");
      return;
    }

    setSaving(true);

    try {
      // Call Firebase directly from client
      await createPost({
        ...post,
        status,
      });

      clearDraft();
      addToast(
        status === POST_STATUS.PUBLISHED
          ? "Post published successfully!"
          : "Draft saved!",
        "success",
      );
      router.push("/admin/blog");
      router.refresh();
    } catch (error) {
      console.error("Error saving post:", error);
      addToast(error.message || "Failed to save post", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = () => {
    handleSave(POST_STATUS.PUBLISHED);
  };

  return (
    <div>
      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {/* Preview Content */}
              <article className="max-w-none">
                {post.featuredImage?.url && (
                  <img
                    src={post.featuredImage.url}
                    alt={post.featuredImage.alt || post.title}
                    className="w-full h-64 object-cover rounded-lg mb-6"
                  />
                )}
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {post.title || "Untitled Post"}
                </h1>
                <div className="flex items-center gap-3 text-sm text-gray-500 mb-6">
                  <span>{post.author?.name || "LoA Team"}</span>
                  <span>·</span>
                  <span>{new Date().toLocaleDateString()}</span>
                  {post.categories?.length > 0 && (
                    <>
                      <span>·</span>
                      <span>{post.categories[0]}</span>
                    </>
                  )}
                </div>
                {post.excerpt && (
                  <p className="text-lg text-gray-600 mb-6 italic">
                    {post.excerpt}
                  </p>
                )}
                <div
                  className="prose prose-gray max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: post.content
                      ? post.content
                          .replace(/^### (.*$)/gim, "<h3>$1</h3>")
                          .replace(/^## (.*$)/gim, "<h2>$1</h2>")
                          .replace(/^# (.*$)/gim, "<h1>$1</h1>")
                          .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
                          .replace(/\*(.*)\*/gim, "<em>$1</em>")
                          .replace(/\n/gim, "<br />")
                      : '<p class="text-gray-400">No content yet</p>',
                  }}
                />
              </article>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Post</h1>
          {lastSaved && (
            <p className="text-xs text-gray-400 mt-1">
              Auto-saved {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(true)}
            className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2"
          >
            Preview
          </button>
          <button
            onClick={() => handleSave(POST_STATUS.DRAFT)}
            disabled={saving}
            className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 disabled:opacity-50"
          >
            Save draft
          </button>
          <button
            onClick={handlePublish}
            disabled={saving}
            className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-5 py-2 rounded-full transition-colors disabled:opacity-50"
          >
            {saving ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Post Details */}
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-3">
              Post Details
            </h2>
            <div className="border border-gray-200 rounded-lg p-5">
              <PostMetadataForm post={post} onChange={setPost} />
            </div>
          </div>

          {/* Featured Image */}
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-3">
              Featured Image
            </h2>
            <div className="border border-gray-200 rounded-lg p-5">
              <ImageUploader
                onImageUploaded={(image) =>
                  setPost({ ...post, featuredImage: image })
                }
                currentImage={post.featuredImage}
              />
            </div>
          </div>

          {/* Content Editor */}
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-3">Content</h2>
            <div className="border border-gray-200 rounded-lg p-5">
              <BlogEditor
                value={post.content}
                onChange={(content) => setPost({ ...post, content })}
              />
            </div>
          </div>

          {/* Categories & Tags */}
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-3">
              Categories & Tags
            </h2>
            <div className="border border-gray-200 rounded-lg p-5">
              <CategoryManager post={post} onChange={setPost} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <PublishControls
            post={post}
            onChange={setPost}
            onSave={handleSave}
            onPublish={handlePublish}
            saving={saving}
          />
        </div>
      </div>
    </div>
  );
}
