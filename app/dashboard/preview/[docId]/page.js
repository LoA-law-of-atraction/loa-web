"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { onAuthStateChanged, signInAnonymously, signOut } from "firebase/auth";
import { ArrowLeft, ChevronLeft, ChevronRight, FileText, GalleryHorizontalEnd, House, LogOut, Maximize2, Sparkles, X } from "lucide-react";
import { auth } from "@/utils/firebase";
import { fetchAffirmationById } from "@/utils/loaCloudSync";

const dashboardTabs = [
  { id: "home", label: "Overview", icon: House, href: "/dashboard?tab=home" },
  { id: "affirmations", label: "Affirmations", icon: Sparkles, href: "/dashboard?tab=affirmations" },
  { id: "templates", label: "Templates", icon: FileText, href: "/dashboard/templates" },
  { id: "gallery", label: "Gallery", icon: GalleryHorizontalEnd, href: "/dashboard?tab=gallery" },
];

function AffirmationPreviewContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const docId = params?.docId ?? null;
  const from = searchParams?.get?.("from") || "home";
  const backHref =
    from === "affirmations"
      ? "/dashboard?tab=affirmations"
      : from === "gallery"
        ? "/dashboard?tab=gallery"
        : "/dashboard?tab=home";
  const backLabel =
    from === "affirmations"
      ? "Back to Affirmations"
      : from === "gallery"
        ? "Back to Gallery"
        : "Back to Overview";

  const [uid, setUid] = useState("");
  const [userLabel, setUserLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [affirmation, setAffirmation] = useState(null);
  const [error, setError] = useState("");
  const [imageIndex, setImageIndex] = useState(0);
  const [expandedImage, setExpandedImage] = useState(false);
  const expandedScrollRef = useRef(null);
  const expandedItemRefs = useRef([]);
  const autoScrollDirectionRef = useRef(1);

  // When expanded opens, scroll active image into view
  const urlCount = affirmation?.imageUrls?.length ?? (affirmation?.imageUrl ? 1 : 0);
  useEffect(() => {
    if (!expandedImage || urlCount === 0) return;
    const el = expandedItemRefs.current[imageIndex];
    if (el && expandedScrollRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [expandedImage, imageIndex, urlCount]);

  // Auto-scroll: bounce back and forth (right then left) instead of wrapping at the end
  useEffect(() => {
    if (!expandedImage || urlCount <= 1) return;
    autoScrollDirectionRef.current = 1;
    const id = setInterval(() => {
      setImageIndex((prev) => {
        const dir = autoScrollDirectionRef.current;
        if (prev + dir >= urlCount) {
          autoScrollDirectionRef.current = -1;
          return Math.max(0, prev - 1);
        }
        if (prev + dir < 0) {
          autoScrollDirectionRef.current = 1;
          return Math.min(urlCount - 1, prev + 1);
        }
        return prev + dir;
      });
    }, 4000);
    return () => clearInterval(id);
  }, [expandedImage, urlCount]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        const activeUser = user || (await signInAnonymously(auth)).user;
        setUid(activeUser.uid);
        setUserLabel(activeUser.email || `anon:${activeUser.uid.slice(0, 8)}`);
      } catch (err) {
        setError(err?.message || "Failed to sign in.");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => signOut(auth);

  useEffect(() => {
    if (!uid || !docId) {
      if (!docId) setError("Missing affirmation ID.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchAffirmationById(uid, docId)
      .then((data) => {
        if (!cancelled) {
          setAffirmation(data);
          setImageIndex(0);
          if (data === null) setError("Affirmation not found.");
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Failed to load.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [uid, docId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-400/70" />
      </div>
    );
  }

  if (error && !affirmation) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 gap-4">
        <p className="text-red-400 text-sm">{error}</p>
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm text-white/60 hover:bg-white/8 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      </div>
    );
  }

  const urls = affirmation?.imageUrls?.length ? affirmation.imageUrls : (affirmation?.imageUrl ? [affirmation.imageUrl] : []);

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
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-white/55 hover:text-white hover:bg-white/8 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-1.5 text-sm text-white/60 hover:text-white hover:bg-white/8 transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{backLabel}</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <span className="rounded-full px-3 py-1.5 text-xs bg-white/5 border border-white/10 text-white/50 hidden sm:block">
              {userLabel}
            </span>
            <button onClick={handleLogout} className="text-white/35 hover:text-red-400 transition-colors p-2" title="Sign Out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="md:hidden flex gap-1.5 px-4 pb-3 overflow-x-auto">
          {dashboardTabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className="rounded-lg bg-white/5 border border-white/8 px-3 py-1.5 text-sm text-white/60 shrink-0"
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="max-w-lg mx-auto px-4 pt-24 pb-12">

        {/* Image section */}
        {urls.length > 0 ? (
          <div className="relative">
            {/* Ambient glow behind image */}
            <div className="absolute inset-x-8 top-4 bottom-0 bg-purple-600/20 blur-3xl rounded-full pointer-events-none" />

            {/* Main 9:16 image */}
            <div className="relative flex items-center justify-center">
              {urls.length > 1 && (
                <button
                  type="button"
                  onClick={() => setImageIndex((i) => (i <= 0 ? urls.length - 1 : i - 1))}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 text-white/50 hover:text-white hover:bg-white/15 transition-all"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}

              <div className="relative rounded-2xl overflow-hidden aspect-[9/16] w-full max-w-[300px] mx-auto shadow-2xl shadow-black/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={urls[imageIndex]} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setExpandedImage(true)}
                  className="absolute top-3 right-3 z-10 rounded-xl p-2 bg-black/50 backdrop-blur-sm text-white/80 hover:bg-black/70 hover:text-white transition-all"
                  aria-label="Expand image"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
                {urls.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 text-[11px] text-white/70">
                    {imageIndex + 1} / {urls.length}
                  </div>
                )}
              </div>

              {urls.length > 1 && (
                <button
                  type="button"
                  onClick={() => setImageIndex((i) => (i >= urls.length - 1 ? 0 : i + 1))}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 text-white/50 hover:text-white hover:bg-white/15 transition-all"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
            </div>

            {/* Thumbnails */}
            {urls.length > 1 && (
              <div className="mt-4 flex gap-2 justify-center flex-wrap">
                {urls.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setImageIndex(idx)}
                    className={`flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                      idx === imageIndex
                        ? "ring-2 ring-purple-400/70 opacity-100"
                        : "opacity-45 hover:opacity-75"
                    }`}
                    style={{ width: 44, height: (44 * 16) / 9 }}
                    aria-label={`Show image ${idx + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover pointer-events-none" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-purple-500/20 bg-purple-500/5 py-20">
            <Sparkles className="w-10 h-10 text-purple-400/30" />
            <span className="text-sm text-white/35">No image</span>
          </div>
        )}

        {/* Affirmation content */}
        <div className="mt-8 text-center px-2">
          <blockquote className="font-tiempos text-2xl italic leading-relaxed text-white/90 whitespace-pre-wrap">
            &ldquo;{affirmation?.content || "No content."}&rdquo;
          </blockquote>

          <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
            {affirmation?.category && (
              <span className="text-[10px] tracking-[0.14em] uppercase font-medium text-purple-300/65 bg-purple-500/10 rounded-full px-3 py-1">
                {affirmation.category}
              </span>
            )}
            {affirmation?.affirmCount != null && (
              <span className="text-xs text-white/30">{affirmation.affirmCount} affirms</span>
            )}
            {affirmation?.isFavorite && (
              <span className="text-xs text-amber-400/70">&#9733; Favorite</span>
            )}
          </div>
        </div>

        {/* Expanded image modal */}
        {expandedImage && (
          <div
            className="fixed inset-0 z-[100] bg-black/97 backdrop-blur-sm flex flex-col"
            role="dialog"
            aria-modal="true"
            onClick={() => setExpandedImage(false)}
          >
            <div className="flex-shrink-0 flex justify-end p-3">
              <button
                type="button"
                onClick={() => setExpandedImage(false)}
                className="rounded-full p-2 text-white/60 hover:text-white hover:bg-white/12 transition-colors"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 min-h-0 flex justify-center overflow-hidden">
              <div
                ref={expandedScrollRef}
                className="h-[calc(100vh-5rem)] overflow-x-auto overflow-y-hidden flex items-center gap-3 px-4 pb-4"
                style={{ scrollBehavior: "smooth", width: "min(100%, calc((100vh - 5rem) * 9 / 16))" }}
                onClick={(e) => e.stopPropagation()}
              >
                {urls.map((url, idx) => (
                  <div
                    key={idx}
                    ref={(el) => { expandedItemRefs.current[idx] = el; }}
                    className="flex-shrink-0 h-full aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-2xl"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover cursor-default" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-shrink-0 px-4 pb-6 pt-3 text-center" onClick={(e) => e.stopPropagation()}>
              <p className="font-tiempos text-lg italic text-white/85 leading-relaxed">
                &ldquo;{affirmation?.content || "No content."}&rdquo;
              </p>
              {affirmation?.category && (
                <p className="mt-2 text-[11px] tracking-[0.14em] uppercase text-white/35">{affirmation.category}</p>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

function PreviewPageFallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white/70" />
    </div>
  );
}

export default function AffirmationPreviewPage() {
  return (
    <Suspense fallback={<PreviewPageFallback />}>
      <AffirmationPreviewContent />
    </Suspense>
  );
}
