"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/admin/Toast";
import { Plus, Pencil, Trash2, Music2 } from "lucide-react";

export default function ManageMusicBasePromptsPage() {
  const { alert, confirm } = useToast();
  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addId, setAddId] = useState("");
  const [addName, setAddName] = useState("");
  const [addPrompt, setAddPrompt] = useState("");
  const [saving, setSaving] = useState(false);

  const loadBases = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quote-videos/music-base-prompts");
      const data = await res.json();
      if (data.success && Array.isArray(data.bases)) {
        setBases(data.bases);
      }
    } catch (e) {
      console.error(e);
      await alert("Failed to load base prompts", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBases();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const id = addId.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const name = addName.trim() || id.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
    const prompt = addPrompt.trim();
    if (!id) {
      await alert("Enter an id (slug, e.g. uplifting)", "warning");
      return;
    }
    if (!prompt) {
      await alert("Enter the prompt text", "warning");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/quote-videos/music-base-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name, prompt }),
      });
      const data = await res.json();
      if (data.success) {
        await loadBases();
        setShowAdd(false);
        setAddId("");
        setAddName("");
        setAddPrompt("");
        await alert("Base prompt added", "success");
      } else {
        await alert(data.error || "Failed to add", "error");
      }
    } catch (e) {
      await alert("Error: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id, updates) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/quote-videos/music-base-prompts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        await loadBases();
        setEditing(null);
        await alert("Updated", "success");
      } else {
        await alert(data.error || "Update failed", "error");
      }
    } catch (e) {
      await alert("Error: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (id === "default") {
      await alert("Cannot delete the default base prompt", "warning");
      return;
    }
    if (!(await confirm("Delete this base prompt? Sample track link will be lost."))) return;
    try {
      const res = await fetch(`/api/quote-videos/music-base-prompts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await loadBases();
        await alert("Deleted", "success");
      } else {
        await alert(data.error || "Delete failed", "error");
      }
    } catch (e) {
      await alert("Error: " + e.message, "error");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Music2 size={28} /> Manage base music prompts
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Add, edit, or delete base prompts (stored in Firebase). When the music prompt field is empty on the Music step, the selected base is used. You can get here from the Quote Videos → Music step via “Manage base prompts”.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setShowAdd(true); setAddId(""); setAddName(""); setAddPrompt(""); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          <Plus size={18} /> Add base prompt
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="mb-8 p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 space-y-4"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New base prompt</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Id (slug, e.g. uplifting)</label>
            <input
              type="text"
              value={addId}
              onChange={(e) => setAddId(e.target.value)}
              placeholder="e.g. uplifting"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display name</label>
            <input
              type="text"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="e.g. Uplifting"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prompt</label>
            <textarea
              value={addPrompt}
              onChange={(e) => setAddPrompt(e.target.value)}
              rows={4}
              placeholder="Describe the music style..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving…" : "Add"}
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading…</p>
      ) : bases.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No base prompts. Add one above to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bases.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              {editing?.id === b.id ? (
                <EditForm
                  base={b}
                  onSave={(updates) => handleUpdate(b.id, updates)}
                  onCancel={() => setEditing(null)}
                  saving={saving}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{b.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">({b.id})</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{b.prompt}</p>
                      {(b.sample_music?.length > 0 || b.sample_music_url) && (
                        <div className="mt-2 space-y-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Samples</p>
                          {(b.sample_music ?? (b.sample_music_url ? [{ url: b.sample_music_url, id: b.sample_music_id || "" }] : [])).map((s, i) => (
                            <audio key={s.id || s.url || i} src={s.url} controls className="w-full max-w-md h-9" />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {b.id !== "default" && (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditing({ id: b.id, name: b.name, prompt: b.prompt })}
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
                            aria-label="Edit"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(b.id)}
                            className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            aria-label="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
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

function EditForm({ base, onSave, onCancel, saving }) {
  const [name, setName] = useState(base.name);
  const [prompt, setPrompt] = useState(base.prompt);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ name: name.trim(), prompt: prompt.trim() });
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium">
          Cancel
        </button>
      </div>
    </form>
  );
}
