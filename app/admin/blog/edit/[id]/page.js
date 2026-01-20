"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import BlogEditor from "@/components/admin/BlogEditor";
import PostMetadataForm from "@/components/admin/PostMetadataForm";
import CategoryManager from "@/components/admin/CategoryManager";
import ImageUploader from "@/components/admin/ImageUploader";
import PublishControls from "@/components/admin/PublishControls";
import { POST_STATUS } from "@/lib/constants/blogConfig";
import { getPostById, updatePost } from "@/utils/blogService";
import { useToast } from "@/components/admin/Toast";

export default function EditBlogPost({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState(null);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const data = await getPostById(id);
      if (!data) {
        throw new Error("Post not found");
      }
      setPost(data);
    } catch (error) {
      console.error("Error fetching post:", error);
      addToast("Failed to load post", "error");
      router.push("/admin/blog");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (status) => {
    if (!post.title || !post.content) {
      addToast("Please fill in title and content", "error");
      return;
    }

    setSaving(true);

    try {
      await updatePost(id, {
        ...post,
        status: status || post.status,
      });

      addToast("Post updated!", "success");
      router.push("/admin/blog");
      router.refresh();
    } catch (error) {
      console.error("Error updating post:", error);
      addToast(error.message || "Failed to update post", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = () => {
    handleSave(POST_STATUS.PUBLISHED);
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Loading...</div>;
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Post not found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Post</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleSave(post.status)}
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
            {saving ? "Saving..." : "Update"}
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
                key={post.id || "new"}
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
