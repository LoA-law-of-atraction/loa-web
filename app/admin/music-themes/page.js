"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/admin/Toast";
import { Pencil, Trash2, Star } from "lucide-react";

export default function ManageMusicThemesPage() {
  const { alert } = useToast();
  const [items, setItems] = useState([]);
  const [defaultThemeId, setDefaultThemeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
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
      const response = await fetch("/api/music-themes/list");
      const result = await response.json();
      if (result.success) {
        setItems(result.music_themes || []);
        setDefaultThemeId(result.default_theme_id || null);
      }
    } catch (error) {
      console.error("Error loading music themes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (themeId) => {
    try {
      const response = await fetch("/api/music-themes/set-default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme_id: themeId }),
      });
      const result = await response.json();
      if (result.success) {
        setDefaultThemeId(themeId);
        await alert("Default theme updated", "success");
      } else {
        await alert("Failed to set default: " + result.error, "error");
      }
    } catch (error) {
      await alert("Error: " + error.message, "error");
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const response = await fetch("/api/music-themes/seed", {
        method: "POST",
      });
      const result = await response.json();
      if (result.success) {
        await alert(result.message || "Seeded music themes", "success");
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
    setEditing(null);
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      await alert("Name and description are required", "error");
      return;
    }

    try {
      const response = await fetch("/api/music-themes/create", {
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
        await alert("Music theme created", "success");
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
      const response = await fetch(`/api/music-themes/${editing.id}`, {
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
        await alert("Music theme updated", "success");
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
    const ok = confirm("Delete this music theme? This cannot be undone.");
    if (!ok) return;
    try {
      const response = await fetch(`/api/music-themes/${id}`, {
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
            Music Themes
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Configure the music theme library used in Step 5.
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
            No music themes yet. Click &quot;Seed defaults&quot;.
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

                  <div className="flex items-center gap-2 shrink-0">
                    {defaultThemeId === item.id ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                        title="Default theme"
                      >
                        <Star size={12} fill="currentColor" />
                        Default
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(item.id)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                        title="Set as default"
                      >
                        <Star size={12} />
                        Set default
                      </button>
                    )}
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
                  {showEditModal ? "Edit music theme" : "New music theme"}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. Core / Everyday Comfort"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Description (music prompt)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={5}
                  placeholder="A comforting retro-futuristic ambient sci-fi music piece..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, tags: e.target.value }))
                  }
                  placeholder="comfort, warm, ambient"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <div className="p-5 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
              <button
                onClick={handleCloseModals}
                className="admin-btn-secondary"
              >
                Cancel
              </button>
              {showEditModal ? (
                <button onClick={handleUpdate} className="admin-btn-primary">
                  Update
                </button>
              ) : (
                <button onClick={handleCreate} className="admin-btn-primary">
                  Create
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
