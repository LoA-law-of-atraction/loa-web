"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/admin/Toast";
import { Plus, Trash2 } from "lucide-react";

export default function QuoteVideosProjectsPage() {
  const { alert, confirm } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quote-videos/projects");
      const data = await res.json();
      if (data.success) setProjects(data.projects || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (id) => {
    window.location.href = `/admin/quote-videos?project_id=${id}&step=1`;
  };

  const handleDelete = async (id) => {
    if (!(await confirm("Delete this quote project?"))) return;
    try {
      const res = await fetch(`/api/quote-videos/projects/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        await loadProjects();
        await alert("Project deleted", "success");
      } else {
        await alert(data.error || "Delete failed", "error");
      }
    } catch (e) {
      await alert("Error: " + e.message, "error");
    }
  };

  const handleCreate = () => {
    window.location.href = "/admin/quote-videos";
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Quote Video Projects
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Manage your motivational quote video projects
          </p>
        </div>
        <a
          href="/admin/quote-videos"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          <Plus size={18} /> New project
        </a>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading…</p>
      ) : projects.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No quote projects yet</p>
          <a
            href="/admin/quote-videos"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Create your first quote video →
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {p.name || "Quote video"}
                </p>
                {p.quote_text && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    &ldquo;{p.quote_text}&rdquo;
                  </p>
                )}
                {p.theme && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Theme: {p.theme}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpen(p.id)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  aria-label="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <a
          href="/admin/quote-videos"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          ← Back to Quote Videos
        </a>
      </div>
    </div>
  );
}
