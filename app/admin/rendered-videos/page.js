"use client";

import { useEffect, useState } from "react";
import { Video, ExternalLink } from "lucide-react";

export default function RenderedVideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rendered-videos");
      const data = await res.json();
      if (data.success) setVideos(data.videos || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return "—";
    try {
      const d = new Date(ts);
      return d.toLocaleDateString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return "—";
    }
  };

  const openLink = (item) => {
    if (item.type === "character") {
      window.location.href = `/admin/video-generator?project_id=${item.project_id}&step=7`;
    } else {
      window.location.href = `/admin/quote-videos?project_id=${item.project_id}&step=4`;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Rendered Videos
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Character Shorts and Quote Videos that have been assembled. Open to post or re-edit.
        </p>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading…</p>
      ) : videos.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
          <Video className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No rendered videos yet.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-4 text-sm">
            <a
              href="/admin/video-generator"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Character Shorts →
            </a>
            <a
              href="/admin/quote-videos"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Quote Videos →
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((v) => (
            <div
              key={`${v.type}-${v.id}`}
              className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <div className="flex-shrink-0 w-full sm:w-64 aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <video
                  src={v.final_video_url}
                  controls
                  className="w-full h-full object-contain"
                  preload="metadata"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {v.name}
                </p>
                {v.quote_text && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    "{v.quote_text}"
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span
                    className={`px-2 py-0.5 rounded ${
                      v.type === "character"
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                    }`}
                  >
                    {v.type === "character" ? "Character Short" : "Quote Video"}
                  </span>
                  <span>{formatDate(v.updated_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={v.final_video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  <ExternalLink size={14} /> Open URL
                </a>
                <button
                  type="button"
                  onClick={() => openLink(v)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                >
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <a
          href="/admin/video-generator"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          ← Character Shorts
        </a>
      </div>
    </div>
  );
}
