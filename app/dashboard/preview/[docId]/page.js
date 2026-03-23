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
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">

      {/* Slim top bar — just back + logo + logout, no tabs */}
      <nav className="shrink-0 h-14 bg-black/80 backdrop-blur-md border-b border-white/8 z-50 flex items-center px-4 gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-white/55 hover:text-white hover:bg-white/8 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{backLabel}</span>
          <span className="sm:hidden">Back</span>
        </Link>
        <div className="flex-1 flex justify-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/app_logo.svg" alt="LoA" width={24} height={24} className="rounded-md opacity-80" />
          </Link>
        </div>
        <button onClick={handleLogout} className="text-white/30 hover:text-red-400 transition-colors p-2" title="Sign Out">
          <LogOut className="w-4 h-4" />
        </button>
      </nav>

      {/* Main — fills remaining height, centered, single view */}
      <main className="flex-1 min-h-0 flex items-stretch justify-center">

        {urls.length > 0 ? (
          /* Image + side thumbnails */
          <div className="flex items-stretch h-full" style={{ maxWidth: "calc((100vh - 56px) * 9 / 16 + 64px)" }}>

            {/* Side thumbnail strip — left side */}
            {urls.length > 1 && (
              <div className="w-16 shrink-0 flex flex-col items-center justify-center gap-2 py-4 px-1.5">
                {urls.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setImageIndex(idx)}
                    className={`flex-shrink-0 rounded-lg overflow-hidden transition-all w-full ${
                      idx === imageIndex
                        ? "ring-2 ring-white/70 opacity-100 scale-105"
                        : "opacity-30 hover:opacity-60"
                    }`}
                    style={{ aspectRatio: "9/16" }}
                    aria-label={`Image ${idx + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover pointer-events-none" />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="relative flex-1 min-w-0">

              {/* Full-height image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={urls[imageIndex]}
                alt=""
                className="w-full h-full object-cover"
              />

              {/* Top gradient */}
              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

              {/* Bottom gradient */}
              <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

              {/* Expand button — top right */}
              <button
                type="button"
                onClick={() => setExpandedImage(true)}
                className="absolute top-4 right-4 z-10 rounded-xl p-2 bg-black/40 backdrop-blur-sm text-white/70 hover:bg-black/65 hover:text-white transition-all"
                aria-label="Expand"
              >
                <Maximize2 className="h-4 w-4" />
              </button>

              {/* Prev / Next arrows */}
              {urls.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setImageIndex((i) => (i <= 0 ? urls.length - 1 : i - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 bg-black/35 backdrop-blur-sm text-white/60 hover:bg-black/60 hover:text-white transition-all"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageIndex((i) => (i >= urls.length - 1 ? 0 : i + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 bg-black/35 backdrop-blur-sm text-white/60 hover:bg-black/60 hover:text-white transition-all"
                    aria-label="Next"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Bottom overlay — text + meta */}
              <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-5">
                {/* Affirmation text */}
                <blockquote className="font-tiempos text-xl italic leading-snug text-white text-center drop-shadow-lg line-clamp-3">
                  &ldquo;{affirmation?.content}&rdquo;
                </blockquote>

                {/* Meta row */}
                <div className="mt-2.5 flex items-center justify-center gap-3 flex-wrap">
                  {affirmation?.category && (
                    <span className="text-[10px] tracking-[0.14em] uppercase font-medium text-white/60 bg-white/10 backdrop-blur-sm rounded-full px-2.5 py-0.5">
                      {affirmation.category}
                    </span>
                  )}
                  {affirmation?.affirmCount != null && (
                    <span className="text-[11px] text-white/45">{affirmation.affirmCount} affirms</span>
                  )}
                  {affirmation?.isFavorite && (
                    <span className="text-[11px] text-amber-400/80">&#9733; Favorite</span>
                  )}
                </div>
              </div>
            </div>
          </div>

        ) : (
          /* No image — centered affirmation card */
          <div className="flex flex-col items-center justify-center gap-8 px-8 max-w-sm w-full">
            <div className="rounded-2xl border border-dashed border-purple-500/25 bg-purple-500/5 p-10 text-center w-full">
              <Sparkles className="w-10 h-10 text-purple-400/30 mx-auto mb-4" />
              <blockquote className="font-tiempos text-2xl italic leading-relaxed text-white/85">
                &ldquo;{affirmation?.content}&rdquo;
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
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Expanded image modal */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/97 backdrop-blur-sm flex flex-col"
          role="dialog"
          aria-modal="true"
          onClick={() => setExpandedImage(false)}
        >
          <div className="shrink-0 flex justify-end p-3">
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
                  className="flex-shrink-0 h-full aspect-[9/16] rounded-2xl overflow-hidden bg-black"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="shrink-0 px-4 pb-6 pt-3 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="font-tiempos text-lg italic text-white/85 leading-relaxed">
              &ldquo;{affirmation?.content}&rdquo;
            </p>
            {affirmation?.category && (
              <p className="mt-2 text-[11px] tracking-[0.14em] uppercase text-white/35">{affirmation.category}</p>
            )}
          </div>
        </div>
      )}

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
