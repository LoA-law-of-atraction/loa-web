"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/admin/Toast";
import { Pencil, Trash2 } from "lucide-react";

export default function ManageCharacterMotionsPage() {
  const { alert } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateKeywords, setGenerateKeywords] = useState("");
  const [generateCount, setGenerateCount] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tags: "",
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/character-motions/list");
      const result = await response.json();
      if (result.success) setItems(result.character_motions || []);
    } catch (error) {
      console.error("Error loading character motions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const response = await fetch("/api/character-motions/seed", {
        method: "POST",
      });
      const result = await response.json();
      if (result.success) {
        await alert(result.message || "Seeded character motions", "success");
        loadItems();
      } else {
        await alert("Failed to seed: " + result.error, "error");
      }
    } catch (error) {
      await alert("Error seeding: " + error.message, "error");
    } finally {
      setSeeding(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({ name: "", description: "", tags: "" });
    setShowCreateModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditing(item);
    setFormData({
      name: item.name || "",
      description: item.description || "",
      tags: Array.isArray(item.tags) ? item.tags.join(", ") : "",
    });
    setShowEditModal(true);
  };

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowGenerateModal(false);
    setEditing(null);
  };

  const handleOpenGenerate = () => {
    setGenerateCount(1);
    setGenerateKeywords("");
    setShowGenerateModal(true);
  };

  const handleGenerate = async () => {
    if (!generateKeywords.trim()) {
      await alert("Please enter at least one keyword", "error");
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/character-motions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: generateCount,
          keywords: generateKeywords.trim(),
        }),
      });
      const result = await response.json();

      if (result.success) {
        const cost = result.cost || 0;
        await alert(
          `✨ Generated ${result.count || 0} character motion(s) with AI${cost ? ` (cost: $${cost.toFixed(4)})` : ""}`,
          "success",
        );
        setShowGenerateModal(false);
        setGenerateKeywords("");
        setGenerateCount(1);
        loadItems();
      } else {
        await alert(
          "Failed to generate: " + (result.error || "Unknown"),
          "error",
        );
      }
    } catch (error) {
      await alert("Error generating: " + error.message, "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      await alert("Name and description are required", "error");
      return;
    }

    try {
      const response = await fetch("/api/character-motions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          tags: formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const result = await response.json();
      if (result.success) {
        await alert("Character motion created", "success");
        handleCloseModals();
        loadItems();
      } else {
        await alert("Failed to create: " + result.error, "error");
      }
    } catch (error) {
      await alert("Error creating: " + error.message, "error");
    }
  };

  const handleUpdate = async () => {
    if (!editing?.id) return;
    if (!formData.name.trim() || !formData.description.trim()) {
      await alert("Name and description are required", "error");
      return;
    }

    try {
      const response = await fetch(`/api/character-motions/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          tags: formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const result = await response.json();
      if (result.success) {
        await alert("Character motion updated", "success");
        handleCloseModals();
        loadItems();
      } else {
        await alert("Failed to update: " + result.error, "error");
      }
    } catch (error) {
      await alert("Error updating: " + error.message, "error");
    }
  };

  const handleDelete = async (id) => {
    const ok = confirm("Delete this character motion? This cannot be undone.");
    if (!ok) return;
    try {
      const response = await fetch(`/api/character-motions/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        await alert("Deleted", "success");
        loadItems();
      } else {
        await alert("Failed to delete", "error");
      }
    } catch (error) {
      await alert("Error deleting: " + error.message, "error");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Character Motions
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Configure the character motion library used in Step 4.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="admin-btn-secondary"
          >
            {seeding ? "Seeding..." : "Seed defaults"}
          </button>
          <button
            onClick={handleOpenGenerate}
            className="admin-btn-secondary"
            title="Generate character motions with AI"
          >
            ✨ Generate
          </button>
          <button onClick={handleOpenCreate} className="admin-btn-primary">
            + New
          </button>
        </div>
      </div>

      <div className="admin-card-solid p-4">
        {loading ? (
          <div className="text-sm admin-muted">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-sm admin-muted">
            No character motions yet. Click &quot;Seed defaults&quot;.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 dark:border-gray-800 rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {item.name}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-200 mt-1">
                      {item.description}
                    </div>

                    {/* Sample Videos */}
                    {Array.isArray(item.sample_videos) &&
                      item.sample_videos.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs text-gray-600 dark:text-gray-300 font-medium mb-1">
                            Sample Videos ({item.sample_videos.length}):
                          </div>
                          <div className="flex gap-2 overflow-x-auto">
                            {item.sample_videos
                              .slice(0, 2)
                              .map((videoUrl, idx) => (
                                <div
                                  key={idx}
                                  className="flex-shrink-0 w-16 h-24 rounded overflow-hidden border border-gray-300 dark:border-gray-800 bg-black"
                                  title="Sample generated video"
                                >
                                  <video
                                    className="w-full h-full object-cover"
                                    controls
                                    preload="metadata"
                                    playsInline
                                  >
                                    <source src={videoUrl} type="video/mp4" />
                                  </video>
                                </div>
                              ))}
                            {item.sample_videos.length > 2 && (
                              <div className="flex-shrink-0 w-16 h-24 rounded bg-gray-100 border border-gray-300 dark:bg-gray-900 dark:border-gray-800 flex items-center justify-center">
                                <span className="text-xs text-gray-600 dark:text-gray-200 font-medium">
                                  +{item.sample_videos.length - 2}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {Array.isArray(item.tags) && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {item.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="admin-btn-secondary"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="admin-btn-secondary"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between gap-4">
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  {showEditModal
                    ? "Edit character motion"
                    : "New character motion"}
                </div>
                <button
                  onClick={handleCloseModals}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  Name
                </label>
                <input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  Tags (comma-separated)
                </label>
                <input
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <div className="p-5 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/40 flex gap-2">
              <button
                onClick={handleCloseModals}
                className="admin-btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={showEditModal ? handleUpdate : handleCreate}
                className="admin-btn-primary flex-1"
              >
                {showEditModal ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between gap-4">
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  Generate character motions with AI
                </div>
                <button
                  onClick={handleCloseModals}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Provide keywords like “breathing, slight glance, shifting
                weight”.
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  Keywords *
                </label>
                <input
                  value={generateKeywords}
                  onChange={(e) => setGenerateKeywords(e.target.value)}
                  placeholder="e.g., subtle head turn, breathing, fidget"
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                  disabled={generating}
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Comma-separated keywords work best
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  Count
                </label>
                <select
                  value={generateCount}
                  onChange={(e) => setGenerateCount(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                  disabled={generating}
                >
                  <option value={1}>1 motion</option>
                  <option value={3}>3 motions</option>
                  <option value={5}>5 motions</option>
                  <option value={10}>10 motions</option>
                </select>
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/40 flex gap-2">
              <button
                onClick={handleCloseModals}
                className="admin-btn-secondary flex-1"
                disabled={generating}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                className="admin-btn-primary flex-1"
                disabled={generating || !generateKeywords.trim()}
              >
                {generating ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
