"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { auth } from "@/utils/firebase";
import { fetchAffirmationById } from "@/utils/loaCloudSync";

export default function AffirmationPreviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const docId = params?.docId ?? null;
  const from = searchParams?.get?.("from") || "home";
  const backHref = from === "affirmations" ? "/dashboard?tab=affirmations" : "/dashboard?tab=home";
  const backLabel = from === "affirmations" ? "Back to Affirmations" : "Back to Overview";

  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(true);
  const [affirmation, setAffirmation] = useState(null);
  const [error, setError] = useState("");
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        const activeUser = user || (await signInAnonymously(auth)).user;
        setUid(activeUser.uid);
      } catch (err) {
        setError(err?.message || "Failed to sign in.");
      }
    });
    return () => unsubscribe();
  }, []);

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
      <header className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href={backHref}
            className="rounded-lg p-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={backLabel}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-sm text-white/60">Preview</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <article className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          {urls.length > 0 ? (
            <div className="relative flex items-center justify-center bg-black/30 p-4">
              <button
                type="button"
                onClick={() => setImageIndex((i) => (i <= 0 ? urls.length - 1 : i - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <div className="rounded-xl overflow-hidden border border-white/10 aspect-[9/16] w-full max-w-[280px] mx-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={urls[imageIndex]}
                  alt=""
                  className="w-full h-full object-cover"
                />
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
