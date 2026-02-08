"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/admin/Toast";
import { Trash2 } from "lucide-react";

export default function ManageLocationsPage() {
  const { alert } = useToast();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateCount, setGenerateCount] = useState(3);
  const [generateCategory, setGenerateCategory] = useState("any");
  const [generateKeywords, setGenerateKeywords] = useState("");

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/locations/list");
      const result = await response.json();

      if (result.success) {
        setLocations(result.locations || []);
      }
    } catch (error) {
      console.error("Error loading locations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedLocations = async () => {
    setSeeding(true);
    try {
      const response = await fetch("/api/locations/seed", {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        await alert(
          `✅ Seeded ${result.seeded} new locations! (${result.skipped} already existed)`,
          "success",
        );
        loadLocations();
      } else {
        await alert("Failed to seed locations: " + result.error, "error");
      }
    } catch (error) {
      await alert("Error seeding locations: " + error.message, "error");
    } finally {
      setSeeding(false);
    }
  };

  const handleGenerateLocations = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/locations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: generateCount,
          type: generateCategory === "any" ? null : generateCategory,
          keywords: generateKeywords.trim() || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await alert(
          `✨ Generated ${result.count} new location(s) with AI!`,
          "success",
        );
        loadLocations();
      } else {
        await alert("Failed to generate locations: " + result.error, "error");
      }
    } catch (error) {
      await alert("Error generating locations: " + error.message, "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteLocation = async (locationId) => {
    const confirmed = confirm("Delete this location? This cannot be undone.");
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/locations/${locationId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        await alert("Location deleted", "success");
        loadLocations();
      } else {
        await alert("Failed to delete location", "error");
      }
    } catch (error) {
      await alert("Error deleting location: " + error.message, "error");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Manage Locations
        </h1>
        <p className="admin-muted">
          View, seed, and generate Blade Runner-style locations for your videos
        </p>
      </div>

      {/* Actions */}
      <div className="admin-card-solid p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Seed Locations */}
          <div className="admin-card p-4 border-blue-200/60 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-950/20">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
              Seed Starter Locations
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-200/90 mb-3">
              Load 15 pre-designed Blade Runner locations into the database
            </p>
            <button
              onClick={handleSeedLocations}
              disabled={seeding || loading}
              className="admin-btn-primary w-full"
            >
              {seeding ? "Seeding..." : "Seed Locations"}
            </button>
          </div>

          {/* Generate with AI */}
          <div className="admin-card p-4 border-purple-200/60 bg-purple-50/60 dark:border-purple-900/40 dark:bg-purple-950/20">
            <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">
              Generate with AI
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-200/90 mb-3">
              Use Claude AI to generate new unique locations
            </p>

            {/* Category Selection */}
            <div className="mb-2">
              <label className="admin-label mb-1 text-xs">Category</label>
              <select
                value={generateCategory}
                onChange={(e) => setGenerateCategory(e.target.value)}
                className="admin-select w-full"
                disabled={generating}
              >
                <option value="any">Any (Indoor or Outdoor)</option>
                <option value="indoor">🏢 Indoor Only</option>
                <option value="outdoor">🌃 Outdoor Only</option>
              </select>
            </div>

            {/* Keywords Input */}
            <div className="mb-2">
              <label className="admin-label mb-1 text-xs">
                Keywords (optional)
              </label>
              <input
                type="text"
                value={generateKeywords}
                onChange={(e) => setGenerateKeywords(e.target.value)}
                placeholder="e.g., neon, rain, cyberpunk"
                className="admin-input"
                disabled={generating}
              />
              <p className="text-xs admin-muted mt-1">
                Comma-separated themes/elements to incorporate
              </p>
            </div>

            <div className="flex gap-2 mb-2">
              <select
                value={generateCount}
                onChange={(e) => setGenerateCount(Number(e.target.value))}
                className="admin-select flex-1"
                disabled={generating}
              >
                <option value={1}>1 location</option>
                <option value={3}>3 locations</option>
                <option value={5}>5 locations</option>
                <option value={10}>10 locations</option>
              </select>
              <button
                onClick={handleGenerateLocations}
                disabled={generating || loading}
                className="admin-btn-primary whitespace-nowrap"
              >
                {generating ? "Generating..." : "Generate"}
              </button>
            </div>

            {/* Loading Bar */}
            {generating && (
              <div className="mb-2">
                <div className="w-full bg-purple-200/80 dark:bg-purple-900/40 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-600 h-full rounded-full animate-pulse"
                    style={{ width: "100%" }}
                  ></div>
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-200 mt-1 text-center font-medium">
                  Generating {generateCount} location
                  {generateCount > 1 ? "s" : ""} with AI...
                </p>
              </div>
            )}

            <p className="text-xs admin-muted">
              Cost: ~$0.01-0.02 per location
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-card-solid p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Total Locations: {locations.length}
            </h3>
            <p className="text-sm admin-muted mt-1">
              {locations.filter((l) => l.generated_by_ai).length} AI-generated •{" "}
              {locations.filter((l) => !l.generated_by_ai).length} Pre-designed
            </p>
          </div>
          <button
            onClick={loadLocations}
            disabled={loading}
            className="admin-btn-secondary"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Locations Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="admin-muted mt-4">Loading locations...</p>
        </div>
      ) : locations.length === 0 ? (
        <div className="admin-card-solid p-12 text-center">
          <p className="admin-muted mb-4">
            No locations found. Seed or generate some to get started!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((location) => (
            <div
              key={location.id}
              className="admin-card-solid p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-2 flex-1">
                  <span className="text-xl">📍</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">
                      {location.name}
                    </h3>
                    {location.generated_by_ai && (
                      <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium mb-2 dark:bg-purple-900/30 dark:text-purple-200">
                        ✨ AI
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteLocation(location.id)}
                  className="admin-icon-btn text-red-600 hover:text-red-700 dark:text-red-300 dark:hover:text-red-200"
                  title="Delete location"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="relative group mb-3">
                <p className="text-xs text-gray-700 dark:text-gray-200 line-clamp-3 leading-relaxed cursor-help">
                  {location.description}
                </p>
                {/* Tooltip on hover */}
                <div className="invisible group-hover:visible absolute left-0 top-full mt-1 w-full bg-gray-900 text-white text-xs p-3 rounded-xl shadow-lg z-50 leading-relaxed">
                  {location.description}
                </div>
              </div>

              {/* Sample Images */}
              {location.sample_images && location.sample_images.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-gray-600 dark:text-gray-300 font-medium mb-1">
                    Sample Images ({location.sample_images.length}):
                  </div>
                  <div className="flex gap-1 overflow-x-auto">
                    {location.sample_images.slice(0, 3).map((imageUrl, idx) => (
                      <div
                        key={idx}
                        className="flex-shrink-0 w-16 h-24 rounded overflow-hidden border border-gray-300"
                      >
                        <img
                          src={imageUrl}
                          alt={`Sample ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {location.sample_images.length > 3 && (
                      <div className="flex-shrink-0 w-16 h-24 rounded bg-gray-100 border border-gray-300 flex items-center justify-center">
                        <span className="text-xs text-gray-600 dark:text-gray-200 font-medium">
                          +{location.sample_images.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-3">
                {location.category && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium dark:bg-purple-900/30 dark:text-purple-200">
                    {location.category === "indoor"
                      ? "🏢 Indoor"
                      : "🌃 Outdoor"}
                  </span>
                )}
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium dark:bg-blue-900/30 dark:text-blue-200">
                  {location.type?.replace(/_/g, " ") || "unknown"}
                </span>
                {location.visual_characteristics?.lighting &&
                  (Array.isArray(location.visual_characteristics.lighting)
                    ? location.visual_characteristics.lighting
                    : location.visual_characteristics.lighting
                        .split(",")
                        .map((s) => s.trim())
                  ).map((light, idx) => (
                    <span
                      key={`light-${idx}`}
                      className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full"
                    >
                      {light}
                    </span>
                  ))}
                {location.visual_characteristics?.atmosphere &&
                  (Array.isArray(location.visual_characteristics.atmosphere)
                    ? location.visual_characteristics.atmosphere
                    : location.visual_characteristics.atmosphere
                        .split(",")
                        .map((s) => s.trim())
                  ).map((atm, idx) => (
                    <span
                      key={`atm-${idx}`}
                      className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                    >
                      {atm}
                    </span>
                  ))}
                {location.visual_characteristics?.key_elements &&
                  location.visual_characteristics.key_elements.map(
                    (element, idx) => (
                      <span
                        key={`elem-${idx}`}
                        className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full"
                      >
                        {element}
                      </span>
                    ),
                  )}
              </div>

              <div className="text-xs admin-muted flex items-center justify-between">
                <span>Used: {location.usage_count || 0} times</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {location.id.substring(0, 12)}...
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
