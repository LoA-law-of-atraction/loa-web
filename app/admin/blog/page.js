"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/utils/seoHelpers";
import { deletePost, getBlogPosts } from "@/utils/blogService";
import { useToast } from "@/components/admin/Toast";

export default function AdminBlogDashboard() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [menuOpen, setMenuOpen] = useState(null);
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setMenuOpen(null);
    if (menuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [menuOpen]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const status = filter === "all" ? "" : filter;
      const data = await getBlogPosts({ status: status || undefined });
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    try {
      await deletePost(id);
      setPosts(posts.filter((p) => p.id !== id));
      addToast(`"${title}" deleted`, "success");
    } catch (error) {
      console.error("Error deleting post:", error);
      addToast("Failed to delete post", "error");
    }
  };

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setMenuOpen(menuOpen === id ? null : id);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Posts</h1>
        <button
          onClick={() => router.push("/admin/blog/new")}
          className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-5 py-2 rounded-full transition-colors"
        >
          Write a post
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-6">
        {["all", "published", "draft"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              filter === status
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-gray-500 mb-4">No posts yet</p>
          <button
            onClick={() => router.push("/admin/blog/new")}
            className="text-gray-900 hover:text-gray-600 font-medium"
          >
            Write your first post
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {posts.map((post) => (
            <article key={post.id} className="py-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2
                      onClick={() => router.push(`/admin/blog/edit/${post.id}`)}
                      className="text-xl font-bold text-gray-900 hover:text-gray-600 cursor-pointer truncate"
                    >
                      {post.title}
                    </h2>
                    {post.status === "draft" && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm mb-2 line-clamp-1">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>
                      {formatDate(post.publishedAt || post.createdAt, "short")}
                    </span>
                    {post.categories?.length > 0 && (
                      <>
                        <span>·</span>
                        <span>{post.categories[0]}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 relative">
                  <button
                    onClick={(e) => toggleMenu(e, post.id)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {menuOpen === post.id && (
                    <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px] z-10">
                      <button
                        onClick={() =>
                          router.push(`/admin/blog/edit/${post.id}`)
                        }
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          const previewParam = post.status === "draft" ? "?preview=true" : "";
                          window.open(`/blog/${post.slug}${previewParam}`, "_blank");
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        {post.status === "draft" ? "Preview" : "View"}
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
