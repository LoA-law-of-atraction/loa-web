"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";

export default function QuoteVideosQuotesPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

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

  const quotes = projects
    .filter((p) => p.quote_text && p.quote_text.trim())
    .map((p) => ({
      id: p.id,
      quote: p.quote_text.trim(),
      theme: p.theme || "",
      projectName: p.name || "Quote video",
    }))
    .filter(
      (q) =>
        !filter ||
        q.quote.toLowerCase().includes(filter.toLowerCase()) ||
        q.theme.toLowerCase().includes(filter.toLowerCase())
    );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Quotes
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Quotes from your quote video projects. Use the generator to create more.
        </p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search by quote or theme…"
          className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
        />
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading…</p>
      ) : quotes.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {filter
              ? "No quotes match your search."
              : "No quotes yet. Create a quote video project and generate a quote."}
          </p>
          {!filter && (
            <Link
              href="/admin/quote-videos"
              className="mt-3 inline-block text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              Go to Generator →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((q) => (
            <div
              key={q.id}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <p className="text-lg text-gray-900 dark:text-gray-100 font-medium">
                &ldquo;{q.quote}&rdquo;
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
                {q.theme && (
                  <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
                    {q.theme}
                  </span>
                )}
                <span>{q.projectName}</span>
              </div>
              <Link
                href={`/admin/quote-videos?project_id=${q.id}&step=1`}
                className="mt-2 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Open project →
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Link
          href="/admin/quote-videos"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          ← Back to Quote Videos
        </Link>
      </div>
    </div>
  );
}
