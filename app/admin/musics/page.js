"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/components/admin/Toast";
import { Music, Trash2, ExternalLink } from "lucide-react";

export default function MusicsPage() {
  const { alert, confirm } = useToast();
  const [music, setMusic] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMusic();
  }, []);

  const loadMusic = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/video-generator/music-list?limit=100");
      const data = await res.json();
      if (data.success) setMusic(data.music || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (musicId) => {
    if (!(await confirm("Delete this music? This cannot be undone."))) return;
    try {
      const res = await fetch("/api/video-generator/delete-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ music_id: musicId }),
      });
      const data = await res.json();
      if (data.success) {
        await loadMusic();
        await alert("Music deleted", "success");
      } else {
        await alert(data.error || "Delete failed", "error");
      }
    } catch (e) {
      await alert("Error: " + e.message, "error");
    }
  };

  const formatDate = (ts) => {
    if (!ts) return "—";
    try {
      const d = typeof ts === "string" ? new Date(ts) : ts?.toDate?.() ?? new Date(ts);
      return d.toLocaleDateString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return "—";
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Musics
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Generated background music for Character Shorts. Play or delete.
        </p>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading…</p>
      ) : music.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
          <Music className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No music generated yet.</p>
          <Link
            href="/admin/video-generator"
            className="mt-3 inline-block text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            Generate music in Character Shorts →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {music.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <div className="flex-shrink-0">
                {m.music_url ? (
                  <audio controls src={m.music_url} className="w-48 h-10" />
                ) : (
                  <span className="text-sm text-gray-400">No URL</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate" title={m.prompt || ""}>
                  {m.prompt || "—"}
                </p>
                <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {m.project_id && (
                    <Link
                      href={`/admin/video-generator?project_id=${m.project_id}`}
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Project <ExternalLink size={12} />
                    </Link>
                  )}
                  <span>{formatDate(m.timestamp)}</span>
                  {m.duration_ms != null && (
                    <span>{(m.duration_ms / 1000).toFixed(1)}s</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {m.music_url && (
                  <a
                    href={m.music_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    Open
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(m.id)}
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
        <Link
          href="/admin/video-generator"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          ← Character Shorts
        </Link>
      </div>
    </div>
  );
}
