"use client";

import { useState } from "react";
import { Info, Trash2, Maximize2 } from "lucide-react";

/**
 * Modal to choose a generated image for a scene from the project's generated_images history.
 * Used in Quote Videos Step 2 (and Step 3) to set the scene's selected image from gallery.
 */
export default function SceneImageGalleryModal({
  open,
  onClose,
  images = [],
  currentSelectedUrl,
  onSelect,
  onDeleted,
  projectId,
  title = "Select from gallery",
}) {
  const [infoEntry, setInfoEntry] = useState(null);
  const [deletingUrl, setDeletingUrl] = useState(null);
  const [expandedPreviewUrl, setExpandedPreviewUrl] = useState(null);

  const handleDelete = async (e, url, sceneId) => {
    e.stopPropagation();
    if (!projectId || !url) return;
    if (!confirm("Remove this image from the gallery and delete it from storage?")) return;
    setDeletingUrl(url);
    try {
      const res = await fetch("/api/quote-videos/delete-background-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, url, scene_id: sceneId || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        onDeleted?.();
      } else {
        alert(data.error || "Failed to delete");
      }
    } catch (err) {
      alert(err?.message || "Failed to delete");
    } finally {
      setDeletingUrl(null);
    }
  };

  if (!open) return null;

  const list = Array.isArray(images) ? [...images] : [];
  const selectedUrl = (currentSelectedUrl || "").trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="scene-gallery-title"
    >
      <div
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-gray-200/80 dark:border-gray-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2
            id="scene-gallery-title"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            aria-label="Close gallery"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-auto flex-1 min-h-0">
          {list.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {list.map((entry) => {
                const url = typeof entry === "string" ? entry : entry?.url;
                if (!url) return null;
                const isSelected = url === selectedUrl;
                const createdAt = typeof entry === "object" && entry?.created_at != null ? entry.created_at : null;
                const promptSent = typeof entry === "object" && entry?.prompt_sent_to_model != null ? entry.prompt_sent_to_model : null;
                const sceneId = typeof entry === "object" && entry?.scene_id != null ? entry.scene_id : null;
                const isDeleting = deletingUrl === url;
                return (
                  <div
                    key={(entry?.id || entry?.url) + "-" + url}
                    className={`group relative rounded-xl overflow-hidden border-2 transition-colors ${
                      isSelected
                        ? "border-blue-500 ring-2 ring-blue-500/50"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelect?.(url);
                        onClose?.();
                      }}
                      className="block w-full text-left"
                    >
                      <img
                        src={url}
                        alt="Generated"
                        className="w-full aspect-[9/16] object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      {isSelected && (
                        <div className="absolute top-1 left-1 bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs font-medium">
                          ✓ Selected
                        </div>
                      )}
                    </button>
                    <div className="absolute top-2 left-2 flex gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedPreviewUrl(url);
                        }}
                        className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white shadow-lg"
                        aria-label="Expand preview"
                        title="Expand preview"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInfoEntry({ url, created_at: createdAt, prompt_sent_to_model: promptSent });
                        }}
                        className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white shadow-lg"
                        aria-label="Image info"
                        title="Info"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {projectId && (
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, url, sceneId)}
                          disabled={isDeleting}
                          className="p-1.5 rounded-lg bg-red-500/90 hover:bg-red-600 text-white shadow-lg disabled:opacity-50"
                          aria-label="Delete from gallery"
                          title="Delete"
                        >
                          {isDeleting ? (
                            <span className="w-4 h-4 block border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                No generated images yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                Generate images in Step 2 to see them here, then pick one for this scene.
              </p>
            </div>
          )}
        </div>

        {expandedPreviewUrl && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setExpandedPreviewUrl(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Expanded preview"
          >
            <div
              className="relative max-h-[90vh] max-w-[90vw] w-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={expandedPreviewUrl}
                alt="Preview"
                className="max-h-[90vh] max-w-full w-auto object-contain rounded-lg shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setExpandedPreviewUrl(null)}
                className="absolute -top-2 -right-2 p-2 rounded-full bg-gray-900/90 hover:bg-gray-800 text-white shadow-lg"
                aria-label="Close preview"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {infoEntry && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setInfoEntry(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Image info"
          >
            <div
              className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 max-w-lg w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Image info</span>
                <button
                  type="button"
                  onClick={() => setInfoEntry(null)}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4 overflow-y-auto min-h-0 flex-1 space-y-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 break-all">
                  URL: {infoEntry.url}
                </div>
                {infoEntry.created_at && (
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    Generated: {new Date(infoEntry.created_at).toLocaleString()}
                  </div>
                )}
                {infoEntry.prompt_sent_to_model != null && infoEntry.prompt_sent_to_model !== "" && (
                  <details className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/40 p-3" open>
                    <summary className="cursor-pointer text-xs font-semibold text-gray-800 dark:text-gray-100">Prompt used</summary>
                    <pre className="mt-2 text-xs font-mono text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words">
                      {infoEntry.prompt_sent_to_model}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
