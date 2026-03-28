"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ArrowLeft, LogOut, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { auth } from "@/utils/firebase";
import { fetchAffirmationById } from "@/utils/loaCloudSync";

const PREVIEW_SETTINGS_CACHE_KEY = "loa.preview.settings.v1";

function AffirmationPreviewContent() {
  const params = useParams();
  const router = useRouter();
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
  const [loading, setLoading] = useState(true);
  const [affirmation, setAffirmation] = useState(null);
  const [error, setError] = useState("");
  const [imageIndex, setImageIndex] = useState(0);
  const [previewMode, setPreviewMode] = useState("split");
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(false);
  const [isAutoSliding, setIsAutoSliding] = useState(false);
  const [fadeSpeed, setFadeSpeed] = useState("normal");
  const [transitionIntervalMs, setTransitionIntervalMs] = useState(3000);
  const activeImageRef = useRef(null);
  const hasLoadedCachedSettingsRef = useRef(false);
  /** Prevents persist effect from running once with stale state before hydrate-from-localStorage applies. */
  const skipFirstPersistAfterLoadRef = useRef(true);
  const transitionInFlightRef = useRef(false);
  const logFade = (...args) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[preview-fade]", ...args);
    }
  };

  const logImgOpacity = (el, tag) => {
    if (!el || process.env.NODE_ENV === "production") return;
    const anims = typeof el.getAnimations === "function" ? el.getAnimations() : [];
    logFade(`probe:${tag}`, {
      computedOpacity: getComputedStyle(el).opacity,
      inlineOpacity: el.style.opacity,
      animationCount: anims.length,
      animationStates: anims.slice(0, 4).map((a) => a.playState),
    });
  };

  const fadeDurations = {
    slow: { out: 360, in: 520 },
    normal: { out: 220, in: 320 },
    fast: { out: 140, in: 210 },
  };
  const { out: fadeOutDuration, in: fadeInDuration } = fadeDurations[fadeSpeed];

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PREVIEW_SETTINGS_CACHE_KEY);
      if (!raw) {
        hasLoadedCachedSettingsRef.current = true;
        return;
      }

      const parsed = JSON.parse(raw);
      if (parsed?.previewMode === "split" || parsed?.previewMode === "overlay") {
        setPreviewMode(parsed.previewMode);
      }
      if (typeof parsed?.autoScrollEnabled === "boolean") {
        setAutoScrollEnabled(parsed.autoScrollEnabled);
      }
      if (parsed?.fadeSpeed === "fast" || parsed?.fadeSpeed === "normal" || parsed?.fadeSpeed === "slow") {
        setFadeSpeed(parsed.fadeSpeed);
      }
      if ([2000, 3000, 5000, 8000].includes(parsed?.transitionIntervalMs)) {
        setTransitionIntervalMs(parsed.transitionIntervalMs);
      }
    } catch {
      // Ignore invalid cached payloads.
    } finally {
      hasLoadedCachedSettingsRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedCachedSettingsRef.current) return;
    if (skipFirstPersistAfterLoadRef.current) {
      skipFirstPersistAfterLoadRef.current = false;
      return;
    }

    const payload = {
      previewMode,
      autoScrollEnabled,
      fadeSpeed,
      transitionIntervalMs,
    };
    window.localStorage.setItem(PREVIEW_SETTINGS_CACHE_KEY, JSON.stringify(payload));
  }, [previewMode, autoScrollEnabled, fadeSpeed, transitionIntervalMs]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user || user.isAnonymous) {
          setUid("");
          router.replace("/login");
          return;
        }
        const activeUser = user;
        setUid(activeUser.uid);
      } catch (err) {
        setError(err?.message || "Failed to sign in.");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/");
  };

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

  const urls = affirmation?.imageUrls?.length
    ? affirmation.imageUrls
    : affirmation?.imageUrl
      ? [affirmation.imageUrl]
      : [];

  useEffect(() => {
    if (!autoScrollEnabled || urls.length <= 1) return undefined;

    logFade("interval:start", {
      autoScrollEnabled,
      urlsLength: urls.length,
      fadeOutDuration,
      transitionIntervalMs,
    });
    const interval = setInterval(() => {
      if (transitionInFlightRef.current) {
        logFade("interval:tick:skipped", { reason: "transition_in_flight" });
        return;
      }
      const activeImage = activeImageRef.current;
      logFade("interval:tick", { hasActiveImage: Boolean(activeImage) });
      if (!activeImage) {
        transitionInFlightRef.current = true;
        setIsAutoSliding(true);
        setImageIndex((i) => (i >= urls.length - 1 ? 0 : i + 1));
        return;
      }

      transitionInFlightRef.current = true;
      const fadeOut = activeImage.animate(
        [
          { opacity: 1 },
          { opacity: 0 },
        ],
        { duration: fadeOutDuration, easing: "ease-out", fill: "forwards" },
      );
      logFade("fadeOut:start", { fadeOutDuration });

      fadeOut.addEventListener("finish", () => {
        logImgOpacity(activeImage, "fadeOut:finish:beforeLock");
        // Keep image invisible across src swap — changing src can drop WAAPI fill and flash a full-opacity frame.
        activeImage.style.opacity = "0";
        logImgOpacity(activeImage, "fadeOut:finish:afterLock");
        logFade("fadeOut:finish");
        setIsAutoSliding(true);
        setImageIndex((i) => (i >= urls.length - 1 ? 0 : i + 1));
      }, { once: true });
    }, transitionIntervalMs);

    return () => {
      logFade("interval:cleanup");
      clearInterval(interval);
    };
  }, [autoScrollEnabled, urls.length, fadeOutDuration, transitionIntervalMs]);

  useEffect(() => {
    if (!isAutoSliding || !activeImageRef.current) return undefined;

    const el = activeImageRef.current;
    logFade("fadeIn:effect:run", { imageIndex, fadeInDuration });
    logImgOpacity(el, "fadeIn:beforeAnimate");

    const animation = el.animate(
      [
        { opacity: 0 },
        { opacity: 1 },
      ],
      { duration: fadeInDuration, easing: "ease-in", fill: "forwards" },
    );

    const handleFinish = () => {
      logImgOpacity(el, "fadeIn:finish:beforeClear");
      el.style.opacity = "";
      logImgOpacity(el, "fadeIn:finish:afterClear");
      logFade("fadeIn:finish", { imageIndex });
      transitionInFlightRef.current = false;
      setIsAutoSliding(false);
    };
    animation.addEventListener("finish", handleFinish);

    return () => {
      logFade("fadeIn:cleanup", { imageIndex, isAutoSliding });
      logImgOpacity(el, "fadeIn:cleanup:cancel");
      animation.removeEventListener("finish", handleFinish);
      if (isAutoSliding) {
        transitionInFlightRef.current = false;
      }
    };
  }, [imageIndex, isAutoSliding, fadeInDuration]);

  useEffect(() => {
    logFade("state:imageIndex", { imageIndex, isAutoSliding });
  }, [imageIndex, isAutoSliding]);

  const handlePreviewImgLoad = () => {
    logFade("img:onLoad", { imageIndex, isAutoSliding });
    logImgOpacity(activeImageRef.current, "img:onLoad");
  };

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

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">

      {/* Nav */}
      <nav className="shrink-0 h-14 bg-black/80 backdrop-blur-md border-b border-white/[0.07] z-50 flex items-center px-4 gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-white/50 hover:text-white hover:bg-white/8 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{backLabel}</span>
          <span className="sm:hidden">Back</span>
        </Link>
        <div className="flex-1 flex justify-center">
          <Link href="/" className="flex items-center gap-2" title="LoA home">
            <Image src="/app_logo.svg" alt="LoA" width={24} height={24} className="rounded-md opacity-80" />
          </Link>
        </div>
        {urls.length > 0 && (
          <div className="hidden sm:inline-flex items-center rounded-lg border border-white/[0.12] bg-white/[0.03] p-0.5">
            <button
              type="button"
              onClick={() => setPreviewMode("split")}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                previewMode === "split"
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              Split
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode("overlay")}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                previewMode === "overlay"
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              Overlay
            </button>
          </div>
        )}
        <button onClick={handleLogout} className="text-white/25 hover:text-red-400 transition-colors p-2" title="Sign Out">
          <LogOut className="w-4 h-4" />
        </button>
      </nav>

      {/* Main content */}
      <main className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden p-3 md:p-0 gap-3 md:gap-0">

        {urls.length > 0 ? (
          previewMode === "overlay" ? (
          <>
            {/* ── Image pane (text overlaid) — same 9:16 shell as split ── */}
            <div className="relative shrink-0 mx-auto flex w-full flex-col items-center md:flex-1 md:min-h-0 md:justify-center md:h-full">
              <div className="relative w-[85vw] max-w-[320px] aspect-[9/16] overflow-hidden bg-black rounded-3xl md:w-full md:max-w-none md:flex md:flex-1 md:min-h-0 md:items-center md:justify-center md:aspect-auto md:rounded-none md:h-full">

              <div className="relative w-full h-full md:h-full md:w-auto md:max-h-full md:max-w-full md:aspect-[9/16] overflow-hidden rounded-3xl md:rounded-2xl">

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={activeImageRef}
                  src={urls[imageIndex]}
                  alt=""
                  className="w-full h-full object-cover"
                  onLoad={handlePreviewImgLoad}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/15 pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

                {urls.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setImageIndex((i) => (i <= 0 ? urls.length - 1 : i - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-10 rounded-full p-1.5 bg-black/40 backdrop-blur-sm text-white/60 hover:bg-black/60 hover:text-white transition-all"
                      aria-label="Previous"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageIndex((i) => (i >= urls.length - 1 ? 0 : i + 1))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-10 rounded-full p-1.5 bg-black/40 backdrop-blur-sm text-white/60 hover:bg-black/60 hover:text-white transition-all"
                      aria-label="Next"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 z-10">
                  <blockquote className="font-tiempos text-xl md:text-[1.45rem] italic leading-[1.45] text-white/95 drop-shadow-[0_1px_8px_rgba(0,0,0,0.65)]">
                    &ldquo;{affirmation?.content}&rdquo;
                  </blockquote>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {affirmation?.category && (
                      <span className="text-[10px] tracking-[0.18em] uppercase font-medium text-purple-200/90 bg-purple-500/20 border border-purple-300/25 rounded-full px-3 py-1">
                        {affirmation.category}
                      </span>
                    )}
                    {affirmation?.affirmCount != null && (
                      <span className="text-[11px] text-white/75 self-center">{affirmation.affirmCount} affirms</span>
                    )}
                    {affirmation?.isFavorite && (
                      <span className="text-[11px] text-amber-300/90 self-center">&#9733; Favorite</span>
                    )}
                  </div>
                </div>
              </div>
              </div>
            </div>

            {/* ── Side panel — same thumbnails as split (no duplicate quote) ── */}
            <div className="w-full md:w-[300px] shrink-0 flex flex-col bg-[#080010] border-t border-white/[0.06] md:border-t-0 md:border-l md:border-white/[0.06] overflow-hidden">
              <div className="flex-1 min-h-0" aria-hidden="true" />

              {urls.length > 1 && (
                <div className="shrink-0 border-t border-white/[0.06] px-4 pt-4 pb-4">
                  <p className="text-[9px] tracking-[0.28em] uppercase text-white/35 mb-2.5">Auto scroll</p>
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-2.5 mb-3">
                    {/* Fade row */}
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] tracking-[0.2em] uppercase text-white/35 w-10 shrink-0">Fade</span>
                      <div className="flex gap-0.5 rounded-lg bg-black/30 p-0.5">
                        {["fast", "normal", "slow"].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setFadeSpeed(s)}
                            className={`px-2.5 py-1 rounded-md text-[9px] tracking-[0.1em] uppercase transition-all duration-150 ${
                              fadeSpeed === s
                                ? "bg-white/15 text-white shadow-sm"
                                : "text-white/30 hover:text-white/55"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Interval row */}
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] tracking-[0.2em] uppercase text-white/35 w-10 shrink-0">Every</span>
                      <div className="flex gap-0.5 rounded-lg bg-black/30 p-0.5">
                        {[2000, 3000, 5000, 8000].map((ms) => (
                          <button
                            key={ms}
                            type="button"
                            onClick={() => setTransitionIntervalMs(ms)}
                            className={`px-2 py-1 rounded-md text-[9px] tracking-[0.1em] uppercase transition-all duration-150 ${
                              transitionIntervalMs === ms
                                ? "bg-white/15 text-white shadow-sm"
                                : "text-white/30 hover:text-white/55"
                            }`}
                          >
                            {ms / 1000}s
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="h-px bg-white/[0.06]" />
                    {/* Auto toggle row */}
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] tracking-[0.2em] uppercase text-white/35 w-10 shrink-0">Auto</span>
                      <button
                        type="button"
                        onClick={() => setAutoScrollEnabled((v) => !v)}
                        className="flex items-center gap-2 group"
                        aria-label={autoScrollEnabled ? "Disable auto scroll" : "Enable auto scroll"}
                      >
                        <span className={`text-[9px] tracking-[0.12em] uppercase transition-colors duration-200 ${autoScrollEnabled ? "text-purple-300/80" : "text-white/20"}`}>
                          {autoScrollEnabled ? "On" : "Off"}
                        </span>
                        <div className={`relative w-8 h-[18px] rounded-full transition-all duration-200 ${autoScrollEnabled ? "bg-purple-500/70" : "bg-white/[0.1]"}`}>
                          <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all duration-200 ${autoScrollEnabled ? "left-[18px]" : "left-[2px]"}`} />
                        </div>
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                    {urls.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImageIndex(idx)}
                        className={`flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200 ${
                          idx === imageIndex
                            ? "ring-2 ring-purple-400/70 opacity-100 scale-105"
                            : "opacity-30 hover:opacity-60"
                        }`}
                        style={{ width: 42, height: Math.round(42 * 16 / 9) }}
                        aria-label={`Image ${idx + 1}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-full h-full object-cover pointer-events-none" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
          ) : (
          <>
            {/* ── Image pane ── */}
            <div className="relative shrink-0 mx-auto flex w-full flex-col items-center md:flex-1 md:min-h-0 md:justify-center md:h-full">
              <div className="relative w-[85vw] max-w-[320px] aspect-[9/16] overflow-hidden bg-black rounded-3xl md:w-full md:max-w-none md:flex md:flex-1 md:min-h-0 md:items-center md:justify-center md:aspect-auto md:rounded-none md:h-full">

              <div className="relative w-full h-full md:h-full md:w-auto md:max-h-full md:max-w-full md:aspect-[9/16] overflow-hidden rounded-3xl md:rounded-2xl">

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={activeImageRef}
                src={urls[imageIndex]}
                alt=""
                className="w-full h-full object-cover"
                onLoad={handlePreviewImgLoad}
              />

              {/* Top gradient for buttons */}
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />

              {/* Prev / Next — subtle, only when multiple */}
              {urls.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setImageIndex((i) => (i <= 0 ? urls.length - 1 : i - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 rounded-full p-1.5 bg-black/30 backdrop-blur-sm text-white/50 hover:bg-black/55 hover:text-white transition-all"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageIndex((i) => (i >= urls.length - 1 ? 0 : i + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 rounded-full p-1.5 bg-black/30 backdrop-blur-sm text-white/50 hover:bg-black/55 hover:text-white transition-all"
                    aria-label="Next"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
              </div>
              </div>
            </div>

            {/* ── Info panel ── */}
            <div className="w-full md:w-[300px] shrink-0 flex flex-col bg-[#080010] border-t border-white/[0.06] md:border-t-0 md:border-l md:border-white/[0.06] overflow-hidden">

              {/* Affirmation text */}
              <div className="flex-1 overflow-y-auto flex flex-col justify-center px-7 py-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-purple-500/30 to-transparent" />
                  <Sparkles className="w-3 h-3 text-purple-400/40 shrink-0" />
                  <div className="h-px flex-1 bg-gradient-to-l from-purple-500/30 to-transparent" />
                </div>

                <blockquote className="font-tiempos text-2xl md:text-[1.6rem] italic leading-[1.45] text-white/90">
                  &ldquo;{affirmation?.content}&rdquo;
                </blockquote>

                <div className="mt-5 flex flex-wrap gap-2">
                  {affirmation?.category && (
                    <span className="text-[10px] tracking-[0.18em] uppercase font-medium text-purple-300/60 bg-purple-500/10 border border-purple-500/15 rounded-full px-3 py-1">
                      {affirmation.category}
                    </span>
                  )}
                  {affirmation?.affirmCount != null && (
                    <span className="text-[11px] text-white/30 self-center">{affirmation.affirmCount} affirms</span>
                  )}
                  {affirmation?.isFavorite && (
                    <span className="text-[11px] text-amber-400/70 self-center">&#9733; Favorite</span>
                  )}
                </div>
              </div>

              {/* Thumbnail filmstrip */}
              {urls.length > 1 && (
                <div className="shrink-0 border-t border-white/[0.06] px-4 pt-4 pb-4">
                  <p className="text-[9px] tracking-[0.28em] uppercase text-white/35 mb-2.5">Auto scroll</p>
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-2.5 mb-3">
                    {/* Fade row */}
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] tracking-[0.2em] uppercase text-white/35 w-10 shrink-0">Fade</span>
                      <div className="flex gap-0.5 rounded-lg bg-black/30 p-0.5">
                        {["fast", "normal", "slow"].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setFadeSpeed(s)}
                            className={`px-2.5 py-1 rounded-md text-[9px] tracking-[0.1em] uppercase transition-all duration-150 ${
                              fadeSpeed === s
                                ? "bg-white/15 text-white shadow-sm"
                                : "text-white/30 hover:text-white/55"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Interval row */}
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] tracking-[0.2em] uppercase text-white/35 w-10 shrink-0">Every</span>
                      <div className="flex gap-0.5 rounded-lg bg-black/30 p-0.5">
                        {[2000, 3000, 5000, 8000].map((ms) => (
                          <button
                            key={ms}
                            type="button"
                            onClick={() => setTransitionIntervalMs(ms)}
                            className={`px-2 py-1 rounded-md text-[9px] tracking-[0.1em] uppercase transition-all duration-150 ${
                              transitionIntervalMs === ms
                                ? "bg-white/15 text-white shadow-sm"
                                : "text-white/30 hover:text-white/55"
                            }`}
                          >
                            {ms / 1000}s
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="h-px bg-white/[0.06]" />
                    {/* Auto toggle row */}
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] tracking-[0.2em] uppercase text-white/35 w-10 shrink-0">Auto</span>
                      <button
                        type="button"
                        onClick={() => setAutoScrollEnabled((v) => !v)}
                        className="flex items-center gap-2 group"
                        aria-label={autoScrollEnabled ? "Disable auto scroll" : "Enable auto scroll"}
                      >
                        <span className={`text-[9px] tracking-[0.12em] uppercase transition-colors duration-200 ${autoScrollEnabled ? "text-purple-300/80" : "text-white/20"}`}>
                          {autoScrollEnabled ? "On" : "Off"}
                        </span>
                        <div className={`relative w-8 h-[18px] rounded-full transition-all duration-200 ${autoScrollEnabled ? "bg-purple-500/70" : "bg-white/[0.1]"}`}>
                          <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all duration-200 ${autoScrollEnabled ? "left-[18px]" : "left-[2px]"}`} />
                        </div>
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                    {urls.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImageIndex(idx)}
                        className={`flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200 ${
                          idx === imageIndex
                            ? "ring-2 ring-purple-400/70 opacity-100 scale-105"
                            : "opacity-30 hover:opacity-60"
                        }`}
                        style={{ width: 42, height: Math.round(42 * 16 / 9) }}
                        aria-label={`Image ${idx + 1}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-full h-full object-cover pointer-events-none" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
          )

        ) : (
          /* No image — centered affirmation card */
          <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8">
            <div className="rounded-2xl border border-dashed border-purple-500/20 bg-purple-500/[0.04] p-12 text-center max-w-sm w-full">
              <Sparkles className="w-10 h-10 text-purple-400/25 mx-auto mb-5" />
              <blockquote className="font-tiempos text-2xl italic leading-relaxed text-white/85">
                &ldquo;{affirmation?.content}&rdquo;
              </blockquote>
              <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
                {affirmation?.category && (
                  <span className="text-[10px] tracking-[0.18em] uppercase font-medium text-purple-300/60 bg-purple-500/10 rounded-full px-3 py-1">
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
