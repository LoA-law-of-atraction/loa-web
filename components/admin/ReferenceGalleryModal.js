"use client";

import { useState } from "react";
import { Info } from "lucide-react";

/**
 * Modal to choose a reference image from the project's history.
 * Used in Quote Videos Step 2.
 */
export default function ReferenceGalleryModal({
  open,
  onClose,
  history = [],
  currentReferenceUrl,
  onSelect,
}) {
  const [infoEntry, setInfoEntry] = useState(null);

  if (!open) return null;

  const fromHistory = Array.isArray(history) ? [...history].reverse() : [];
  const hasCurrent = typeof currentReferenceUrl === "string" && currentReferenceUrl.trim().length > 0;
  const entries =
    fromHistory.length > 0
      ? fromHistory
      : hasCurrent
        ? [{ url: currentReferenceUrl.trim() }]
        : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reference-gallery-title"
    >
      <div
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-gray-200/80 dark:border-gray-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2
            id="reference-gallery-title"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            Reference gallery
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
          {entries.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {entries.map((entry, idx) => {
                const url = typeof entry === "string" ? entry : entry?.url;
                if (!url) return null;
                const imagePrompt = typeof entry === "object" && entry?.image_prompt != null ? entry.image_prompt : null;
                const createdAt = typeof entry === "object" && entry?.created_at != null ? entry.created_at : null;
                return (
                  <div
                    key={url + "-" + idx}
                    className="group relative rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-gray-900"
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
                        alt="Reference"
                        className="w-full aspect-[9/16] object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      <span className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors rounded-xl pointer-events-none" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoEntry({ url, image_prompt: imagePrompt, created_at: createdAt });
                      }}
                      className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white shadow-lg"
                      aria-label="Image info"
                      title="Info"
                    >
                      <Info className="w-4 h-4" />
                    </button>
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
                No reference images yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                Upload an image in Step 2 to add it here, then pick it anytime.
              </p>
            </div>
          )}
        </div>

        {infoEntry && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/60 rounded-2xl"
            onClick={() => setInfoEntry(null)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Reference image info</span>
                <button
                  type="button"
                  onClick={() => setInfoEntry(null)}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:text-gray-400 dark:hover:bg-gray-800"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4 overflow-y-auto space-y-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 break-all">
                  URL: {infoEntry.url}
                </div>
                {infoEntry.created_at && (
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    Added: {new Date(infoEntry.created_at).toLocaleString()}
                  </div>
                )}
                {infoEntry.image_prompt != null && infoEntry.image_prompt !== "" ? (
                  <details className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/40 p-3" open>
                    <summary className="cursor-pointer text-xs font-semibold text-gray-800 dark:text-gray-100">Image prompt (from “Image to prompt”)</summary>
                    <pre className="mt-2 text-xs font-mono text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words">
                      {infoEntry.image_prompt}
                    </pre>
                  </details>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    No saved prompt. Use “Image to prompt” in Step 2 with this reference to generate and save one.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
