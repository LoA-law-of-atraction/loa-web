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
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white/70" />
      </div>
    );
  }

  if (error && !affirmation) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <p className="text-red-400 mb-4">{error}</p>
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      </div>
    );
  }

  const urls = affirmation?.imageUrls?.length ? affirmation.imageUrls : (affirmation?.imageUrl ? [affirmation.imageUrl] : []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Dashboard bar – same as main dashboard */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-black border-b border-white/10 z-50">
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
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
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
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label={backLabel}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
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
          {dashboardTabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 pt-24 pb-6">
        <article className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          {urls.length > 0 ? (
            <div className="relative bg-black/30 p-4">
              {/* Main 9:16 preview */}
              <div className="relative flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setImageIndex((i) => (i <= 0 ? urls.length - 1 : i - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <div className="rounded-xl overflow-hidden border border-white/10 aspect-[9/16] w-full max-w-[280px] mx-auto relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={urls[imageIndex]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setExpandedImage(true)}
                    className="absolute top-2 right-2 z-10 rounded-lg p-2 bg-black/60 text-white/90 hover:bg-black/80 hover:text-white transition-colors"
                    aria-label="Expand image"
                    title="Expand image"
                  >
                    <Maximize2 className="h-5 w-5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setImageIndex((i) => (i >= urls.length - 1 ? 0 : i + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
                {urls.length > 1 && (
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] text-white/50">
                    {imageIndex + 1} / {urls.length}
                  </span>
                )}
              </div>

              {/* Expanded image modal – 9:16 ratio, horizontal scroll */}
              {expandedImage && (
                <div
                  className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Expanded image"
                  onClick={() => setExpandedImage(false)}
                >
                  <div className="flex-shrink-0 flex justify-end p-2">
                    <button
                      type="button"
                      onClick={() => setExpandedImage(false)}
                      className="rounded-full p-2 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                      aria-label="Close"
                    >
                      <X className="h-8 w-8" />
                    </button>
                  </div>
                  {/* One 9:16 slot visible at a time; horizontal scroll to see rest */}
                  <div className="flex-1 min-h-0 flex justify-center overflow-hidden">
                    <div
                      ref={expandedScrollRef}
                      className="h-[calc(100vh-5rem)] overflow-x-auto overflow-y-hidden flex items-center gap-4 px-4 pb-4"
                      style={{
                        scrollBehavior: "smooth",
                        width: "min(100%, calc((100vh - 5rem) * 9 / 16))",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {urls.map((url, idx) => (
                        <div
                          key={idx}
                          ref={(el) => { expandedItemRefs.current[idx] = el; }}
                          className="flex-shrink-0 h-full aspect-[9/16] rounded-xl overflow-hidden border border-white/10 bg-black"
                        >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover cursor-default"
                        />
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Affirmation text in expanded view */}
                  <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-white/10 text-center" onClick={(e) => e.stopPropagation()}>
                    <p className="text-base leading-relaxed text-white/95 whitespace-pre-wrap">
                      {affirmation?.content || "No content."}
                    </p>
                    {affirmation?.category && (
                      <p className="mt-2 text-sm text-white/50">
                        {affirmation.category}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Small 9:16 thumbnails below – tap to switch main preview */}
              {urls.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1 justify-center flex-wrap">
                  {urls.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImageIndex(idx)}
                      className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-white/50 ${
                        idx === imageIndex
                          ? "border-white ring-2 ring-white/30"
                          : "border-white/20 hover:border-white/40 opacity-80 hover:opacity-100"
                      }`}
                      style={{ width: 52, height: (52 * 16) / 9 }}
                      aria-label={`Show image ${idx + 1}`}
                      aria-pressed={idx === imageIndex}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 bg-black/20 border-b border-white/10 min-h-[180px]">
              <Sparkles className="w-12 h-12 text-white/25" />
              <span className="text-sm text-white/40">No image</span>
            </div>
          )}
          <div className="p-5">
            <p className="text-lg leading-relaxed text-white/95 whitespace-pre-wrap">
              {affirmation?.content || "No content."}
            </p>
            {affirmation?.category && (
              <p className="mt-3 text-sm text-white/50">
                {affirmation.category}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/40">
              {affirmation?.affirmCount != null && (
                <span>Affirmed {affirmation.affirmCount} time(s)</span>
              )}
              {affirmation?.isFavorite && (
                <span className="text-amber-400/80">Favorite</span>
              )}
            </div>
          </div>
        </article>
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
