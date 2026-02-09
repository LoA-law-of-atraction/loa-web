"use client";

import { useState, useRef, useEffect, useMemo, useImperativeHandle, forwardRef } from "react";

/**
 * Custom timeline editor – FCP/Premiere-style layout.
 * No media loading in browser (avoids CORS). Renders via ShotStack API.
 * ref.getEdit() returns the edit JSON for assembly.
 */
const PIXELS_PER_SECOND = 80;

/** ShotStack transition options for scene changes */
const TRANSITION_OPTIONS = [
  { value: "none", label: "None" },
  { value: "fade", label: "Fade" },
  { value: "fadeSlow", label: "Fade Slow" },
  { value: "fadeFast", label: "Fade Fast" },
  { value: "reveal", label: "Reveal" },
  { value: "wipeLeft", label: "Wipe Left" },
  { value: "wipeRight", label: "Wipe Right" },
  { value: "slideLeft", label: "Slide Left" },
  { value: "slideRight", label: "Slide Right" },
  { value: "slideUp", label: "Slide Up" },
  { value: "slideDown", label: "Slide Down" },
  { value: "zoomIn", label: "Zoom In" },
  { value: "zoomOut", label: "Zoom Out" },
  { value: "carouselLeft", label: "Carousel Left" },
  { value: "carouselRight", label: "Carousel Right" },
];
const TRACK_HEIGHT = 52;
const RULER_HEIGHT = 32;
const LABEL_WIDTH = 112; // w-28 – must match track labels so ruler and clips align

/** Use proxy for Firebase/storage URLs to avoid CORS in preview */
function getPreviewUrl(url) {
  if (!url || typeof url !== "string") return url;
  try {
    const parsed = new URL(url);
    const useProxy =
      parsed.hostname.endsWith("firebasestorage.googleapis.com") ||
      parsed.hostname.endsWith("storage.googleapis.com");
    return useProxy
      ? `/api/video-generator/proxy-media?url=${encodeURIComponent(url)}`
      : url;
  } catch {
    return url;
  }
}

const DEBOUNCE_MS = 600;

const TimelineEditor = forwardRef(function TimelineEditor(
  {
    videos = [],
    voiceoverUrl,
    backgroundMusicUrl = null,
    sceneDurations = {},
    getSceneDurationSeconds,
    scriptData,
    projectId = null,
    initialTimelineSettings = null,
  },
  ref,
) {
  const init = initialTimelineSettings || {};
  // Per-gap transitions: { 0: "fade", 1: "none", ... } for gap between clip i and i+1
  const [gapTransitions, setGapTransitions] = useState(init.gapTransitions ?? {});
  const [transitionGap, setTransitionGap] = useState(
    init.transitionGap != null ? Number(init.transitionGap) : 0.5,
  );
  // Per-gap transition duration (seconds): { 0: 0.5, 1: 1.0, ... }; fallback to transitionGap
  const [transitionGapByIndex, setTransitionGapByIndex] = useState(
    init.transitionGapByIndex ?? {},
  );
  const [previewTransitionGapIndex, setPreviewTransitionGapIndex] = useState(null);
  // Per-clip audio settings (FCP style): { scene_id: { volume: 0–1, fadeIn: bool, fadeOut: bool } }
  const [clipAudioSettings, setClipAudioSettings] = useState(init.clipAudioSettings ?? {});
  // Clip order for drag-and-drop reordering (scene_id[]). Empty = use scene order.
  const [clipOrder, setClipOrder] = useState(Array.isArray(init.clipOrder) ? init.clipOrder : []);
  // Voiceover and music volume (0–1)
  const [voiceoverVolume, setVoiceoverVolume] = useState(
    init.voiceoverVolume != null ? Math.max(0, Math.min(1, Number(init.voiceoverVolume))) : 1,
  );
  const [musicVolume, setMusicVolume] = useState(
    init.musicVolume != null ? Math.max(0, Math.min(1, Number(init.musicVolume))) : 0.25,
  );
  // Playback
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [previewTransitioning, setPreviewTransitioning] = useState(false);
  const previewVideoRef = useRef(null);
  const voiceoverAudioRef = useRef(null);
  const musicAudioRef = useRef(null);
  const playIntervalRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const isDraggingPlayheadRef = useRef(false);
  const lastVoiceoverSrcRef = useRef("");
  const lastMusicSrcRef = useRef("");
  const gapTransitionsRef = useRef(gapTransitions);
  const transitionGapRef = useRef(transitionGap);
  const transitionGapByIndexRef = useRef(transitionGapByIndex);
  gapTransitionsRef.current = gapTransitions;
  transitionGapRef.current = transitionGap;
  transitionGapByIndexRef.current = transitionGapByIndex;

  // Re-init from initialTimelineSettings when project loads or settings arrive
  const prevProjectIdRef = useRef(null);
  const prevHadSettingsForProjectRef = useRef(null);
  const skipNextSaveRef = useRef(false);
  useEffect(() => {
    if (!projectId) return;
    const hasSettings = initialTimelineSettings && typeof initialTimelineSettings === "object";
    const projectChanged = prevProjectIdRef.current !== projectId;
    if (projectChanged) {
      prevProjectIdRef.current = projectId;
      prevHadSettingsForProjectRef.current = null;
    }
    const settingsJustArrived = hasSettings && prevHadSettingsForProjectRef.current !== projectId;
    if (hasSettings) prevHadSettingsForProjectRef.current = projectId;
    if (!projectChanged && !settingsJustArrived) return;
    if (!hasSettings) return;
    const init = initialTimelineSettings;
    skipNextSaveRef.current = true; // avoid redundant save right after load
    setGapTransitions(init.gapTransitions ?? {});
    setTransitionGap(init.transitionGap != null ? Number(init.transitionGap) : 0.5);
    setTransitionGapByIndex(init.transitionGapByIndex ?? {});
    setClipAudioSettings(init.clipAudioSettings ?? {});
    setClipOrder(Array.isArray(init.clipOrder) ? init.clipOrder : []);
    setVoiceoverVolume(init.voiceoverVolume != null ? Math.max(0, Math.min(1, Number(init.voiceoverVolume))) : 1);
    setMusicVolume(init.musicVolume != null ? Math.max(0, Math.min(1, Number(init.musicVolume))) : 0.25);
  }, [projectId, initialTimelineSettings]);

  // Reset clip order when video set changes (e.g. different project)
  const videoKeyRef = useRef("");
  useEffect(() => {
    const key = (videos?.length ? videos : [])
      .map((v) => v?.scene_id)
      .join(",");
    if (videoKeyRef.current && videoKeyRef.current !== key) {
      setClipOrder([]);
    }
    videoKeyRef.current = key;
  }, [videos]);

  // Auto-save timeline settings to Firestore (debounced)
  const saveTimeoutRef = useRef(null);
  useEffect(() => {
    if (!projectId) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null;
      const payload = {
        timeline_settings: {
          gapTransitions: { ...gapTransitions },
          transitionGap,
          transitionGapByIndex: { ...transitionGapByIndex },
          clipAudioSettings: { ...clipAudioSettings },
          clipOrder: [...clipOrder],
          voiceoverVolume,
          musicVolume,
        },
      };
      fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch((err) => console.warn("Timeline auto-save failed:", err));
    }, DEBOUNCE_MS);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [projectId, gapTransitions, transitionGap, transitionGapByIndex, clipAudioSettings, clipOrder, voiceoverVolume, musicVolume]);

  const clampDurationSeconds = (value, fallback = 8) => {
    const n = Number(value);
    const numeric = Number.isFinite(n) ? n : fallback;
    return Math.max(1, Math.min(15, Math.round(numeric)));
  };

  const getGapTransition = (gapIdx) => gapTransitions[gapIdx] ?? "fade";

  const getGapDuration = (gapIdx) => {
    const v = transitionGapByIndex[gapIdx];
    return v != null ? Math.max(0.2, Math.min(2, Number(v))) : (transitionGap ?? 0.5);
  };

  const getClipAudioSetting = (sceneId) => {
    const s = clipAudioSettings[sceneId];
    return {
      volume: s?.volume != null ? Math.max(0, Math.min(1, Number(s.volume))) : 0.4,
      fadeIn: s?.fadeIn ?? false,
      fadeOut: s?.fadeOut ?? false,
    };
  };

  const updateClipAudioSetting = (sceneId, patch) => {
    setClipAudioSettings((prev) => {
      const cur = prev[sceneId] ?? { volume: 0.4, fadeIn: false, fadeOut: false };
      return { ...prev, [sceneId]: { ...cur, ...patch } };
    });
  };

  const buildEdit = (vids, gapTrans, clipSettings = {}, order = [], gapByIndex = transitionGapByIndex, defaultGap = transitionGap) => {
    const list = vids || videos;
    let sumPrev = 0;
    let sumOverlapPrev = 0;
    const sortedVideos = (() => {
      const arr = [...list];
      if (order?.length === arr.length) {
        const byScene = Object.fromEntries(arr.map((v) => [String(v?.scene_id), v]));
        return order.map((sid) => byScene[String(sid)]).filter(Boolean);
      }
      return arr.sort((a, b) => Number(a?.scene_id) - Number(b?.scene_id));
    })();
    const numGaps = Math.max(0, sortedVideos.length - 1);
    const getOverlap = (i) => {
      if ((gapTrans[i] ?? "fade") === "none") return 0;
      const d = gapByIndex[i];
      const sec = d != null ? Math.max(0.2, Math.min(2, Number(d))) : (defaultGap ?? 0.5);
      return Math.min(sec, 2);
    };
    const hasAnyTransition = Array.from({ length: numGaps }, (_, i) => i).some(
      (i) => (gapTrans[i] ?? "fade") !== "none"
    );
    const useGaps = hasAnyTransition && sortedVideos.length > 1;

    const videoClips = sortedVideos.map((video, idx) => {
      const durationSeconds = clampDurationSeconds(
        sceneDurations?.[video.scene_id] ??
          (scriptData?.scenes?.find((s) => String(s.id) === String(video.scene_id))
            ? getSceneDurationSeconds?.(
                scriptData.scenes.find(
                  (s) => String(s.id) === String(video.scene_id),
                ),
              )
            : null),
        8,
      );
      const s = clipSettings[video.scene_id];
      const volume = s?.volume != null ? Math.max(0, Math.min(1, Number(s.volume))) : 0.4;
      const fadeIn = s?.fadeIn ?? false;
      const fadeOut = s?.fadeOut ?? false;
      const volumeEffect =
        fadeIn && fadeOut ? "fadeInFadeOut" : fadeIn ? "fadeIn" : fadeOut ? "fadeOut" : undefined;
      const start = Math.max(0, sumPrev - sumOverlapPrev);
      const inTransition = idx > 0 ? (gapTrans[idx - 1] ?? "fade") : "none";
      const outTransition = idx < sortedVideos.length - 1 ? (gapTrans[idx] ?? "fade") : "none";
      const asset = { type: "video", src: video.video_url, volume };
      if (volumeEffect) asset.volumeEffect = volumeEffect;
      const clip = {
        asset,
        start: Math.max(0, start),
        length: durationSeconds,
      };
      if (sortedVideos.length > 1 && (inTransition !== "none" || outTransition !== "none")) {
        clip.transition = { in: inTransition, out: outTransition };
      }
      sumPrev += durationSeconds;
      if (useGaps && idx < numGaps) sumOverlapPrev += getOverlap(idx);
      return clip;
    });

    const voVol = Math.max(0, Math.min(1, Number(voiceoverVolume)));
    const musVol = Math.max(0, Math.min(1, Number(musicVolume)));
    const tracks = [
      { clips: videoClips },
      {
        clips: [
          { asset: { type: "audio", src: voiceoverUrl, volume: voVol }, start: 0, length: "auto" },
        ],
      },
    ];
    if (backgroundMusicUrl) {
      tracks.push({
        clips: [
          {
            asset: { type: "audio", src: backgroundMusicUrl, volume: musVol },
            start: 0,
            length: "auto",
          },
        ],
      });
    }

    return {
      timeline: { background: "#000000", tracks },
      output: { format: "mp4", size: { width: 1080, height: 1920 } },
    };
  };

  const { edit, timelineData } = useMemo(() => {
    const derived = (scriptData?.scenes || [])
      .filter((s) => {
        const url =
          s?.selected_video_url ||
          (Array.isArray(s?.video_urls) && s.video_urls.length > 0 && s.video_urls[s.video_urls.length - 1]);
        return url && s?.id != null;
      })
      .map((s) => ({
        scene_id: s.id,
        video_url:
          s.selected_video_url ||
          (Array.isArray(s?.video_urls) && s.video_urls.length > 0 ? s.video_urls[s.video_urls.length - 1] : null),
      }))
      .filter((v) => v.video_url);
    const vids = videos?.length > 0 ? videos : derived;
    const sortedVids = (() => {
      const arr = [...vids];
      if (clipOrder?.length === arr.length) {
        const byScene = Object.fromEntries(arr.map((v) => [String(v?.scene_id), v]));
        return clipOrder.map((sid) => byScene[String(sid)]).filter(Boolean);
      }
      return arr.sort((a, b) => Number(a?.scene_id) - Number(b?.scene_id));
    })();
    const e = buildEdit(vids, gapTransitions, clipAudioSettings, clipOrder, transitionGapByIndex, transitionGap);
    const clips = e.timeline.tracks[0]?.clips || [];
    const totalSeconds = clips.length
      ? Math.max(...clips.map((c) => (Number(c.start) || 0) + (Number(c.length) || 0)))
      : 0;
    const videoClips = (e.timeline.tracks[0]?.clips || []).map((c, i) => ({
      ...c,
      label: `Scene ${i + 1}`,
      scene_id: sortedVids[i]?.scene_id,
    }));
    return {
      edit: e,
      timelineData: {
        totalSeconds,
        videoClips,
        hasVoiceover: !!voiceoverUrl,
        hasMusic: !!backgroundMusicUrl,
      },
    };
  }, [
    videos,
    voiceoverUrl,
    backgroundMusicUrl,
    sceneDurations,
    scriptData,
    gapTransitions,
    transitionGap,
    transitionGapByIndex,
    clipAudioSettings,
    clipOrder,
    voiceoverVolume,
    musicVolume,
  ]);

  const handleClipAudioDragStart = (e, fromIndex) => {
    e.dataTransfer.setData("text/plain", String(fromIndex));
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.classList.add("opacity-50");
  };

  const handleClipAudioDragEnd = (e) => {
    e.currentTarget.classList.remove("opacity-50");
  };

  const handleClipAudioDrop = (e, toIndex) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (Number.isNaN(fromIndex) || fromIndex === toIndex) return;
    const clips = timelineData.videoClips || [];
    const sceneIds = clips.map((c) => c.scene_id);
    const reordered = [...sceneIds];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, removed);
    setClipOrder(reordered.length === clips.length ? reordered : []);
  };

  const handleClipAudioDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // Find clip at time and offset within clip
  const getClipAtTime = (t) => {
    const clips = timelineData.videoClips || [];
    for (let i = 0; i < clips.length; i++) {
      const start = clips[i].start ?? 0;
      const len = clips[i].length ?? 0;
      if (t >= start && t < start + len) {
        return { clip: clips[i], index: i, offsetInClip: t - start };
      }
    }
    if (clips.length > 0 && t >= (clips[clips.length - 1].start ?? 0) + (clips[clips.length - 1].length ?? 0)) {
      const last = clips[clips.length - 1];
      return { clip: last, index: clips.length - 1, offsetInClip: last.length ?? 0 };
    }
    return null;
  };

  // Update preview video when currentTime or clip changes (when NOT playing)
  useEffect(() => {
    if (isPlaying) return;
    const el = previewVideoRef.current;
    const info = getClipAtTime(currentTime);
    if (!el || !info?.clip?.asset?.src) return;
    const src = getPreviewUrl(info.clip.asset.src);
    if (!el.src || !el.src.includes(encodeURIComponent(info.clip.asset.src))) {
      el.src = src;
      setPreviewError(null);
    }
    el.currentTime = info.offsetInClip;
    el.muted = isMuted;
    el.volume = isMuted ? 0 : (info.clip?.asset?.volume ?? 0.4);
  }, [currentTime, timelineData.videoClips, isMuted, isPlaying]);

  const getTransitionDurationMs = () => {
    const trans = previewTransitioning && previewTransitionGapIndex != null
      ? getGapTransition(previewTransitionGapIndex)
      : "none";
    if (trans === "none") return 0;
    const sec = getGapDuration(previewTransitionGapIndex);
    return Math.round(sec * 1000);
  };

  const transitionTypeToPreviewClass = (type) => {
    if (type === "none") return "preview-fade";
    const base = type.replace(/Slow|Fast$/, "");
    const map = {
      fade: "preview-fade",
      reveal: "preview-fade",
      wipeLeft: "preview-wipe-left",
      wipeRight: "preview-wipe-right",
      slideLeft: "preview-slide-left",
      slideRight: "preview-slide-right",
      slideUp: "preview-slide-up",
      slideDown: "preview-slide-down",
      zoomIn: "preview-zoom-in",
      zoomOut: "preview-zoom-out",
      carouselLeft: "preview-slide-left",
      carouselRight: "preview-slide-right",
      carouselUp: "preview-slide-up",
      carouselDown: "preview-slide-down",
    };
    return map[base] || "preview-fade";
  };

  const getPreviewTransitionClass = () => {
    const trans = previewTransitioning && previewTransitionGapIndex != null
      ? getGapTransition(previewTransitionGapIndex)
      : "none";
    return transitionTypeToPreviewClass(trans);
  };

  // Playback: drive from video element when isPlaying
  const playingClipIndexRef = useRef(0);
  const currentTimeRef = useRef(0);
  currentTimeRef.current = currentTime;

  useEffect(() => {
    if (!isPlaying || !timelineData?.videoClips?.length) return;
    const video = previewVideoRef.current;
    const voiceover = voiceoverAudioRef.current;
    const music = musicAudioRef.current;
    const clips = timelineData.videoClips;
    const total = timelineData.totalSeconds;
    const t0 = currentTimeRef.current;

    let idx = clips.findIndex(
      (c) => t0 >= (c.start ?? 0) && t0 < (c.start ?? 0) + (c.length ?? 0)
    );
    if (idx < 0) idx = 0;
    playingClipIndexRef.current = idx;
    const clip = clips[idx];
    const clipStart = clip?.start ?? 0;
    const clipLen = clip?.length ?? 0;
    const offsetInClip = Math.max(0, Math.min(t0 - clipStart, clipLen));

    // Start voiceover and music once – let them play continuously (no seeking on clip switches)
    if (voiceover && voiceoverUrl) {
      const audioUrl = getPreviewUrl(voiceoverUrl);
      if (lastVoiceoverSrcRef.current !== audioUrl) {
        voiceover.src = audioUrl;
        lastVoiceoverSrcRef.current = audioUrl;
      }
      voiceover.currentTime = t0;
      voiceover.volume = isMuted ? 0 : Math.max(0, Math.min(1, voiceoverVolume));
      voiceover.play().catch(() => {});
    }
    if (music && backgroundMusicUrl) {
      const musicUrl = getPreviewUrl(backgroundMusicUrl);
      if (lastMusicSrcRef.current !== musicUrl) {
        music.src = musicUrl;
        lastMusicSrcRef.current = musicUrl;
      }
      music.currentTime = t0;
      music.volume = isMuted ? 0 : Math.max(0, Math.min(1, musicVolume));
      music.play().catch(() => {});
    }

    const playClip = (clipIdx) => {
      if (clipIdx >= clips.length) {
        setIsPlaying(false);
        setCurrentTime(total);
        video?.pause();
        voiceover?.pause();
        music?.pause();
        return;
      }
      const c = clips[clipIdx];
      const url = getPreviewUrl(c?.asset?.src);
      if (!url || !video) return;
      video.src = url;
      video.currentTime = clipIdx === idx ? offsetInClip : 0;
      const clipVol = c?.asset?.volume ?? 0.4;
      video.muted = isMuted;
      video.volume = isMuted ? 0 : clipVol;
      setPreviewError(null);
      video.play().catch(() => {
        setPreviewError("Preview unavailable (check CORS or URL)");
        setIsPlaying(false);
      });
      // Voiceover and music keep playing – do not seek or restart on clip switch
    };

    const onTimeUpdate = () => {
      const curIdx = playingClipIndexRef.current;
      const c = clips[curIdx];
      if (!video || !c) return;
      const t = Math.min(total, (c.start ?? 0) + video.currentTime);
      setCurrentTime(t);
      const endOfClip = (c.start ?? 0) + (c.length ?? 0);
      const gapTrans = gapTransitionsRef.current[curIdx] ?? "fade";
      const gapSec = transitionGapByIndexRef.current[curIdx];
      const sec = gapSec != null ? Math.max(0.2, Math.min(2, Number(gapSec))) : (transitionGapRef.current ?? 0.5);
      const transitionMs = gapTrans !== "none" ? Math.round(sec * 1000) : 0;
      const leadTime = transitionMs > 0 ? transitionMs / 1000 + 0.05 : 0.15;
      if (t >= endOfClip - leadTime) {
        playingClipIndexRef.current = curIdx + 1;
        video.removeEventListener("timeupdate", onTimeUpdate);
        const nextIdx = curIdx + 1;
        if (transitionMs > 0) {
          setPreviewTransitionGapIndex(curIdx);
          setPreviewTransitioning(true);
          setTimeout(() => {
            playClip(nextIdx);
            setPreviewTransitioning(false);
            setPreviewTransitionGapIndex(null);
            if (nextIdx < clips.length) {
              video.addEventListener("timeupdate", onTimeUpdate);
            }
          }, transitionMs);
        } else {
          playClip(nextIdx);
          if (nextIdx < clips.length) {
            video.addEventListener("timeupdate", onTimeUpdate);
          }
        }
      }
    };

    playClip(idx);
    video?.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      video?.removeEventListener("timeupdate", onTimeUpdate);
      video?.pause();
      voiceover?.pause();
      music?.pause();
    };
  }, [isPlaying, timelineData?.videoClips, timelineData?.totalSeconds]);

  // Sync mute state and volume during playback
  useEffect(() => {
    const v = previewVideoRef.current;
    const voiceover = voiceoverAudioRef.current;
    const music = musicAudioRef.current;
    if (v) v.muted = isMuted;
    if (voiceover) voiceover.volume = isMuted ? 0 : Math.max(0, Math.min(1, voiceoverVolume));
    if (music) music.volume = isMuted ? 0 : Math.max(0, Math.min(1, musicVolume));
  }, [isMuted, voiceoverVolume, musicVolume]);

  // When pausing, sync voiceover and music position for next play
  useEffect(() => {
    if (!isPlaying) {
      const voiceover = voiceoverAudioRef.current;
      const music = musicAudioRef.current;
      if (voiceover) voiceover.currentTime = currentTime;
      if (music) music.currentTime = currentTime;
    }
  }, [isPlaying, currentTime]);

  const handleTimelineClick = (e) => {
    if (isDraggingPlayheadRef.current || e.target.closest("[data-playhead]")) return;
    const container = scrollContainerRef.current;
    if (!container || !timelineData?.totalSeconds) return;
    const rect = container.getBoundingClientRect();
    const scrollLeft = container.scrollLeft ?? 0;
    const contentX = e.clientX - rect.left + scrollLeft;
    const timelineX = Math.max(0, contentX - LABEL_WIDTH);
    const t = Math.max(0, Math.min(timelineData.totalSeconds, timelineX / PIXELS_PER_SECOND));
    setCurrentTime(t);
  };

  const handlePlayheadMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isPlaying) setIsPlaying(false);
    isDraggingPlayheadRef.current = true;
    const onMove = (ev) => {
      const container = scrollContainerRef.current;
      if (!container || !timelineData?.totalSeconds) return;
      const scrollLeft = container.scrollLeft;
      const rect = container.getBoundingClientRect();
      const contentX = ev.clientX - rect.left + scrollLeft;
      const timelineX = Math.max(0, contentX - LABEL_WIDTH);
      const t = Math.max(0, Math.min(timelineData.totalSeconds, timelineX / PIXELS_PER_SECOND));
      setCurrentTime(t);
    };
    const onUp = () => {
      isDraggingPlayheadRef.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  useImperativeHandle(ref, () => ({
    getEdit: () => edit,
  }));

  const effectiveVideos =
    videos?.length > 0
      ? videos
      : (scriptData?.scenes || [])
          .filter((s) => {
            const url =
              s?.selected_video_url ||
              (Array.isArray(s?.video_urls) && s.video_urls.length > 0 && s.video_urls[s.video_urls.length - 1]);
            return url && s?.id != null;
          })
          .map((s) => ({
            scene_id: s.id,
            video_url:
              s.selected_video_url ||
              (Array.isArray(s?.video_urls) && s.video_urls.length > 0 ? s.video_urls[s.video_urls.length - 1] : null),
          }))
          .filter((v) => v.video_url);

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

  const timelineWidth = Math.max(600, timelineData.totalSeconds * PIXELS_PER_SECOND);
  const totalWidth = LABEL_WIDTH + timelineWidth;
  const currentClipInfo = getClipAtTime(currentTime);

  return (
    <div className="max-w-full overflow-hidden rounded-xl border-2 border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-900">
      {/* Preview panel – centered */}
      <div className="flex flex-col items-center gap-3 border-b border-gray-200 bg-gray-900 p-4 dark:border-gray-700">
        <div className="flex w-full items-center justify-center gap-4">
          <span className="text-xs font-medium text-gray-400">Preview</span>
          <span className="text-xs tabular-nums text-gray-500">
            {formatTime(currentTime)} / {formatTime(timelineData.totalSeconds)}
          </span>
        </div>
        <div className="relative aspect-video w-full max-w-[560px] overflow-hidden rounded-lg bg-black">
          <div
            className={`h-full w-full preview-transition-container ${getPreviewTransitionClass()} ${
              previewTransitioning ? "preview-transition-out" : "preview-transition-in"
            }`}
            style={{
              transitionDuration: `${getTransitionDurationMs()}ms`,
            }}
          >
            <video
              ref={previewVideoRef}
              className="h-full w-full object-contain"
              playsInline
              onError={() => setPreviewError("Video failed to load")}
            />
          </div>
          {voiceoverUrl && (
            <audio ref={voiceoverAudioRef} style={{ display: "none" }} />
          )}
          {backgroundMusicUrl && (
            <audio ref={musicAudioRef} style={{ display: "none" }} />
          )}
          {currentClipInfo && (
            <div className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
              {currentClipInfo.clip?.label ?? ""}
            </div>
          )}
          {previewError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-xs text-red-400">
              {previewError}
            </div>
          )}
        </div>
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`rounded p-1.5 ${isMuted ? "bg-gray-600 text-gray-400" : "bg-gray-600 text-white hover:bg-gray-500"}`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            className="rounded bg-gray-600 p-1.5 text-white hover:bg-gray-500"
            title="Stop"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="rounded bg-blue-600 p-1.5 text-white hover:bg-blue-500"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg className="ml-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-100 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Timeline
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {timelineData.videoClips && timelineData.videoClips.length > 1 && (
            <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
              <span className="shrink-0">Default:</span>
              <input
                type="number"
                min={0.2}
                max={2}
                step={0.1}
                value={transitionGap}
                onChange={(e) => setTransitionGap(Math.max(0.2, Math.min(2, parseFloat(e.target.value) || 0.5)))}
                className="w-12 rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                title="Default duration for transitions (used when not set per-gap)"
              />
              <span className="text-gray-500">s</span>
            </label>
          )}
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {Math.floor(timelineData.totalSeconds / 60)}m {Math.round(timelineData.totalSeconds % 60)}s total
          </span>
        </div>
      </div>

      {/* Ruler + Tracks – scroll horizontally when wide */}
      <div ref={scrollContainerRef} className="overflow-x-auto">
        {/* Ruler – label spacer + timeline (aligned with tracks) */}
        <div
          role="presentation"
          className="flex cursor-pointer border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
          style={{ height: RULER_HEIGHT, width: totalWidth, minWidth: "100%" }}
          onClick={handleTimelineClick}
        >
          <div className="flex w-28 shrink-0 border-r border-gray-200 dark:border-gray-700" />
          <div
            className="relative flex flex-1"
            style={{ minWidth: timelineWidth }}
          >
            {/* Playhead – draggable */}
            <div
              role="slider"
              tabIndex={0}
              aria-label="Playhead position"
              data-playhead
              className="absolute top-0 bottom-0 z-20 flex cursor-ew-resize items-center justify-center px-3 -mx-3"
              style={{ left: currentTime * PIXELS_PER_SECOND, transform: "translateX(-50%)" }}
              onMouseDown={handlePlayheadMouseDown}
            >
              <div className="h-full w-1 bg-red-500 shadow-md" />
              <div className="absolute -top-0.5 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 rounded-sm bg-red-500 shadow-md hover:bg-red-400 ring-2 ring-white/50" />
            </div>
            {Array.from({ length: Math.ceil(timelineData.totalSeconds / 5) + 1 }).map((_, i) => {
              const t = i * 5;
              return (
                <div
                  key={i}
                  className="absolute flex flex-col items-start border-l border-gray-300 dark:border-gray-600"
                  style={{ left: t * PIXELS_PER_SECOND }}
                >
                  <span className="pl-1 pt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                    {Math.floor(t / 60)}:{String(Math.round(t % 60)).padStart(2, "0")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tracks – click to scrub */}
        <div
          className="relative cursor-pointer"
          style={{ width: totalWidth, minWidth: "100%" }}
          onClick={handleTimelineClick}
        >
          <div
            className="pointer-events-none absolute top-0 bottom-0 z-10 w-0.5 bg-red-500"
            style={{ left: LABEL_WIDTH + currentTime * PIXELS_PER_SECOND }}
          />
          <div style={{ width: totalWidth, minWidth: "100%" }}>
          {/* Video track (video only – FCP style) */}
          <div
            className="flex border-b border-gray-200 dark:border-gray-700"
            style={{ height: TRACK_HEIGHT }}
          >
            <div className="flex w-28 shrink-0 items-center border-r border-gray-200 bg-blue-50 px-2 text-xs font-semibold text-blue-800 dark:border-gray-700 dark:bg-blue-950/50 dark:text-blue-200">
              Video
            </div>
            <div className="relative flex flex-1 bg-gray-100 dark:bg-gray-800">
              {timelineData.videoClips.map((clip, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={(e) => handleClipAudioDragStart(e, i)}
                  onDragEnd={handleClipAudioDragEnd}
                  onDragOver={handleClipAudioDragOver}
                  onDrop={(e) => handleClipAudioDrop(e, i)}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-1.5 bottom-1.5 flex cursor-grab items-center overflow-hidden rounded-lg border-2 border-blue-400 bg-blue-500 px-2 shadow-md active:cursor-grabbing dark:border-blue-500 dark:bg-blue-600"
                  style={{
                    left: (clip.start || 0) * PIXELS_PER_SECOND + 4,
                    width: (clip.length || 1) * PIXELS_PER_SECOND - 8,
                    minWidth: 48,
                  }}
                >
                  <span className="truncate text-xs font-medium text-white">
                    {clip.label}
                  </span>
                </div>
              ))}
              {/* Per-gap transition controls – FCP style, between clips */}
              {timelineData.videoClips.length > 1 && timelineData.videoClips.map((clip, i) => {
                if (i >= timelineData.videoClips.length - 1) return null;
                const nextClip = timelineData.videoClips[i + 1];
                const gapStart = (clip.start || 0) + (clip.length || 0);
                const gapEnd = nextClip?.start ?? gapStart;
                const centerX = ((gapStart + gapEnd) / 2) * PIXELS_PER_SECOND;
                const trans = getGapTransition(i);
                const duration = getGapDuration(i);
                return (
                  <div
                    key={`gap-${i}`}
                    className="absolute top-1/2 z-10 flex -translate-y-1/2 items-center gap-1"
                    style={{ left: centerX, transform: "translate(-50%, -50%)" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <select
                      value={trans}
                      onChange={(e) => setGapTransitions((prev) => ({ ...prev, [i]: e.target.value }))}
                      title={`Transition between Scene ${i + 1} and Scene ${i + 2}`}
                      className="rounded border border-purple-400 bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-800 shadow hover:bg-purple-200 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-purple-600 dark:bg-purple-900/80 dark:text-purple-200 dark:hover:bg-purple-800"
                    >
                      {TRANSITION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {trans !== "none" && (
                      <label className="flex items-center gap-0.5" title="Duration (seconds)">
                        <input
                          type="number"
                          min={0.2}
                          max={2}
                          step={0.1}
                          value={duration}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            if (Number.isFinite(v)) {
                              setTransitionGapByIndex((prev) => ({ ...prev, [i]: Math.max(0.2, Math.min(2, v)) }));
                            }
                          }}
                          className="w-10 rounded border border-purple-300 bg-white px-1 py-0.5 text-[10px] text-purple-800 dark:border-purple-700 dark:bg-purple-950/50 dark:text-purple-200"
                        />
                        <span className="text-[10px] text-purple-600 dark:text-purple-400">s</span>
                      </label>
                    )}
                  </div>
                );
  })}
            </div>
          </div>

          {/* Clip Audio track – FCP style: draggable, volume slider, fade in/out */}
          <div
            className="flex border-b border-gray-200 dark:border-gray-700"
            style={{ height: TRACK_HEIGHT }}
          >
            <div className="flex w-28 shrink-0 items-center border-r border-gray-200 bg-slate-50 px-2 text-xs font-semibold text-slate-700 dark:border-gray-700 dark:bg-slate-900/50 dark:text-slate-300">
              Clip Audio
            </div>
            <div className="relative flex flex-1 bg-gray-100 dark:bg-gray-800">
              {timelineData.videoClips.map((clip, i) => {
                const sceneId = clip.scene_id ?? i;
                const s = getClipAudioSetting(sceneId);
                const muted = s.volume <= 0;
                const w = Math.max(120, (clip.length || 1) * PIXELS_PER_SECOND - 8);
                return (
                  <div
                    key={`${sceneId}-${i}`}
                    draggable
                    onDragStart={(e) => handleClipAudioDragStart(e, i)}
                    onDragEnd={handleClipAudioDragEnd}
                    onDragOver={handleClipAudioDragOver}
                    onDrop={(e) => handleClipAudioDrop(e, i)}
                    className={`absolute top-1.5 bottom-1.5 flex cursor-grab items-center gap-1 overflow-hidden rounded-lg border-2 px-1.5 py-0.5 shadow-md transition-colors active:cursor-grabbing ${
                      muted
                        ? "border-slate-400 bg-slate-400/60 opacity-70 hover:border-slate-500 dark:border-slate-600 dark:bg-slate-600/60"
                        : "border-slate-500 bg-slate-500 hover:border-slate-600 dark:border-slate-500 dark:bg-slate-600"
                    }`}
                    style={{
                      left: (clip.start || 0) * PIXELS_PER_SECOND + 4,
                      width: w,
                      minWidth: 80,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span
                      className="shrink-0 cursor-grab text-slate-200 active:cursor-grabbing"
                      title="Drag to reorder"
                    >
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 6h2v2H8V6zm0 5h2v2H8v-2zm0 5h2v2H8v-2zm5-10h2v2h-2V6zm0 5h2v2h-2v-2zm0 5h2v2h-2v-2z" />
                      </svg>
                    </span>
                    <span className="truncate text-xs font-medium text-white" title={clip.label}>
                      {clip.label}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round((s.volume ?? 0.4) * 100)}
                      onChange={(e) =>
                        updateClipAudioSetting(sceneId, {
                          volume: parseInt(e.target.value, 10) / 100,
                        })
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="h-1.5 w-12 shrink-0 accent-slate-200"
                      title="Volume"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateClipAudioSetting(sceneId, { fadeIn: !s.fadeIn });
                      }}
                      title={s.fadeIn ? "Remove fade in" : "Fade in"}
                      className={`shrink-0 rounded px-1 py-0.5 text-[10px] font-bold transition-colors ${
                        s.fadeIn
                          ? "bg-emerald-500 text-white ring-1 ring-emerald-400 ring-inset shadow-sm"
                          : "bg-white/15 text-white/80 border border-white/30 hover:bg-white/25 hover:text-white"
                      }`}
                    >
                      IN{s.fadeIn && " ✓"}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateClipAudioSetting(sceneId, { fadeOut: !s.fadeOut });
                      }}
                      title={s.fadeOut ? "Remove fade out" : "Fade out"}
                      className={`shrink-0 rounded px-1 py-0.5 text-[10px] font-bold transition-colors ${
                        s.fadeOut
                          ? "bg-emerald-500 text-white ring-1 ring-emerald-400 ring-inset shadow-sm"
                          : "bg-white/15 text-white/80 border border-white/30 hover:bg-white/25 hover:text-white"
                      }`}
                    >
                      OUT{s.fadeOut && " ✓"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Voiceover track */}
          <div
            className="flex border-b border-gray-200 dark:border-gray-700"
            style={{ height: TRACK_HEIGHT }}
          >
            <div className="flex w-28 shrink-0 items-center border-r border-gray-200 bg-emerald-50 px-2 text-xs font-semibold text-emerald-800 dark:border-gray-700 dark:bg-emerald-950/50 dark:text-emerald-200">
              Voiceover
            </div>
            <div className="relative flex flex-1 bg-gray-100 dark:bg-gray-800">
              {timelineData.hasVoiceover && (
                <div
                  className="absolute top-1.5 bottom-1.5 flex items-center gap-2 overflow-hidden rounded-lg border-2 border-emerald-400 bg-emerald-500 px-2 shadow-md dark:border-emerald-500 dark:bg-emerald-600"
                  style={{
                    left: 4,
                    width: Math.max(100, timelineWidth - 8),
                    minWidth: 100,
                  }}
                >
                  <span className="shrink-0 text-xs font-medium text-white">Voiceover</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(voiceoverVolume * 100)}
                    onChange={(e) =>
                      setVoiceoverVolume(Math.max(0, Math.min(1, parseInt(e.target.value, 10) / 100)))
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="h-1.5 w-16 shrink-0 accent-emerald-200"
                    title="Voiceover volume"
                  />
                  <span className="shrink-0 text-[10px] text-white/90">{Math.round(voiceoverVolume * 100)}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Music track */}
          {timelineData.hasMusic && (
            <div
              className="flex border-b border-gray-200 dark:border-gray-700"
              style={{ height: TRACK_HEIGHT }}
            >
              <div className="flex w-28 shrink-0 items-center border-r border-gray-200 bg-amber-50 px-2 text-xs font-semibold text-amber-800 dark:border-gray-700 dark:bg-amber-950/50 dark:text-amber-200">
                Music
              </div>
              <div className="relative flex flex-1 bg-gray-100 dark:bg-gray-800">
                <div
                  className="absolute top-1.5 bottom-1.5 flex items-center gap-2 overflow-hidden rounded-lg border-2 border-amber-400 bg-amber-500 px-2 shadow-md dark:border-amber-500 dark:bg-amber-600"
                  style={{
                    left: 4,
                    width: Math.max(100, timelineWidth - 8),
                    minWidth: 100,
                  }}
                >
                  <span className="shrink-0 text-xs font-medium text-white">Background music</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(musicVolume * 100)}
                    onChange={(e) =>
                      setMusicVolume(Math.max(0, Math.min(1, parseInt(e.target.value, 10) / 100)))
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="h-1.5 w-16 shrink-0 accent-amber-200"
                    title="Music volume"
                  />
                  <span className="shrink-0 text-[10px] text-white/90">{Math.round(musicVolume * 100)}%</span>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      <p className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        Assembly uses ShotStack cloud – no media loaded in browser. Click Render to build the final video.
      </p>
    </div>
  );
});

export default TimelineEditor;
