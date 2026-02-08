"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/admin/Toast";
import { Pencil, Trash2, Star } from "lucide-react";

export default function ManageInstrumentsPage() {
  const { alert } = useToast();
  const [items, setItems] = useState([]);
  const [defaultInstrumentId, setDefaultInstrumentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "forbidden",
    description: "",
    use_for: "",
    behavior: "",
    rules: "",
    order: "999",
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/instruments/list");
      const result = await response.json();
      if (result.success) {
        setItems(result.instruments || []);
        setDefaultInstrumentId(result.default_instrument_id || null);
      }
    } catch (error) {
      console.error("Error loading instruments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const response = await fetch("/api/instruments/seed", {
        method: "POST",
      });
      const result = await response.json();
      if (result.success) {
        await alert(result.message || "Seeded instruments", "success");
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

  const handleSetDefault = async (instrumentId) => {
    try {
      const response = await fetch("/api/instruments/set-default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instrument_id: instrumentId }),
      });
      const result = await response.json();
      if (result.success) {
        setDefaultInstrumentId(instrumentId);
        await alert("Default instrument updated", "success");
      } else {
        await alert("Failed to set default: " + result.error, "error");
      }
    } catch (error) {
      await alert("Error: " + error.message, "error");
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      name: "",
      role: "forbidden",
      description: "",
      use_for: "",
      behavior: "",
      rules: "",
      order: "999",
    });
    setShowCreateModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditing(item);
    setFormData({
      name: item.name || "",
      role: item.role || "forbidden",
      description: item.description || "",
      use_for: item.use_for || "",
      behavior: item.behavior || "",
      rules: item.rules || "",
      order: String(item.order ?? 999),
    });
    setShowEditModal(true);
  };

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditing(null);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      await alert("Name is required", "error");
      return;
    }

    try {
      const response = await fetch("/api/instruments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          role: formData.role,
          description: formData.description.trim(),
          use_for: formData.use_for.trim(),
          behavior: formData.behavior.trim(),
          rules: formData.rules.trim(),
          order: Number(formData.order) || 999,
        }),
      });
      const result = await response.json();
      if (result.success) {
        await alert("Instrument created", "success");
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
    if (!formData.name.trim()) {
      await alert("Name is required", "error");
      return;
    }

    try {
      const response = await fetch(`/api/instruments/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          role: formData.role,
          description: formData.description.trim(),
          use_for: formData.use_for.trim(),
          behavior: formData.behavior.trim(),
          rules: formData.rules.trim(),
          order: Number(formData.order) || 999,
        }),
      });
      const result = await response.json();
      if (result.success) {
        await alert("Instrument updated", "success");
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
    const ok = confirm("Delete this instrument? This cannot be undone.");
    if (!ok) return;
    try {
      const response = await fetch(`/api/instruments/${id}`, {
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
            Instruments
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Manage the instrument palette used for music prompt generation in
            Step 5. These rules are injected into prompts to enforce brand
            sound.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="admin-btn-secondary"
          >
            {seeding ? "Seeding..." : "Seed brand palette"}
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
            No instruments yet. Click &quot;Seed brand palette&quot; to add the
            default LOA instrument palette.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 dark:border-gray-800 rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {item.name}
                    </div>
                    {(item.description || item.use_for || item.behavior) && (
                      <div className="text-sm text-gray-700 dark:text-gray-200 mt-1 space-y-0.5">
                        {item.description && <p>{item.description}</p>}
                        {item.use_for && (
                          <p className="text-xs text-gray-500">
                            Use for: {item.use_for}
                          </p>
                        )}
                        {item.behavior && (
                          <p className="text-xs text-gray-500">
                            Behavior: {item.behavior}
                          </p>
                        )}
                        {item.rules && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            Rules: {item.rules}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {defaultInstrumentId === item.id ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                        title="Default instrument"
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
                  {showEditModal ? "Edit instrument" : "New instrument"}
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
                  placeholder="e.g. Warm analog synth pad"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Role (for prompt rules: primary, secondary, conditional, forbidden)
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="primary">primary</option>
                  <option value="secondary">secondary</option>
                  <option value="conditional">conditional</option>
                  <option value="forbidden">forbidden</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Behavior and role in the mix"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Use for
                </label>
                <input
                  type="text"
                  value={formData.use_for}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, use_for: e.target.value }))
                  }
                  placeholder="e.g. 80–90% of videos"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Behavior
                </label>
                <input
                  type="text"
                  value={formData.behavior}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      behavior: e.target.value,
                    }))
                  }
                  placeholder="e.g. sustained chords, no rhythm"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Rules (optional)
                </label>
                <input
                  type="text"
                  value={formData.rules}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, rules: e.target.value }))
                  }
                  placeholder="e.g. Never piano alone"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Order
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, order: e.target.value }))
                  }
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
