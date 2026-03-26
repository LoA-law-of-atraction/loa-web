"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { onAuthStateChanged } from "firebase/auth";
import { motion } from "framer-motion";
import Autoplay from "embla-carousel-autoplay";
import EmblaCarousel from "embla-carousel-react";
import {
  AlertCircle,
  Cloud,
  FileText,
  GalleryHorizontalEnd,
  House,
  ImagePlus,
  Sparkles,
  Star,
  TrendingUp,
  ChevronDown,
  Check,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import { auth } from "@/utils/firebase";
import {
  createAffirmation,
  ensureStreakDoc,
  fetchLoACloudData,
  softDeleteAffirmation,
  subscribeLoAAffirmations,
  updateAffirmation,
  uploadAffirmationImages,
  deleteAffirmationImage,
} from "@/utils/loaCloudSync";

const tabs = [
  { id: "home", label: "Overview", icon: House },
  { id: "affirmations", label: "Affirmations", icon: Sparkles },
  { id: "templates", label: "Templates", icon: FileText, href: "/dashboard/templates" },
  { id: "gallery", label: "Gallery", icon: GalleryHorizontalEnd },
];

const tabMeta = {
  home: {
    title: "Overview",
    description:
      "Create affirmations, collect images, and keep your manifestation practice consistent.",
  },
  affirmations: {
    title: "Affirmations",
    description: "Write, favorite, and track your personal affirmations.",
  },
  gallery: {
    title: "Gallery",
    description: "Browse your affirmation images and keep your vision visible.",
  },
};

const defaultInterceptSettings = {
  isEnabled: true,
  interceptedApps: [],
  cooldownPeriod: 5,
  requiredAffirmationsCount: 3,
};

const DEFAULT_SYSTEM_PROMPT = `You are a manifestation and Law of Attraction coach. Given a user's intention or desire (what they want to manifest), you generate one short, powerful affirmation.

Rules:
- Write the affirmation as if the user has ALREADY manifested it. Use present tense only: "I am...", "I have...", "I attract...", "I live...". It must sound like a current reality, not a future wish.
- No future tense or hoping: avoid "I will", "I want to", "I am going to". The affirmation should feel like a statement of fact about the present.
- Honor the user's specific desire: if they mention specific traits, a type of person, or a situation (e.g. "blonde Ukrainian wife", "dream job in Paris", "healthy at 80"), reflect those specifics in the affirmation in present tense. Do not replace them with generic phrases like "my ideal partner" or "my dream life"—keep their words where natural (e.g. "I am with my beloved blonde Ukrainian wife" or "I have a loving marriage with my blonde Ukrainian wife").
- Output exactly one affirmation: 1-2 sentences, first person.
- Keep it concise (under 20 words when possible) so it fits on a pause screen.
- Use positive, present-tense language as if it's already true.
- Align with Law of Attraction: focus on the feeling and state, not the lack—but keep the user's specific description when they give it.
- Return ONLY valid JSON: { "affirmation": "...", "category": "..." }.
- category: one short word or phrase (e.g. "Abundance", "Love", "Health", "Career", "Peace", "Relationship").`;

const USER_PROMPT_SUFFIX = "\n\nGenerate one short affirmation and a category. Return only JSON: { \"affirmation\": \"...\", \"category\": \"...\" }";

function AffirmationImageGrid({ urls = [] }) {
  const displayUrls = urls.slice(0, 4);
  const n = displayUrls.length;
  const hiddenCount = urls.length - n;
  const lastIndex = n - 1;

  const getCellSpan = (i) => {
    if (n === 1) return "col-span-2";
    if (n === 3 && i === 1) return "row-span-2";
    return "";
  };

  const gridRowsClass = n <= 2 ? "grid-rows-1" : "grid-rows-2";

  if (n === 0) {
    return (
      <div className="aspect-square grid-cols-2 flex flex-col items-center justify-center gap-1.5 rounded-lg border border-white/10 border-dashed w-full">
        <Sparkles className="w-8 h-8 text-white/25" />
        <span className="text-[11px] text-white/40">No image</span>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-1.5 shrink-0 w-full overflow-hidden aspect-square ${gridRowsClass}`}>
      {displayUrls.map((url, i) => (
        <div
          key={i}
          className={`relative rounded-lg overflow-hidden border border-white/20 min-h-0 min-w-0 w-full h-full ${getCellSpan(i)}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="w-full h-full object-cover object-center" />
          {i === lastIndex && hiddenCount > 0 && (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center rounded-lg">
              <span className="text-white font-semibold text-lg">+{hiddenCount}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TemplateSelect({ value, onChange, defaultTemplates, label, variant = "manual" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = defaultTemplates.find((t) => t.id === value);
  const grouped = useMemo(
    () =>
      defaultTemplates.reduce((acc, t) => {
        const cat = t.category || "Other";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(t);
        return acc;
      }, {}),
    [defaultTemplates]
  );

  useEffect(() => {
    const onOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("click", onOutside);
    return () => document.removeEventListener("click", onOutside);
  }, [open]);

  const isAi = variant === "ai";
  const triggerClass = `w-full flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 ${
    isAi
      ? "bg-black/30 border-white/10 hover:border-amber-400/30 focus:ring-amber-400/30"
      : "bg-black/30 border-white/10 hover:border-white/20 focus:ring-white/20"
  }`;
  const panelClass = `absolute left-0 right-0 top-full mt-1.5 z-20 rounded-xl border shadow-xl overflow-hidden ${
    isAi ? "border-amber-400/20 bg-black/95 shadow-amber-500/5" : "border-white/10 bg-black/95 shadow-black/50"
  }`;

  return (
    <div ref={ref} className="relative">
      <label className="text-xs text-white/50 block mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={triggerClass}
      >
        <span className="truncate text-white/90">
          {selected ? (selected.content.length > 52 ? selected.content.slice(0, 49) + "…" : selected.content) : "Choose a template"}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-white/50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className={panelClass} style={{ maxHeight: "16rem" }}>
          <div className="overflow-y-auto max-h-64 py-1">
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 transition-colors text-left"
            >
              {!value ? <Check className="h-4 w-4 text-white/80" /> : <span className="w-4" />}
              None
            </button>
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/40 sticky top-0 bg-black/90 backdrop-blur">
                  {category}
                </p>
                {items.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { onChange(t.id); setOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors ${
                      value === t.id ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/5"
                    }`}
                  >
                    {value === t.id ? <Check className="h-4 w-4 shrink-0 text-white" /> : <span className="w-4 shrink-0" />}
                    <span className="line-clamp-2">{t.content}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const validTabIds = ["home", "affirmations", "gallery"];
  const initialTab = validTabIds.includes(tabFromUrl) ? tabFromUrl : "home";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [affirmations, setAffirmations] = useState([]);
  const [streak, setStreak] = useState(null);
  const [interceptSettings, setInterceptSettings] = useState(defaultInterceptSettings);
  const [schedules, setSchedules] = useState([]);

  const [newAffirmation, setNewAffirmation] = useState({
    content: "",
    category: "",
    isFavorite: false,
    files: [],
  });
  const [newAffirmationImagePreviews, setNewAffirmationImagePreviews] = useState([]);
  const [manifestInput, setManifestInput] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [generatingAffirmation, setGeneratingAffirmation] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(null);
  const [aiAffirmationFiles, setAiAffirmationFiles] = useState([]);
  const [aiAffirmationImagePreviews, setAiAffirmationImagePreviews] = useState([]);
  const aiAffirmationImageInputRef = useRef(null);
  const aiNextImageAppendRef = useRef(false);
  const [schedulesJson, setSchedulesJson] = useState("[]");
  const [defaultTemplates, setDefaultTemplates] = useState([]);
  const [selectedTemplateIdManual, setSelectedTemplateIdManual] = useState("");
  const [selectedTemplateIdAi, setSelectedTemplateIdAi] = useState("");
  const [editingAffirmationDocId, setEditingAffirmationDocId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingCategory, setEditingCategory] = useState("");
  const [editingImageUrls, setEditingImageUrls] = useState([]);
  const [editingCloudImagePaths, setEditingCloudImagePaths] = useState([]);
  const [editingNewFiles, setEditingNewFiles] = useState([]);
  const [editingNewPreviews, setEditingNewPreviews] = useState([]);
  const [pastedImageUrl, setPastedImageUrl] = useState("");
  const [imageUrlLoading, setImageUrlLoading] = useState(false);
  const [imageUrlError, setImageUrlError] = useState("");
  const [isDragOverManualImages, setIsDragOverManualImages] = useState(false);
  const [isDragOverAiImages, setIsDragOverAiImages] = useState(false);
  const [isDragOverEditImages, setIsDragOverEditImages] = useState(false);
  const editingNewFilesInputRef = useRef(null);
  const editingNextImageAppendRef = useRef(false);
  const newAffirmationImageInputRef = useRef(null);
  const nextImageAppendRef = useRef(false);
  const activeMeta = tabMeta[activeTab] || tabMeta.home;

  const [showSystemPrompt, setShowSystemPrompt] = useState(false);

  const [emblaRef, emblaApi] = EmblaCarousel(
    {
      loop: affirmations.length > 1,
      draggable: true,
      align: "start",
      containScroll: "trimSnaps",
      skipSnaps: false,
    },
    [Autoplay({ delay: 5000, stopOnInteraction: true })]
  );

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && validTabIds.includes(t)) setActiveTab(t);
  }, [searchParams]);

  const setActiveTabAndUrl = (tabId) => {
    setActiveTab(tabId);
    router.replace(`/dashboard?tab=${tabId}`, { scroll: false });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setLoading(true);
        setError("");
        if (!user || user.isAnonymous) {
          setUid("");
          router.replace("/login");
          return;
        }
        const activeUser = user;
        setUid(activeUser.uid);

        await ensureStreakDoc(activeUser.uid);
        const cloud = await fetchLoACloudData(activeUser.uid);
        setAffirmations(cloud.affirmations);
        setStreak(cloud.streak);
        setInterceptSettings(cloud.interceptSettings || defaultInterceptSettings);
        setSchedules(Array.isArray(cloud.schedules) ? cloud.schedules : []);
        setSchedulesJson(
          JSON.stringify(Array.isArray(cloud.schedules) ? cloud.schedules : [], null, 2),
        );
        const templatesRes = await fetch("/api/affirmation-templates/defaults").catch(() => null);
        if (templatesRes?.ok) {
          const list = await templatesRes.json();
          setDefaultTemplates(Array.isArray(list) ? list : []);
        } else {
          setDefaultTemplates([]);
        }
      } catch (err) {
        setError(err?.message || "Failed to sync cloud data.");
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Realtime affirmation sync (same contract as mobile: live Firestore + updated_at / is_deleted).
  useEffect(() => {
    if (!uid) return undefined;
    const unsub = subscribeLoAAffirmations(uid, setAffirmations, (err) => {
      console.error("[LoA] affirmation sync subscription failed:", err);
    });
    return () => unsub();
  }, [uid]);

  const affirmationsWithImages = useMemo(
    () => affirmations.filter((a) => a.imageUrl?.trim()),
    [affirmations],
  );

  const favoriteCount = useMemo(
    () => affirmations.filter((a) => a.isFavorite).length,
    [affirmations],
  );

  const totalAffirmCount = useMemo(
    () => affirmations.reduce((sum, a) => sum + (a.affirmCount || 0), 0),
    [affirmations],
  );

  const refreshCloud = async () => {
    if (!uid) return;
    const cloud = await fetchLoACloudData(uid);
    setAffirmations(cloud.affirmations);
    setStreak(cloud.streak);
    setInterceptSettings(cloud.interceptSettings || defaultInterceptSettings);
    setSchedules(Array.isArray(cloud.schedules) ? cloud.schedules : []);
    setSchedulesJson(
      JSON.stringify(Array.isArray(cloud.schedules) ? cloud.schedules : [], null, 2),
    );
  };

  const withSaving = async (fn) => {
    try {
      setSaving(true);
      setError("");
      await fn();
      await refreshCloud();
    } catch (err) {
      setError(err?.message || "Operation failed.");
    } finally {
      setSaving(false);
    }
  };

  const addAffirmation = async () => {
    const content = newAffirmation.content.trim();
    if (!content || !uid) return;
    await withSaving(async () => {
      await createAffirmation(uid, {
        content,
        category: newAffirmation.category.trim(),
        isFavorite: newAffirmation.isFavorite,
        affirmCount: 0,
        files: newAffirmation.files,
      });
      setNewAffirmation({ content: "", category: "", isFavorite: false, files: [] });
      newAffirmationImagePreviews.forEach((url) => URL.revokeObjectURL(url));
      setNewAffirmationImagePreviews([]);
      setSelectedTemplateIdManual("");
    });
  };

  const generateAffirmationWithAI = async () => {
    const intention = manifestInput.trim();
    if (!intention) {
      setError("Enter what you want to manifest first.");
      return;
    }
    try {
      setGeneratingAffirmation(true);
      setError("");
      const res = await fetch("/api/affirmations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manifestInput: intention, systemPrompt: systemPrompt.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Failed to generate");
      const userMessage = `What I want to manifest: ${intention}${USER_PROMPT_SUFFIX}`;
      setAiGenerated({
        content: data.affirmation || "",
        category: data.category || "Manifestation",
        prompt: data.prompt || userMessage,
      });
    } catch (err) {
      setError(err?.message || "Could not generate affirmation.");
    } finally {
      setGeneratingAffirmation(false);
    }
  };

  const saveAiAffirmation = async () => {
    if (!aiGenerated?.content?.trim() || !uid) return;
    await withSaving(async () => {
      await createAffirmation(uid, {
        content: aiGenerated.content.trim(),
        category: aiGenerated.category.trim(),
        isFavorite: false,
        affirmCount: 0,
        files: aiAffirmationFiles,
      });
      aiAffirmationImagePreviews.forEach((url) => URL.revokeObjectURL(url));
      setAiGenerated(null);
      setAiAffirmationFiles([]);
      setAiAffirmationImagePreviews([]);
      setSelectedTemplateIdAi("");
    });
  };

  const applyTemplateToManual = (templateId) => {
    setSelectedTemplateIdManual(templateId || "");
    if (!templateId) return;
    const t = defaultTemplates.find((x) => x.id === templateId);
    if (t) {
      setNewAffirmation((s) => ({
        ...s,
        content: t.content || s.content,
        category: t.category || s.category,
      }));
    }
  };

  const applyTemplateToAi = (templateId) => {
    setSelectedTemplateIdAi(templateId || "");
    if (!templateId) {
      setAiGenerated(null);
      return;
    }
    const t = defaultTemplates.find((x) => x.id === templateId);
    if (t) {
      setAiGenerated({ content: t.content || "", category: t.category || "" });
    }
  };

  const handleAffirmationImageSelect = (files, append = false) => {
    const selected = Array.from(files || [])
      .filter(Boolean)
      .filter((f) => f.type?.startsWith?.("image/"));
    if (!selected.length) {
      if (!append) {
        newAffirmationImagePreviews.forEach((url) => URL.revokeObjectURL(url));
        setNewAffirmation((s) => ({ ...s, files: [] }));
        setNewAffirmationImagePreviews([]);
      }
      return;
    }
    if (append) {
      setNewAffirmation((s) => ({ ...s, files: [...s.files, ...selected] }));
      const newPreviews = selected.map((file) => URL.createObjectURL(file));
      setNewAffirmationImagePreviews((prev) => [...prev, ...newPreviews]);
    } else {
      newAffirmationImagePreviews.forEach((url) => URL.revokeObjectURL(url));
      setNewAffirmation((s) => ({ ...s, files: selected }));
      setNewAffirmationImagePreviews(selected.map((file) => URL.createObjectURL(file)));
    }
  };

  const removeOneNewAffirmationImage = (index) => {
    URL.revokeObjectURL(newAffirmationImagePreviews[index]);
    setNewAffirmation((s) => ({
      ...s,
      files: s.files.filter((_, i) => i !== index),
    }));
    setNewAffirmationImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAiAffirmationImageSelect = (files, append = false) => {
    const selected = Array.from(files || [])
      .filter(Boolean)
      .filter((f) => f.type?.startsWith?.("image/"));
    if (!selected.length) {
      if (!append) {
        aiAffirmationImagePreviews.forEach((url) => URL.revokeObjectURL(url));
        setAiAffirmationFiles([]);
        setAiAffirmationImagePreviews([]);
      }
      return;
    }
    if (append) {
      setAiAffirmationFiles((prev) => [...prev, ...selected]);
      const newPreviews = selected.map((f) => URL.createObjectURL(f));
      setAiAffirmationImagePreviews((prev) => [...prev, ...newPreviews]);
    } else {
      aiAffirmationImagePreviews.forEach((url) => URL.revokeObjectURL(url));
      setAiAffirmationFiles(selected);
      setAiAffirmationImagePreviews(selected.map((f) => URL.createObjectURL(f)));
    }
  };

  const removeOneAiAffirmationImage = (index) => {
    URL.revokeObjectURL(aiAffirmationImagePreviews[index]);
    setAiAffirmationFiles((prev) => prev.filter((_, i) => i !== index));
    setAiAffirmationImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const fetchImageFromUrl = async (url) => {
    const trimmed = url?.trim();
    if (!trimmed) return null;
    setImageUrlError("");
    setImageUrlLoading(true);
    console.log("[paste-image] Fetching from URL:", trimmed.slice(0, 100));
    try {
      const res = await fetch(
        `/api/download-image?url=${encodeURIComponent(trimmed)}&filename=pasted-image.jpg`
      );
      console.log("[paste-image] API response status:", res.status, "ok:", res.ok, "content-type:", res.headers.get("content-type"));
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.log("[paste-image] API error body:", data);
        const msg = data.error || data.message || `Failed to load image (${res.status})`;
        const hint = data.hint ? ` ${data.hint}` : "";
        throw new Error(msg + hint);
      }
      const blob = await res.blob();
      console.log("[paste-image] Blob from API size:", blob.size, "type:", blob.type);
      const ct = (res.headers.get("content-type") || blob.type || "").toLowerCase();
      if (ct.includes("text/html")) {
        console.warn("[paste-image] Server returned HTML instead of image");
        setImageUrlError("This link points to a web page, not an image. Use a direct image URL or try another Pinterest pin.");
        return null;
      }
      const ext = (blob.type || "").includes("png") ? "png" : "jpg";
      const file = new File([blob], `pasted-image.${ext}`, { type: blob.type || "image/jpeg" });
      console.log("[paste-image] Created File:", file.name, file.size, file.type);
      return file;
    } catch (err) {
      console.error("[paste-image] Error:", err?.message, err);
      setImageUrlError(err?.message || "Failed to load image");
      return null;
    } finally {
      setImageUrlLoading(false);
    }
  };

  const addImageFromUrlToManual = async () => {
    const file = await fetchImageFromUrl(pastedImageUrl);
    console.log("[paste-image] addImageFromUrlToManual file:", file ? `${file.name} ${file.size}b` : file);
    if (file) {
      setPastedImageUrl("");
      handleAffirmationImageSelect([file], true);
      console.log("[paste-image] Appended to manual form; newAffirmation.files will update");
    } else if (pastedImageUrl.trim()) {
      setImageUrlError("Enter a valid image URL");
    }
  };

  const addImageFromUrlToAi = async () => {
    const file = await fetchImageFromUrl(pastedImageUrl);
    console.log("[paste-image] addImageFromUrlToAi file:", file ? `${file.name} ${file.size}b` : file);
    if (file) {
      setPastedImageUrl("");
      handleAiAffirmationImageSelect([file], true);
      console.log("[paste-image] Appended to AI form");
    } else if (pastedImageUrl.trim()) {
      setImageUrlError("Enter a valid image URL");
    }
  };

  const addImageFromUrlToEdit = async () => {
    const file = await fetchImageFromUrl(pastedImageUrl);
    console.log("[paste-image] addImageFromUrlToEdit file:", file ? `${file.name} ${file.size}b` : file);
    if (file) {
      setPastedImageUrl("");
      handleEditingNewImages([file], true);
      console.log("[paste-image] Appended to edit form");
    } else if (pastedImageUrl.trim()) {
      setImageUrlError("Enter a valid image URL");
    }
  };

  useEffect(() => {
    return () => {
      newAffirmationImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newAffirmationImagePreviews]);

  useEffect(() => {
    return () => {
      aiAffirmationImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [aiAffirmationImagePreviews]);

  useEffect(() => {
    if (activeTab !== "affirmations") return;
    const onPaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length === 0) return;
      e.preventDefault();
      if (editingAffirmationDocId) {
        handleEditingNewImages(imageFiles, true);
      } else if (aiGenerated) {
        handleAiAffirmationImageSelect(imageFiles, true);
      } else {
        handleAffirmationImageSelect(imageFiles, true);
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [activeTab, editingAffirmationDocId, aiGenerated]);

  const removeAffirmation = async (docId) => {
    await withSaving(async () => {
      await softDeleteAffirmation(uid, docId);
    });
  };

  const incrementAffirmCount = async (item) => {
    await withSaving(async () => {
      await updateAffirmation(uid, item.docId, { affirmCount: (item.affirmCount || 0) + 1 });
    });
  };

  const toggleFavorite = async (item) => {
    await withSaving(async () => {
      await updateAffirmation(uid, item.docId, { isFavorite: !item.isFavorite });
    });
  };

  const startEditingAffirmation = (item) => {
    setEditingAffirmationDocId(item.docId);
    setEditingContent(item.content || "");
    setEditingCategory(item.category || "");
    setEditingImageUrls(item.imageUrls || []);
    setEditingCloudImagePaths(item.cloudImagePaths || []);
    setEditingNewFiles([]);
    setEditingNewPreviews([]);
  };

  const cancelEditAffirmation = () => {
    setEditingNewPreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
    setEditingAffirmationDocId(null);
    setEditingContent("");
    setEditingCategory("");
    setEditingImageUrls([]);
    setEditingCloudImagePaths([]);
    setEditingNewFiles([]);
    setEditingNewPreviews([]);
    setImageUrlError("");
  };

  const confirmRemoveEditingExistingImage = async (index) => {
    const path = editingCloudImagePaths[index];
    if (!path || !uid || !editingAffirmationDocId) return;
    if (!window.confirm("Remove this image? It will be permanently deleted from storage.")) return;
    await withSaving(async () => {
      await deleteAffirmationImage(uid, editingAffirmationDocId, path, editingCloudImagePaths);
      setEditingCloudImagePaths((prev) => prev.filter((_, i) => i !== index));
      setEditingImageUrls((prev) => prev.filter((_, i) => i !== index));
      setAffirmations((prev) =>
        prev.map((a) => {
          if (a.docId !== editingAffirmationDocId) return a;
          const newPaths = a.cloudImagePaths?.filter((_, i) => i !== index) || [];
          const newUrls = a.imageUrls?.filter((_, i) => i !== index) || [];
          return { ...a, cloudImagePaths: newPaths, imageUrls: newUrls };
        })
      );
      await refreshCloud();
    });
  };

  const handleEditingNewImages = (files, append = false) => {
    const selected = Array.from(files || [])
      .filter(Boolean)
      .filter((f) => f.type?.startsWith?.("image/"));
    if (!selected.length) {
      if (!append) {
        setEditingNewPreviews((prev) => {
          prev.forEach((url) => URL.revokeObjectURL(url));
          return [];
        });
        setEditingNewFiles([]);
      }
      return;
    }
    if (append) {
      setEditingNewFiles((prev) => [...prev, ...selected]);
      const newPreviews = selected.map((f) => URL.createObjectURL(f));
      setEditingNewPreviews((prev) => [...prev, ...newPreviews]);
    } else {
      setEditingNewPreviews((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url));
        return selected.map((f) => URL.createObjectURL(f));
      });
      setEditingNewFiles(selected);
    }
  };

  const removeOneEditingNewImage = (index) => {
    URL.revokeObjectURL(editingNewPreviews[index]);
    setEditingNewFiles((prev) => prev.filter((_, i) => i !== index));
    setEditingNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const saveEditAffirmation = async () => {
    if (!editingAffirmationDocId || !uid) return;
    await withSaving(async () => {
      const keptPaths = [...editingCloudImagePaths];
      let finalPaths = [...keptPaths];
      if (editingNewFiles.length > 0) {
        const newPaths = await uploadAffirmationImages(
          uid,
          editingAffirmationDocId,
          editingNewFiles,
          finalPaths.length
        );
        finalPaths = [...finalPaths, ...newPaths];
      }
      await updateAffirmation(uid, editingAffirmationDocId, {
        content: editingContent.trim() || "",
        category: editingCategory.trim() || "",
        cloudImagePaths: finalPaths,
      });
      setAffirmations((prev) =>
        prev.map((a) => {
          if (a.docId !== editingAffirmationDocId) return a;
          return {
            ...a,
            content: editingContent.trim() || "",
            category: editingCategory.trim() || "",
            cloudImagePaths: finalPaths,
            imageUrls: a.imageUrls, // will refresh on next load; could resolve if needed
          };
        })
      );
      cancelEditAffirmation();
      await refreshCloud();
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white/70" />
      </div>
    );
  }

  return (
      <div className="max-w-7xl mx-auto px-4 py-8 pt-20 md:pt-24 text-white">
      <section className="mb-6 max-w-2xl mx-auto">
            <p className="inline-flex items-center gap-2 text-purple-400/70 text-xs uppercase tracking-widest font-medium">
              <Cloud className="h-3.5 w-3.5" />
              LoA Dashboard
            </p>
            <h1 className="font-tiempos text-3xl font-bold mt-2 text-white">{activeMeta.title}</h1>
            <p className="text-white/50 mt-1">
              {activeMeta.description}
            </p>
        {error && (
          <p className="mt-4 text-sm text-red-400 inline-flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </p>
        )}
      </section>

      {activeTab === "home" && (
        <section className="space-y-3 max-w-2xl mx-auto">

          {/* ── Stats ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-wrap gap-x-8 gap-y-4 py-2"
          >
            {[
              { label: "Affirmations", value: affirmations.length },
              { label: "Favorites", value: favoriteCount },
              { label: "Gallery", value: affirmationsWithImages.length },
              { label: "Total affirmed", value: totalAffirmCount },
              { label: "🔥 Streak", value: streak?.currentStreak ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-baseline gap-2">
                <span className="font-tiempos text-xl text-white">{value}</span>
                <span className="text-xs text-white/35">{label}</span>
              </div>
            ))}
          </motion.div>

          {affirmations.length > 0 && (
            <article className="pt-4 w-full">
              {/* Mobile: vertical cards */}
              <div className="sm:hidden space-y-3">
                {affirmations.map((item) => {
                  const urls = item.imageUrls?.length ? item.imageUrls : (item.imageUrl ? [item.imageUrl] : []);
                  return (
                    <Link
                      key={item.docId}
                      href={`/dashboard/preview/${item.docId}?from=home`}
                      className="block rounded-xl overflow-hidden w-full"
                    >
                      <AffirmationImageGrid urls={urls} />
                      <div className="p-3">
                        <p className="font-tiempos text-xl italic leading-relaxed text-white/85 line-clamp-3">&ldquo;{item.content}&rdquo;</p>
                        {item.category && (
                          <p className="mt-1.5 text-[11px] text-white/50">{item.category}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Desktop: horizontal carousel */}
              <div className="hidden sm:block embla overflow-hidden max-w-2xl mx-auto" ref={emblaRef}>
                <div className="embla__container flex gap-3">
                  {affirmations.map((item) => {
                    const urls = item.imageUrls?.length ? item.imageUrls : (item.imageUrl ? [item.imageUrl] : []);
                    return (
                      <div key={item.docId} className="embla__slide flex-[0_0_44%] md:flex-[0_0_32%] min-w-0">
                        <Link
                          href={`/dashboard/preview/${item.docId}?from=home`}
                          className="block rounded-xl overflow-hidden flex flex-col w-full cursor-pointer"
                        >
                          <AffirmationImageGrid urls={urls} />
                          <div className="p-3 shrink-0">
                            <p className="font-tiempos text-xl italic leading-relaxed text-white/85 line-clamp-3">&ldquo;{item.content}&rdquo;</p>
                            {item.category && (
                              <p className="mt-1.5 text-[11px] text-white/50">{item.category}</p>
                            )}
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
          )}
        </section>
      )}

      {activeTab === "affirmations" && (
        <section className="grid lg:grid-cols-[380px_1fr] gap-5">
          <aside className="space-y-5 lg:sticky lg:top-24 h-fit">
            {/* ——— Create manually ——— */}
            <div className="rounded-2xl bg-gradient-to-b from-purple-500/10 to-purple-500/[0.02] border border-purple-500/20 p-5 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-[10px] text-purple-400 font-bold shrink-0">✦</span>
                  <h2 className="font-tiempos text-lg font-semibold text-white">Write it yourself</h2>
                </div>
                <p className="text-xs text-white/40 pl-7">Craft your affirmation and attach a vision image.</p>
              </div>
              {defaultTemplates.length > 0 && (
                <TemplateSelect
                  label="Optional: start from template"
                  value={selectedTemplateIdManual}
                  onChange={(id) => applyTemplateToManual(id)}
                  defaultTemplates={defaultTemplates}
                  variant="manual"
                />
              )}
              <div className="space-y-3">
                <textarea
                  value={newAffirmation.content}
                  onChange={(e) => setNewAffirmation((s) => ({ ...s, content: e.target.value }))}
                  placeholder="I am already living my dream life."
                  rows={4}
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm placeholder:text-white/25 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 resize-none transition-all"
                />
                <input
                  value={newAffirmation.category}
                  onChange={(e) => setNewAffirmation((s) => ({ ...s, category: e.target.value }))}
                  placeholder="Category (e.g. Abundance)"
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm placeholder:text-white/25 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                />
                <div
                  className={`rounded-xl border border-white/10 bg-black/30 p-3 transition-colors ${isDragOverManualImages ? "border-white/40 bg-white/10" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragOverManualImages(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOverManualImages(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragOverManualImages(false);
                    const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith("image/"));
                    if (files.length) handleAffirmationImageSelect(files, true);
                  }}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm text-white/80 inline-flex items-center gap-2">
                        <ImagePlus className="h-4 w-4" />
                        Vision Images
                      </p>
                      <p className="text-[11px] text-white/40 mt-1">
                        Add multiple images (drag & drop, select files, paste URL, or Ctrl+V).
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          nextImageAppendRef.current = false;
                          newAffirmationImageInputRef.current?.click();
                        }}
                        className="rounded-lg border border-white/20 px-3 py-1.5 text-xs cursor-pointer hover:bg-white/10"
                      >
                        {newAffirmation.files.length ? "Replace all" : "Add images"}
                      </button>
                      {newAffirmation.files.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            nextImageAppendRef.current = true;
                            newAffirmationImageInputRef.current?.click();
                          }}
                          className="rounded-lg border border-white/20 px-3 py-1.5 text-xs cursor-pointer hover:bg-white/10"
                        >
                          Add more
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    ref={newAffirmationImageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const list = e.target.files;
                      const append = nextImageAppendRef.current;
                      if (list?.length) handleAffirmationImageSelect(Array.from(list), append);
                      e.target.value = "";
                    }}
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-white/40">Or paste image URL (e.g. Pinterest):</span>
                    <input
                      type="url"
                      value={pastedImageUrl}
                      onChange={(e) => { setPastedImageUrl(e.target.value); setImageUrlError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImageFromUrlToManual())}
                      placeholder="https://..."
                      className="flex-1 min-w-[160px] rounded-lg bg-black/30 border border-white/10 px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                    />
                    <button
                      type="button"
                      onClick={addImageFromUrlToManual}
                      disabled={imageUrlLoading}
                      className="rounded-lg border border-white/20 px-2.5 py-1.5 text-xs hover:bg-white/10 disabled:opacity-50"
                    >
                      {imageUrlLoading ? "Loading…" : "Add"}
                    </button>
                  </div>
                  {imageUrlError && (
                    <p className="mt-1.5 text-[11px] text-red-400">{imageUrlError}</p>
                  )}
                  {newAffirmationImagePreviews.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[11px] text-white/50">{newAffirmationImagePreviews.length} image(s)</p>
                      <div className="grid grid-cols-3 gap-2">
                        {newAffirmationImagePreviews.map((preview, index) => (
                          <div
                            key={`${preview}-${index}`}
                            className="relative rounded-lg overflow-hidden border border-white/10 group aspect-[9/16]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeOneNewAffirmationImage(index)}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/90 transition-opacity"
                              aria-label="Remove image"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAffirmationImageSelect([])}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remove all images
                      </button>
                    </div>
                  )}
                </div>
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={newAffirmation.isFavorite}
                    onChange={(e) =>
                      setNewAffirmation((s) => ({ ...s, isFavorite: e.target.checked }))
                    }
                  />
                  Mark as favorite
                </label>
              </div>
              <button
                onClick={addAffirmation}
                disabled={saving}
                className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white px-3 py-2.5 text-sm font-semibold disabled:opacity-50 transition-all shadow-lg shadow-purple-500/20"
              >
                {saving ? "Saving..." : "Create Affirmation"}
              </button>
            </div>

            {/* ——— Generate with AI ——— */}
            <div className="rounded-2xl bg-gradient-to-b from-amber-500/10 to-amber-500/[0.02] border border-amber-400/20 p-5 space-y-4">

              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <h2 className="font-tiempos text-lg font-semibold text-white leading-tight">Generate with AI</h2>
                  <p className="text-[11px] text-white/35 mt-0.5">Describe your intention, receive an affirmation</p>
                </div>
              </div>

              {defaultTemplates.length > 0 && (
                <TemplateSelect
                  label="Optional: start from template"
                  value={selectedTemplateIdAi}
                  onChange={(id) => applyTemplateToAi(id)}
                  defaultTemplates={defaultTemplates}
                  variant="ai"
                />
              )}

              {/* Intention input + inline generate */}
              <div className="relative">
                <input
                  value={manifestInput}
                  onChange={(e) => setManifestInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !generatingAffirmation && manifestInput.trim() && generateAffirmationWithAI()}
                  placeholder="What do you want to manifest?"
                  className="w-full rounded-xl bg-black/40 border border-amber-400/15 px-4 py-3.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-amber-400/40 focus:bg-black/50 transition-all pr-28"
                />
                <button
                  type="button"
                  onClick={generateAffirmationWithAI}
                  disabled={generatingAffirmation || !manifestInput.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/25 disabled:text-black/40 disabled:cursor-not-allowed text-black font-semibold text-xs px-3 py-1.5 transition-all"
                >
                  {generatingAffirmation ? "…" : "Generate"}
                </button>
              </div>

              {/* Advanced toggle */}
              <button
                type="button"
                onClick={() => setShowSystemPrompt((v) => !v)}
                className="flex items-center gap-1.5 text-[11px] text-white/25 hover:text-white/45 transition-colors"
              >
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showSystemPrompt ? "rotate-180" : ""}`} />
                Advanced: edit AI instructions
              </button>

              {showSystemPrompt && (
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={6}
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-xs font-mono text-white/60 focus:outline-none focus:border-amber-400/25 resize-y"
                />
              )}

              {/* AI result card — appears after generation */}
              {aiGenerated && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="rounded-xl border border-amber-400/25 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-amber-400/70" />
                      <span className="text-[10px] uppercase tracking-[0.18em] text-amber-400/60 font-medium">AI Result</span>
                    </div>
                    <span className="text-[10px] text-white/25">Edit if needed, then save</span>
                  </div>
                  <textarea
                    value={aiGenerated.content}
                    onChange={(e) => setAiGenerated((s) => (s ? { ...s, content: e.target.value } : null))}
                    rows={3}
                    className="w-full rounded-lg bg-black/30 border border-amber-400/15 px-3 py-2.5 text-sm text-white/95 italic font-medium focus:outline-none focus:border-amber-400/35 resize-none placeholder:text-white/20"
                  />
                  <input
                    value={aiGenerated.category}
                    onChange={(e) => setAiGenerated((s) => (s ? { ...s, category: e.target.value } : null))}
                    placeholder="Category (e.g. Abundance)"
                    className="w-full rounded-lg bg-black/30 border border-amber-400/15 px-3 py-2 text-xs text-white/70 placeholder:text-white/20 focus:outline-none focus:border-amber-400/30"
                  />
                  <div
                    className={`rounded-xl border border-dashed p-3 transition-colors ${isDragOverAiImages ? "border-amber-400/45 bg-amber-500/8" : "border-amber-400/18 bg-black/20"}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragOverAiImages(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOverAiImages(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragOverAiImages(false);
                      const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith("image/"));
                      if (files.length) handleAiAffirmationImageSelect(files, true);
                    }}
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-white/35 inline-flex items-center gap-1.5">
                        <ImagePlus className="h-3.5 w-3.5 text-amber-400/50" />
                        Vision images <span className="text-white/20 ml-0.5">(optional)</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => { aiNextImageAppendRef.current = false; aiAffirmationImageInputRef.current?.click(); }}
                          className="text-[11px] text-amber-400/60 hover:text-amber-400 transition-colors"
                        >
                          {aiAffirmationFiles.length ? "Replace" : "Upload"}
                        </button>
                        {aiAffirmationFiles.length > 0 && (
                          <button
                            type="button"
                            onClick={() => { aiNextImageAppendRef.current = true; aiAffirmationImageInputRef.current?.click(); }}
                            className="text-[11px] text-white/25 hover:text-white/55 transition-colors"
                          >
                            + More
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      ref={aiAffirmationImageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const list = e.target.files;
                        const append = aiNextImageAppendRef.current;
                        if (list?.length) handleAiAffirmationImageSelect(Array.from(list), append);
                        e.target.value = "";
                      }}
                    />

                    {/* URL paste row */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="url"
                        value={pastedImageUrl}
                        onChange={(e) => { setPastedImageUrl(e.target.value); setImageUrlError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImageFromUrlToAi())}
                        placeholder="Paste image URL…"
                        className="flex-1 rounded-lg bg-black/30 border border-white/8 px-2.5 py-1.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/30"
                      />
                      <button
                        type="button"
                        onClick={addImageFromUrlToAi}
                        disabled={imageUrlLoading}
                        className="rounded-lg bg-amber-500/12 border border-amber-400/18 px-2.5 py-1.5 text-xs text-amber-300/75 hover:bg-amber-500/22 disabled:opacity-40 transition-colors shrink-0"
                      >
                        {imageUrlLoading ? "…" : "Add"}
                      </button>
                    </div>

                    {imageUrlError && aiGenerated && (
                      <p className="mt-1 text-[11px] text-red-400">{imageUrlError}</p>
                    )}

                    {aiAffirmationImagePreviews.length > 0 ? (
                      <div className="mt-2.5">
                        <div className="grid grid-cols-4 gap-1.5">
                          {aiAffirmationImagePreviews.map((preview, index) => (
                            <div
                              key={`ai-${preview}-${index}`}
                              className="relative rounded-lg overflow-hidden border border-white/10 group aspect-[9/16]"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeOneAiAffirmationImage(index)}
                                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/85 transition-opacity"
                                aria-label="Remove image"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAiAffirmationImageSelect([])}
                          className="mt-1.5 text-[11px] text-white/20 hover:text-red-400 transition-colors"
                        >
                          Clear all
                        </button>
                      </div>
                    ) : (
                      <p className="mt-2 text-center text-[11px] text-white/18">Drop files here or Ctrl+V to paste</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveAiAffirmation}
                      disabled={saving}
                      className="flex-1 rounded-xl bg-amber-500 text-black px-3 py-2.5 text-sm font-medium hover:bg-amber-400 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save affirmation"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        aiAffirmationImagePreviews.forEach((url) => URL.revokeObjectURL(url));
                        setAiGenerated(null);
                        setAiAffirmationFiles([]);
                        setAiAffirmationImagePreviews([]);
                        setSelectedTemplateIdAi("");
                      }}
                      className="rounded-xl border border-white/20 px-3 py-2.5 text-sm text-white/70 hover:bg-white/10"
                    >
                      Clear
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </aside>

          <div className="rounded-2xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-tiempos text-xl font-semibold text-white">Affirmation Library</h2>
                <p className="text-xs text-white/35 mt-0.5">Your personal collection of manifestations</p>
              </div>
              <span className="text-xs text-purple-300/60 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1 font-medium">{affirmations.length} total</span>
            </div>

            {affirmations.length === 0 && (
              <div className="rounded-xl border border-dashed border-purple-500/20 bg-purple-500/5 p-10 text-center">
                <Sparkles className="h-8 w-8 text-purple-400/30 mx-auto mb-3" />
                <p className="text-sm text-white/50 font-medium">Your library is empty</p>
                <p className="text-xs text-white/30 mt-1">Write your first affirmation using the panel on the left.</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {affirmations.map((item) => (
                <article
                  key={item.docId}
                  className={`rounded-xl bg-white/[0.03] overflow-hidden hover:bg-white/[0.05] transition-all duration-300 group ${editingAffirmationDocId === item.docId ? "sm:col-span-2" : ""}`}
                >
                  {editingAffirmationDocId === item.docId ? (
                    <div className="p-4 space-y-3">
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        rows={3}
                        placeholder="Affirmation text"
                        className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
                      />
                      <input
                        value={editingCategory}
                        onChange={(e) => setEditingCategory(e.target.value)}
                        placeholder="Category"
                        className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                      />
                      <div
                        className={`rounded-lg border border-white/10 bg-black/20 p-3 transition-colors ${isDragOverEditImages ? "border-white/30 bg-white/10" : ""}`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDragOverEditImages(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOverEditImages(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDragOverEditImages(false);
                          const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith("image/"));
                          if (files.length) handleEditingNewImages(files, true);
                        }}
                      >
                        <p className="text-xs text-white/70 mb-2 inline-flex items-center gap-1.5">
                          <ImagePlus className="h-3.5 w-3.5" />
                          Images (drag & drop, paste URL, or Ctrl+V)
                        </p>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <button
                            type="button"
                            onClick={() => {
                              editingNextImageAppendRef.current = false;
                              editingNewFilesInputRef.current?.click();
                            }}
                            className="rounded-lg border border-white/20 px-2.5 py-1 text-xs hover:bg-white/10"
                          >
                            {editingNewFiles.length ? "Replace new" : "Add images"}
                          </button>
                          {editingNewFiles.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                editingNextImageAppendRef.current = true;
                                editingNewFilesInputRef.current?.click();
                              }}
                              className="rounded-lg border border-white/20 px-2.5 py-1 text-xs hover:bg-white/10"
                            >
                              Add more
                            </button>
                          )}
                        </div>
                        <input
                          ref={editingNewFilesInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const list = e.target.files;
                            const append = editingNextImageAppendRef.current;
                            if (list?.length) handleEditingNewImages(Array.from(list), append);
                            e.target.value = "";
                          }}
                        />
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-white/50">Or paste image URL:</span>
                          <input
                            type="url"
                            value={pastedImageUrl}
                            onChange={(e) => { setPastedImageUrl(e.target.value); setImageUrlError(""); }}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImageFromUrlToEdit())}
                            placeholder="https://..."
                            className="flex-1 min-w-[140px] rounded-lg bg-black/30 border border-white/10 px-2 py-1 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                          />
                          <button
                            type="button"
                            onClick={addImageFromUrlToEdit}
                            disabled={imageUrlLoading}
                            className="rounded-lg border border-white/20 px-2 py-1 text-xs hover:bg-white/10 disabled:opacity-50"
                          >
                            {imageUrlLoading ? "…" : "Add"}
                          </button>
                        </div>
                        {imageUrlError && editingAffirmationDocId && (
                          <p className="mt-1 text-[11px] text-red-400">{imageUrlError}</p>
                        )}
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {editingImageUrls.map((url, index) => (
                            <div
                              key={`edit-existing-${index}`}
                              className="relative rounded-lg overflow-hidden border border-white/10 group aspect-[9/16]"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt={`Existing ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => confirmRemoveEditingExistingImage(index)}
                                className="absolute top-0.5 right-0.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/90 transition-opacity"
                                aria-label="Delete image"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {editingNewPreviews.map((preview, index) => (
                            <div
                              key={`edit-new-${preview}-${index}`}
                              className="relative rounded-lg overflow-hidden border border-white/10 group aspect-[9/16]"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={preview}
                                alt={`New ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeOneEditingNewImage(index)}
                                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/90 transition-opacity"
                                aria-label="Remove image"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={saveEditAffirmation}
                          disabled={saving}
                          className="rounded-md bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50 transition-all"
                        >
                          {saving ? "Saving…" : "Save"}
                        </button>
                        <button
                          onClick={cancelEditAffirmation}
                          className="rounded-md border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Image grid — same style as home carousel */}
                      {(() => {
                        const imgUrls = item.imageUrls?.length ? item.imageUrls : (item.imageUrl ? [item.imageUrl] : []);
                        return imgUrls.length > 0 ? <AffirmationImageGrid urls={imgUrls} /> : null;
                      })()}

                      {/* Content */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <blockquote className="font-tiempos text-xl italic leading-relaxed text-white/85 flex-1">
                            &ldquo;{item.content}&rdquo;
                          </blockquote>
                          <button
                            onClick={() => toggleFavorite(item)}
                            className={`shrink-0 p-1 rounded-md mt-0.5 transition-colors ${item.isFavorite ? "text-yellow-400" : "text-white/15 hover:text-yellow-400/50"}`}
                            title={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
                          >
                            <Star className={`h-4 w-4 ${item.isFavorite ? "fill-yellow-400" : ""}`} />
                          </button>
                        </div>

                        {/* Category + meta row */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.category && (
                            <span className="text-[10px] tracking-[0.12em] uppercase font-medium text-purple-300/65 bg-purple-500/10 rounded-full px-2.5 py-0.5">
                              {item.category}
                            </span>
                          )}
                          <span className="text-[11px] text-white/25 ml-auto">{item.affirmCount} affirms</span>
                        </div>

                        {/* Action row */}
                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-0.5">
                          <Link
                            href={`/dashboard/preview/${item.docId}?from=affirmations`}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-white/35 hover:text-white/75 hover:bg-white/6 transition-all"
                          >
                            <Eye className="h-3 w-3" />
                            Preview
                          </Link>
                          <button
                            onClick={() => startEditingAffirmation(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-white/35 hover:text-white/75 hover:bg-white/6 transition-all"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => incrementAffirmCount(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-purple-300/55 hover:text-purple-300 hover:bg-purple-500/10 transition-all"
                          >
                            +1 Affirm
                          </button>
                          <button
                            onClick={() => removeAffirmation(item.docId)}
                            className="ml-auto inline-flex items-center rounded-lg p-1.5 text-white/15 hover:text-red-400 hover:bg-red-500/8 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeTab === "gallery" && (
        <section>
          {/* Count badge */}
          <div className="flex justify-end mb-4">
            <span className="text-xs text-indigo-300/60 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 font-medium">
              {affirmationsWithImages.length} with images
            </span>
          </div>

          {affirmationsWithImages.length === 0 && (
            <div className="rounded-xl border border-dashed border-indigo-500/20 bg-indigo-500/5 p-16 text-center">
              <GalleryHorizontalEnd className="h-10 w-10 text-indigo-400/30 mx-auto mb-3" />
              <p className="text-sm text-white/50 font-medium">No vision images yet</p>
              <p className="text-xs text-white/30 mt-1">Add images to your affirmations to see them here.</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {affirmationsWithImages.map((item) => {
              const urls = item.imageUrls?.length ? item.imageUrls : item.imageUrl ? [item.imageUrl] : [];
              const displayUrls = urls.slice(0, 4);
              const n = displayUrls.length;
              const hiddenCount = urls.length - n;
              const lastIndex = n - 1;
              const getCellSpan = (i) => {
                if (n === 1) return "col-span-2";
                if (n === 3 && i === 1) return "row-span-2";
                return "";
              };
              const gridRowsClass = n <= 2 ? "grid-rows-1" : "grid-rows-2";

              return (
                <article key={item.docId} className="rounded-2xl overflow-hidden bg-white/[0.03] hover:bg-white/[0.05] transition-all duration-300 group">
                  {/* Image mosaic */}
                  <div className={`grid grid-cols-2 gap-0.5 w-full overflow-hidden aspect-square ${gridRowsClass}`}>
                    {n > 0 ? (
                      displayUrls.map((url, i) => (
                        <div
                          key={`${item.docId}-img-${i}`}
                          className={`relative min-h-0 min-w-0 w-full h-full overflow-hidden ${getCellSpan(i)}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" className="w-full h-full object-cover object-center" />
                          {i === lastIndex && hiddenCount > 0 && (
                            <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                              <span className="text-white font-semibold text-xl">+{hiddenCount}</span>
                            </div>
                          )}
                          <Link
                            href={`/dashboard/preview/${item.docId}?from=gallery`}
                            className="absolute inset-0 z-[1]"
                            aria-label="Open affirmation preview"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 flex flex-col items-center justify-center gap-2 border border-dashed border-white/10 m-3 rounded-xl">
                        <Sparkles className="w-8 h-8 text-white/20" />
                        <span className="text-xs text-white/30">No image</span>
                      </div>
                    )}
                  </div>

                  {/* Caption */}
                  <div className="px-4 py-3.5">
                    <p className="font-tiempos text-xl italic leading-relaxed text-white/85 line-clamp-2">&ldquo;{item.content}&rdquo;</p>
                    <div className="mt-2.5 flex items-center gap-2">
                      {item.category && (
                        <span className="text-[10px] tracking-[0.12em] uppercase font-medium text-indigo-300/65 bg-indigo-500/10 rounded-full px-2.5 py-0.5">
                          {item.category}
                        </span>
                      )}
                      <span className="text-[11px] text-white/25 ml-auto">
                        {urls.length} image{urls.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      </div>
  );
}

const STAT_ACCENTS = {
  purple: { card: "bg-gradient-to-br from-purple-500/15 to-purple-500/5 border border-purple-500/25", icon: "text-purple-400" },
  yellow: { card: "bg-gradient-to-br from-yellow-500/15 to-yellow-500/5 border border-yellow-500/25", icon: "text-yellow-400" },
  indigo: { card: "bg-gradient-to-br from-indigo-500/15 to-indigo-500/5 border border-indigo-500/25", icon: "text-indigo-400" },
  pink:   { card: "bg-gradient-to-br from-pink-500/15 to-pink-500/5 border border-pink-500/25",   icon: "text-pink-400"   },
};

function StatCard({ label, value, icon, accent = "purple" }) {
  const styles = STAT_ACCENTS[accent] || STAT_ACCENTS.purple;
  return (
    <article className={`rounded-xl p-4 ${styles.card}`}>
      <div className={styles.icon}>{icon}</div>
      <p className="mt-2 text-xs uppercase tracking-wider text-white/50">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </article>
  );
}

function DashboardPageFallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white/70" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardPageFallback />}>
      <DashboardContent />
    </Suspense>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-white/45 text-xs uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}
