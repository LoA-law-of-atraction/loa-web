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

  const addDefaultTemplate = async (t) => {
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
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-400/70" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black bg-[radial-gradient(ellipse_at_top,_rgba(88,28,135,0.10)_0%,_transparent_55%)] text-white">

      {/* Nav — matches dashboard */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-black/85 backdrop-blur-md border-b border-white/8 z-50">
        <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/app_logo.svg" alt="LoA" width={28} height={28} className="rounded-lg" />
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
                      ? "bg-purple-500/15 text-white border border-purple-500/30"
                      : "text-white/55 hover:text-white hover:bg-white/8"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full px-3 py-1.5 text-xs bg-white/5 border border-white/10 text-white/60">
              {userLabel}
            </span>
            <button onClick={handleLogout} className="text-white/40 hover:text-red-400 transition-colors p-2" title="Sign Out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden flex gap-1.5 px-4 pb-3 overflow-x-auto">
          {dashboardTabs.map((tab) => {
            const active = tab.active;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`rounded-lg px-3 py-1.5 text-sm shrink-0 transition-colors ${
                  active
                    ? "bg-purple-500/15 border border-purple-500/30 text-white"
                    : "bg-white/5 border border-white/8 text-white/60"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 pt-24 pb-12">

        {/* Page header */}
        <section className="mb-8">
          <p className="inline-flex items-center gap-1.5 text-purple-400/70 text-xs uppercase tracking-[0.15em] font-medium">
            <Cloud className="h-3 w-3" />
            Dashboard
          </p>
          <h1 className="font-tiempos text-3xl font-bold text-white mt-1.5">Affirmation Templates</h1>
          <p className="text-sm text-white/45 mt-1">
            Reusable starting points for your affirmation practice.
          </p>
          {error && (
            <p className="mt-3 text-sm text-red-400 inline-flex items-center gap-2 bg-red-400/8 border border-red-400/20 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </p>
          )}
        </section>

        <div className="grid lg:grid-cols-[360px_1fr] gap-6">

          {/* ——— Create / Edit panel ——— */}
          <aside className="h-fit lg:sticky lg:top-24 space-y-0">
            <div className="rounded-2xl bg-gradient-to-b from-purple-500/10 to-purple-500/[0.02] border border-purple-500/20 p-5 space-y-4">

              {/* Panel header */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <h2 className="font-tiempos text-lg font-semibold text-white leading-tight">
                    {editingDefaultId ? "Edit default" : editingId ? "Edit template" : "New template"}
                  </h2>
                  <p className="text-[11px] text-white/35 mt-0.5">
                    {editingId || editingDefaultId ? "Update the template below" : "Write a reusable affirmation pattern"}
                  </p>
                </div>
              </div>

              <form
                onSubmit={editingDefaultId ? saveDefaultTemplate : editingId ? handleUpdate : handleCreate}
                className="space-y-3"
              >
                <input
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder="Template name (e.g. Abundance)"
                  className="w-full rounded-xl bg-black/40 border border-purple-400/15 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                />
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))}
                  placeholder="Affirmation text... use ______ for fill-in-the-blank"
                  rows={4}
                  className="w-full rounded-xl bg-black/40 border border-purple-400/15 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all resize-none"
                  required
                />
                <input
                  value={form.category}
                  onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                  placeholder="Category (e.g. Abundance)"
                  className="w-full rounded-xl bg-black/40 border border-purple-400/15 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                />
                <div className="flex gap-2 pt-1">
                  {editingId || editingDefaultId ? (
                    <>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white px-3 py-2.5 text-sm font-semibold disabled:opacity-50 transition-all shadow-lg shadow-purple-500/20"
                      >
                        {saving ? "Saving..." : "Save changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { cancelEdit(); setEditingDefaultId(null); setForm(emptyTemplate); }}
                        className="rounded-xl border border-white/15 px-3 py-2.5 text-sm text-white/55 hover:bg-white/8 transition-all"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white px-3 py-2.5 text-sm font-semibold disabled:opacity-50 transition-all shadow-lg shadow-purple-500/20"
                    >
                      {saving ? "Creating..." : "Create template"}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </aside>

          {/* ——— Template lists ——— */}
          <div className="space-y-8">

            {/* Default templates */}
            {defaultTemplates.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-tiempos text-xl font-semibold text-white">Default templates</h2>
                    <p className="text-xs text-white/35 mt-0.5">Click &ldquo;Use&rdquo; to copy into your collection</p>
                  </div>
                  <span className="text-xs text-purple-300/60 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1 font-medium">
                    {defaultTemplates.length} total
                  </span>
                </div>

                <div className="space-y-5">
                  {Object.entries(defaultByCategory).map(([category, items]) => (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] tracking-[0.14em] uppercase font-medium text-purple-300/60 bg-purple-500/10 rounded-full px-2.5 py-0.5">
                          {category}
                        </span>
                        <div className="h-px flex-1 bg-white/5" />
                      </div>
                      <div className="space-y-2">
                        {items.map((t) => (
                          <article
                            key={t.id}
                            className="rounded-xl bg-white/[0.03] hover:bg-white/[0.05] p-4 flex flex-col gap-2 transition-colors group"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-tiempos text-xl italic text-white/90 leading-relaxed flex-1 min-w-0 line-clamp-2">
                                &ldquo;{t.content}&rdquo;
                              </p>
                              <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => startEditDefault(t)}
                                  className="rounded-lg p-1.5 text-white/50 hover:bg-white/8 hover:text-white transition-all"
                                  title="Edit"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteDefaultConfirmId(t.id)}
                                  className="rounded-lg p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/8 transition-all"
                                  title="Remove"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => addDefaultTemplate(t)}
                                  disabled={saving || usingDefaultId !== null}
                                  className="rounded-lg bg-purple-500/15 border border-purple-500/25 px-2.5 py-1.5 text-xs font-medium text-purple-300/80 hover:bg-purple-500/25 hover:text-purple-200 disabled:opacity-40 inline-flex items-center gap-1 transition-all"
                                >
                                  {usingDefaultId === t.id ? "Adding..." : (
                                    <>
                                      <Copy className="h-3 w-3" />
                                      Use
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                            {deleteDefaultConfirmId === t.id && (
                              <div className="pt-2 border-t border-white/8 flex items-center gap-2">
                                <span className="text-xs text-white/40">Remove this template?</span>
                                <button
                                  type="button"
                                  onClick={() => removeDefaultTemplate(t.id)}
                                  disabled={saving}
                                  className="rounded-lg bg-red-500/15 text-red-400 px-2.5 py-1 text-xs font-medium hover:bg-red-500/25 disabled:opacity-50"
                                >
                                  Yes, remove
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteDefaultConfirmId(null)}
                                  className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-white/50 hover:bg-white/8"
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
                <div>
                  <h2 className="font-tiempos text-xl font-semibold text-white">My templates</h2>
                  <p className="text-xs text-white/35 mt-0.5">Your personal collection</p>
                </div>
                <span className="text-xs text-purple-300/60 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1 font-medium">
                  {templates.length} total
                </span>
              </div>

              {templates.length === 0 && (
                <div className="rounded-xl border border-dashed border-purple-500/20 bg-purple-500/5 p-10 text-center">
                  <FileText className="h-8 w-8 text-purple-400/30 mx-auto mb-3" />
                  <p className="text-sm text-white/50 font-medium">No templates yet</p>
                  <p className="text-xs text-white/30 mt-1">
                    {defaultTemplates.length > 0
                      ? "Click \"Use\" on a default template above, or create one on the left."
                      : "Create one using the form on the left."}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates.map((t) => (
                  <article
                    key={t.id}
                    className="rounded-xl bg-white/[0.03] hover:bg-white/[0.05] overflow-hidden transition-colors group"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0 flex-1">
                          {t.name && (
                            <p className="text-xs text-white/40 font-medium uppercase tracking-[0.12em] mb-1">{t.name}</p>
                          )}
                          <blockquote className="font-tiempos text-xl italic leading-relaxed text-white/90">
                            &ldquo;{t.content}&rdquo;
                          </blockquote>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => startEdit(t)}
                            className="rounded-lg p-1.5 text-white/50 hover:bg-white/8 hover:text-white transition-all"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(t.id)}
                            className="rounded-lg p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/8 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {t.category && (
                        <span className="text-[10px] tracking-[0.12em] uppercase font-medium text-purple-300/65 bg-purple-500/10 rounded-full px-2.5 py-0.5">
                          {t.category}
                        </span>
                      )}

                      {deleteConfirmId === t.id && (
                        <div className="mt-3 pt-3 border-t border-white/8 flex items-center gap-2">
                          <span className="text-xs text-white/40">Delete this template?</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id)}
                            disabled={saving}
                            className="rounded-lg bg-red-500/15 text-red-400 px-2.5 py-1 text-xs font-medium hover:bg-red-500/25 disabled:opacity-50"
                          >
                            Yes, delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-white/50 hover:bg-white/8"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
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
