"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { onAuthStateChanged, signInAnonymously, signOut } from "firebase/auth";
import {
  AlertCircle,
  Cloud,
  FileText,
  GalleryHorizontalEnd,
  House,
  LogOut,
  Sparkles,
  Pencil,
  Trash2,
  Copy,
} from "lucide-react";
import { auth } from "@/utils/firebase";
import {
  createAffirmationTemplate,
  deleteAffirmationTemplate,
  getAffirmationTemplates,
  updateAffirmationTemplate,
} from "@/utils/loaCloudSync";

const dashboardTabs = [
  { id: "home", label: "Overview", icon: House, href: "/dashboard?tab=home" },
  { id: "affirmations", label: "Affirmations", icon: Sparkles, href: "/dashboard?tab=affirmations" },
  { id: "templates", label: "Templates", icon: FileText, href: "/dashboard/templates", active: true },
  { id: "gallery", label: "Gallery", icon: GalleryHorizontalEnd, href: "/dashboard?tab=gallery" },
];

const emptyTemplate = { name: "", content: "", category: "" };

export default function AffirmationTemplatesPage() {
  const router = useRouter();
  const [uid, setUid] = useState("");
  const [userLabel, setUserLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [templates, setTemplates] = useState([]);
  const [defaultTemplates, setDefaultTemplates] = useState([]);
  const [form, setForm] = useState(emptyTemplate);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [usingDefaultId, setUsingDefaultId] = useState(null);
  const [editingDefaultId, setEditingDefaultId] = useState(null);
  const [deleteDefaultConfirmId, setDeleteDefaultConfirmId] = useState(null);

  const loadTemplates = async (userId) => {
    if (!userId) return;
    const list = await getAffirmationTemplates(userId);
    setTemplates(list);
  };

  const loadDefaultTemplates = async () => {
    console.log("[Templates] loadDefaultTemplates called (via API)");
    try {
      const res = await fetch("/api/affirmation-templates/defaults");
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || errBody.message || `HTTP ${res.status}`);
      }
      const list = await res.json();
      console.log("[Templates] defaults API returned", list?.length ?? 0, "items");
      setDefaultTemplates(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("[Templates] loadDefaultTemplates error:", err?.message, err);
      setError(err?.message || "Failed to load default templates.");
      setDefaultTemplates([]);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setLoading(true);
        setError("");
        console.log("[Templates] Auth state changed, user:", user?.uid ?? "none");
        const activeUser = user || (await signInAnonymously(auth)).user;
        setUid(activeUser.uid);
        setUserLabel(activeUser.email || `anon:${activeUser.uid.slice(0, 8)}`);
        await loadTemplates(activeUser.uid);
        console.log("[Templates] About to load default templates");
        await loadDefaultTemplates();
      } catch (err) {
        console.error("[Templates] Auth/load error:", err?.message, err);
        setError(err?.message || "Failed to load.");
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const content = form.content.trim();
    if (!content || !uid) return;
    try {
      setSaving(true);
      setError("");
      await createAffirmationTemplate(uid, {
        name: name || content.slice(0, 30),
        content,
        category: form.category.trim(),
      });
      setForm(emptyTemplate);
      await loadTemplates(uid);
    } catch (err) {
      setError(err?.message || "Create failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingId || !uid) return;
    const name = form.name.trim();
    const content = form.content.trim();
    if (!content) return;
    try {
      setSaving(true);
      setError("");
      await updateAffirmationTemplate(uid, editingId, {
        name: name || content.slice(0, 30),
        content,
        category: form.category.trim(),
      });
      setEditingId(null);
      setForm(emptyTemplate);
      await loadTemplates(uid);
    } catch (err) {
      setError(err?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (templateId) => {
    if (!uid || !templateId) return;
    try {
      setSaving(true);
      setError("");
      await deleteAffirmationTemplate(uid, templateId);
      setDeleteConfirmId(null);
      if (editingId === templateId) {
        setEditingId(null);
        setForm(emptyTemplate);
      }
      await loadTemplates(uid);
    } catch (err) {
      setError(err?.message || "Delete failed.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (t) => {
    setEditingDefaultId(null);
    setEditingId(t.id);
    setForm({
      name: t.name,
      content: t.content,
      category: t.category || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingDefaultId(null);
    setForm(emptyTemplate);
  };

  const useDefaultTemplate = async (t) => {
    if (!uid) return;
    try {
      setUsingDefaultId(t.id);
      setError("");
      await createAffirmationTemplate(uid, {
        name: t.name || t.content.slice(0, 30),
        content: t.content,
        category: t.category || "",
      });
      await loadTemplates(uid);
    } catch (err) {
      setError(err?.message || "Failed to add template.");
    } finally {
      setUsingDefaultId(null);
    }
  };

  const startEditDefault = (t) => {
    setEditingId(null);
    setEditingDefaultId(t.id);
    setForm({
      name: t.name || "",
      content: t.content || "",
      category: t.category || "",
    });
  };

  const saveDefaultTemplate = async (e) => {
    e.preventDefault();
    if (!editingDefaultId) return;
    const name = form.name.trim();
    const content = form.content.trim();
    if (!content) return;
    try {
      setSaving(true);
      setError("");
      const res = await fetch(`/api/affirmation-templates/defaults/${editingDefaultId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || content.slice(0, 30),
          content,
          category: form.category.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Update failed");
      }
      setEditingDefaultId(null);
      setForm(emptyTemplate);
      await loadDefaultTemplates();
    } catch (err) {
      setError(err?.message || "Failed to update default template.");
    } finally {
      setSaving(false);
    }
  };

  const removeDefaultTemplate = async (id) => {
    try {
      setSaving(true);
      setError("");
      const res = await fetch(`/api/affirmation-templates/defaults/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Delete failed");
      }
      setDeleteDefaultConfirmId(null);
      if (editingDefaultId === id) {
        setEditingDefaultId(null);
        setForm(emptyTemplate);
      }
      await loadDefaultTemplates();
    } catch (err) {
      setError(err?.message || "Failed to remove default template.");
    } finally {
      setSaving(false);
    }
  };

  const defaultByCategory = defaultTemplates.reduce((acc, t) => {
    const cat = t.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  useEffect(() => {
    console.log("[Templates] defaultTemplates state updated, length:", defaultTemplates.length);
  }, [defaultTemplates]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white/70" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <nav className="fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-lg border-b border-white/10 z-50">
        <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/app_logo.svg"
              alt="LoA"
              width={28}
              height={28}
              className="rounded-lg"
            />
            <span className="text-white font-bold text-lg hidden sm:block">LoA</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {dashboardTabs.map((tab) => {
              const Icon = tab.icon;
              const active = tab.active;
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-white/10 text-white border border-white/20"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full px-3 py-1.5 text-xs bg-white/5 border border-white/10 text-white/80">
              {userLabel}
            </span>
            <button
              onClick={handleLogout}
              className="text-white/70 hover:text-red-400 transition-colors p-2"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="md:hidden flex flex-wrap gap-2 px-4 pb-3">
          {dashboardTabs.map((tab) => {
            const active = tab.active;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  active
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-white/5 border-white/10 text-white/80"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 pt-24 text-white">
        <section className="mb-6">
          <p className="inline-flex items-center gap-2 text-white/50 text-xs uppercase tracking-wider">
            <Cloud className="h-3.5 w-3.5" />
            Dashboard
          </p>
          <h1 className="text-3xl font-bold mt-2">Affirmation Templates</h1>
          <p className="text-white/60 mt-1">
            Create and manage reusable affirmation templates. Use them as starting points when writing affirmations.
          </p>
          {error && (
            <p className="mt-4 text-sm text-red-400 inline-flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> {error}
            </p>
          )}
        </section>

        <div className="grid lg:grid-cols-[360px_1fr] gap-6">
          {/* Create / Edit form */}
          <aside className="rounded-2xl bg-gradient-to-b from-white/10 to-white/[0.03] border border-white/15 p-5 space-y-4 h-fit lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold">
              {editingDefaultId ? "Edit default template" : editingId ? "Edit template" : "New template"}
            </h2>
            <form
              onSubmit={editingDefaultId ? saveDefaultTemplate : editingId ? handleUpdate : handleCreate}
              className="space-y-3"
            >
              <input
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                placeholder="Template name (e.g. Abundance)"
                className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30"
              />
              <textarea
                value={form.content}
                onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))}
                placeholder="Affirmation text..."
                rows={4}
                className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
                required
              />
              <input
                value={form.category}
                onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                placeholder="Category (e.g. Abundance)"
                className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30"
              />
              <div className="flex gap-2">
                {editingDefaultId ? (
                  <>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 rounded-xl bg-white text-black px-3 py-2.5 text-sm font-medium disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingDefaultId(null); setForm(emptyTemplate); }}
                      className="rounded-xl border border-white/20 px-3 py-2.5 text-sm text-white/70 hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  </>
                ) : editingId ? (
                  <>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 rounded-xl bg-white text-black px-3 py-2.5 text-sm font-medium disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-xl border border-white/20 px-3 py-2.5 text-sm text-white/70 hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full rounded-xl bg-white text-black px-3 py-2.5 text-sm font-medium disabled:opacity-50"
                  >
                    {saving ? "Creating..." : "Create template"}
                  </button>
                )}
              </div>
            </form>
          </aside>

          {/* List: Default templates + My templates */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 md:p-5 space-y-6">
            {/* Default templates */}
            {defaultTemplates.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Default templates</h2>
                  <span className="text-xs text-white/50">{defaultTemplates.length} total</span>
                </div>
                <p className="text-xs text-white/50 mb-3">
                  Add any template to your list to edit and use. Fill in the blank (______) when creating an affirmation.
                </p>
                <div className="space-y-4">
                  {Object.entries(defaultByCategory).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="text-sm font-medium text-white/80 mb-2">{category}</h3>
                      <div className="space-y-2">
                        {items.map((t) => (
                          <article
                            key={t.id}
                            className="rounded-xl border border-white/10 bg-black/20 p-3 flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm text-white/80 line-clamp-1 flex-1 min-w-0">{t.content}</p>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => startEditDefault(t)}
                                  className="rounded-lg border border-white/20 p-2 text-white/70 hover:bg-white/10 hover:text-white"
                                  title="Edit"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteDefaultConfirmId(t.id)}
                                  className="rounded-lg border border-red-500/30 p-2 text-red-400 hover:bg-red-500/10"
                                  title="Remove"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => useDefaultTemplate(t)}
                                  disabled={saving || usingDefaultId !== null}
                                  className="rounded-lg border border-white/20 px-2.5 py-1.5 text-xs font-medium hover:bg-white/10 disabled:opacity-50 inline-flex items-center gap-1"
                                >
                                  {usingDefaultId === t.id ? "Adding…" : (
                                    <>
                                      <Copy className="h-3.5 w-3.5" />
                                      Use
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                            {deleteDefaultConfirmId === t.id && (
                              <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                                <span className="text-xs text-white/50">Remove this default template?</span>
                                <button
                                  type="button"
                                  onClick={() => removeDefaultTemplate(t.id)}
                                  disabled={saving}
                                  className="rounded-lg bg-red-500/20 text-red-400 px-2.5 py-1.5 text-xs font-medium hover:bg-red-500/30 disabled:opacity-50"
                                >
                                  Yes, remove
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteDefaultConfirmId(null)}
                                  className="rounded-lg border border-white/20 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My templates */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">My templates</h2>
                <span className="text-xs text-white/50">{templates.length} total</span>
              </div>

            {templates.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-black/20 p-8 text-center">
                <FileText className="h-10 w-10 text-white/30 mx-auto mb-2" />
                <p className="text-sm text-white/60">No templates yet.</p>
                <p className="text-xs text-white/40 mt-1">
                  {defaultTemplates.length > 0
                    ? "Click “Use” on a default template above to add it here, or create one with the form on the left."
                    : "Create one using the form on the left, or run the seed to load default templates."}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {templates.map((t) => (
                <article
                  key={t.id}
                  className="rounded-xl border border-white/10 bg-black/30 p-4 hover:bg-black/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white/90">{t.name || "Untitled"}</p>
                      <p className="text-sm text-white/70 mt-1 line-clamp-2">{t.content}</p>
                      {t.category && (
                        <span className="inline-block mt-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/50">
                          {t.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(t)}
                        className="rounded-lg border border-white/20 p-2 text-white/70 hover:bg-white/10 hover:text-white"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(t.id)}
                        className="rounded-lg border border-red-500/30 p-2 text-red-400 hover:bg-red-500/10"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {deleteConfirmId === t.id && (
                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
                      <span className="text-xs text-white/50">Delete this template?</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        disabled={saving}
                        className="rounded-lg bg-red-500/20 text-red-400 px-2.5 py-1.5 text-xs font-medium hover:bg-red-500/30 disabled:opacity-50"
                      >
                        Yes, delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="rounded-lg border border-white/20 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
