"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useImperativeHandle,
  forwardRef,
} from "react";

/**
 * Timeline editor – Shotstack Studio SDK only.
 * Edit in Studio's timeline (drag, trim, transitions). ref.getEdit() returns edit for assembly.
 */
const DEBOUNCE_MS = 600;

/** Return proxy URL for Firebase/Storage URLs to avoid CORS when loading in the timeline (browser). */
function proxyMediaUrlForTimeline(url, origin = null) {
  if (!url || typeof url !== "string") return url;
  const o = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  if (!o) return url;
  if (
    url.includes("firebasestorage.googleapis.com") ||
    url.includes("storage.googleapis.com")
  ) {
    return `${o}/api/video-generator/proxy-media?url=${encodeURIComponent(url)}`;
  }
  return url;
}

/** Build volume for asset: number or tween array (Shotstack volume animation for configurable fade duration) */
function buildVolumeWithFade(vol, fadeIn, fadeOut, fadeInDur, fadeOutDur, clipLength) {
  const v = Math.max(0, Math.min(1, Number(vol) ?? 0.5));
  if (!fadeIn && !fadeOut) return v;
  const inDur = Math.max(0.1, Math.min(5, Number(fadeInDur) ?? 1));
  const outDur = Math.max(0.1, Math.min(5, Number(fadeOutDur) ?? 1));
  const len = Number(clipLength);
  if (!Number.isFinite(len) || len < 0.1) {
    return v; // fallback when length unknown (e.g. "auto")
  }
  const tweens = [];
  if (fadeIn) {
    tweens.push({ from: 0, to: v, start: 0, length: Math.min(inDur, len * 0.5), interpolation: "linear" });
  }
  const holdStart = fadeIn ? Math.min(inDur, len * 0.5) : 0;
  const holdEnd = fadeOut ? Math.max(holdStart, len - Math.min(outDur, len * 0.5)) : len;
  if (holdEnd > holdStart + 0.05) {
    tweens.push({ from: v, to: v, start: holdStart, length: holdEnd - holdStart, interpolation: "linear" });
  }
  if (fadeOut && len > holdEnd) {
    tweens.push({ from: v, to: 0, start: holdEnd, length: len - holdEnd, interpolation: "linear" });
  }
  return tweens.length > 0 ? tweens : v;
}

/** Build initial edit JSON from videos + voiceover + music (used when no saved edit) */
function buildInitialEdit(
  videos,
  voiceoverUrl,
  backgroundMusicUrl,
  sceneDurations,
  scriptData,
  getSceneDurationSeconds,
  oldSettings = {},
) {
  if (!videos?.length || !voiceoverUrl) return null;

  const clampDurationSeconds = (value, fallback = 8) => {
    const n = Number(value);
    return Number.isFinite(n)
      ? Math.max(1, Math.min(15, Math.round(n)))
      : Math.max(1, Math.min(15, Math.round(fallback)));
  };

  const sortedVideos = (() => {
    const arr = [...videos];
    const order = oldSettings.clipOrder;
    if (order?.length === arr.length) {
      const byScene = Object.fromEntries(
        arr.map((v) => [String(v?.scene_id), v]),
      );
      return order.map((sid) => byScene[String(sid)]).filter(Boolean);
    }
    return arr.sort((a, b) => Number(a?.scene_id) - Number(b?.scene_id));
  })();

  const gapTrans = oldSettings.gapTransitions ?? {};
  const gapByIndex = oldSettings.transitionGapByIndex ?? {};
  const defaultGap = oldSettings.transitionGap ?? 0;
  const clipSettings = oldSettings.clipAudioSettings ?? {};
  const getClipSettings = (trackIdx, clipIdx) =>
    clipSettings[`${trackIdx}-${clipIdx}`] ??
    (trackIdx === 0 ? clipSettings[sortedVideos[clipIdx]?.scene_id] : clipSettings[trackIdx === 1 ? "voiceover" : "music"]);
  const numGaps = Math.max(0, sortedVideos.length - 1);

  const getOverlap = (i) => {
    const d = gapByIndex[i];
    if (d != null) return Math.max(-2, Math.min(2, Number(d)));
    if ((gapTrans[i] ?? "fade") === "none") return 0;
    return Math.max(0, Math.min(2, defaultGap));
  };

  let sumPrev = 0;
  let sumOverlapPrev = 0;
  const videoClips = sortedVideos.map((video, idx) => {
    const s = getClipSettings(0, idx) ?? clipSettings[video.scene_id];
    const durationSeconds = clampDurationSeconds(
      sceneDurations?.[video.scene_id] ??
        (scriptData?.scenes?.find(
          (s) => String(s.id) === String(video.scene_id),
        )
          ? getSceneDurationSeconds?.(
              scriptData.scenes.find(
                (s) => String(s.id) === String(video.scene_id),
              ),
            )
          : null),
      8,
    );
    const volume =
      s?.volume != null ? Math.max(0, Math.min(1, Number(s.volume))) : 0.8;
    const fadeIn = s?.fadeIn ?? false;
    const fadeOut = s?.fadeOut ?? false;
    const volumeEffect =
      fadeIn && fadeOut
        ? "fadeInFadeOut"
        : fadeIn
          ? "fadeIn"
          : fadeOut
            ? "fadeOut"
            : undefined;
    const start = Math.max(0, sumPrev - sumOverlapPrev);
    const inTransition = idx > 0 ? (gapTrans[idx - 1] ?? "fade") : "none";
    const outTransition =
      idx < sortedVideos.length - 1 ? (gapTrans[idx] ?? "fade") : "none";
    const asset = {
      type: "video",
      src: proxyMediaUrlForTimeline(video.video_url),
      volume,
    };
    if (volumeEffect) asset.volumeEffect = volumeEffect;
    const clip = {
      asset,
      start: Math.max(0, start),
      length: durationSeconds,
    };
    if (
      sortedVideos.length > 1 &&
      (inTransition !== "none" || outTransition !== "none")
    ) {
      clip.transition = { in: inTransition, out: outTransition };
    }
    sumPrev += durationSeconds;
    if (idx < numGaps) sumOverlapPrev += getOverlap(idx);
    return clip;
  });

  const voVol =
    getClipSettings(1, 0)?.volume != null
      ? Math.max(0, Math.min(1, Number(getClipSettings(1, 0).volume)))
      : Math.max(0, Math.min(1, Number(oldSettings.voiceoverVolume ?? 1)));
  const musVol =
    getClipSettings(2, 0)?.volume != null
      ? Math.max(0, Math.min(1, Number(getClipSettings(2, 0).volume)))
      : Math.max(0, Math.min(1, Number(oldSettings.musicVolume ?? 0.25)));
  const voTrim = Math.max(0, Number(oldSettings.voiceoverTrim ?? 0));
  const musTrim = Math.max(0, Number(oldSettings.musicTrim ?? 0));
  const voLen =
    oldSettings.voiceoverLength != null &&
    oldSettings.voiceoverLength !== "auto"
      ? Math.max(0.1, Number(oldSettings.voiceoverLength))
      : "auto";
  const musLen =
    oldSettings.musicLength != null && oldSettings.musicLength !== "auto"
      ? Math.max(0.1, Number(oldSettings.musicLength))
      : "auto";

  const voFade = getClipSettings(1, 0) ?? clipSettings.voiceover;
  const voFadeIn = !!voFade?.fadeIn;
  const voFadeOut = !!voFade?.fadeOut;
  const voEffect =
    voFadeIn && voFadeOut ? "fadeInFadeOut" : voFadeIn ? "fadeIn" : voFadeOut ? "fadeOut" : undefined;
  const voLenNum = voLen === "auto" ? null : Number(voLen);
  const voVolAsset =
    voFadeIn || voFadeOut
      ? buildVolumeWithFade(
          voVol,
          voFadeIn,
          voFadeOut,
          voFade?.fadeInDuration ?? 1,
          voFade?.fadeOutDuration ?? 1,
          voLenNum ?? 30,
        )
      : voVol;
  const voiceoverClip = {
    asset: {
      type: "audio",
      src: voiceoverUrl,
      ...(Array.isArray(voVolAsset)
        ? { volume: voVolAsset }
        : { volume: voVolAsset, ...(voEffect && { volumeEffect: voEffect }) }),
    },
    start: 0,
    length: voLen,
  };
  if (voTrim > 0) voiceoverClip.trim = voTrim;

  const tracks = [{ clips: videoClips }, { clips: [voiceoverClip] }];
  if (backgroundMusicUrl) {
    const musFade = getClipSettings(2, 0) ?? clipSettings.music;
    const musFadeIn = !!musFade?.fadeIn;
    const musFadeOut = !!musFade?.fadeOut;
    const musEffect =
      musFadeIn && musFadeOut ? "fadeInFadeOut" : musFadeIn ? "fadeIn" : musFadeOut ? "fadeOut" : undefined;
    const musLenNum = musLen === "auto" ? null : Number(musLen);
    const musVolAsset =
      musFadeIn || musFadeOut
        ? buildVolumeWithFade(
            musVol,
            musFadeIn,
            musFadeOut,
            musFade?.fadeInDuration ?? 1,
            musFade?.fadeOutDuration ?? 1,
            musLenNum ?? 60,
          )
        : musVol;
    const musicClip = {
      asset: {
        type: "audio",
        src: backgroundMusicUrl,
        ...(Array.isArray(musVolAsset)
          ? { volume: musVolAsset }
          : { volume: musVolAsset, ...(musEffect && { volumeEffect: musEffect }) }),
      },
      start: 0,
      length: musLen,
    };
    if (musTrim > 0) musicClip.trim = musTrim;
    tracks.push({ clips: [musicClip] });
  }

  return {
    timeline: { background: "#000000", tracks },
    output: { format: "mp4", size: { width: 1080, height: 1920 } },
  };
}

const TimelineEditor = forwardRef(function TimelineEditor(
  {
    videos = [],
    voiceoverUrl,
    backgroundMusicUrl = null,
    voiceoverDuration = null,
    musicDuration = null,
    sceneDurations = {},
    getSceneDurationSeconds,
    scriptData,
    projectId = null,
    initialTimelineSettings = null,
  },
  ref,
) {
  const [timelineScale, setTimelineScale] = useState(1);
  const [selectedClip, setSelectedClip] = useState(null); // { trackIndex, clipIndex }
  const [, setVolumeChangeTick] = useState(0); // force re-render when clip volume changes
  const [studioReadyTick, setStudioReadyTick] = useState(0); // increment when init completes – persistence listens
  const timelineContainerRef = useRef(null);
  const studioEditRef = useRef(null);
  const studioSdkInstancesRef = useRef(null); // { canvas, timeline, controls } for cleanup dispose
  const clipEventHandlersRef = useRef(null);
  const volumeReloadTimeoutRef = useRef(null);
  const initialEditRef = useRef(null);
  const usedVideoOnlyFallbackRef = useRef(false);
  const fadeOverrideRef = useRef(Object.create(null)); // { "track-clip": { fadeIn, fadeOut, fadeInDuration?, fadeOutDuration? } } – SDK rejects volumeEffect in loadEdit, so we keep UI state here

  // Edit to load: saved edit or build from source data (supports migration from old format)
  const editToLoad = useMemo(() => {
    const saved = initialTimelineSettings?.edit;
    const effectiveVideos =
      videos?.length > 0
        ? videos
        : (scriptData?.scenes || [])
            .filter((s) => {
              const url =
                s?.selected_video_url ||
                (Array.isArray(s?.video_urls) &&
                  s.video_urls.length > 0 &&
                  s.video_urls[s.video_urls.length - 1]);
              return url && s?.id != null;
            })
            .map((s) => ({
              scene_id: s.id,
              video_url:
                s?.selected_video_url ||
                (Array.isArray(s?.video_urls) && s.video_urls.length > 0
                  ? s.video_urls[s.video_urls.length - 1]
                  : null),
            }))
            .filter((v) => v.video_url);

    const savedVideoClips = saved?.timeline?.tracks?.[0]?.clips?.length ?? 0;
    const clipCountMatches =
      effectiveVideos?.length > 0 && savedVideoClips === effectiveVideos.length;

    // Use saved edit only if valid and video clip count matches current project (scenes may have been added/removed)
    if (saved?.timeline && saved?.output && clipCountMatches) {
      const tracks = saved.timeline?.tracks ?? [];
      const oldSettings = initialTimelineSettings || {};
      const clipSettings = oldSettings.clipAudioSettings ?? {};
      const getClipSettings = (trackIdx, clipIdx) =>
        clipSettings[`${trackIdx}-${clipIdx}`] ??
        (trackIdx === 0
          ? clipSettings[effectiveVideos?.[clipIdx]?.scene_id]
          : clipSettings[trackIdx === 1 ? "voiceover" : "music"]);

      const needsVoiceover = voiceoverUrl && tracks.length < 2;
      const needsMusic =
        backgroundMusicUrl && tracks.length < 3;

      if (needsVoiceover || needsMusic) {
        const clone = JSON.parse(JSON.stringify(saved));
        const vol =
          getClipSettings(1, 0)?.volume != null
            ? Math.max(0, Math.min(1, Number(getClipSettings(1, 0).volume)))
            : Math.max(0, Math.min(1, Number(oldSettings.voiceoverVolume ?? 1)));
        const musVol =
          getClipSettings(2, 0)?.volume != null
            ? Math.max(0, Math.min(1, Number(getClipSettings(2, 0).volume)))
            : Math.max(0, Math.min(1, Number(oldSettings.musicVolume ?? 0.25)));
        const voTrim = Math.max(0, Number(oldSettings.voiceoverTrim ?? 0));
        const musTrim = Math.max(0, Number(oldSettings.musicTrim ?? 0));
        const voLen =
          oldSettings.voiceoverLength != null &&
          oldSettings.voiceoverLength !== "auto"
            ? Math.max(0.1, Number(oldSettings.voiceoverLength))
            : "auto";
        const musLen =
          oldSettings.musicLength != null && oldSettings.musicLength !== "auto"
            ? Math.max(0.1, Number(oldSettings.musicLength))
            : "auto";

        if (needsVoiceover) {
          const voFade = getClipSettings(1, 0) ?? clipSettings.voiceover;
          const voEffect =
            voFade?.fadeIn && voFade?.fadeOut
              ? "fadeInFadeOut"
              : voFade?.fadeIn
                ? "fadeIn"
                : voFade?.fadeOut
                  ? "fadeOut"
                  : undefined;
          const voiceoverClip = {
            asset: {
              type: "audio",
              src: voiceoverUrl,
              volume: vol,
              ...(voEffect && { volumeEffect: voEffect }),
            },
            start: 0,
            length: voLen,
          };
          if (voTrim > 0) voiceoverClip.trim = voTrim;
          while (clone.timeline.tracks.length < 2) {
            clone.timeline.tracks.push({ clips: [] });
          }
          clone.timeline.tracks[1] = { clips: [voiceoverClip] };
        }

        if (needsMusic) {
          const musFade = getClipSettings(2, 0) ?? clipSettings.music;
          const musEffect =
            musFade?.fadeIn && musFade?.fadeOut
              ? "fadeInFadeOut"
              : musFade?.fadeIn
                ? "fadeIn"
                : musFade?.fadeOut
                  ? "fadeOut"
                  : undefined;
          const musicClip = {
            asset: {
              type: "audio",
              src: backgroundMusicUrl,
              volume: musVol,
              ...(musEffect && { volumeEffect: musEffect }),
            },
            start: 0,
            length: musLen,
          };
          if (musTrim > 0) musicClip.trim = musTrim;
          while (clone.timeline.tracks.length < 3) {
            clone.timeline.tracks.push({ clips: [] });
          }
          clone.timeline.tracks[2] = { clips: [musicClip] };
        }

        return clone;
      }

      // Ensure music track when we have 2 tracks but no music (saved edit may lack it)
      if (backgroundMusicUrl && tracks.length >= 2 && tracks.length < 3) {
        const musVol =
          getClipSettings(2, 0)?.volume != null
            ? Math.max(0, Math.min(1, Number(getClipSettings(2, 0).volume)))
            : Math.max(0, Math.min(1, Number(oldSettings.musicVolume ?? 0.25)));
        const musTrim = Math.max(0, Number(oldSettings.musicTrim ?? 0));
        const musLen =
          oldSettings.musicLength != null && oldSettings.musicLength !== "auto"
            ? Math.max(0.1, Number(oldSettings.musicLength))
            : "auto";
        const musicClip = {
          asset: { type: "audio", src: backgroundMusicUrl, volume: musVol },
          start: 0,
          length: musLen,
        };
        if (musTrim > 0) musicClip.trim = musTrim;
        const clone = JSON.parse(JSON.stringify(saved));
        while (clone.timeline.tracks.length < 3) {
          clone.timeline.tracks.push({ clips: [] });
        }
        clone.timeline.tracks[2] = { clips: [musicClip] };
        return clone;
      }

      // Ensure music track when we have 3 tracks but music track is empty
      if (
        backgroundMusicUrl &&
        tracks.length >= 3 &&
        (!tracks[2]?.clips?.length)
      ) {
        const musVol =
          getClipSettings(2, 0)?.volume != null
            ? Math.max(0, Math.min(1, Number(getClipSettings(2, 0).volume)))
            : Math.max(0, Math.min(1, Number(oldSettings.musicVolume ?? 0.25)));
        const musTrim = Math.max(0, Number(oldSettings.musicTrim ?? 0));
        const musLen =
          oldSettings.musicLength != null && oldSettings.musicLength !== "auto"
            ? Math.max(0.1, Number(oldSettings.musicLength))
            : "auto";
        const musicClip = {
          asset: { type: "audio", src: backgroundMusicUrl, volume: musVol },
          start: 0,
          length: musLen,
        };
        if (musTrim > 0) musicClip.trim = musTrim;
        const clone = JSON.parse(JSON.stringify(saved));
        clone.timeline.tracks[2] = { clips: [musicClip] };
        return clone;
      }

      // Normalize music track to single clip – saved edit may have duplicate clips (from SDK or old bug)
      if (
        backgroundMusicUrl &&
        tracks.length >= 3 &&
        (tracks[2]?.clips?.length ?? 0) > 1
      ) {
        const musVol =
          getClipSettings(2, 0)?.volume != null
            ? Math.max(0, Math.min(1, Number(getClipSettings(2, 0).volume)))
            : Math.max(0, Math.min(1, Number(oldSettings.musicVolume ?? 0.25)));
        const musTrim = Math.max(0, Number(oldSettings.musicTrim ?? 0));
        const musLen =
          oldSettings.musicLength != null && oldSettings.musicLength !== "auto"
            ? Math.max(0.1, Number(oldSettings.musicLength))
            : "auto";
        const musFade = getClipSettings(2, 0) ?? clipSettings.music;
        const musEffect =
          musFade?.fadeIn && musFade?.fadeOut
            ? "fadeInFadeOut"
            : musFade?.fadeIn
              ? "fadeIn"
              : musFade?.fadeOut
                ? "fadeOut"
                : undefined;
        const musicClip = {
          asset: {
            type: "audio",
            src: backgroundMusicUrl,
            volume: musVol,
            ...(musEffect && { volumeEffect: musEffect }),
          },
          start: 0,
          length: musLen,
        };
        if (musTrim > 0) musicClip.trim = musTrim;
        const clone = JSON.parse(JSON.stringify(saved));
        clone.timeline.tracks[2] = { clips: [musicClip] };
        return clone;
      }

      return saved;
    }

    return buildInitialEdit(
      effectiveVideos,
      voiceoverUrl,
      backgroundMusicUrl,
      sceneDurations,
      scriptData,
      getSceneDurationSeconds,
      initialTimelineSettings || {},
    );
  }, [
    videos,
    voiceoverUrl,
    backgroundMusicUrl,
    sceneDurations,
    scriptData,
    getSceneDurationSeconds,
    initialTimelineSettings,
  ]);

  initialEditRef.current = editToLoad;

  const editKey = useMemo(() => {
    try {
      return editToLoad ? JSON.stringify(editToLoad) : "";
    } catch {
      return "";
    }
  }, [editToLoad]);

  const effectiveVideos =
    videos?.length > 0
      ? videos
      : (scriptData?.scenes || [])
          .filter((s) => {
            const url =
              s?.selected_video_url ||
              (Array.isArray(s?.video_urls) &&
                s.video_urls.length > 0 &&
                s.video_urls[s.video_urls.length - 1]);
            return url && s?.id != null;
          })
          .map((s) => ({
            scene_id: s.id,
            video_url:
              s?.selected_video_url ||
              (Array.isArray(s?.video_urls) && s.video_urls.length > 0
                ? s.video_urls[s.video_urls.length - 1]
                : null),
          }))
          .filter((v) => v.video_url);

  // Scale timeline to fit container width (1080→containerWidth)
  useEffect(() => {
    const el = timelineContainerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setTimelineScale(w / 1080);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [editKey]);

  // Init Shotstack Studio SDK
  useEffect(() => {
    const editToLoadCur = initialEditRef.current;
    if (!editKey || !editToLoadCur) return;

    let cancelled = false;

    async function initStudioSdk() {
      try {
        if (typeof window === "undefined") return;
        const studioRoot = document.querySelector("[data-shotstack-studio]");
        const timelineRoot = document.querySelector(
          "[data-shotstack-timeline]",
        );
        if (!studioRoot || !timelineRoot) return;

        studioRoot.innerHTML = "";
        timelineRoot.innerHTML = "";

        await new Promise((r) => {
          requestAnimationFrame(() => requestAnimationFrame(r));
        });
        if (cancelled) return;

        const {
          Edit: StudioEdit,
          Canvas,
          Controls,
          Timeline: StudioTimeline,
        } = await import("@shotstack/shotstack-studio");

        if (cancelled) return;

        const studioEditJson = JSON.parse(JSON.stringify(editToLoadCur || {}));
        const origin =
          typeof window !== "undefined" ? window.location.origin : "";

        try {
          const allTracks = studioEditJson.timeline?.tracks || [];
          const tracks = allTracks.map((t) => JSON.parse(JSON.stringify(t)));

          // Use current project URLs for audio to avoid stale/blob URLs that break on refresh
          if (voiceoverUrl && tracks[1]?.clips?.[0]?.asset?.type === "audio") {
            tracks[1].clips[0].asset.src = voiceoverUrl.startsWith("http")
              ? voiceoverUrl
              : origin +
                (voiceoverUrl.startsWith("/")
                  ? voiceoverUrl
                  : "/" + voiceoverUrl);
          }
          if (
            backgroundMusicUrl &&
            tracks[2]?.clips?.[0]?.asset?.type === "audio"
          ) {
            tracks[2].clips[0].asset.src = backgroundMusicUrl.startsWith("http")
              ? backgroundMusicUrl
              : origin +
                (backgroundMusicUrl.startsWith("/")
                  ? backgroundMusicUrl
                  : "/" + backgroundMusicUrl);
          }

          for (const track of tracks) {
            for (const clip of track.clips || []) {
              delete clip.alias;
              const asset = clip?.asset;
              if (asset?.src && typeof asset.src === "string") {
                let src = asset.src;
                if (src.startsWith("/")) src = origin ? origin + src : "";
                if (src.startsWith("http://") || src.startsWith("https://")) {
                  src = proxyMediaUrlForTimeline(src, origin);
                  asset.src = src;
                }
              }
              if (clip.transition) {
                if (clip.transition.in === "none") clip.transition.in = "fade";
                if (clip.transition.out === "none")
                  clip.transition.out = "fade";
              }
              if (asset && (asset.type === "video" || asset.type === "audio")) {
                const v = asset.volume ?? 0.5;
                asset.volume = Math.min(1, Math.max(0, Number(v)));
                // SDK loadEdit rejects volumeEffect (ZodError) — strip it before loadEdit
                if ("volumeEffect" in asset) {
                  const { volumeEffect: _, ...rest } = asset;
                  clip.asset = rest;
                }
              }
            }
          }
          studioEditJson.timeline.tracks = tracks;
        } catch {
          /* best-effort */
        }

        const size = studioEditJson.output?.size || {
          width: 1080,
          height: 1920,
        };
        const bg = studioEditJson.timeline?.background || "#000000";

        const studioEdit = new StudioEdit(size, bg);
        await studioEdit.load();

        // Register AudioLoadParser/FontLoadParser BEFORE loadEdit – otherwise audio fails to load
        const canvas = new Canvas(size, studioEdit);
        canvas.registerExtensions();

        usedVideoOnlyFallbackRef.current = false;
        try {
          await studioEdit.loadEdit(studioEditJson);
        } catch (loadErr) {
          // PixiJS/SDK may fail to load audio (parser not found). Fall back to video-only for preview.
          console.warn(
            "[TimelineEditor] loadEdit failed (audio loading may have failed), retrying with video-only for preview",
            loadErr,
          );
          usedVideoOnlyFallbackRef.current = true;
          studioEditJson.timeline.tracks =
            studioEditJson.timeline.tracks?.slice(0, 1) ?? [];
          await studioEdit.loadEdit(studioEditJson);
        }

        if (cancelled) return;

        await canvas.load();

        if (cancelled) return;

        // Override SDK's gray (#424242) canvas background to black
        if (canvas.background && canvas.size) {
          canvas.background.clear();
          canvas.background.fillStyle = { color: "#000000" };
          canvas.background.rect(0, 0, canvas.size.width, canvas.size.height);
          canvas.background.fill();
        }

        const canvasEl = studioRoot.querySelector("canvas");
        if (canvasEl) {
          canvasEl.style.maxWidth = "100%";
          canvasEl.style.maxHeight = "100%";
          canvasEl.style.width = "auto";
          canvasEl.style.height = "auto";
          canvasEl.style.objectFit = "contain";
          canvasEl.style.objectPosition = "center";
        }
        studioRoot.style.display = "flex";
        studioRoot.style.alignItems = "center";
        studioRoot.style.justifyContent = "center";
        studioRoot.style.overflow = "hidden";

        const controls = new Controls(studioEdit);
        await controls.load();

        if (cancelled) return;

        const timeline = new StudioTimeline(studioEdit, {
          width: size.width,
          height: 400,
          trackHeight: 40,
        });
        await timeline.load();

        const onClipSelected = (data) => {
          setSelectedClip(
            data?.trackIndex != null && data?.clipIndex != null
              ? { trackIndex: data.trackIndex, clipIndex: data.clipIndex }
              : null,
          );
        };
        const onSelectionCleared = () => setSelectedClip(null);
        studioEdit.events?.on?.("clip:selected", onClipSelected);
        studioEdit.events?.on?.("selection:cleared", onSelectionCleared);
        clipEventHandlersRef.current = { onClipSelected, onSelectionCleared };

        if (cancelled) {
          try {
            canvas?.dispose?.();
            timeline?.dispose?.();
            controls?.dispose?.();
            studioEdit?.dispose?.();
          } catch (e) {
            console.warn("[TimelineEditor] SDK dispose (cancelled) error:", e);
          }
          return;
        }
        studioEditRef.current = studioEdit;
        studioSdkInstancesRef.current = { canvas, timeline, controls };
        setStudioReadyTick((t) => t + 1);
        console.log("[TimelineEditor] Studio SDK initialised");
      } catch (err) {
        console.warn("[TimelineEditor] Studio SDK init failed", err);
        studioEditRef.current = null;
      }
    }

    initStudioSdk();

    return () => {
      cancelled = true;
      usedVideoOnlyFallbackRef.current = false;
      fadeOverrideRef.current = Object.create(null);
      if (volumeReloadTimeoutRef.current) {
        clearTimeout(volumeReloadTimeoutRef.current);
        volumeReloadTimeoutRef.current = null;
      }
      const edit = studioEditRef.current;
      const instances = studioSdkInstancesRef.current;
      const handlers = clipEventHandlersRef.current;
      if (edit && handlers) {
        edit.events?.off?.("clip:selected", handlers.onClipSelected);
        edit.events?.off?.("selection:cleared", handlers.onSelectionCleared);
        clipEventHandlersRef.current = null;
      }
      if (edit?.pause) edit.pause();
      // Dispose SDK instances to stop ticker and prevent "Cannot read properties of null (reading 'resource')"
      try {
        if (instances?.canvas?.dispose) instances.canvas.dispose();
        if (instances?.timeline?.dispose) instances.timeline.dispose();
        if (instances?.controls?.dispose) instances.controls.dispose();
        if (edit?.dispose) edit.dispose();
      } catch (e) {
        // PixiJS TexturePool bug on unmount (e.g. HMR): "Cannot read properties of undefined (reading 'push')"
        // Shotstack SDK triggers this during dispose; safe to ignore.
        if (e?.message?.includes?.("push")) return;
        console.warn("[TimelineEditor] SDK dispose error:", e);
      }
      studioSdkInstancesRef.current = null;
      studioEditRef.current = null;
      setSelectedClip(null);
      const studioRoot = document.querySelector("[data-shotstack-studio]");
      const timelineRoot = document.querySelector("[data-shotstack-timeline]");
      if (studioRoot) studioRoot.innerHTML = "";
      if (timelineRoot) timelineRoot.innerHTML = "";
    };
  }, [editKey, voiceoverUrl, backgroundMusicUrl]);

  // Persist edit from Studio on timeline changes (debounced)
  const saveTimeoutRef = useRef(null);
  useEffect(() => {
    const studioEdit = studioEditRef.current;
    if (!studioEdit || !projectId) return;

    const getEffectiveEdit = () => {
      if (
        usedVideoOnlyFallbackRef.current &&
        initialEditRef.current?.timeline?.tracks?.length >= 2
      ) {
        const sd = studioEdit.getEdit?.();
        if (sd?.timeline?.tracks?.length >= 1) {
          const audioTracks = initialEditRef.current.timeline.tracks.slice(1);
          return {
            ...sd,
            timeline: {
              ...sd.timeline,
              tracks: [...sd.timeline.tracks, ...audioTracks],
            },
          };
        }
      }
      return studioEdit.getEdit?.();
    };

    const onTimelineUpdated = () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveTimeoutRef.current = null;
        const edit = getEffectiveEdit?.() ?? initialEditRef.current;
        if (!edit?.timeline || !edit?.output) return;
        // Extract gapTransitions and transitionGapByIndex from edit so buildInitialEdit can restore them on rebuild
        const videoClips = edit.timeline?.tracks?.[0]?.clips ?? [];
        const gapTransitions = {};
        const transitionGapByIndex = {};
        const fromTransitionValue = (v) => {
          if (!v || v === "none") return { type: "none", duration: 1 };
          if (v === "fade" || v === "fadeFast" || v === "fadeSlow") {
            const dur = v === "fadeFast" ? 0.5 : v === "fadeSlow" ? 2 : 1;
            return { type: "fade", duration: dur };
          }
          const m = v.match(/^(slideLeft|slideRight|slideUp|slideDown)(Fast|Slow)?$/);
          if (m) {
            const dur = m[2] === "Fast" ? 0.5 : m[2] === "Slow" ? 2 : 1;
            return { type: m[1], duration: dur };
          }
          return { type: "fade", duration: 1 };
        };
        for (let i = 0; i < videoClips.length - 1; i++) {
          const curr = videoClips[i];
          const next = videoClips[i + 1];
          const outVal = curr?.transition?.out ?? "fade";
          const parsed = fromTransitionValue(outVal);
          gapTransitions[String(i)] = outVal;
          // Extract overlap from clip positions (preserves 0s when user chose Fade + 0s)
          const cEnd = (Number(curr?.start) || 0) + (Number(curr?.length) || 0);
          const nStart = Number(next?.start) || 0;
          const overlap = Math.max(-2, Math.min(2, cEnd - nStart));
          transitionGapByIndex[String(i)] =
            outVal === "none" && overlap >= 0 ? 0 : overlap;
        }
        const clipAudioSettings = {};
        const allTracks = edit.timeline?.tracks ?? [];
        const fOverrides = fadeOverrideRef.current;
        allTracks.forEach((track, ti) => {
          (track.clips ?? []).forEach((clip, ci) => {
            const a = clip?.asset;
            if (a && (a.type === "video" || a.type === "audio")) {
              const vol = Math.max(0, Math.min(1, Number(a.volume ?? 0.5)));
              const ve = a.volumeEffect;
              const key = `${ti}-${ci}`;
              const ov = fOverrides[key];
              const fadeIn = ov?.fadeIn ?? (ve === "fadeIn" || ve === "fadeInFadeOut");
              const fadeOut = ov?.fadeOut ?? (ve === "fadeOut" || ve === "fadeInFadeOut");
              const prevSettings = initialTimelineSettings?.clipAudioSettings?.[key];
              clipAudioSettings[key] = {
                volume: vol,
                fadeIn: !!fadeIn,
                fadeOut: !!fadeOut,
                fadeInDuration: ov?.fadeInDuration ?? prevSettings?.fadeInDuration ?? 1,
                fadeOutDuration: ov?.fadeOutDuration ?? prevSettings?.fadeOutDuration ?? 1,
              };
            }
          });
        });
        const prev = initialTimelineSettings && typeof initialTimelineSettings === "object"
          ? initialTimelineSettings
          : {};
        fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            timeline_settings: {
              ...prev,
              edit,
              gapTransitions: Object.keys(gapTransitions).length > 0 ? gapTransitions : prev.gapTransitions,
              transitionGapByIndex: Object.keys(transitionGapByIndex).length > 0 ? transitionGapByIndex : prev.transitionGapByIndex,
              clipAudioSettings: Object.keys(clipAudioSettings).length > 0 ? clipAudioSettings : prev.clipAudioSettings,
            },
          }),
        }).catch((err) => console.warn("Timeline auto-save failed:", err));
      }, DEBOUNCE_MS);
    };

    studioEdit.events?.on?.("clip:updated", onTimelineUpdated);
    studioEdit.events?.on?.("timeline:updated", onTimelineUpdated);
    return () => {
      studioEdit.events?.off?.("clip:updated", onTimelineUpdated);
      studioEdit.events?.off?.("timeline:updated", onTimelineUpdated);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [projectId, editKey, studioReadyTick, initialTimelineSettings]); // studioReadyTick: attach when init completes

  useImperativeHandle(
    ref,
    () => ({
      getEdit: () => {
        const studioEdit = studioEditRef.current;
        const initialEdit = initialEditRef.current;
        const usedFallback = usedVideoOnlyFallbackRef.current;
        const clipSettings = initialTimelineSettings?.clipAudioSettings ?? {};
        const fOverrides = fadeOverrideRef.current;

        let edit = null;
        if (
          usedFallback &&
          studioEdit &&
          initialEdit?.timeline?.tracks?.length >= 2
        ) {
          const studioEditData = studioEdit.getEdit?.();
          if (studioEditData?.timeline?.tracks?.length >= 1) {
            edit = {
              ...studioEditData,
              timeline: {
                ...studioEditData.timeline,
                tracks: [
                  ...studioEditData.timeline.tracks,
                  ...initialEdit.timeline.tracks.slice(1),
                ],
              },
            };
          }
        }
        if (!edit) {
          edit = studioEdit?.getEdit?.() ?? initialEdit ?? null;
        }
        if (!edit?.timeline?.tracks || !edit?.output) return edit;

        // Apply clipAudioSettings + fadeOverrideRef so render has correct volume/fade
        edit = JSON.parse(JSON.stringify(edit));
        edit.timeline.tracks.forEach((track, ti) => {
          (track.clips ?? []).forEach((clip, ci) => {
            const a = clip?.asset;
            if (!a || (a.type !== "video" && a.type !== "audio")) return;
            const key = `${ti}-${ci}`;
            const ov = fOverrides[key];
            const saved = clipSettings[key] ?? {};
            const vol = Math.max(0, Math.min(1, ov?.volume ?? saved?.volume ?? Number(a.volume ?? 0.5)));
            const fadeIn = ov?.fadeIn ?? saved?.fadeIn ?? (a.volumeEffect === "fadeIn" || a.volumeEffect === "fadeInFadeOut");
            const fadeOut = ov?.fadeOut ?? saved?.fadeOut ?? (a.volumeEffect === "fadeOut" || a.volumeEffect === "fadeInFadeOut");
            const fadeInDur = ov?.fadeInDuration ?? saved?.fadeInDuration ?? 1;
            const fadeOutDur = ov?.fadeOutDuration ?? saved?.fadeOutDuration ?? 1;
            const clipLen = Number(clip.length) || (ti === 0 ? 8 : 30);

            if (fadeIn || fadeOut) {
              const volAsset = buildVolumeWithFade(vol, fadeIn, fadeOut, fadeInDur, fadeOutDur, clipLen);
              if (Array.isArray(volAsset)) {
                clip.asset = { ...a, volume: volAsset };
                delete clip.asset.volumeEffect;
              } else {
                const effect = fadeIn && fadeOut ? "fadeInFadeOut" : fadeIn ? "fadeIn" : "fadeOut";
                clip.asset = { ...a, volume: volAsset, volumeEffect: effect };
              }
            } else {
              clip.asset = { ...a, volume: vol };
              delete clip.asset.volumeEffect;
            }
          });
        });
        return edit;
      },
    }),
    [initialTimelineSettings],
  );

  if (!effectiveVideos.length || !voiceoverUrl) {
    return (
      <div className="rounded-xl border border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
        {!effectiveVideos.length && !voiceoverUrl
          ? "Loading project data…"
          : !effectiveVideos.length
            ? "No videos found. Generate videos in Step 4 first."
            : "No voiceover found. Generate voiceover in Step 2 first."}
      </div>
    );
  }

  const totalSeconds = (() => {
    const tracks = editToLoad?.timeline?.tracks ?? [];
    const clips = tracks[0]?.clips ?? [];
    if (!clips.length) return 0;
    return Math.max(
      ...clips.map((c) => (Number(c.start) || 0) + (Number(c.length) || 0)),
    );
  })();

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  // Transition options: type + duration (duration maps to Fast/default/Slow for fade)
  const TRANSITION_TYPES = [
    { value: "none", label: "None" },
    { value: "fade", label: "Fade" },
    { value: "slideLeft", label: "Slide left" },
    { value: "slideRight", label: "Slide right" },
    { value: "slideUp", label: "Slide up" },
    { value: "slideDown", label: "Slide down" },
  ];
  const TRANSITION_DURATIONS = [
    { value: -1, label: "1s gap" },
    { value: -0.5, label: "0.5s gap" },
    { value: 0, label: "0s", suffix: "Instant" },
    { value: 0.5, label: "0.5s", suffix: "Fast" },
    { value: 1, label: "1s", suffix: "" },
    { value: 2, label: "2s", suffix: "Slow" },
  ];
  const toTransitionValue = (type, durationSec) => {
    if (type === "none") return "none";
    if (type === "fade") {
      const d =
        TRANSITION_DURATIONS.find((x) => x.value === durationSec) ||
        TRANSITION_DURATIONS[2]; // 0s default
      if (durationSec === 0) return "fade";
      if (durationSec < 0) return "fade"; // gap: store via transitionGapByIndex
      return d.suffix ? `fade${d.suffix}` : "fade";
    }
    return type; // slide types don't have duration variants in Shotstack
  };
  const fromTransitionValue = (v) => {
    if (!v || v === "none") return { type: "none", duration: 0 };
    if (v === "fade" || v === "fadeFast" || v === "fadeSlow") {
      const dur =
        v === "fadeFast" ? 0.5 : v === "fadeSlow" ? 2 : 1;
      return { type: "fade", duration: dur };
    }
    const m = v.match(/^(slideLeft|slideRight|slideUp|slideDown)(Fast|Slow)?$/);
    if (m) {
      const dur = m[2] === "Fast" ? 0.5 : m[2] === "Slow" ? 2 : 1;
      return { type: m[1], duration: dur };
    }
    return { type: "fade", duration: 1 };
  };

  // Use editToLoad for structure (row count) so panels don't disappear when SDK reloads.
  // Use live getEdit() only for current values when available.
  const structureEdit = editToLoad;
  const liveEdit = studioEditRef.current?.getEdit?.();

  const transitionGaps = (() => {
    const structureClips = structureEdit?.timeline?.tracks?.[0]?.clips ?? [];
    const numGaps = Math.max(0, structureClips.length - 1);
    if (numGaps === 0) return [];
    const tracks = (liveEdit ?? structureEdit)?.timeline?.tracks ?? [];
    const videoClips = tracks[0]?.clips ?? [];
    const list = [];
    for (let i = 0; i < numGaps; i++) {
      const curr = videoClips[i] ?? structureClips[i];
      const next = videoClips[i + 1] ?? structureClips[i + 1];
      const outVal = curr?.transition?.out ?? "fade";
      const parsed = fromTransitionValue(outVal);
      const cEnd = (Number(curr?.start) || 0) + (Number(curr?.length) || 0);
      const nStart = Number(next?.start) || 0;
      const overlap = Math.max(-2, Math.min(2, cEnd - nStart));
      const duration =
        outVal === "none"
          ? overlap < 0 ? overlap : 0
          : overlap;
      list.push({
        gapIndex: i,
        label: `V${i + 1}→V${i + 2}`,
        type: parsed.type,
        duration,
        clipIndices: [i, i + 1],
      });
    }
    return list;
  })();

  const clipSettings = initialTimelineSettings?.clipAudioSettings ?? {};
  const clipsWithVolume = (() => {
    const tracks = (liveEdit ?? structureEdit)?.timeline?.tracks ?? [];
    const structureTracks = structureEdit?.timeline?.tracks ?? [];
    const fOverrides = fadeOverrideRef.current;
    let totalDuration = 0;
    const v0 = tracks[0]?.clips ?? [];
    if (v0.length)
      totalDuration = Math.max(
        ...v0.map((c) => (Number(c.start) || 0) + (Number(c.length) || 0)),
      );
    const list = [];
    const trackNames = ["Video", "Voiceover", "Music"];
    structureTracks.forEach((structureTrack, ti) => {
      const structureClips = structureTrack?.clips ?? [];
      const liveTrack = tracks[ti];
      const liveClips = liveTrack?.clips ?? [];
      structureClips.forEach((_, ci) => {
        const clip = liveClips[ci] ?? structureTrack?.clips?.[ci];
        const asset = clip?.asset;
        if (asset && (asset.type === "audio" || asset.type === "video")) {
          const vol = Math.max(0, Math.min(1, Number(asset.volume ?? 0.5)));
          const ve = asset.volumeEffect;
          const key = `${ti}-${ci}`;
          const ov = fOverrides[key];
          const saved = clipSettings[key];
          const fadeIn = ov != null ? !!ov.fadeIn : (ve === "fadeIn" || ve === "fadeInFadeOut");
          const fadeOut = ov != null ? !!ov.fadeOut : (ve === "fadeOut" || ve === "fadeInFadeOut");
          const fadeInDuration = ov?.fadeInDuration ?? saved?.fadeInDuration ?? 1;
          const fadeOutDuration = ov?.fadeOutDuration ?? saved?.fadeOutDuration ?? 1;
          const start = Number(clip.start) || 0;
          const length = Number(clip.length) || 1;
          const label = ti === 0 ? `V${ci + 1}` : trackNames[ti];
          list.push({
            trackIndex: ti,
            clipIndex: ci,
            label,
            vol,
            fadeIn,
            fadeOut,
            fadeInDuration,
            fadeOutDuration,
            start,
            length,
            totalDuration: totalDuration || 1,
          });
        }
      });
    });
    return list;
  })();

  // Ensure loadEdit receives full edit including voiceover/music – getEdit() can sometimes return fewer tracks
  // volumeOverrides: { "trackIndex-clipIndex": 0.5 } – explicitly set volume so preview reflects slider changes
  // Note: Shotstack SDK loadEdit rejects volumeEffect on asset (ZodError); we do NOT add it and strip any existing before return
  const getEditForLoad = (overrides = {}) => {
    const volumeOverrides = overrides.volume ?? {};
    const ed = studioEditRef.current;
    const raw = ed?.getEdit?.();
    const initial = initialEditRef.current;
    // When getEdit() returns no/empty tracks but we have overrides, use initial edit as base
    const base = raw?.timeline?.tracks?.length
      ? raw
      : initial?.timeline?.tracks?.length
        ? JSON.parse(JSON.stringify(initial))
        : raw;
    if (!base?.timeline?.tracks) return base;
    const expectedCount = initial?.timeline?.tracks?.length ?? 0;
    let edit = base;
    if (
      !usedVideoOnlyFallbackRef.current &&
      edit.timeline.tracks.length < expectedCount
    ) {
      const audioTracks = initial.timeline.tracks.slice(edit.timeline.tracks.length);
      edit = {
        ...edit,
        timeline: {
          ...edit.timeline,
          tracks: [...edit.timeline.tracks, ...audioTracks],
        },
      };
    }
    const hasVolumeOverrides = Object.keys(volumeOverrides).length > 0;
    if (hasVolumeOverrides && edit?.timeline?.tracks) {
      edit = JSON.parse(JSON.stringify(edit));
      for (const [key, vol] of Object.entries(volumeOverrides)) {
        const [ti, ci] = key.split("-").map(Number);
        const clip = edit.timeline.tracks?.[ti]?.clips?.[ci];
        if (clip?.asset && Number.isFinite(vol)) {
          clip.asset = { ...clip.asset, volume: Math.max(0, Math.min(1, vol)) };
        }
      }
    }
    // SDK rejects volumeEffect on asset; strip it so loadEdit succeeds (clone first to avoid mutating base)
    if (edit?.timeline?.tracks) {
      edit = JSON.parse(JSON.stringify(edit));
      for (const track of edit.timeline.tracks) {
        for (const clip of track.clips ?? []) {
          if (clip?.asset && "volumeEffect" in clip.asset) {
            const { volumeEffect: _, ...rest } = clip.asset;
            clip.asset = rest;
          }
        }
      }
    }
    return edit;
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-10rem)] w-full flex-col rounded-xl border-2 border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-900">
      <div className="flex flex-1 flex-col gap-3 border-b border-gray-200 bg-black p-4 dark:border-gray-700 overflow-hidden min-h-0">
        <div className="flex w-full shrink-0 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-300">
              Shotstack Studio
            </span>
            <button
              type="button"
              onClick={() => {
                const edit = studioEditRef.current;
                if (
                  edit &&
                  typeof edit.seek === "function" &&
                  typeof edit.play === "function"
                ) {
                  edit.seek(0);
                  edit.play();
                }
              }}
              className="rounded-md bg-amber-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!studioEditRef.current}
              title="Play from start"
            >
              Play from start
            </button>
          </div>
          <span className="text-sm tabular-nums text-gray-400">
            {formatTime(totalSeconds)} total
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-3 min-h-0 overflow-hidden">
          {/* Preview – above timeline */}
          <div className="shrink-0 flex items-center justify-center bg-black">
            <div
              data-shotstack-studio
              className="flex items-center justify-center overflow-hidden rounded-md bg-black"
              style={{ aspectRatio: "9/16", width: 260, maxWidth: "100%" }}
            />
          </div>
          <div className="flex flex-1 min-h-0 min-w-0 overflow-auto">
            {/* Timeline – 1080×400 scaled; overflow-auto enables vertical scroll when content exceeds container */}
            <div
              ref={timelineContainerRef}
              className="flex min-h-[320px] flex-1 min-w-0 overflow-auto"
            >
              <div
                className="shrink-0 origin-top-left overflow-visible rounded-md bg-black"
                style={{
                  width: 1080 * timelineScale,
                  height: 400 * timelineScale,
                }}
              >
                <div
                  data-shotstack-timeline
                  className="rounded-md bg-black origin-top-left"
                  style={{
                    width: 1080,
                    height: 400,
                    transform: `scale(${timelineScale})`,
                  }}
                />
              </div>
            </div>
          </div>
          {/* Volume + Transition controls – below timeline */}
          {(clipsWithVolume.length > 0 || transitionGaps.length > 0) && (
            <div className="shrink-0 flex flex-col gap-4 rounded-md border border-gray-600 bg-gray-800/60 px-4 py-3">
              {clipsWithVolume.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide" title="Audio fade applies in the rendered video; Shotstack Studio preview may not show it">
                    Clip volume
                  </span>
                  <div className="flex flex-wrap gap-x-8 gap-y-3">
                    {clipsWithVolume.map(
                      ({
                        trackIndex,
                        clipIndex,
                        label,
                        vol,
                        fadeIn: initialFadeIn,
                        fadeOut: initialFadeOut,
                        fadeInDuration: initialFadeInDuration,
                        fadeOutDuration: initialFadeOutDuration,
                      }) => {
                        const edit = studioEditRef.current;
                        const clip = edit?.getClip?.(trackIndex, clipIndex);
                        const asset = clip?.asset;
                        const currentVol = asset
                          ? Math.max(
                              0,
                              Math.min(1, Number(asset.volume ?? 0.5)),
                            )
                          : vol;
                        const ve = asset?.volumeEffect;
                        const override = fadeOverrideRef.current[`${trackIndex}-${clipIndex}`];
                        const fadeIn =
                          override != null
                            ? override.fadeIn
                            : asset != null
                              ? ve === "fadeIn" || ve === "fadeInFadeOut"
                              : initialFadeIn;
                        const fadeOut =
                          override != null
                            ? override.fadeOut
                            : asset != null
                              ? ve === "fadeOut" || ve === "fadeInFadeOut"
                              : initialFadeOut;
                        const fadeInDuration = override?.fadeInDuration ?? initialFadeInDuration ?? 1;
                        const fadeOutDuration = override?.fadeOutDuration ?? initialFadeOutDuration ?? 1;

                        const key = `${trackIndex}-${clipIndex}`;
                        const FADE_DURATIONS = [0.5, 1, 2];
                        const setVolumeEffect = (inVal, outVal, inDur, outDur) => {
                          const val =
                            inVal && outVal
                              ? "fadeInFadeOut"
                              : inVal
                                ? "fadeIn"
                                : outVal
                                  ? "fadeOut"
                                  : "none";
                          fadeOverrideRef.current[key] = {
                            fadeIn: inVal,
                            fadeOut: outVal,
                            fadeInDuration: inDur ?? fadeInDuration,
                            fadeOutDuration: outDur ?? fadeOutDuration,
                          };
                          const ed = studioEditRef.current;
                          const c = ed?.getClip?.(trackIndex, clipIndex);
                          const a = c?.asset;
                          if (ed && c && a) {
                            ed.updateClip(trackIndex, clipIndex, {
                              asset: { ...a, volumeEffect: val },
                            });
                          }
                          setVolumeChangeTick((t) => t + 1);
                          // Do NOT call loadEdit on fade toggle – it clears clips and re-adds, causing
                          // "Invalid video source" / "Asset not found in Cache" and disappearing clips.
                          // updateClip above handles live preview; fadeOverrideRef + clipAudioSettings handle persistence.
                        };
                        const setFadeDuration = (which, sec) => {
                          const d = Math.max(0.5, Math.min(5, Number(sec) ?? 1));
                          fadeOverrideRef.current[key] = {
                            fadeIn,
                            fadeOut,
                            fadeInDuration: which === "in" ? d : fadeInDuration,
                            fadeOutDuration: which === "out" ? d : fadeOutDuration,
                          };
                          setVolumeChangeTick((t) => t + 1);
                        };

                        return (
                          <div
                            key={`${trackIndex}-${clipIndex}`}
                            className="flex items-center gap-3 flex-wrap"
                          >
                            <span className="w-16 shrink-0 text-xs text-gray-300">
                              {label}
                            </span>
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step={0.05}
                              value={currentVol}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                const ed = studioEditRef.current;
                                const c = ed?.getClip?.(trackIndex, clipIndex);
                                const a = c?.asset;
                                if (ed && c && a) {
                                  ed.updateClip(trackIndex, clipIndex, {
                                    asset: { ...a, volume: v },
                                  });
                                  setVolumeChangeTick((t) => t + 1);
                                  // Reload so preview reflects volume; structureEdit keeps panel rows stable
                                  if (volumeReloadTimeoutRef.current)
                                    clearTimeout(volumeReloadTimeoutRef.current);
                                  volumeReloadTimeoutRef.current = setTimeout(() => {
                                    volumeReloadTimeoutRef.current = null;
                                    const currentEdit = getEditForLoad({
                                      volume: { [`${trackIndex}-${clipIndex}`]: v },
                                    });
                                    if (currentEdit)
                                      ed.loadEdit(currentEdit).catch((err) =>
                                        console.warn("Reload after volume change:", err),
                                      );
                                  }, 300);
                                }
                              }}
                              className="h-2 w-24 shrink cursor-pointer accent-amber-500"
                              title={`${label}: ${Math.round(currentVol * 100)}%`}
                            />
                            <span className="w-10 shrink-0 text-xs tabular-nums text-amber-400">
                              {Math.round(currentVol * 100)}%
                            </span>
                            <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={fadeIn}
                                onChange={(e) =>
                                  setVolumeEffect(e.target.checked, fadeOut)
                                }
                                className="rounded border-gray-500 bg-gray-700"
                              />
                              Fade in
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={fadeOut}
                                onChange={(e) =>
                                  setVolumeEffect(fadeIn, e.target.checked)
                                }
                                className="rounded border-gray-500 bg-gray-700"
                              />
                              Fade out
                            </label>
                            {(fadeIn || fadeOut) && (
                              <span className="flex items-center gap-2 text-xs text-gray-500">
                                {fadeIn && (
                                  <label className="flex items-center gap-1">
                                    In:
                                    <select
                                      value={fadeInDuration}
                                      onChange={(e) => setFadeDuration("in", e.target.value)}
                                      className="rounded border border-gray-600 bg-gray-700 px-1 py-0.5 text-gray-300"
                                    >
                                      {FADE_DURATIONS.map((d) => (
                                        <option key={d} value={d}>{d}s</option>
                                      ))}
                                    </select>
                                  </label>
                                )}
                                {fadeOut && (
                                  <label className="flex items-center gap-1">
                                    Out:
                                    <select
                                      value={fadeOutDuration}
                                      onChange={(e) => setFadeDuration("out", e.target.value)}
                                      className="rounded border border-gray-600 bg-gray-700 px-1 py-0.5 text-gray-300"
                                    >
                                      {FADE_DURATIONS.map((d) => (
                                        <option key={d} value={d}>{d}s</option>
                                      ))}
                                    </select>
                                  </label>
                                )}
                              </span>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              )}
              {transitionGaps.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                    Transitions
                  </span>
                  <div className="flex flex-wrap gap-x-8 gap-y-3">
                    {transitionGaps.map(
                      ({ gapIndex, label, type, duration, clipIndices }) => {
                        const ed = studioEditRef.current;
                        const clip0 = ed?.getClip?.(0, clipIndices[0]);
                        const clip1 = ed?.getClip?.(0, clipIndices[1]);
                        const applyTransition = (newType, newDur) => {
                          const val = toTransitionValue(newType, newDur);
                          if (!ed || !clip0 || !clip1) return;
                          const isGap = newDur < 0;
                          const overlap =
                            newType === "none" || (newDur === 0 && !isGap)
                              ? 0
                              : isGap
                                ? 0
                                : Math.max(0.2, Math.min(2, newDur));
                          const gapSec = isGap ? Math.min(2, Math.abs(newDur)) : 0;
                          const c0End =
                            (Number(clip0.start) || 0) +
                            (Number(clip0.length) || 0);
                          const clip1NewStart = Math.max(
                            0,
                            isGap ? c0End + gapSec : c0End - overlap,
                          );
                          const t0 = { ...clip0.transition, out: val };
                          const t1 = { ...clip1.transition, in: val };
                          ed.updateClip(0, clipIndices[0], {
                            ...clip0,
                            transition: t0,
                          });
                          ed.updateClip(0, clipIndices[1], {
                            ...clip1,
                            transition: t1,
                            start: clip1NewStart,
                          });
                          setVolumeChangeTick((t) => t + 1);
                          // Only reload timeline when transition *type* changes (dropdown), not on duration slider.
                          // Slider-only changes already applied via updateClip; loadEdit clears clips and makes other settings disappear.
                          const typeChanged = newType !== type;
                          const isSlide =
                            newType === "slideLeft" ||
                            newType === "slideRight" ||
                            newType === "slideUp" ||
                            newType === "slideDown";
                          if (typeChanged && !isSlide) {
                            if (volumeReloadTimeoutRef.current)
                              clearTimeout(volumeReloadTimeoutRef.current);
                            volumeReloadTimeoutRef.current = setTimeout(() => {
                              volumeReloadTimeoutRef.current = null;
                              const currentEdit = getEditForLoad();
                              console.log("[loadEdit] transition change, edit tracks:", currentEdit?.timeline?.tracks?.length);
                              if (currentEdit)
                                ed.loadEdit(currentEdit).catch((err) =>
                                  console.warn("Reload after transition:", err),
                                );
                            }, 300);
                          }
                        };
                        return (
                          <div
                            key={`gap-${gapIndex}`}
                            className="flex items-center gap-3"
                          >
                            <span className="w-16 shrink-0 text-xs text-gray-300">
                              {label}
                            </span>
                            <select
                              value={type}
                              onChange={(e) =>
                                applyTransition(e.target.value, duration)
                              }
                              className="rounded border border-gray-600 bg-gray-700 px-2 py-1 text-xs text-gray-200"
                            >
                              {TRANSITION_TYPES.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            {(type === "fade" || type === "none") && (
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <input
                                  type="range"
                                  min={-1}
                                  max={2}
                                  step={0.1}
                                  value={duration}
                                  onChange={(e) =>
                                    applyTransition(
                                      type,
                                      parseFloat(e.target.value),
                                    )
                                  }
                                  className="h-2 w-24 min-w-0 flex-1 max-w-[120px] accent-gray-500"
                                />
                                <span className="w-16 shrink-0 text-xs text-gray-400 tabular-nums">
                                  {duration < 0
                                    ? `${Number(Math.abs(duration).toFixed(1))}s gap`
                                    : duration === 0
                                      ? "0s"
                                      : `${Number(duration).toFixed(1)}s`}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        Edit in the timeline above (drag clips, trim, adjust). Click Render to
        build the final video.
      </p>
    </div>
  );
});

export default TimelineEditor;
