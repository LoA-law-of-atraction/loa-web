"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  Suspense,
} from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toast";
import ReferenceGalleryModal from "@/components/admin/ReferenceGalleryModal";
import SceneImageGalleryModal from "@/components/admin/SceneImageGalleryModal";
import {
  MessageSquare,
  Image as ImageIcon,
  Video,
  Music2,
  Layers,
  Share2,
  Plus,
  Trash2,
  Info,
  Download,
  Maximize2,
} from "lucide-react";
import { SiInstagram, SiYoutube, SiTiktok } from "react-icons/si";
import {
  QUOTE_VIDEOS_TEXT_TO_IMAGE_MODELS,
  DEFAULT_QUOTE_VIDEOS_IMAGE_MODEL,
} from "@/lib/quote-videos-text-to-image-models";
import { MUSIC_MODELS, getMusicModelById } from "@/data/music-models";
import TimelineEditor from "@/components/admin/TimelineEditor";

const STEPS = [
  { num: 1, label: "Quote", icon: MessageSquare },
  { num: 2, label: "Image", icon: ImageIcon },
  { num: 3, label: "Generate video", icon: Video },
  { num: 4, label: "Music", icon: Music2 },
  { num: 5, label: "Render", icon: Layers },
  { num: 6, label: "Post", icon: Share2 },
];

function QuoteVideosContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { alert, confirm } = useToast();

  const urlProjectId = searchParams.get("project_id");
  const urlStep = searchParams.get("step");
  const initialStep = urlProjectId ? (urlStep ? parseInt(urlStep, 10) : 1) : 0;

  const [step, setStep] = useState(initialStep);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [currentProjectId, setCurrentProjectId] = useState(
    urlProjectId || null,
  );
  const [project, setProject] = useState(null);
  const [loadingProject, setLoadingProject] = useState(false);

  // Step 1
  const [theme, setTheme] = useState("");
  const [quoteText, setQuoteText] = useState("");
  const [quoteList, setQuoteList] = useState([]);
  const [generatingQuote, setGeneratingQuote] = useState(false);
  const [themeSuggestions, setThemeSuggestions] = useState([]);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const themeBlurRef = useRef(null);
  const [youtubeTranscriptUrl, setYoutubeTranscriptUrl] = useState("");
  const [youtubeTranscript, setYoutubeTranscript] = useState("");
  const [fetchingTranscript, setFetchingTranscript] = useState(false);
  const [youtubeTranscriptError, setYoutubeTranscriptError] = useState("");
  const [extractingQuotes, setExtractingQuotes] = useState(false);

  // Step 2 (Image)
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imagePromptUsed, setImagePromptUsed] = useState("");
  const [textToImageModel, setTextToImageModel] = useState(
    DEFAULT_QUOTE_VIDEOS_IMAGE_MODEL,
  );
  const [referenceImageUrl, setReferenceImageUrl] = useState("");
  const [uploadingReferenceImage, setUploadingReferenceImage] = useState(false);
  const [generatingPromptFromImage, setGeneratingPromptFromImage] =
    useState(false);
  const [showReferenceGalleryModal, setShowReferenceGalleryModal] =
    useState(false);
  const [showSceneImageGalleryModal, setShowSceneImageGalleryModal] =
    useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryImagesLoading, setGalleryImagesLoading] = useState(false);
  const [referenceDropActive, setReferenceDropActive] = useState(false);
  const [finalImagePromptDisplay, setFinalImagePromptDisplay] = useState(null);
  const [loadingFinalPrompt, setLoadingFinalPrompt] = useState(false);
  const [backgroundImageInfoUrl, setBackgroundImageInfoUrl] = useState(null);
  const [deletingBackgroundImageUrl, setDeletingBackgroundImageUrl] =
    useState(null);
  const [applyingGrain, setApplyingGrain] = useState(false);
  const [grainStyle, setGrainStyle] = useState("modern");
  const [grainIntensity, setGrainIntensity] = useState(0.4);
  const [grainScale, setGrainScale] = useState(10);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [expandedImageUrl, setExpandedImageUrl] = useState(null);
  const [expandedVideoUrl, setExpandedVideoUrl] = useState(null);
  const [sceneVideoInfo, setSceneVideoInfo] = useState(null);
  const referenceFileInputRef = useRef(null);
  const prevStepRef = useRef(1);
  const prevMusicStepProjectIdRef = useRef(null);

  // Step 3 (Generate video)
  const [animationVideoUrl, setAnimationVideoUrl] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(8);
  const [showVideoHistoryModal, setShowVideoHistoryModal] = useState(false);
  const [videoHistoryTargetSceneId, setVideoHistoryTargetSceneId] =
    useState(null);
  const [globalVideoHistoryEntries, setGlobalVideoHistoryEntries] = useState(
    [],
  );
  const [globalVideoHistoryLoading, setGlobalVideoHistoryLoading] =
    useState(false);
  const [musicUrl, setMusicUrl] = useState("");
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [generatingVideoSceneId, setGeneratingVideoSceneId] = useState(null);
  const [generatingVideoPromptSceneId, setGeneratingVideoPromptSceneId] =
    useState(null);
  const [videoPromptReview, setVideoPromptReview] = useState(null);
  const [videoPromptReviewDraft, setVideoPromptReviewDraft] = useState("");
  const [imageToVideoModel, setImageToVideoModel] = useState(null);
  const [defaultMotionPrompt, setDefaultMotionPrompt] = useState(null);

  // Step 4 (Music)
  const [selectedMusicModelId, setSelectedMusicModelId] =
    useState("stable-audio-25");
  const [musicPrompt, setMusicPrompt] = useState("");
  const [musicNegativePrompt, setMusicNegativePrompt] = useState("");
  const [generatingBackgroundMusic, setGeneratingBackgroundMusic] =
    useState(false);
  const [musicUnitCost, setMusicUnitCost] = useState(null);
  const [musicPricingUnit, setMusicPricingUnit] = useState(null);
  const [loadingMusicPricing, setLoadingMusicPricing] = useState(false);
  const [availableMusicFromCollection, setAvailableMusicFromCollection] =
    useState([]);
  const [loadingMusicCollection, setLoadingMusicCollection] = useState(false);
  const [showMusicCollectionPicker, setShowMusicCollectionPicker] =
    useState(false);
  const [musicDetailsModal, setMusicDetailsModal] = useState(null);
  const [generatingMusicPrompt, setGeneratingMusicPrompt] = useState(false);
  const [musicPromptReview, setMusicPromptReview] = useState(null);
  const [baseMusicPrompt, setBaseMusicPrompt] = useState("");
  const [musicBasePrompts, setMusicBasePrompts] = useState([]);
  const [selectedMusicBaseId, setSelectedMusicBaseId] = useState("default");
  const [musicDurationSeconds, setMusicDurationSeconds] = useState(15);

  // Step 5 (Render) – same flow as character shorts
  const [assembling, setAssembling] = useState(false);
  const [renderStatus, setRenderStatus] = useState(null);
  const [finalVideoUrl, setFinalVideoUrl] = useState(null);
  const [polling, setPolling] = useState(false);
  const [isAssembling, setIsAssembling] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [lastRenderPayload, setLastRenderPayload] = useState(null);
  const [showRenderPayloadModal, setShowRenderPayloadModal] = useState(false);
  const timelineEditorRef = useRef(null);
  const [timelineSettings, setTimelineSettings] = useState(null);
  const [grainOverlayUrl, setGrainOverlayUrl] = useState("");
  const [grainOpacity, setGrainOpacity] = useState(0.2);
  const [localGrainsList, setLocalGrainsList] = useState([]);
  const alertShownForFailedRef = useRef(false);

  // Step 6: Post (same as character shorts)
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const [socialTab, setSocialTab] = useState("instagram");
  const [instagramCaption, setInstagramCaption] = useState("");
  const [instagramCoverUrl, setInstagramCoverUrl] = useState(null);
  const [youtubeCaption, setYoutubeCaption] = useState("");
  const [youtubeThumbnailUrl, setYoutubeThumbnailUrl] = useState(null);
  const [tiktokCaption, setTiktokCaption] = useState("");
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [instagramStatusLoading, setInstagramStatusLoading] = useState(false);
  const [instagramTokenDebug, setInstagramTokenDebug] = useState(null);
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [youtubeStatusLoading, setYoutubeStatusLoading] = useState(false);
  const [youtubeTokenDebug, setYoutubeTokenDebug] = useState(null);
  const [generatingCaptionFor, setGeneratingCaptionFor] = useState(null);
  const [postProgress, setPostProgress] = useState(null); // { platform, status }
  const [instagramSwitchLoading, setInstagramSwitchLoading] = useState(false);
  const [instagramOAuthError, setInstagramOAuthError] = useState(null); // reason from URL after failed OAuth

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch("/api/quote-videos/projects");
      const data = await res.json();
      if (data.success) setProjects(data.projects || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const loadThemeSuggestions = useCallback(async (query = "") => {
    try {
      const url = query
        ? `/api/quote-videos/theme-suggestions?q=${encodeURIComponent(query)}`
        : "/api/quote-videos/theme-suggestions";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.suggestions))
        setThemeSuggestions(data.suggestions);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadProject = useCallback(async (id, options = {}) => {
    if (!id) return;
    const keepStep = options.keepStep === true;
    // When keepStep: true we refetch in background without loading UI so TimelineEditor never unmounts (prevents resetting shadow strength / preview).
    if (!keepStep) setLoadingProject(true);
    try {
      const res = await fetch(`/api/quote-videos/projects/${id}`);
      const data = await res.json();
      if (data.success && data.project) {
        const p = data.project;
        setProject(p);
        setTheme(p.theme || "");
        setQuoteText(p.quote_text || "");
        setQuoteList(
          Array.isArray(p.quote_list) && p.quote_list.length > 0
            ? p.quote_list
            : p.quote_text
              ? [p.quote_text]
              : [],
        );
        setYoutubeTranscriptUrl(p.youtube_transcript_url || "");
        setYoutubeTranscript(p.youtube_transcript || "");
        setBackgroundImageUrl(p.background_image_url || "");
        setReferenceImageUrl(p.reference_image_url || "");
        setImagePromptUsed(p.image_prompt_used || "");
        setTextToImageModel(
          QUOTE_VIDEOS_TEXT_TO_IMAGE_MODELS.some(
            (m) => m.id === p.text_to_image_model,
          )
            ? p.text_to_image_model
            : DEFAULT_QUOTE_VIDEOS_IMAGE_MODEL,
        );
        const firstSceneWithVideo = Array.isArray(p.scenes)
          ? p.scenes.find((s) => (s.selected_video_url || "").trim())
          : null;
        setAnimationVideoUrl(
          p.animation_video_url ||
            (firstSceneWithVideo?.selected_video_url || "").trim() ||
            "",
        );
        setDurationSeconds(
          p.duration_seconds ??
            (firstSceneWithVideo?.duration != null
              ? firstSceneWithVideo.duration
              : null) ??
            8,
        );
        setMusicUrl(p.music_url || "");
        setMusicPrompt(p.music_prompt ?? p.background_music_prompt ?? "");
        setMusicNegativePrompt(p.music_negative_prompt ?? "");
        setSelectedMusicBaseId(p.music_base_id ?? "default");
        setFinalVideoUrl(p.final_video_url || null);
        setRenderStatus(p.status || null);
        setTimelineSettings(p.timeline_settings ?? null);
        setGrainOverlayUrl(p.grain_overlay_url ?? "");
        setGrainOpacity(
          typeof p.grain_opacity === "number"
            ? Math.max(0, Math.min(1, p.grain_opacity))
            : 0.2,
        );
        if (!keepStep) {
          const savedStep =
            typeof p.current_step === "number" &&
            p.current_step >= 1 &&
            p.current_step <= 6
              ? p.current_step
              : 1;
          setStep(savedStep);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!keepStep) setLoadingProject(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (currentProjectId) loadProject(currentProjectId);
    else setProject(null);
  }, [currentProjectId, loadProject]);

  const onTimelineSettingsSaved = useCallback(() => {
    if (currentProjectId) loadProject(currentProjectId, { keepStep: true });
  }, [currentProjectId, loadProject]);

  useEffect(() => {
    fetch("/api/quote-videos/grains-list")
      .then((r) => r.json())
      .then((data) => {
        if (data.files && Array.isArray(data.files))
          setLocalGrainsList(data.files);
      })
      .catch(() => setLocalGrainsList([]));
  }, []);

  useEffect(() => {
    if (step === 1) loadThemeSuggestions();
  }, [step, loadThemeSuggestions]);

  useEffect(() => {
    if (step === 3) {
      fetch("/api/quote-videos/image-to-video-model")
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.model) setImageToVideoModel(data.model);
          else setImageToVideoModel(null);
        })
        .catch(() => setImageToVideoModel(null));
      fetch("/api/quote-videos/default-motion-prompt")
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.prompt) setDefaultMotionPrompt(data.prompt);
          else setDefaultMotionPrompt(null);
        })
        .catch(() => setDefaultMotionPrompt(null));
    }
  }, [step]);

  const loadMusicPricing = useCallback(
    (modelId) => {
      setLoadingMusicPricing(true);
      fetch(
        `/api/video-generator/music-pricing?model_id=${encodeURIComponent(modelId || selectedMusicModelId)}`,
      )
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setMusicUnitCost(data.cost);
            setMusicPricingUnit(data.unit || "min");
          } else {
            setMusicUnitCost(null);
            setMusicPricingUnit(null);
          }
        })
        .catch(() => {
          setMusicUnitCost(null);
          setMusicPricingUnit(null);
        })
        .finally(() => setLoadingMusicPricing(false));
    },
    [selectedMusicModelId],
  );

  const loadAvailableMusicFromCollection = useCallback(async () => {
    if (!currentProjectId) return;
    setLoadingMusicCollection(true);
    try {
      const res = await fetch(
        `/api/video-generator/music-list?project_id=${currentProjectId}&limit=50`,
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.music)) {
        setAvailableMusicFromCollection(data.music);
      } else {
        setAvailableMusicFromCollection([]);
      }
    } catch (_) {
      setAvailableMusicFromCollection([]);
    } finally {
      setLoadingMusicCollection(false);
    }
  }, [currentProjectId]);

  useEffect(() => {
    if (step === 4 && currentProjectId) {
      loadMusicPricing(selectedMusicModelId);
      loadAvailableMusicFromCollection();
      fetch("/api/quote-videos/music-base-prompts")
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.bases)) {
            setMusicBasePrompts(data.bases);
          }
        })
        .catch(() => setMusicBasePrompts([]));
    }
  }, [
    step,
    currentProjectId,
    selectedMusicModelId,
    loadMusicPricing,
    loadAvailableMusicFromCollection,
  ]);

  // Default music duration to total video length when entering Music step or switching project (stable 4-element deps)
  const projectIdForMusic = project?.id ?? null;
  const projectScenesLength = project?.scenes?.length ?? 0;
  const projectRef = useRef(project);
  projectRef.current = project;
  useEffect(() => {
    const p = projectRef.current;
    if (step !== 4 || !p) {
      prevStepRef.current = step;
      return;
    }
    const justEnteredStep = prevStepRef.current !== 4;
    const switchedProject = prevMusicStepProjectIdRef.current !== p.id;
    if (justEnteredStep || switchedProject) {
      const scenes = Array.isArray(p.scenes) ? p.scenes : [];
      const totalSec =
        scenes.length > 0
          ? scenes.reduce(
              (s, sc) =>
                s +
                Math.max(1, Math.min(15, Math.round(Number(sc.duration) || 8))),
              0,
            )
          : Math.max(5, Math.min(60, Number(durationSeconds) || 15));
      setMusicDurationSeconds(Math.max(5, Math.min(600, totalSec)));
    }
    prevStepRef.current = 4;
    prevMusicStepProjectIdRef.current = p.id;
  }, [step, projectIdForMusic, projectScenesLength, durationSeconds]);

  useEffect(() => {
    if (musicBasePrompts.length > 0) {
      const selected =
        musicBasePrompts.find((b) => b.id === selectedMusicBaseId) ||
        musicBasePrompts[0];
      setBaseMusicPrompt(selected?.prompt ?? "");
    }
  }, [selectedMusicBaseId, musicBasePrompts]);

  // Persist music prompt, negative prompt, and base id so they survive refresh (auto-save)
  const saveMusicStepDraft = useCallback(() => {
    if (!currentProjectId) return;
    fetch(`/api/quote-videos/projects/${currentProjectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        music_prompt: musicPrompt.trim() || null,
        music_negative_prompt: musicNegativePrompt.trim() || null,
        music_base_id: selectedMusicBaseId || null,
      }),
    }).catch(() => {});
  }, [currentProjectId, musicPrompt, musicNegativePrompt, selectedMusicBaseId]);

  useEffect(() => {
    if (!currentProjectId || step !== 4) return;
    const t = setTimeout(saveMusicStepDraft, 800);
    return () => clearTimeout(t);
  }, [currentProjectId, step, saveMusicStepDraft]);

  useEffect(() => {
    if (!showSceneImageGalleryModal || !currentProjectId) return;
    setGalleryImagesLoading(true);
    fetch(`/api/quote-videos/projects/${currentProjectId}/generated-images`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.images))
          setGalleryImages(data.images);
        else setGalleryImages([]);
      })
      .catch(() => setGalleryImages([]))
      .finally(() => setGalleryImagesLoading(false));
  }, [showSceneImageGalleryModal, currentProjectId]);

  useEffect(() => {
    if (!showVideoHistoryModal) return;
    setGlobalVideoHistoryLoading(true);
    fetch("/api/quote-videos/video-history")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.entries))
          setGlobalVideoHistoryEntries(data.entries);
        else setGlobalVideoHistoryEntries([]);
      })
      .catch(() => setGlobalVideoHistoryEntries([]))
      .finally(() => setGlobalVideoHistoryLoading(false));
  }, [showVideoHistoryModal]);

  useEffect(() => {
    if (!imagePromptUsed.trim()) {
      setFinalImagePromptDisplay(null);
      return;
    }
    let cancelled = false;
    setLoadingFinalPrompt(true);
    fetch("/api/quote-videos/final-image-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: imagePromptUsed.trim() }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.success && data.final_prompt) {
          setFinalImagePromptDisplay(data.final_prompt);
        } else {
          setFinalImagePromptDisplay(null);
        }
      })
      .catch(() => {
        if (!cancelled) setFinalImagePromptDisplay(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingFinalPrompt(false);
      });
    return () => {
      cancelled = true;
    };
  }, [imagePromptUsed]);

  const handleCreateProject = async () => {
    try {
      const res = await fetch("/api/quote-videos/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Quote video" }),
      });
      const data = await res.json();
      if (data.success && data.project) {
        await loadProjects();
        setCurrentProjectId(data.project.id);
        setStep(1);
        setTheme("");
        setQuoteText("");
        setQuoteList([]);
        setYoutubeTranscriptUrl("");
        setYoutubeTranscript("");
        setYoutubeTranscriptError("");
        setBackgroundImageUrl("");
        setAnimationVideoUrl("");
        setDurationSeconds(8);
        setMusicUrl("");
        setFinalVideoUrl(null);
        setRenderStatus(null);
        setTextToImageModel(DEFAULT_QUOTE_VIDEOS_IMAGE_MODEL);
        setProject({ ...data.project, theme: "", quote_text: "" });
      } else {
        await alert(data.error || "Failed to create project", "error");
      }
    } catch (e) {
      await alert("Error: " + e.message, "error");
    }
  };

  const handleOpenProject = (id) => {
    setCurrentProjectId(id);
    setStep(1);
    const params = new URLSearchParams(searchParams.toString());
    params.set("project_id", id);
    params.set("step", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleGenerateQuote = async () => {
    if (!theme.trim()) {
      await alert("Enter a theme first", "warning");
      return;
    }
    setGeneratingQuote(true);
    try {
      const res = await fetch("/api/quote-videos/generate-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: theme.trim(),
          project_id: currentProjectId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.quote) {
        const nextList = [...quoteList, data.quote];
        setQuoteList(nextList);
        setQuoteText(data.quote);
        if (currentProjectId) loadProject(currentProjectId);
        if (currentProjectId) {
          await fetch(`/api/quote-videos/projects/${currentProjectId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              theme: theme.trim(),
              quote_text: data.quote,
              quote_list: nextList,
            }),
          });
        }
      } else {
        await alert(data.error || "Failed to generate quote", "error");
      }
    } catch (e) {
      await alert("Error: " + e.message, "error");
    } finally {
      setGeneratingQuote(false);
    }
  };

  const handleFetchYoutubeTranscript = async () => {
    const url = youtubeTranscriptUrl.trim();
    if (!url) {
      await alert("Paste a YouTube video URL", "warning");
      return;
    }
    setFetchingTranscript(true);
    setYoutubeTranscriptError("");
    setYoutubeTranscript("");
    try {
      const res = await fetch("/api/quote-videos/youtube-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.success && data.transcript) {
        setYoutubeTranscript(data.transcript);
        if (currentProjectId) {
          await fetch(`/api/quote-videos/projects/${currentProjectId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              youtube_transcript_url: url,
              youtube_transcript: data.transcript.slice(0, 100000),
            }),
          });
        }
      } else {
        setYoutubeTranscriptError(data.error || "Failed to fetch transcript.");
      }
    } catch (e) {
      setYoutubeTranscriptError(e.message || "Request failed.");
    } finally {
      setFetchingTranscript(false);
    }
  };

  const addTranscriptSentencesAsQuotes = () => {
    if (!youtubeTranscript.trim()) return;
    const sentences = youtubeTranscript
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10 && s.length < 200);
    const nextList = [...quoteList, ...sentences];
    setQuoteList(nextList);
    if (sentences.length > 0) setQuoteText(sentences[0]);
    if (currentProjectId) {
      fetch(`/api/quote-videos/projects/${currentProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quote_list: nextList,
          quote_text: sentences[0] || quoteText,
        }),
      }).catch(console.error);
    }
  };

  const addFullTranscriptAsQuote = () => {
    if (!youtubeTranscript.trim()) return;
    const text =
      youtubeTranscript.length > 500
        ? youtubeTranscript.slice(0, 500).trim()
        : youtubeTranscript;
    const nextList = [...quoteList, text];
    setQuoteList(nextList);
    setQuoteText(text);
    if (currentProjectId) {
      fetch(`/api/quote-videos/projects/${currentProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote_list: nextList, quote_text: text }),
      }).catch(console.error);
    }
  };

  const handleAIPickQuotes = async () => {
    if (!youtubeTranscript.trim()) return;
    setExtractingQuotes(true);
    try {
      const res = await fetch("/api/quote-videos/extract-quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: youtubeTranscript,
          project_id: currentProjectId || undefined,
        }),
      });
      const data = await res.json();
      if (
        data.success &&
        Array.isArray(data.quotes) &&
        data.quotes.length > 0
      ) {
        const nextList = [...quoteList, ...data.quotes];
        setQuoteList(nextList);
        setQuoteText(data.quotes[0]);
        if (currentProjectId) {
          await fetch(`/api/quote-videos/projects/${currentProjectId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quote_list: nextList,
              quote_text: data.quotes[0],
            }),
          });
          loadProject(currentProjectId);
        }
      } else {
        await alert(data.error || "No quotes extracted.", "warning");
      }
    } catch (e) {
      await alert("Error: " + e.message, "error");
    } finally {
      setExtractingQuotes(false);
    }
  };

  const saveStep2 = useCallback(async () => {
    if (!currentProjectId) return;
    await fetch(`/api/quote-videos/projects/${currentProjectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        animation_video_url: animationVideoUrl.trim() || undefined,
        duration_seconds: durationSeconds,
        music_url: musicUrl.trim() || null,
      }),
    });
  }, [currentProjectId, animationVideoUrl, durationSeconds, musicUrl]);

  const uploadReferenceFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      await alert(
        "Please use an image file (JPEG, PNG, WebP, or GIF).",
        "warning",
      );
      return;
    }
    setUploadingReferenceImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/quote-videos/upload-reference-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setReferenceImageUrl(data.url);
        if (currentProjectId) {
          let history = [];
          try {
            const resGet = await fetch(
              `/api/quote-videos/projects/${currentProjectId}`,
            );
            const dataGet = await resGet.json();
            if (
              dataGet.success &&
              dataGet.project &&
              Array.isArray(dataGet.project.reference_image_history)
            ) {
              history = dataGet.project.reference_image_history;
            }
          } catch (_) {}
          const next = [
            ...history,
            {
              url: data.url,
              path: data.path || null,
              created_at: new Date().toISOString(),
            },
          ].slice(-30);
          await fetch(`/api/quote-videos/projects/${currentProjectId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reference_image_url: data.url,
              reference_image_history: next,
            }),
          });
          await loadProject(currentProjectId);
        }
      } else {
        await alert(data.error || "Upload failed", "error");
      }
    } catch (err) {
      await alert("Error: " + err.message, "error");
    } finally {
      setUploadingReferenceImage(false);
    }
  };

  const handleUploadReferenceImage = async (e) => {
    const file = e?.target?.files?.[0];
    if (file) await uploadReferenceFile(file);
    e.target.value = "";
  };

  const handleReferenceDrop = (e) => {
    e.preventDefault();
    setReferenceDropActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) uploadReferenceFile(file);
  };

  const handleReferenceDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setReferenceDropActive(true);
  };

  const handleReferenceDragLeave = (e) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget))
      setReferenceDropActive(false);
  };

  const handleImageToPrompt = async () => {
    const url = (referenceImageUrl || "").trim();
    if (!url) {
      await alert("Upload a reference image first.", "warning");
      return;
    }
    if (!/^https:\/\//i.test(url)) {
      await alert("Invalid reference image URL.", "warning");
      return;
    }
    setGeneratingPromptFromImage(true);
    try {
      const res = await fetch("/api/quote-videos/image-to-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference_image_url: url,
          project_id: project?.id || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.base_prompt) {
        const suffix = " Vertical 9:16, no text, no words, no letters.";
        const p = data.base_prompt.trim();
        const finalPrompt =
          p.toLowerCase().includes("no text") &&
          p.toLowerCase().includes("9:16")
            ? p
            : p + suffix;
        setImagePromptUsed(finalPrompt);
        if (project?.id) {
          const history = Array.isArray(project.reference_image_history)
            ? project.reference_image_history
            : [];
          const updatedHistory = history.map((entry) => {
            const entryUrl = typeof entry === "string" ? entry : entry?.url;
            if (entryUrl === url) {
              const base =
                typeof entry === "object" && entry != null
                  ? { ...entry }
                  : { url: entryUrl };
              return { ...base, url: entryUrl, image_prompt: finalPrompt };
            }
            return entry;
          });
          await fetch(`/api/quote-videos/projects/${project.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reference_image_url: url,
              image_prompt_used: finalPrompt,
              reference_image_history: updatedHistory,
            }),
          });
          await loadProject(project.id);
        }
      } else {
        await alert(data.error || "Failed to get prompt from image", "error");
      }
    } catch (e) {
      await alert("Error: " + e.message, "error");
    } finally {
      setGeneratingPromptFromImage(false);
    }
  };

  const updateProjectCurrentStep = useCallback(
    async (nextStep) => {
      if (!currentProjectId || nextStep < 1 || nextStep > 6) return;
      try {
        const res = await fetch(
          `/api/quote-videos/projects/${currentProjectId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ current_step: nextStep }),
          },
        );
        const data = await res.json();
        if (!res.ok || !data?.success) {
          console.error("Failed to save current step:", data?.error);
        }
      } catch (e) {
        console.error("Failed to save current step:", e);
      }
    },
    [currentProjectId],
  );

  const goToStep = useCallback(
    (nextStep) => {
      if (currentProjectId && nextStep >= 1 && nextStep <= 6) {
        updateProjectCurrentStep(nextStep);
      }
      setStep(nextStep);
    },
    [currentProjectId, updateProjectCurrentStep],
  );

  const handleGenerateImage = async () => {
    if (!currentProjectId) return;
    if (!quoteText.trim() && !theme.trim()) {
      await alert("Generate a quote first (step 1).", "warning");
      return;
    }
    setGeneratingImage(true);
    try {
      const body = { project_id: currentProjectId };
      if (imagePromptUsed.trim()) body.prompt = imagePromptUsed.trim();
      const scenes = Array.isArray(project?.scenes) ? project.scenes : [];
      const idx =
        scenes.length > 0
          ? Math.min(currentSceneIndex, Math.max(0, scenes.length - 1))
          : -1;
      if (idx >= 0 && scenes[idx]?.id) body.scene_id = scenes[idx].id;
      const res = await fetch("/api/quote-videos/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success && data.background_image_url) {
        setBackgroundImageUrl(data.background_image_url);
        if (data.prompt_used) setImagePromptUsed(data.prompt_used);
        if (currentProjectId) loadProject(currentProjectId);
      } else {
        await alert(
          data.error || data.message || "Generate image failed",
          "error",
        );
      }
    } catch (e) {
      await alert("Error: " + e.message, "error");
    } finally {
      setGeneratingImage(false);
    }
  };

  /** Add scene: same DB structure as Character Shorts — scenes in subcollection quote_projects/{id}/scenes/{sceneId} */
  const handleAddScene = async () => {
    if (!currentProjectId || !project) return;
    const scenes = Array.isArray(project.scenes) ? project.scenes : [];
    try {
      if (scenes.length === 0) {
        const hist = Array.isArray(project.background_image_history)
          ? project.background_image_history
          : [];
        const image_urls = hist
          .map((e) => (typeof e === "string" ? e : e?.url))
          .filter(Boolean);
        const image_prompts = hist
          .map((e) =>
            typeof e === "object" && e?.prompt_sent_to_model
              ? e.prompt_sent_to_model
              : "",
          )
          .slice(0, image_urls.length);
        const image_metadata = hist
          .map((e) =>
            typeof e === "object" && e
              ? {
                  prompt_sent_to_model: e.prompt_sent_to_model ?? null,
                  model_endpoint: e.model_endpoint ?? null,
                  fal_request_payload: e.fal_request_payload ?? null,
                  created_at: e.created_at ?? null,
                }
              : {},
          )
          .slice(0, image_urls.length);
        const currentUrl = (project.background_image_url || "").trim();
        let selected_image_index = 0;
        if (currentUrl && image_urls.length) {
          const idx = image_urls.indexOf(currentUrl);
          if (idx >= 0) selected_image_index = idx;
        }
        const res1 = await fetch(
          `/api/quote-videos/projects/${currentProjectId}/scenes`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              label: "Scene 1",
              image_prompt: project.image_prompt_used || "",
              image_urls,
              image_prompts:
                image_prompts.length === image_urls.length
                  ? image_prompts
                  : image_urls.map(() => ""),
              selected_image_index,
              image_metadata:
                image_metadata.length === image_urls.length
                  ? image_metadata
                  : [],
            }),
          },
        );
        const data1 = await res1.json();
        if (!data1.success)
          throw new Error(data1.error || "Failed to create Scene 1");
        const res2 = await fetch(
          `/api/quote-videos/projects/${currentProjectId}/scenes`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ label: "Scene 2" }),
          },
        );
        const data2 = await res2.json();
        if (!data2.success)
          throw new Error(data2.error || "Failed to create Scene 2");
        setCurrentSceneIndex(1);
        setBackgroundImageUrl("");
        loadProject(currentProjectId);
      } else {
        const res = await fetch(
          `/api/quote-videos/projects/${currentProjectId}/scenes`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ label: `Scene ${scenes.length + 1}` }),
          },
        );
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to add scene");
        setCurrentSceneIndex(scenes.length);
        setBackgroundImageUrl("");
        loadProject(currentProjectId);
      }
    } catch (e) {
      console.error(e);
      await alert(e.message || "Failed to add scene", "error");
    }
  };

  const handleGenerateVideo = async () => {
    if (!currentProjectId) return;
    if (!backgroundImageUrl.trim() && !quoteText.trim() && !theme.trim()) {
      await alert(
        "Generate an image first (step 2) or complete Quote step.",
        "warning",
      );
      return;
    }
    setGeneratingVideo(true);
    try {
      const res = await fetch("/api/quote-videos/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: currentProjectId }),
      });
      const data = await res.json();
      if (data.success && data.animation_video_url) {
        setAnimationVideoUrl(data.animation_video_url);
        setDurationSeconds(data.duration_seconds ?? 8);
        if (currentProjectId) loadProject(currentProjectId);
      } else {
        await alert(
          data.error || data.message || "Generate video failed",
          "error",
        );
      }
    } catch (e) {
      await alert("Error: " + e.message, "error");
    } finally {
      setGeneratingVideo(false);
    }
  };

  const handleSelectVideoFromHistory = async (entry) => {
    if (!currentProjectId || !entry?.url) return;
    try {
      const res = await fetch(
        `/api/quote-videos/projects/${currentProjectId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            animation_video_url: entry.url,
            duration_seconds: entry.duration_seconds ?? 8,
          }),
        },
      );
      if (res.ok) {
        setAnimationVideoUrl(entry.url);
        setDurationSeconds(entry.duration_seconds ?? 8);
        if (currentProjectId) loadProject(currentProjectId);
      }
    } catch (e) {
      await alert("Failed to select video: " + e.message, "error");
    }
  };

  const handleSelectVideoFromHistoryForScene = async (entry, sceneId) => {
    if (!currentProjectId || !entry?.url || !sceneId) return;
    try {
      const res = await fetch(
        `/api/quote-videos/projects/${currentProjectId}/scenes/${sceneId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selected_video_url: entry.url,
            duration: entry.duration_seconds ?? 8,
          }),
        },
      );
      if (res.ok && currentProjectId) loadProject(currentProjectId);
    } catch (e) {
      await alert("Failed to select video: " + e.message, "error");
    }
  };

  const handleApplyGrain = async (imageUrl, sceneId) => {
    if (!currentProjectId || !imageUrl?.trim()) return;
    setApplyingGrain(true);
    try {
      const body = {
        project_id: currentProjectId,
        image_url: imageUrl.trim(),
        grain_style: grainStyle,
        grain_intensity: grainIntensity,
        grain_scale: grainScale,
      };
      if (sceneId) body.scene_id = sceneId;
      const res = await fetch("/api/quote-videos/apply-grain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success && data.url) {
        if (currentProjectId) loadProject(currentProjectId);
      } else {
        await alert(
          data.error || data.message || "Apply grain failed",
          "error",
        );
      }
    } catch (e) {
      await alert("Error: " + e.message, "error");
    } finally {
      setApplyingGrain(false);
    }
  };

  const getSelectedImageUrlForScene = (scene) => {
    if (!scene) return "";
    const urls = Array.isArray(scene.image_urls) ? scene.image_urls : [];
    const idx =
      typeof scene.selected_image_index === "number"
        ? scene.selected_image_index
        : 0;
    return (urls[idx] || scene.background_image_url || "").trim();
  };

  const handleSelectFromGallery = async (url) => {
    if (!currentProjectId || !url?.trim()) return;
    const scenes = Array.isArray(project?.scenes) ? project.scenes : [];
    const useScenes = scenes.length > 0;
    const safeSceneIndex = useScenes
      ? Math.min(currentSceneIndex, Math.max(0, scenes.length - 1))
      : 0;
    const currentScene = useScenes ? scenes[safeSceneIndex] : null;
    try {
      if (useScenes && currentScene?.id) {
        const urls = Array.isArray(currentScene.image_urls)
          ? currentScene.image_urls
          : [];
        const prompts = Array.isArray(currentScene.image_prompts)
          ? currentScene.image_prompts
          : [];
        const meta = Array.isArray(currentScene.image_metadata)
          ? currentScene.image_metadata
          : [];
        const idx = urls.indexOf(url);
        if (idx >= 0) {
          await fetch(
            `/api/quote-videos/projects/${currentProjectId}/scenes/${currentScene.id}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ selected_image_index: idx }),
            },
          );
        } else {
          const newUrls = [...urls, url].slice(-30);
          const newPrompts = [...prompts, ""].slice(-30);
          const newMeta = [...meta, {}].slice(-30);
          await fetch(
            `/api/quote-videos/projects/${currentProjectId}/scenes/${currentScene.id}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                image_urls: newUrls,
                image_prompts: newPrompts,
                image_metadata: newMeta,
                selected_image_index: newUrls.length - 1,
              }),
            },
          );
        }
      } else {
        await fetch(`/api/quote-videos/projects/${currentProjectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ background_image_url: url }),
        });
      }
      await loadProject(currentProjectId);
    } catch (e) {
      console.error(e);
      await alert("Failed to set selected image", "error");
    }
  };

  const updateSceneDuration = async (sceneId, duration) => {
    if (!currentProjectId || sceneId == null) return;
    const d = Math.max(1, Math.min(15, Math.round(Number(duration) || 8)));
    try {
      await fetch(
        `/api/quote-videos/projects/${currentProjectId}/scenes/${sceneId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ duration: d }),
        },
      );
      setProject((prev) => {
        if (!prev?.scenes) return prev;
        return {
          ...prev,
          scenes: prev.scenes.map((s) =>
            String(s.id) === String(sceneId) ? { ...s, duration: d } : s,
          ),
        };
      });
    } catch (_) {}
  };

  const handleGenerateVideoForScene = async (scene) => {
    if (!currentProjectId || !scene?.id) return;
    const selectedImageUrl = getSelectedImageUrlForScene(scene);
    if (!selectedImageUrl) {
      await alert("Select an image for this scene first (Step 2).", "warning");
      return;
    }
    const duration = Math.max(
      1,
      Math.min(15, Math.round(Number(scene.duration) || 8)),
    );
    setGeneratingVideoSceneId(scene.id);
    try {
      const res = await fetch("/api/quote-videos/generate-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: currentProjectId,
          images: [
            {
              scene_id: scene.id,
              image_url: selectedImageUrl,
              duration,
            },
          ],
        }),
      });
      const data = await res.json();
      if (data.success && data.videos?.length) {
        await loadProject(currentProjectId);
        const v = data.videos.find(
          (x) => String(x.scene_id) === String(scene.id),
        );
        if (v?.video_url) setAnimationVideoUrl(v.video_url);
      } else {
        await alert(
          data.error || data.message || "Generate video failed",
          "error",
        );
      }
    } catch (e) {
      await alert("Error: " + e.message, "error");
    } finally {
      setGeneratingVideoSceneId(null);
    }
  };

  const handleGenerateVideoPromptForScene = async (scene) => {
    if (!currentProjectId || !scene?.id) return;
    const selIdx =
      typeof scene.selected_image_index === "number"
        ? scene.selected_image_index
        : 0;
    const prompts = Array.isArray(scene.image_prompts)
      ? scene.image_prompts
      : [];
    const meta = Array.isArray(scene.image_metadata)
      ? scene.image_metadata
      : [];
    const imagePromptText =
      (prompts[selIdx] && String(prompts[selIdx]).trim()) ||
      meta[selIdx]?.prompt_sent_to_model ||
      scene.image_prompt ||
      "";
    if (!imagePromptText.trim()) {
      await alert(
        "This scene has no image prompt. Generate or select an image first (Step 2).",
        "warning",
      );
      return;
    }
    const ok = await confirm(
      `Generate a video prompt for ${scene.label || "Scene " + scene.id} from its image prompt?\n\nYou can review and edit before saving.`,
      {
        title: "Generate Video Prompt",
        confirmText: "Generate",
        cancelText: "Cancel",
      },
    );
    if (!ok) return;
    setGeneratingVideoPromptSceneId(scene.id);
    try {
      const res = await fetch("/api/quote-videos/generate-video-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: currentProjectId,
          scene_id: scene.id,
          image_prompt: imagePromptText,
        }),
      });
      const data = await res.json();
      if (data.success && data.motion_prompt != null) {
        setVideoPromptReview({
          sceneId: scene.id,
          generatedPrompt: data.motion_prompt,
          cost: data.cost ?? 0,
        });
        setVideoPromptReviewDraft(data.motion_prompt);
      } else {
        await alert(
          data.error || data.message || "Failed to generate video prompt",
          "error",
        );
      }
    } catch (e) {
      await alert("Error: " + e.message, "error");
    } finally {
      setGeneratingVideoPromptSceneId(null);
    }
  };

  const handleSaveVideoPromptReview = async () => {
    if (!currentProjectId || !videoPromptReview?.sceneId) return;
    try {
      await fetch(
        `/api/quote-videos/projects/${currentProjectId}/scenes/${videoPromptReview.sceneId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            motion_prompt: videoPromptReviewDraft.trim(),
          }),
        },
      );
      setVideoPromptReview(null);
      setVideoPromptReviewDraft("");
      await loadProject(currentProjectId);
    } catch (e) {
      await alert("Failed to save video prompt: " + e.message, "error");
    }
  };

  const handleAssemble = async () => {
    const rawScenes = Array.isArray(project?.scenes) ? project.scenes : [];
    const scenesWithVideo = rawScenes
      .filter((s) => (s.selected_video_url || "").trim())
      .map((s) => ({
        video_url: (s.selected_video_url || "").trim(),
        duration_seconds: Math.max(
          1,
          Math.min(60, Math.round(Number(s.duration) || 8)),
        ),
      }));
    const hasScenes = scenesWithVideo.length > 0;
    // DEBUG: Step 5 render – what we're sending from Step 3 selections
    console.log(
      "[QuoteVideos Render] project.scenes (raw):",
      rawScenes.length,
      rawScenes.map((s, i) => ({
        index: i,
        id: s.id,
        label: s.label,
        selected_video_url:
          (s.selected_video_url || "").slice(0, 60) +
          ((s.selected_video_url || "").length > 60 ? "…" : ""),
        duration: s.duration,
      })),
    );
    console.log(
      "[QuoteVideos Render] scenesWithVideo (sent to assemble):",
      scenesWithVideo.length,
      scenesWithVideo.map((s, i) => ({
        index: i,
        video_url:
          (s.video_url || "").slice(0, 60) +
          ((s.video_url || "").length > 60 ? "…" : ""),
        duration_seconds: s.duration_seconds,
      })),
    );
    console.log(
      "[QuoteVideos Render] hasScenes:",
      hasScenes,
      "animationVideoUrl (single-scene):",
      (animationVideoUrl || "").slice(0, 60) +
        ((animationVideoUrl || "").length > 60 ? "…" : ""),
    );
    if (!currentProjectId || !quoteText.trim()) {
      await alert("Fill in quote first", "warning");
      return;
    }
    if (!hasScenes && !animationVideoUrl.trim()) {
      await alert(
        "Add at least one scene with a generated video (Step 3) before rendering",
        "warning",
      );
      return;
    }
    const payload = {
      project_id: currentProjectId,
      quote_text: quoteText.trim(),
      music_url: musicUrl.trim() || null,
      grain_overlay_url: grainOverlayUrl.trim() || null,
      grain_opacity: grainOpacity,
    };
    if (hasScenes) {
      payload.scenes = scenesWithVideo;
      console.log(
        "[QuoteVideos Render] payload.scenes count:",
        payload.scenes.length,
      );
    } else {
      payload.animation_video_url = animationVideoUrl.trim();
      payload.duration_seconds = durationSeconds;
      console.log(
        "[QuoteVideos Render] using single video (no scenes), duration_seconds:",
        payload.duration_seconds,
      );
    }
    const currentTimelineSettings =
      timelineEditorRef.current?.getTimelineSettings?.();
    if (
      currentTimelineSettings &&
      typeof currentTimelineSettings === "object" &&
      Object.keys(currentTimelineSettings).length > 0
    ) {
      payload.timeline_settings = currentTimelineSettings;
    } else if (timelineSettings && typeof timelineSettings === "object") {
      payload.timeline_settings = timelineSettings;
    }
    setAssembling(true);
    try {
      const res = await fetch("/api/quote-videos/assemble", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.render_id) {
        alertShownForFailedRef.current = false;
        setLastRenderPayload(payload);
        setRenderStatus("rendering");
        setPolling(true);
        setIsAssembling(true);
        setRenderProgress(0);
        if (currentProjectId) loadProject(currentProjectId);
      } else {
        const msg = data.message || data.error || "Assemble failed";
        await alert(msg, "error");
      }
    } catch (e) {
      await alert("Error: " + e.message, "error");
    } finally {
      setAssembling(false);
    }
  };

  // Poll for final video when on step 5/6 (same as character shorts: every 3s)
  useEffect(() => {
    if ((step !== 5 && step !== 6) || !currentProjectId) return;
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/quote-videos/render-status?project_id=${currentProjectId}`,
        );
        const data = await res.json();
        if (!data.success) return;
        setRenderStatus(data.status);
        if (data.final_video_url) {
          setFinalVideoUrl(data.final_video_url);
          setPolling(false);
          setIsAssembling(false);
          setRenderProgress(100);
          loadProject(currentProjectId);
          return;
        }
        if (data.status === "failed") {
          setPolling(false);
          setIsAssembling(false);
          setRenderProgress(0);
          // Only show alert once per render attempt (avoid repeat popups on every poll)
          if (!alertShownForFailedRef.current) {
            alertShownForFailedRef.current = true;
            const msg = data.render_error
              ? `Video rendering failed: ${data.render_error}`
              : "Video rendering failed. Please try again.";
            await alert(msg, "error");
          }
          return;
        }
      } catch (_) {}
    };
    poll();
    if (finalVideoUrl) return;
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [step, currentProjectId, finalVideoUrl, loadProject]);

  // Simulate progress bar while rendering (Shotstack doesn't return real progress – same as character shorts)
  useEffect(() => {
    if (!isAssembling) return;
    setRenderProgress(5);
    const start = Date.now();
    const phase1Ms = 120000;
    const phase2Ms = 90000;
    const tick = () => {
      const elapsed = Date.now() - start;
      let p;
      if (elapsed <= phase1Ms) {
        p = 5 + (elapsed / phase1Ms) * 80;
      } else {
        const phase2Elapsed = elapsed - phase1Ms;
        p = 85 + Math.min(14, (phase2Elapsed / phase2Ms) * 14);
      }
      p = Math.min(99, p);
      setRenderProgress((prev) => Math.max(prev, Math.round(p)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isAssembling]);

  // Instagram OAuth error from callback redirect (e.g. exchange_error, redirect_uri_mismatch)
  useEffect(() => {
    if (step !== 6) return;
    const err =
      searchParams.get("instagram") === "error"
        ? searchParams.get("reason") || "unknown"
        : null;
    if (err) {
      setInstagramOAuthError(err);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("instagram");
      params.delete("reason");
      const q = params.toString();
      const replaceUrl = pathname + (q ? "?" + q : "");
      router.replace(replaceUrl, { scroll: false });
    }
  }, [step, searchParams, pathname, router]);

  // Instagram connection status (step 6 or after OAuth redirect)
  useEffect(() => {
    if (step !== 6 && searchParams.get("instagram") !== "connected") return;
    setInstagramStatusLoading(true);
    fetch("/api/auth/instagram/status?debug=1")
      .then((r) => r.json())
      .then((data) => {
        setInstagramConnected(!!data.connected);
        setInstagramTokenDebug(data.debug || null);
        if (data.connected) setInstagramOAuthError(null);
      })
      .catch(() => {
        setInstagramConnected(false);
        setInstagramTokenDebug(null);
      })
      .finally(() => setInstagramStatusLoading(false));
  }, [step, searchParams]);

  // YouTube connection status (step 6 or after OAuth redirect)
  useEffect(() => {
    if (step !== 6 && searchParams.get("youtube") !== "connected") return;
    setYoutubeStatusLoading(true);
    fetch("/api/auth/youtube/status?debug=1")
      .then((r) => r.json())
      .then((data) => {
        setYoutubeConnected(!!data.connected);
        setYoutubeTokenDebug(data.debug || null);
      })
      .catch(() => {
        setYoutubeConnected(false);
        setYoutubeTokenDebug(null);
      })
      .finally(() => setYoutubeStatusLoading(false));
  }, [step, searchParams]);

  const handlePostToSocial = async (platform) => {
    if (!finalVideoUrl) {
      await alert("No video ready. Assemble first.", "warning");
      return;
    }
    setPosting(true);
    setPostProgress({ platform, status: "Creating media container…" });
    const statusInterval = setInterval(() => {
      setPostProgress((p) => {
        if (!p) return null;
        if (p.status === "Creating media container…")
          return { ...p, status: "Uploading video…" };
        if (p.status === "Uploading video…")
          return { ...p, status: "Publishing…" };
        return p;
      });
    }, 12000);
    try {
      const res = await fetch("/api/video-generator/post-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: currentProjectId,
          platform,
          video_url: finalVideoUrl,
          caption:
            (platform === "instagram"
              ? instagramCaption
              : platform === "youtube"
                ? youtubeCaption
                : tiktokCaption) ||
            caption ||
            quoteText ||
            "",
          ...(platform === "instagram" &&
            instagramCoverUrl && { cover_url: instagramCoverUrl }),
          ...(platform === "youtube" &&
            youtubeThumbnailUrl && { thumbnail_url: youtubeThumbnailUrl }),
        }),
      });
      clearInterval(statusInterval);
      setPostProgress((p) => (p ? { ...p, status: "Finishing…" } : null));
      const data = await res.json();
      setPostProgress(null);
      if (data.success) {
        const msg = data.message || `Posted to ${platform} successfully!`;
        await alert(msg, "success");
        if (data.post_url && typeof window !== "undefined") {
          window.open(data.post_url, "_blank", "noopener,noreferrer");
        }
      } else {
        let errMsg =
          data.message || data.error || `Failed to post to ${platform}`;
        if (data.debug)
          errMsg += "\n\nDebug: " + JSON.stringify(data.debug, null, 2);
        await alert(errMsg, "error");
      }
    } catch (e) {
      clearInterval(statusInterval);
      setPostProgress(null);
      await alert("Error: " + e.message, "error");
    } finally {
      setPosting(false);
    }
  };

  const handleGenerateCaption = async (platform) => {
    if (!quoteText?.trim()) {
      await alert("Add a quote first (Step 1)", "warning");
      return;
    }
    setGeneratingCaptionFor(platform);
    try {
      const res = await fetch("/api/video-generator/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: theme || "",
          script: quoteText,
          platform,
        }),
      });
      const data = await res.json();
      if (data.success && data.caption) {
        if (platform === "instagram") setInstagramCaption(data.caption);
        else if (platform === "youtube") setYoutubeCaption(data.caption);
        else setTiktokCaption(data.caption);
        await alert(
          `${platform.charAt(0).toUpperCase() + platform.slice(1)} caption generated`,
          "success",
        );
      } else {
        await alert(data.error || "Failed to generate caption", "error");
      }
    } catch (e) {
      await alert("Error: " + e.message, "error");
    } finally {
      setGeneratingCaptionFor(null);
    }
  };

  const handleDisconnectInstagram = async () => {
    try {
      const res = await fetch("/api/auth/instagram/disconnect", {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setInstagramConnected(false);
        setInstagramTokenDebug(null);
        await alert(
          'Instagram disconnected. Click "Connect Instagram" to connect again.',
          "success",
        );
      } else {
        await alert(data.error || "Failed to disconnect", "error");
      }
    } catch (e) {
      await alert("Error: " + e.message, "error");
    }
  };

  const handleSwitchInstagramAccount = async () => {
    setInstagramSwitchLoading(true);
    try {
      const res = await fetch("/api/auth/instagram/disconnect", {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setInstagramConnected(false);
        setInstagramTokenDebug(null);
        const returnTo = `/admin/quote-videos${currentProjectId || step != null ? "?" + new URLSearchParams({ ...(currentProjectId && { project_id: currentProjectId }), ...(step != null && { step: String(step) }) }).toString() : ""}`;
        window.location.href =
          "/api/auth/instagram?return_to=" + encodeURIComponent(returnTo);
        return;
      }
      await alert(data.error || "Failed to disconnect", "error");
    } catch (e) {
      await alert("Error: " + e.message, "error");
    } finally {
      setInstagramSwitchLoading(false);
    }
  };

  const handleDisconnectYouTube = async () => {
    try {
      const res = await fetch("/api/auth/youtube/disconnect", {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setYoutubeConnected(false);
        setYoutubeTokenDebug(null);
        await alert(
          'YouTube disconnected. Click "Connect YouTube" to connect again.',
          "success",
        );
      } else {
        await alert(data.error || "Failed to disconnect", "error");
      }
    } catch (e) {
      await alert("Error: " + e.message, "error");
    }
  };

  const postStepImageUrls = useMemo(() => {
    const scenes = Array.isArray(project?.scenes) ? project.scenes : [];
    if (scenes.length > 0) {
      return scenes.map((s) => getSelectedImageUrlForScene(s)).filter(Boolean);
    }
    return backgroundImageUrl ? [backgroundImageUrl] : [];
  }, [project?.scenes, backgroundImageUrl]);

  const returnToForOAuth = `/admin/quote-videos${currentProjectId || step != null ? "?" + new URLSearchParams({ ...(currentProjectId && { project_id: currentProjectId }), ...(step != null && { step: String(step) }) }).toString() : ""}`;

  if (step === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Quote Videos
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Motivational quote + animation clip. No character, no voiceover.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateProject}
            className="w-full flex items-center gap-5 p-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/50 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all cursor-pointer text-left group mb-10"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Plus
                className="w-7 h-7 text-blue-600 dark:text-blue-400"
                strokeWidth={2}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Create new quote video
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Theme → quote → image → video → render → post
              </p>
            </div>
          </button>

          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
            Your projects
          </h3>
          {loadingProjects ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              Loading…
            </div>
          ) : projects.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-8">
              No projects yet. Create one above.
            </p>
          ) : (
            <div className="space-y-3">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-gray-900 dark:text-gray-100 block truncate">
                      {p.name || "Quote video"}
                    </span>
                    {p.quote_text && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md mt-0.5">
                        {p.quote_text}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenProject(p.id)}
                    className="ml-4 px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Quote Videos
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {project?.name || "Quote video"} · Step {step} of 5
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setStep(0);
              setCurrentProjectId(null);
              router.replace(pathname, { scroll: false });
            }}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/80 dark:hover:bg-gray-800/80 transition-colors"
          >
            ← All projects
          </button>
        </div>

        {/* Step pills + cost */}
        <div className="flex flex-wrap items-center gap-3 mb-10">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-gray-200/80 dark:bg-gray-800/80">
            {STEPS.map((s, idx) => (
              <button
                key={s.num}
                type="button"
                onClick={() => goToStep(s.num)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  step === s.num
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <s.icon size={18} strokeWidth={2} />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>
          {project?.costs?.total > 0 && (
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              {[1, 2, 3, 4].map((n) => {
                const stepCost = project?.costs?.[`step${n}`];
                const total = stepCost?.total;
                if (total == null || total <= 0) return null;
                return (
                  <span
                    key={n}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800/80 text-xs font-medium text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-gray-500 dark:text-gray-400">
                      S{n}
                    </span>
                    <span className="font-semibold">${total.toFixed(4)}</span>
                  </span>
                );
              })}
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold">
                Total ${project.costs.total.toFixed(4)}
              </span>
            </div>
          )}
        </div>

        {loadingProject ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            Loading project…
          </div>
        ) : (
          <>
            {step === 1 && (
              <div className="space-y-6">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                    Step 1: Quote
                  </h2>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <div className="bg-blue-50 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap dark:bg-blue-950/40">
                      <span className="text-blue-700 dark:text-blue-200">
                        🤖 Model:
                      </span>
                      <span className="font-semibold text-blue-900 dark:text-blue-100">
                        {process.env.NEXT_PUBLIC_QUOTE_CLAUDE_MODEL_LABEL ||
                          process.env.NEXT_PUBLIC_CLAUDE_MODEL ||
                          "—"}
                      </span>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap dark:bg-blue-950/40">
                      <span className="text-blue-700 dark:text-blue-200">
                        📥 Input:
                      </span>
                      <span className="font-semibold text-blue-900 dark:text-blue-100">
                        $
                        {(
                          parseFloat(
                            process.env.NEXT_PUBLIC_CLAUDE_INPUT_PER_MILLION ||
                              "3.00",
                          ) / 1e6
                        ).toFixed(6)}
                        /tok
                      </span>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap dark:bg-blue-950/40">
                      <span className="text-blue-700 dark:text-blue-200">
                        📤 Output:
                      </span>
                      <span className="font-semibold text-blue-900 dark:text-blue-100">
                        $
                        {(
                          parseFloat(
                            process.env.NEXT_PUBLIC_CLAUDE_OUTPUT_PER_MILLION ||
                              "15.00",
                          ) / 1e6
                        ).toFixed(6)}
                        /tok
                      </span>
                    </div>
                    {project?.costs?.step1?.claude > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                        <span className="text-gray-600 dark:text-gray-300">
                          🤖 Claude:
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          ${project.costs.step1.claude.toFixed(4)}
                        </span>
                      </div>
                    )}
                    {project?.costs?.step1?.total > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                        <span className="text-gray-600 dark:text-gray-300">
                          💰 Step 1 Total:
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          ${project.costs.step1.total.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Theme (e.g. success, mindset, courage)
                  </label>
                  <input
                    type="text"
                    value={theme}
                    onChange={(e) => {
                      setTheme(e.target.value);
                      setShowThemeDropdown(true);
                    }}
                    onFocus={() => {
                      if (themeBlurRef.current)
                        clearTimeout(themeBlurRef.current);
                      setShowThemeDropdown(true);
                    }}
                    onBlur={() => {
                      themeBlurRef.current = setTimeout(
                        () => setShowThemeDropdown(false),
                        180,
                      );
                    }}
                    placeholder="Type to see suggestions"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                  {showThemeDropdown && themeSuggestions.length > 0 && (
                    <ul
                      className="absolute z-10 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-lg py-1"
                      role="listbox"
                    >
                      {themeSuggestions
                        .filter(
                          (t) =>
                            !theme.trim() ||
                            t
                              .toLowerCase()
                              .includes(theme.trim().toLowerCase()),
                        )
                        .slice(0, 12)
                        .map((s) => (
                          <li key={s}>
                            <button
                              type="button"
                              role="option"
                              className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setTheme(s);
                                setShowThemeDropdown(false);
                              }}
                            >
                              {s}
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={handleGenerateQuote}
                    disabled={generatingQuote || !theme.trim()}
                    className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingQuote ? "Generating…" : "Generate quote"}
                  </button>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Or get quote from YouTube
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    <input
                      type="url"
                      value={youtubeTranscriptUrl}
                      onChange={(e) => {
                        setYoutubeTranscriptUrl(e.target.value);
                        setYoutubeTranscriptError("");
                      }}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="flex-1 min-w-[200px] px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                    <button
                      type="button"
                      onClick={handleFetchYoutubeTranscript}
                      disabled={fetchingTranscript}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      <SiYoutube className="w-4 h-4" />
                      {fetchingTranscript ? "Fetching…" : "Fetch transcript"}
                    </button>
                  </div>
                  {youtubeTranscriptError && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {youtubeTranscriptError}
                    </p>
                  )}
                  {youtubeTranscript && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Transcript (use below to add as quotes)
                      </p>
                      <div className="max-h-32 overflow-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-3 text-sm text-gray-700 dark:text-gray-300">
                        {youtubeTranscript}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleAIPickQuotes}
                          disabled={extractingQuotes}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                          {extractingQuotes
                            ? "Picking…"
                            : "AI pick punchy quotes"}
                        </button>
                        <button
                          type="button"
                          onClick={addTranscriptSentencesAsQuotes}
                          className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          Add sentences as quotes
                        </button>
                        <button
                          type="button"
                          onClick={addFullTranscriptAsQuote}
                          className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          Add full as one quote
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {quoteList.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Generated quotes (click to use)
                    </label>
                    <ul className="space-y-2 max-h-48 overflow-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-2">
                      {quoteList.map((q, i) => (
                        <li
                          key={`${i}-${q.slice(0, 20)}`}
                          className="flex items-center gap-2"
                        >
                          <button
                            type="button"
                            onClick={() => setQuoteText(q)}
                            className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              quoteText === q
                                ? "bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700"
                                : "bg-white dark:bg-gray-800 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                          >
                            {q}
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const nextList = quoteList.filter(
                                (_, j) => j !== i,
                              );
                              const newSelected =
                                quoteText === q
                                  ? (nextList[0] ?? "")
                                  : quoteText;
                              setQuoteList(nextList);
                              setQuoteText(newSelected);
                              if (currentProjectId) {
                                await fetch(
                                  `/api/quote-videos/projects/${currentProjectId}`,
                                  {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      quote_list: nextList,
                                      quote_text: newSelected,
                                    }),
                                  },
                                );
                              }
                            }}
                            className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 shrink-0"
                            title="Remove quote"
                          >
                            <Trash2 size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quote (edit if needed)
                  </label>
                  <textarea
                    value={quoteText}
                    onChange={(e) => setQuoteText(e.target.value)}
                    placeholder="Generate quotes above or type your own"
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-y"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={async () => {
                      if (currentProjectId) {
                        await fetch(
                          `/api/quote-videos/projects/${currentProjectId}`,
                          {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              theme: theme.trim(),
                              quote_text: quoteText.trim(),
                              quote_list: quoteList,
                            }),
                          },
                        );
                      }
                      if (theme.trim()) {
                        try {
                          await fetch("/api/quote-videos/theme-suggestions", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ theme: theme.trim() }),
                          });
                        } catch (e) {
                          console.error("Add theme to suggestions:", e);
                        }
                      }
                      goToStep(2);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-90 transition-opacity"
                  >
                    Next: Image →
                  </button>
                </div>
              </div>
            )}

            {step === 2 &&
              (() => {
                return (
                  <div className="space-y-6">
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        Step 2: Image
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Claude (reference → prompt) · Fal (image generation)
                      </p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <div className="bg-blue-50 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap dark:bg-blue-950/40">
                          <span className="text-blue-700 dark:text-blue-200">
                            🤖 Claude (image→prompt):
                          </span>
                          <span className="font-semibold text-blue-900 dark:text-blue-100">
                            {process.env.NEXT_PUBLIC_QUOTE_CLAUDE_MODEL_LABEL ||
                              process.env.NEXT_PUBLIC_CLAUDE_MODEL ||
                              "—"}
                          </span>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap dark:bg-blue-950/40">
                          <span className="text-blue-700 dark:text-blue-200">
                            📥 Claude Input:
                          </span>
                          <span className="font-semibold text-blue-900 dark:text-blue-100">
                            $
                            {(
                              parseFloat(
                                process.env
                                  .NEXT_PUBLIC_CLAUDE_INPUT_PER_MILLION ||
                                  "3.00",
                              ) / 1e6
                            ).toFixed(6)}
                            /tok
                          </span>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap dark:bg-blue-950/40">
                          <span className="text-blue-700 dark:text-blue-200">
                            📤 Claude Output:
                          </span>
                          <span className="font-semibold text-blue-900 dark:text-blue-100">
                            $
                            {(
                              parseFloat(
                                process.env
                                  .NEXT_PUBLIC_CLAUDE_OUTPUT_PER_MILLION ||
                                  "15.00",
                              ) / 1e6
                            ).toFixed(6)}
                            /tok
                          </span>
                        </div>
                        {project?.costs?.step2?.claude > 0 && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                            <span className="text-blue-700 dark:text-blue-200">
                              🤖 Claude:
                            </span>
                            <span className="font-semibold text-blue-900 dark:text-blue-100">
                              ${project.costs.step2.claude.toFixed(4)}
                            </span>
                          </div>
                        )}
                        <div className="bg-purple-50 border border-purple-200 dark:border-purple-800 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap dark:bg-purple-950/40">
                          <span className="text-purple-700 dark:text-purple-200">
                            🖼️ Fal (image gen):
                          </span>
                          <span className="font-semibold text-purple-900 dark:text-purple-100">
                            {process.env.NEXT_PUBLIC_QUOTE_IMAGE_MODEL_LABEL ||
                              "—"}
                          </span>
                        </div>
                        {project?.costs?.step2?.fal > 0 && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                            <span className="text-purple-700 dark:text-purple-200">
                              🖼️ Fal:
                            </span>
                            <span className="font-semibold text-purple-900 dark:text-purple-100">
                              ${project.costs.step2.fal.toFixed(4)}
                            </span>
                          </div>
                        )}
                        {project?.costs?.step2?.total > 0 && (
                          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                            <span className="text-gray-600 dark:text-gray-300">
                              💰 Step 2 Total:
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              ${project.costs.step2.total.toFixed(4)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <label
                          htmlFor="text-to-image-model"
                          className="text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Text-to-image model:
                        </label>
                        <select
                          id="text-to-image-model"
                          value={textToImageModel}
                          onChange={async (e) => {
                            const next = e.target.value;
                            if (
                              !QUOTE_VIDEOS_TEXT_TO_IMAGE_MODELS.some(
                                (m) => m.id === next,
                              ) ||
                              !currentProjectId
                            )
                              return;
                            setTextToImageModel(next);
                            try {
                              await fetch(
                                `/api/quote-videos/projects/${currentProjectId}`,
                                {
                                  method: "PATCH",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    text_to_image_model: next,
                                  }),
                                },
                              );
                            } catch (err) {
                              console.error(
                                "Failed to save text-to-image model:",
                                err,
                              );
                            }
                          }}
                          disabled={!project?.id}
                          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                        >
                          {QUOTE_VIDEOS_TEXT_TO_IMAGE_MODELS.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {(generatingImage ||
                      generatingPromptFromImage ||
                      loadingFinalPrompt ||
                      uploadingReferenceImage) && (
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 p-4 shadow-sm">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          {generatingImage
                            ? "Generating image…"
                            : generatingPromptFromImage
                              ? "Analyzing image (image to prompt)…"
                              : loadingFinalPrompt
                                ? "Loading final prompt…"
                                : "Uploading reference image…"}
                        </p>
                        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500 dark:bg-blue-500 min-w-[30%]"
                            style={{
                              animation:
                                "quote-step2-loading-bar 1.5s ease-in-out infinite",
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <style
                      dangerouslySetInnerHTML={{
                        __html: `
                @keyframes quote-step2-loading-bar {
                  0% { transform: translateX(-100%); }
                  50% { transform: translateX(200%); }
                  100% { transform: translateX(-100%); }
                }
              `,
                      }}
                    />

                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 p-5 shadow-sm">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                        Quote for this image
                      </p>
                      <p className="text-gray-800 dark:text-gray-200 italic">
                        &ldquo;{quoteText || "—"}&rdquo;
                      </p>
                    </div>
                    {/* Section: Reference image + Image to prompt */}
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 p-5 shadow-sm">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                        Image to prompt
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Upload a reference image. Claude analyzes it to create a
                        scene prompt only (image is not used for generation).
                        9:16.
                      </p>
                      <div
                        className={`rounded-xl border-2 border-dashed p-5 transition-all duration-200 ${
                          referenceDropActive
                            ? "border-blue-500 bg-blue-50/80 dark:bg-blue-950/30"
                            : "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                        onDragOver={handleReferenceDragOver}
                        onDragLeave={handleReferenceDragLeave}
                        onDrop={handleReferenceDrop}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div
                            className="flex-1 flex flex-col sm:items-start text-center sm:text-left cursor-pointer"
                            onClick={() =>
                              referenceFileInputRef.current?.click()
                            }
                          >
                            {referenceDropActive ? (
                              <p className="text-base font-semibold text-blue-600 dark:text-blue-400">
                                Drop image here
                              </p>
                            ) : (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Drag and drop or use the buttons below.
                              </p>
                            )}
                          </div>
                          <input
                            ref={referenceFileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handleUploadReferenceImage}
                            className="hidden"
                          />
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                referenceFileInputRef.current?.click()
                              }
                              disabled={uploadingReferenceImage}
                              className="px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                            >
                              {uploadingReferenceImage
                                ? "Uploading…"
                                : "Upload"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowReferenceGalleryModal(true)}
                              disabled={!project?.id}
                              className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                            >
                              Gallery
                            </button>
                          </div>
                        </div>
                      </div>
                      {referenceImageUrl && (
                        <div className="mt-4 flex flex-wrap items-center gap-4">
                          <img
                            src={referenceImageUrl}
                            alt="Reference"
                            className="w-20 aspect-[9/16] rounded-xl object-cover border border-gray-200 dark:border-gray-700 shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={handleImageToPrompt}
                            disabled={generatingPromptFromImage}
                            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                          >
                            {generatingPromptFromImage
                              ? "Analyzing…"
                              : "Image to prompt"}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 p-5 shadow-sm">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                        Image prompt
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
                        {imagePromptUsed.trim()
                          ? imagePromptUsed
                          : "Use “Image to prompt” above to generate the prompt from your reference image."}
                      </p>
                    </div>

                    {imagePromptUsed.trim() && (
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                          Final prompt (dark Ghibli)
                        </p>
                        {loadingFinalPrompt ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Loading…
                          </p>
                        ) : finalImagePromptDisplay ? (
                          <p className="text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
                            {finalImagePromptDisplay}
                          </p>
                        ) : null}
                      </div>
                    )}

                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 p-5 shadow-sm">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                        Generate from final prompt
                      </p>
                      <button
                        type="button"
                        onClick={handleGenerateImage}
                        disabled={generatingImage || !imagePromptUsed.trim()}
                        className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {generatingImage
                          ? "Generating image…"
                          : "Generate new image"}
                      </button>
                    </div>
                    {(() => {
                      const scenes = Array.isArray(project?.scenes)
                        ? project.scenes
                        : [];
                      const useScenes = scenes.length > 0;
                      const safeSceneIndex = useScenes
                        ? Math.min(
                            currentSceneIndex,
                            Math.max(0, scenes.length - 1),
                          )
                        : 0;
                      const currentScene = useScenes
                        ? scenes[safeSceneIndex]
                        : null;

                      // Character Shorts shape: image_urls, image_prompts, selected_image_index, image_metadata (or legacy background_image_*)
                      function getSceneImageState(sceneOrProject, isScene) {
                        if (!sceneOrProject)
                          return {
                            image_urls: [],
                            selected_index: 0,
                            entries: [],
                          };
                        const urls = Array.isArray(sceneOrProject.image_urls)
                          ? sceneOrProject.image_urls
                          : [];
                        if (urls.length > 0) {
                          const meta = Array.isArray(
                            sceneOrProject.image_metadata,
                          )
                            ? sceneOrProject.image_metadata
                            : [];
                          const idx =
                            typeof sceneOrProject.selected_image_index ===
                            "number"
                              ? Math.max(
                                  0,
                                  Math.min(
                                    sceneOrProject.selected_image_index,
                                    urls.length - 1,
                                  ),
                                )
                              : 0;
                          const entries = urls.map((url, i) => ({
                            url,
                            created_at: meta[i]?.created_at ?? null,
                            prompt_sent_to_model:
                              meta[i]?.prompt_sent_to_model ?? null,
                            model_endpoint: meta[i]?.model_endpoint ?? null,
                            fal_request_payload:
                              meta[i]?.fal_request_payload ?? null,
                          }));
                          return {
                            image_urls: urls,
                            selected_index: idx,
                            entries,
                          };
                        }
                        const hist = Array.isArray(
                          sceneOrProject.background_image_history,
                        )
                          ? sceneOrProject.background_image_history
                          : [];
                        const legacyUrls = hist
                          .map((e) => (typeof e === "string" ? e : e?.url))
                          .filter(Boolean);
                        const legacyEntries = hist
                          .map((e) => {
                            if (typeof e === "string")
                              return {
                                url: e,
                                created_at: null,
                                prompt_sent_to_model: null,
                                model_endpoint: null,
                                fal_request_payload: null,
                              };
                            return {
                              url: e?.url,
                              created_at: e?.created_at ?? null,
                              prompt_sent_to_model:
                                e?.prompt_sent_to_model ?? null,
                              model_endpoint: e?.model_endpoint ?? null,
                              fal_request_payload:
                                e?.fal_request_payload ?? null,
                            };
                          })
                          .filter((e) => e.url);
                        const selectedUrl = (
                          sceneOrProject.background_image_url || ""
                        ).trim();
                        const legacyIdx = selectedUrl
                          ? legacyUrls.indexOf(selectedUrl)
                          : -1;
                        const selected_index = legacyIdx >= 0 ? legacyIdx : 0;
                        return {
                          image_urls: legacyUrls,
                          selected_index,
                          entries: legacyEntries,
                        };
                      }

                      const sceneState =
                        useScenes && currentScene
                          ? getSceneImageState(currentScene, true)
                          : getSceneImageState(project, false);
                      let entries = sceneState.entries;
                      const selectedUrl =
                        useScenes && currentScene
                          ? (
                              sceneState.image_urls[
                                sceneState.selected_index
                              ] || ""
                            ).trim()
                          : (backgroundImageUrl || "").trim();
                      if (entries.length === 0 && selectedUrl) {
                        entries = [
                          {
                            url: selectedUrl,
                            created_at: null,
                            prompt_sent_to_model: null,
                            model_endpoint: null,
                            fal_request_payload: null,
                          },
                        ];
                      }
                      if (entries.length === 0 && !useScenes) return null;
                      const sceneIndexForActions = safeSceneIndex;

                      const handleDownloadBackgroundImage = async (
                        url,
                        index,
                      ) => {
                        try {
                          const filename = `quote-background_${index + 1}.png`;
                          const downloadUrl = `/api/download-image?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
                          const link = document.createElement("a");
                          link.href = downloadUrl;
                          link.download = filename;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        } catch (e) {
                          await alert("Failed to download image", "error");
                        }
                      };

                      const handleDeleteBackgroundImage = async (url) => {
                        if (
                          !(await confirm(
                            "Remove this generated image from the list and delete it from storage?",
                          ))
                        )
                          return;
                        if (!currentProjectId) return;
                        setDeletingBackgroundImageUrl(url);
                        try {
                          const body = { project_id: currentProjectId, url };
                          if (useScenes && currentScene?.id)
                            body.scene_id = currentScene.id;
                          const res = await fetch(
                            "/api/quote-videos/delete-background-image",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(body),
                            },
                          );
                          const data = await res.json();
                          if (data.success) {
                            if (
                              !useScenes &&
                              data.background_image_url !== undefined
                            )
                              setBackgroundImageUrl(
                                data.background_image_url || "",
                              );
                            loadProject(currentProjectId);
                          } else {
                            await alert(
                              data.error || "Failed to delete image",
                              "error",
                            );
                          }
                        } catch (e) {
                          await alert(
                            e.message || "Failed to delete image",
                            "error",
                          );
                        } finally {
                          setDeletingBackgroundImageUrl(null);
                        }
                      };

                      return (
                        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 p-5 shadow-sm">
                          {useScenes && (
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Scenes
                              </span>
                              {scenes.map((s, i) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => setCurrentSceneIndex(i)}
                                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    i === safeSceneIndex
                                      ? "bg-blue-600 text-white"
                                      : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                                  }`}
                                >
                                  {s.label || `Scene ${i + 1}`}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={handleAddScene}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium border-2 border-dashed border-gray-400 dark:border-gray-500 text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
                              >
                                + Add scene
                              </button>
                            </div>
                          )}
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              Generated images — select one for video
                              {useScenes
                                ? ` (${currentScene?.label || `Scene ${currentSceneIndex + 1}`})`
                                : ""}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                setShowSceneImageGalleryModal(true)
                              }
                              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                              Select from gallery
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {entries.map((entry, index) => {
                              const url = entry.url;
                              const isSelected = url === selectedUrl;
                              const isDeleting =
                                deletingBackgroundImageUrl === url;
                              return (
                                <div
                                  key={url}
                                  onClick={async () => {
                                    if (url === selectedUrl) return;
                                    if (!useScenes) setBackgroundImageUrl(url);
                                    if (!currentProjectId) return;
                                    try {
                                      if (useScenes && currentScene?.id) {
                                        await fetch(
                                          `/api/quote-videos/projects/${currentProjectId}/scenes/${currentScene.id}`,
                                          {
                                            method: "PATCH",
                                            headers: {
                                              "Content-Type":
                                                "application/json",
                                            },
                                            body: JSON.stringify({
                                              selected_image_index: index,
                                            }),
                                          },
                                        );
                                      } else {
                                        await fetch(
                                          `/api/quote-videos/projects/${currentProjectId}`,
                                          {
                                            method: "PATCH",
                                            headers: {
                                              "Content-Type":
                                                "application/json",
                                            },
                                            body: JSON.stringify({
                                              background_image_url: url,
                                            }),
                                          },
                                        );
                                      }
                                      loadProject(currentProjectId);
                                    } catch (e) {
                                      console.error(e);
                                    }
                                  }}
                                  className={`relative aspect-[9/16] w-24 rounded-xl overflow-hidden border-2 cursor-pointer transition-all group ${
                                    isSelected
                                      ? "border-blue-500 ring-2 ring-blue-500/50"
                                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                  }`}
                                  title={
                                    isSelected
                                      ? "Selected for video"
                                      : "Click to select for video"
                                  }
                                >
                                  <img
                                    src={url}
                                    alt="Generated"
                                    className="w-full h-full object-cover"
                                  />
                                  {isSelected && (
                                    <div className="absolute top-1 left-1 bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs font-medium">
                                      ✓ Selected
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex flex-col justify-end p-1.5 gap-1">
                                    <div className="flex flex-wrap gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setExpandedImageUrl(url);
                                        }}
                                        className="flex items-center gap-1 bg-black/80 text-white px-2 py-1 rounded text-xs hover:bg-black"
                                        title="Expand preview"
                                      >
                                        <Maximize2 size={12} /> Preview
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setBackgroundImageInfoUrl(url);
                                        }}
                                        className="flex items-center gap-1 bg-black/80 text-white px-2 py-1 rounded text-xs hover:bg-black"
                                        title="Info"
                                      >
                                        <Info size={12} /> Info
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownloadBackgroundImage(
                                            url,
                                            index,
                                          );
                                        }}
                                        className="flex items-center gap-1 bg-black/80 text-white px-2 py-1 rounded text-xs hover:bg-black"
                                        title="Download"
                                      >
                                        <Download size={12} /> Download
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteBackgroundImage(url);
                                        }}
                                        disabled={isDeleting}
                                        className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 disabled:opacity-50"
                                        title="Delete"
                                      >
                                        <Trash2 size={12} />{" "}
                                        {isDeleting ? "…" : "Delete"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {(sceneState.entries[sceneState.selected_index]
                            ?.prompt_sent_to_model ||
                            currentScene?.image_prompt ||
                            (!useScenes && imagePromptUsed)) && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                Image prompt
                              </p>
                              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                                {useScenes
                                  ? sceneState.entries[
                                      sceneState.selected_index
                                    ]?.prompt_sent_to_model ||
                                    currentScene?.image_prompt ||
                                    "No image prompt yet."
                                  : imagePromptUsed || "No image prompt yet."}
                              </div>
                            </div>
                          )}
                          {selectedUrl && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                Selected for video
                              </p>
                              <div className="relative inline-block">
                                <img
                                  src={selectedUrl}
                                  alt="Selected"
                                  className="w-full max-w-sm rounded-lg border border-gray-200 dark:border-gray-700 object-cover aspect-[9/16]"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedImageUrl(selectedUrl)
                                  }
                                  className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white"
                                  title="Expand preview"
                                >
                                  <Maximize2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}

                          {selectedUrl && (
                            <div className="mt-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50/50 dark:bg-slate-900/30">
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">
                                Apply film grain
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                                Add a new grained version of the selected image
                                (original unchanged). Uses{" "}
                                <a
                                  href="https://fal.ai/models/fal-ai/post-processing/grain"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 underline"
                                >
                                  fal.ai post-processing/grain
                                </a>
                                .
                              </p>
                              <div className="flex flex-wrap items-center gap-4 mb-3">
                                <div className="flex items-center gap-2">
                                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                    Style
                                  </label>
                                  <select
                                    value={grainStyle}
                                    onChange={(e) =>
                                      setGrainStyle(e.target.value)
                                    }
                                    className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm px-3 py-2"
                                  >
                                    <option value="modern">Modern</option>
                                    <option value="analog">Analog</option>
                                    <option value="kodak">Kodak</option>
                                    <option value="fuji">Fuji</option>
                                    <option value="cinematic">Cinematic</option>
                                    <option value="newspaper">Newspaper</option>
                                  </select>
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                    Intensity
                                  </label>
                                  <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    value={grainIntensity}
                                    onChange={(e) =>
                                      setGrainIntensity(
                                        parseFloat(e.target.value),
                                      )
                                    }
                                    className="h-2 w-24 accent-slate-500"
                                  />
                                  <span className="text-xs tabular-nums text-slate-600 dark:text-slate-400 w-8">
                                    {grainIntensity}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                    Scale
                                  </label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={grainScale}
                                    onChange={(e) =>
                                      setGrainScale(
                                        Math.max(
                                          1,
                                          Math.min(
                                            100,
                                            Number(e.target.value) || 10,
                                          ),
                                        ),
                                      )
                                    }
                                    className="w-16 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm px-2 py-2"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleApplyGrain(
                                    selectedUrl,
                                    useScenes && currentScene?.id
                                      ? currentScene.id
                                      : null,
                                  )
                                }
                                disabled={applyingGrain}
                                className="px-4 py-2 rounded-lg bg-slate-600 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {applyingGrain
                                  ? "Applying grain…"
                                  : "Apply grain"}
                              </button>
                            </div>
                          )}

                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                            <button
                              type="button"
                              onClick={handleAddScene}
                              className="px-4 py-2 rounded-lg border-2 border-dashed border-gray-400 dark:border-gray-500 text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-sm"
                            >
                              + Add scene
                            </button>
                          </div>

                          {backgroundImageInfoUrl &&
                            (() => {
                              const entry = entries.find(
                                (e) => e.url === backgroundImageInfoUrl,
                              );
                              const hasMeta =
                                entry &&
                                (entry.prompt_sent_to_model != null ||
                                  entry.model_endpoint != null ||
                                  entry.fal_request_payload != null);
                              return (
                                <div
                                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                                  onClick={() =>
                                    setBackgroundImageInfoUrl(null)
                                  }
                                  role="dialog"
                                  aria-modal="true"
                                >
                                  <div
                                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
                                      <div className="min-w-0">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                          Image details
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                                          URL: {backgroundImageInfoUrl}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <a
                                          href={backgroundImageInfoUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800"
                                        >
                                          Open
                                        </a>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setBackgroundImageInfoUrl(null)
                                          }
                                          className="text-xs px-3 py-1.5 rounded-xl bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-gray-900"
                                        >
                                          Close
                                        </button>
                                      </div>
                                    </div>
                                    <div className="px-5 py-4 overflow-y-auto space-y-4">
                                      {!hasMeta && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-4 text-sm dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                                          No generation metadata for this image
                                          (e.g. generated before metadata was
                                          stored).
                                        </div>
                                      )}
                                      {entry?.created_at && (
                                        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/40 p-4">
                                          <div className="text-xs font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                            Settings
                                          </div>
                                          <div className="text-xs text-gray-700 dark:text-gray-200 space-y-1">
                                            <div>
                                              <span className="font-medium">
                                                Generated:
                                              </span>{" "}
                                              {new Date(
                                                entry.created_at,
                                              ).toISOString()}
                                            </div>
                                            {entry.model_endpoint && (
                                              <div>
                                                <span className="font-medium">
                                                  Model endpoint:
                                                </span>{" "}
                                                {entry.model_endpoint}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      {entry?.prompt_sent_to_model != null && (
                                        <details
                                          className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/40 p-4"
                                          open
                                        >
                                          <summary className="cursor-pointer text-xs font-semibold text-gray-800 dark:text-gray-100">
                                            Prompt sent to model
                                          </summary>
                                          <pre className="mt-3 text-xs font-mono leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words rounded-xl bg-gray-50/80 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-800/80 p-3">
                                            {entry.prompt_sent_to_model ||
                                              "(empty)"}
                                          </pre>
                                        </details>
                                      )}
                                      {entry?.fal_request_payload != null && (
                                        <details
                                          className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/40 p-4"
                                          open
                                        >
                                          <summary className="cursor-pointer text-xs font-semibold text-gray-800 dark:text-gray-100">
                                            Request payload (exact API params)
                                          </summary>
                                          <pre className="mt-3 text-[11px] font-mono leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words rounded-xl bg-gray-50/80 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-800/80 p-3">
                                            {JSON.stringify(
                                              entry.fal_request_payload,
                                              null,
                                              2,
                                            )}
                                          </pre>
                                        </details>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                        </div>
                      );
                    })()}
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => goToStep(1)}
                        className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={() => goToStep(3)}
                        disabled={
                          !(backgroundImageUrl || "").trim() &&
                          (!Array.isArray(project?.scenes) ||
                            project.scenes.length === 0 ||
                            !project.scenes.some((s) => {
                              const urls = Array.isArray(s.image_urls)
                                ? s.image_urls
                                : [];
                              if (urls.length > 0) {
                                const idx =
                                  typeof s.selected_image_index === "number"
                                    ? s.selected_image_index
                                    : 0;
                                return (urls[idx] || "").trim();
                              }
                              return (s.background_image_url || "").trim();
                            }))
                        }
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next: Generate video →
                      </button>
                    </div>
                  </div>
                );
              })()}

            {step === 3 && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">
                    Step 3: Generate video
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <div className="bg-purple-50 border border-purple-200 dark:border-purple-800 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap dark:bg-purple-950/40">
                      <span className="text-purple-700 dark:text-purple-200">
                        🎬 Model:
                      </span>
                      <span
                        className="font-semibold text-purple-900 dark:text-purple-100"
                        title={imageToVideoModel || ""}
                      >
                        {imageToVideoModel ?? "…"}
                      </span>
                    </div>
                    {project?.costs?.step3?.fal > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                        <span className="text-gray-600 dark:text-gray-300">
                          🎬 Fal:
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          ${project.costs.step3.fal.toFixed(4)}
                        </span>
                      </div>
                    )}
                    {project?.costs?.step3?.total > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                        <span className="text-gray-600 dark:text-gray-300">
                          💰 Step 3 Total:
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          ${project.costs.step3.total.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {(generatingVideoSceneId || generatingVideoPromptSceneId) && (
                  <>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/80 p-4 shadow-sm">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        {generatingVideoSceneId
                          ? "Generating video…"
                          : "Generating video prompt…"}
                      </p>
                      <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500 dark:bg-blue-500 min-w-[30%]"
                          style={{
                            animation:
                              "quote-step3-loading-bar 1.5s ease-in-out infinite",
                          }}
                        />
                      </div>
                    </div>
                    <style
                      dangerouslySetInnerHTML={{
                        __html: `
                    @keyframes quote-step3-loading-bar {
                      0% { transform: translateX(-100%); }
                      50% { transform: translateX(200%); }
                      100% { transform: translateX(-100%); }
                    }
                  `,
                      }}
                    />
                  </>
                )}

                {Array.isArray(project?.scenes) && project.scenes.length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-6">
                      {project.scenes.map((scene) => {
                        const selectedImageUrl =
                          getSelectedImageUrlForScene(scene);
                        const selectedVideoUrl = (
                          scene.selected_video_url || ""
                        ).trim();
                        const sceneDuration = Math.max(
                          1,
                          Math.min(15, Math.round(Number(scene.duration) || 8)),
                        );
                        const isGenerating =
                          generatingVideoSceneId === scene.id;
                        const canGenerate =
                          Boolean(selectedImageUrl) && !isGenerating;
                        return (
                          <div
                            key={scene.id}
                            className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-950"
                          >
                            <div className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                              {scene.label || `Scene ${scene.id}`}
                            </div>

                            {(() => {
                              const selIdx =
                                typeof scene.selected_image_index === "number"
                                  ? scene.selected_image_index
                                  : 0;
                              const prompts = Array.isArray(scene.image_prompts)
                                ? scene.image_prompts
                                : [];
                              const meta = Array.isArray(scene.image_metadata)
                                ? scene.image_metadata
                                : [];
                              const imagePromptText =
                                (prompts[selIdx] &&
                                  String(prompts[selIdx]).trim()) ||
                                meta[selIdx]?.prompt_sent_to_model ||
                                scene.image_prompt ||
                                "";
                              const videoPromptText =
                                (scene.motion_prompt &&
                                  String(scene.motion_prompt).trim()) ||
                                defaultMotionPrompt ||
                                "";
                              return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <div className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
                                      Image prompt
                                    </div>
                                    <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words max-h-24 overflow-y-auto">
                                      {imagePromptText || "—"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                                        Video prompt
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleGenerateVideoPromptForScene(
                                            scene,
                                          )
                                        }
                                        disabled={
                                          generatingVideoPromptSceneId ===
                                            scene.id || !imagePromptText.trim()
                                        }
                                        className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                      >
                                        {generatingVideoPromptSceneId ===
                                        scene.id
                                          ? "Generating…"
                                          : "Generate from image prompt"}
                                      </button>
                                    </div>
                                    <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words max-h-24 overflow-y-auto">
                                      {videoPromptText || "—"}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Generated videos — select one for this scene
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleGenerateVideoForScene(scene)
                                  }
                                  disabled={!canGenerate || isGenerating}
                                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isGenerating
                                    ? "Generating…"
                                    : "Generate video"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVideoHistoryTargetSceneId(scene.id);
                                    setShowVideoHistoryModal(true);
                                  }}
                                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                                >
                                  Select from history
                                </button>
                              </div>
                            </div>
                            {(() => {
                              const hist = Array.isArray(
                                scene.video_generation_history,
                              )
                                ? scene.video_generation_history
                                : [];
                              const videoEntries = hist
                                .map((m) => ({
                                  url: (m.video_url || m.url || "").trim(),
                                  duration_seconds:
                                    m.model_request_payload?.duration ??
                                    m.duration_seconds ??
                                    scene.duration ??
                                    8,
                                  created_at: m.timestamp || m.created_at,
                                }))
                                .filter((e) => e.url);
                              return (
                                <div className="flex flex-wrap gap-3 mb-5">
                                  {videoEntries.map((entry, idx) => {
                                    const isSelected =
                                      (entry.url || "").trim() ===
                                      (selectedVideoUrl || "").trim();
                                    return (
                                      <div
                                        key={
                                          (entry.url || "") +
                                          (entry.created_at || idx)
                                        }
                                        onClick={async () => {
                                          if (!isSelected)
                                            await handleSelectVideoFromHistoryForScene(
                                              entry,
                                              scene.id,
                                            );
                                        }}
                                        className={`relative aspect-[9/16] w-24 rounded-xl overflow-hidden border-2 cursor-pointer transition-all flex-shrink-0 group ${isSelected ? "border-blue-500 ring-2 ring-blue-500/50" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}
                                        title={
                                          isSelected
                                            ? "Selected"
                                            : "Click to select"
                                        }
                                      >
                                        <video
                                          src={entry.url}
                                          className="w-full h-full object-cover"
                                          muted
                                          preload="metadata"
                                          playsInline
                                        />
                                        {isSelected && (
                                          <div className="absolute top-1 left-1 bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs font-medium">
                                            ✓ Selected
                                          </div>
                                        )}
                                        <div className="absolute bottom-1 left-1 right-1 text-[10px] text-white bg-black/70 rounded px-1 py-0.5 text-center">
                                          {entry.duration_seconds ?? 8}s
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {videoEntries.length === 0 &&
                                    !selectedVideoUrl && (
                                      <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                                        No videos yet. Generate one or select
                                        from history.
                                      </p>
                                    )}
                                </div>
                              );
                            })()}
                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_48px_1fr] gap-4 lg:gap-6 items-start">
                              <div>
                                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                  Source image
                                </div>
                                <div className="relative aspect-[9/16] max-h-[320px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
                                  {selectedImageUrl ? (
                                    <>
                                      <img
                                        src={selectedImageUrl}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedImageUrl(selectedImageUrl)
                                        }
                                        className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white"
                                        title="Expand"
                                      >
                                        <Maximize2 className="w-4 h-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                                      No image
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="hidden lg:flex items-center justify-center text-gray-400 dark:text-gray-500 text-xl">
                                →
                              </div>
                              <div className="space-y-2">
                                <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Selected clip
                                </div>
                                <div className="relative aspect-[9/16] max-h-[320px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-black">
                                  {selectedVideoUrl ? (
                                    <>
                                      <video
                                        src={selectedVideoUrl}
                                        controls
                                        className="w-full h-full object-cover"
                                        preload="metadata"
                                        playsInline
                                      />
                                      <div className="absolute top-2 right-2 flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setExpandedVideoUrl(
                                              selectedVideoUrl,
                                            )
                                          }
                                          className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white"
                                          title="Expand"
                                        >
                                          <Maximize2 className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setSceneVideoInfo({
                                              sceneId: scene.id,
                                              label:
                                                scene.label ||
                                                `Scene ${scene.id}`,
                                              metadata:
                                                scene.last_video_generation_metadata,
                                            })
                                          }
                                          className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white"
                                          title="Info"
                                        >
                                          <Info className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                                      {isGenerating
                                        ? "Generating…"
                                        : "No video yet"}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Duration (s)
                                  </label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={15}
                                    value={sceneDuration}
                                    onChange={(e) =>
                                      updateSceneDuration(
                                        scene.id,
                                        Number(e.target.value) || 8,
                                      )
                                    }
                                    className="w-16 px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 p-5 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Generated videos — select one
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleGenerateVideo}
                          disabled={
                            generatingVideo ||
                            (!backgroundImageUrl.trim() &&
                              !quoteText.trim() &&
                              !theme.trim())
                          }
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {generatingVideo ? "Generating…" : "Generate video"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowVideoHistoryModal(true)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          Select from history
                        </button>
                      </div>
                    </div>
                    {Array.isArray(project?.animation_video_history) &&
                    project.animation_video_history.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {[...project.animation_video_history]
                          .reverse()
                          .map((entry, i) => {
                            const isSelected =
                              (entry.url || "").trim() ===
                              (animationVideoUrl || "").trim();
                            return (
                              <div
                                key={
                                  (entry.url || "") + (entry.created_at || i)
                                }
                                onClick={async () => {
                                  if (!isSelected)
                                    await handleSelectVideoFromHistory(entry);
                                }}
                                className={`relative aspect-[9/16] w-24 rounded-xl overflow-hidden border-2 cursor-pointer transition-all flex-shrink-0 ${isSelected ? "border-blue-500 ring-2 ring-blue-500/50" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}
                                title={
                                  isSelected ? "Selected" : "Click to select"
                                }
                              >
                                <video
                                  src={entry.url}
                                  className="w-full h-full object-cover"
                                  muted
                                  preload="metadata"
                                  playsInline
                                />
                                {isSelected && (
                                  <div className="absolute top-1 left-1 bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs font-medium">
                                    ✓ Selected
                                  </div>
                                )}
                                <div className="absolute bottom-1 left-1 right-1 text-[10px] text-white bg-black/70 rounded px-1 py-0.5 text-center">
                                  {entry.duration_seconds ?? 8}s
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No videos yet. Generate one or select from history.
                      </p>
                    )}
                    {animationVideoUrl && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Selected clip
                        </p>
                        <div className="flex flex-wrap gap-4 items-start">
                          <div className="relative aspect-[9/16] w-full max-w-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-black">
                            <video
                              src={animationVideoUrl}
                              controls
                              className="w-full h-full object-cover"
                              preload="metadata"
                              playsInline
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Duration (s)
                              </label>
                              <input
                                type="number"
                                min={5}
                                max={60}
                                value={durationSeconds}
                                onChange={(e) =>
                                  setDurationSeconds(
                                    Number(e.target.value) || 8,
                                  )
                                }
                                className="w-20 px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                              />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={handleGenerateVideo}
                                disabled={generatingVideo}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                              >
                                Generate another
                              </button>
                              <span className="text-gray-400 dark:text-gray-500">
                                ·
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowVideoHistoryModal(true)}
                                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                              >
                                Select from history
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await saveStep2();
                      goToStep(4);
                    }}
                    disabled={
                      Array.isArray(project?.scenes) &&
                      project.scenes.length > 0
                        ? !project.scenes.some((s) =>
                            (s.selected_video_url || "").trim(),
                          )
                        : !animationVideoUrl.trim()
                    }
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Music →
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">
                    Step 4: Background Music
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <div className="bg-teal-50 border border-teal-200 dark:border-teal-800 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap dark:bg-teal-950/40">
                      <span className="text-teal-700 dark:text-teal-200">
                        Video length:
                      </span>
                      <span className="font-semibold text-teal-900 dark:text-teal-100">
                        {(() => {
                          const scenes = Array.isArray(project?.scenes)
                            ? project.scenes
                            : [];
                          const totalSec =
                            scenes.length > 0
                              ? scenes.reduce(
                                  (s, sc) =>
                                    s +
                                    Math.max(
                                      1,
                                      Math.min(
                                        15,
                                        Math.round(Number(sc.duration) || 8),
                                      ),
                                    ),
                                  0,
                                )
                              : Math.max(
                                  5,
                                  Math.min(60, Number(durationSeconds) || 15),
                                );
                          return `${Math.floor(totalSec / 60)}m ${totalSec % 60}s`;
                        })()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-violet-700 dark:text-violet-300 text-xs sm:text-sm font-medium">
                        Model:
                      </span>
                      <select
                        value={selectedMusicModelId}
                        onChange={(e) => {
                          setSelectedMusicModelId(e.target.value);
                          loadMusicPricing(e.target.value);
                        }}
                        className="text-xs sm:text-sm font-medium bg-white dark:bg-gray-900 border border-violet-200 dark:border-violet-800 rounded-lg px-2 py-1.5 text-violet-900 dark:text-violet-100"
                      >
                        {MUSIC_MODELS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                      <span className="text-purple-700 dark:text-purple-200">
                        Unit:
                      </span>
                      <span className="font-semibold text-purple-900 dark:text-purple-100">
                        {loadingMusicPricing
                          ? "..."
                          : musicUnitCost != null
                            ? `$${musicUnitCost.toFixed(2)}/${musicPricingUnit || "min"}`
                            : "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="quote-music-duration"
                        className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap"
                      >
                        Duration (s):
                      </label>
                      <input
                        id="quote-music-duration"
                        type="number"
                        min={5}
                        max={600}
                        value={musicDurationSeconds}
                        onChange={(e) =>
                          setMusicDurationSeconds(
                            Math.max(
                              5,
                              Math.min(600, Number(e.target.value) || 5),
                            ),
                          )
                        }
                        className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                      />
                    </div>
                    {project?.costs?.step4?.total > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                        <span className="text-gray-600 dark:text-gray-300">
                          Step 4 Total:
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          ${project.costs.step4.total.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Generate or select background music. It will be mixed under
                  the clip when you render in the next step.
                </p>
                {musicBasePrompts.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Base prompt library
                      </label>
                      <a
                        href="/admin/quote-videos/music-base-prompts"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Manage base prompts →
                      </a>
                    </div>
                    <select
                      value={selectedMusicBaseId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedMusicBaseId(id);
                        const base = musicBasePrompts.find((b) => b.id === id);
                        if (base) setBaseMusicPrompt(base.prompt);
                      }}
                      className="w-full max-w-md px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                    >
                      {musicBasePrompts.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    {baseMusicPrompt && (
                      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3 space-y-3">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                          Selected base (used when music prompt field is empty)
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {baseMusicPrompt}
                        </p>
                        {(() => {
                          const selectedBase = musicBasePrompts.find(
                            (b) => b.id === selectedMusicBaseId,
                          );
                          const samples =
                            selectedBase?.sample_music ??
                            (selectedBase?.sample_music_url
                              ? [
                                  {
                                    url: selectedBase.sample_music_url,
                                    id: selectedBase.sample_music_id || "",
                                  },
                                ]
                              : []);
                          if (!samples.length) return null;
                          return (
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-600 space-y-2">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                                Samples (generated with this base)
                              </p>
                              {samples.map((s, i) => (
                                <audio
                                  key={s.id || s.url || i}
                                  src={s.url}
                                  controls
                                  className="w-full max-w-md h-9"
                                />
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      loadAvailableMusicFromCollection();
                      setShowMusicCollectionPicker(true);
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-900"
                    title="Select previously generated music"
                  >
                    Select from collection
                  </button>
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <label
                      htmlFor="quote-music-prompt"
                      className="text-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                      Music prompt (optional — leave empty to use base only)
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        setGeneratingMusicPrompt(true);
                        try {
                          const res = await fetch(
                            "/api/video-generator/generate-music-prompt",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                topic: (project?.theme || "").trim(),
                                script: (project?.quote_text || "").trim(),
                                scene_locations: [],
                              }),
                            },
                          );
                          const result = await res.json();
                          if (result.success && result.prompt?.trim()) {
                            setMusicPromptReview({
                              previousPrompt: musicPrompt,
                              newPrompt: result.prompt.trim(),
                            });
                          } else {
                            await alert(
                              "Failed to generate prompt: " +
                                (result.error || "Unknown"),
                              "error",
                            );
                          }
                        } catch (err) {
                          await alert("Error: " + err.message, "error");
                        } finally {
                          setGeneratingMusicPrompt(false);
                        }
                      }}
                      disabled={generatingMusicPrompt}
                      className="text-xs px-3 py-1.5 rounded-lg bg-violet-100 text-violet-800 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-200 dark:hover:bg-violet-900/60 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingMusicPrompt
                        ? "Generating…"
                        : "Generate prompt"}
                    </button>
                  </div>
                  <textarea
                    id="quote-music-prompt"
                    value={musicPrompt}
                    onChange={(e) => setMusicPrompt(e.target.value)}
                    onBlur={saveMusicStepDraft}
                    rows={4}
                    placeholder="Leave empty to use base only, or generate/enter custom prompt…"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900 dark:text-gray-100 dark:border-gray-800"
                  />
                </div>
                <div>
                  <label
                    htmlFor="quote-music-negative"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                  >
                    Negative prompt (avoid)
                  </label>
                  <textarea
                    id="quote-music-negative"
                    value={musicNegativePrompt}
                    onChange={(e) => setMusicNegativePrompt(e.target.value)}
                    onBlur={saveMusicStepDraft}
                    rows={2}
                    placeholder="e.g. meditation, spa, relaxation, calming"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900 dark:text-gray-100 dark:border-gray-800"
                  />
                </div>
                <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/30 dark:bg-violet-950/20 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-violet-900 dark:text-violet-100 mb-1">
                        Generate new music
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Uses the selected model. Leave prompt empty to use base
                        + your quote for variation; or enter a custom prompt.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        setGeneratingBackgroundMusic(true);
                        try {
                          const res = await fetch(
                            "/api/quote-videos/generate-background-music",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                project_id: currentProjectId,
                                model_id: selectedMusicModelId,
                                prompt: musicPrompt.trim() || null,
                                negative_prompt:
                                  musicNegativePrompt.trim() || null,
                                base_id: selectedMusicBaseId || null,
                                music_length_ms: Math.round(
                                  Math.max(
                                    5,
                                    Math.min(600, musicDurationSeconds),
                                  ) * 1000,
                                ),
                              }),
                            },
                          );
                          const result = await res.json();
                          if (result.success) {
                            setMusicUrl(result.music_url || "");
                            loadProject();
                            loadAvailableMusicFromCollection();
                            fetch("/api/quote-videos/music-base-prompts")
                              .then((r) => r.json())
                              .then((data) => {
                                if (data.success && Array.isArray(data.bases)) {
                                  setMusicBasePrompts(data.bases);
                                  const selected =
                                    data.bases.find(
                                      (b) => b.id === selectedMusicBaseId,
                                    ) || data.bases[0];
                                  if (selected)
                                    setBaseMusicPrompt(selected.prompt);
                                }
                              })
                              .catch(() => {});
                          } else {
                            await alert(
                              "Failed to generate music: " +
                                (result.error || "Unknown"),
                              "error",
                            );
                          }
                        } catch (err) {
                          await alert("Error: " + err.message, "error");
                        } finally {
                          setGeneratingBackgroundMusic(false);
                        }
                      }}
                      disabled={generatingBackgroundMusic}
                      className="shrink-0 px-6 py-2.5 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingBackgroundMusic
                        ? "Generating…"
                        : "Generate music"}
                    </button>
                  </div>
                  {generatingBackgroundMusic && (
                    <div className="mt-4 pt-4 border-t border-violet-200 dark:border-violet-700">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="animate-spin h-4 w-4 border-2 border-violet-600 border-t-transparent rounded-full" />
                        <span className="text-sm font-medium text-violet-900 dark:text-violet-100">
                          Generating with{" "}
                          {getMusicModelById(selectedMusicModelId)?.name ||
                            selectedMusicModelId}
                          …
                        </span>
                      </div>
                      <p className="text-xs text-violet-700 dark:text-violet-300">
                        This may take 30–60 seconds.
                      </p>
                    </div>
                  )}
                </div>
                {musicUrl && (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Current music
                      </span>
                      {(() => {
                        const current = availableMusicFromCollection.find(
                          (x) => x.music_url === musicUrl,
                        );
                        return current ? (
                          <button
                            type="button"
                            onClick={() => setMusicDetailsModal(current)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-400"
                            title="Track details"
                            aria-label="Track details"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        ) : null;
                      })()}
                    </div>
                    <audio
                      controls
                      src={musicUrl}
                      className="w-full max-w-md h-9"
                    />
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await fetch(
                              `/api/quote-videos/projects/${currentProjectId}`,
                              {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  music_url: null,
                                  background_music_id: null,
                                }),
                              },
                            );
                            const data = await res.json();
                            if (data.success) {
                              setMusicUrl("");
                              setProject(data.project);
                            }
                          } catch (_) {}
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
                {musicPromptReview && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Apply generated prompt?
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {musicPromptReview.newPrompt}
                      </p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setMusicPrompt(musicPromptReview.newPrompt);
                            setMusicPromptReview(null);
                          }}
                          className="px-4 py-2 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700"
                        >
                          Apply
                        </button>
                        <button
                          type="button"
                          onClick={() => setMusicPromptReview(null)}
                          className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => goToStep(3)}
                    className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => goToStep(5)}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
                  >
                    Next: Render
                  </button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="admin-card p-8 flex flex-col min-h-[calc(100vh-10rem)]">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                    Step 5: Assemble & Final Video
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Assemble quote, clip, and music then render via ShotStack.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project?.costs?.step5?.shotstack > 0 && (
                      <div className="bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                        <span className="text-pink-700 dark:text-pink-200">
                          🎞️ Shotstack:
                        </span>
                        <span className="font-semibold text-pink-900 dark:text-pink-100">
                          ${project.costs.step5.shotstack.toFixed(4)}
                        </span>
                      </div>
                    )}
                    {project?.costs?.step5?.total > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                        <span className="text-gray-600 dark:text-gray-300">
                          💰 Step 5 Total:
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          ${project.costs.step5.total.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col min-h-0 gap-4">
                  {isAssembling && (
                    <div className="shrink-0 px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                        Video is being rendered. This usually takes 1–2 minutes.
                      </p>
                      <div className="w-full h-2.5 bg-blue-200 dark:bg-blue-900/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${renderProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-blue-600 dark:text-blue-300 mt-2">
                        {renderProgress < 100
                          ? `${renderProgress}%`
                          : "Complete! Loading..."}
                      </p>
                      {renderProgress >= 95 && renderProgress < 100 && (
                        <p className="text-xs text-blue-600/80 dark:text-blue-300/80 mt-1">
                          Taking longer than usual. The page will update
                          automatically when the video is ready.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Shotstack Timeline Editor – same as character shorts */}
                  <div className="flex-1 min-h-0 w-full flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900/50">
                    <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 shrink-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Timeline
                      </p>
                    </div>
                    {/* Grain settings – visible next to preview; opacity drives preview grain layer */}
                    <div className="shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-amber-50/50 dark:bg-amber-950/20">
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-2 uppercase tracking-wide">
                        Grain overlay
                      </p>
                      {localGrainsList.length > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <label className="text-xs font-medium text-amber-800 dark:text-amber-200 whitespace-nowrap">
                            Grain (Firebase Storage):
                          </label>
                          <select
                            value={
                              localGrainsList.find(
                                (item) => item?.url === grainOverlayUrl,
                              )?.url ?? ""
                            }
                            onChange={async (e) => {
                              const url = e.target.value || "";
                              setGrainOverlayUrl(url);
                              if (currentProjectId && url !== grainOverlayUrl) {
                                try {
                                  await fetch(
                                    `/api/quote-videos/projects/${currentProjectId}`,
                                    {
                                      method: "PATCH",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        grain_overlay_url: url || null,
                                        grain_opacity: grainOpacity,
                                      }),
                                    },
                                  );
                                } catch (_) {}
                              }
                            }}
                            className="rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm px-3 py-2 min-w-[200px]"
                          >
                            <option value="">— None —</option>
                            {localGrainsList.map((item) => {
                              const name =
                                typeof item === "object" ? item.name : item;
                              const url =
                                typeof item === "object"
                                  ? item.url
                                  : `${typeof window !== "undefined" ? window.location.origin : ""}/grains/${encodeURIComponent(item)}`;
                              return (
                                <option key={url || name} value={url}>
                                  {name}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <input
                            type="url"
                            value={grainOverlayUrl}
                            onChange={(e) => setGrainOverlayUrl(e.target.value)}
                            onBlur={async () => {
                              if (!currentProjectId) return;
                              try {
                                await fetch(
                                  `/api/quote-videos/projects/${currentProjectId}`,
                                  {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      grain_overlay_url:
                                        grainOverlayUrl.trim() || null,
                                      grain_opacity: grainOpacity,
                                    }),
                                  },
                                );
                              } catch (_) {}
                            }}
                            placeholder="Grain image or video URL (HTTPS). Optional."
                            className="w-full px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm placeholder:text-gray-400"
                          />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <label className="text-xs font-medium text-amber-800 dark:text-amber-200 whitespace-nowrap">
                            Opacity (preview):
                          </label>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={grainOpacity}
                            onChange={(e) =>
                              setGrainOpacity(parseFloat(e.target.value))
                            }
                            onMouseUp={async (e) => {
                              if (!currentProjectId) return;
                              const opacity = parseFloat(e.target.value);
                              try {
                                await fetch(
                                  `/api/quote-videos/projects/${currentProjectId}`,
                                  {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      grain_overlay_url:
                                        grainOverlayUrl.trim() || null,
                                      grain_opacity: opacity,
                                    }),
                                  },
                                );
                              } catch (_) {}
                            }}
                            className="h-2 w-28 accent-amber-500"
                          />
                          <span className="text-sm tabular-nums font-medium text-amber-900 dark:text-amber-100 w-10">
                            {Math.round(grainOpacity * 100)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1">
                        Preview below updates with opacity. Rendered video uses
                        this opacity.
                      </p>
                      <p className="text-xs text-amber-600/90 dark:text-amber-400/90 mt-1">
                        <strong>Where to get a grain URL:</strong> Use the
                        dropdown to pick a grain from Firebase Storage (bucket
                        path{" "}
                        <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">
                          grains/
                        </code>
                        ), or paste any public HTTPS URL. You can also set{" "}
                        <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">
                          QUOTE_VIDEOS_GRAIN_OVERLAY_URL
                        </code>{" "}
                        in{" "}
                        <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">
                          .env
                        </code>{" "}
                        for a project-wide default.
                      </p>
                    </div>
                    {/* Video darken: clip filter + opacity */}
                    <div className="shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-slate-50/50 dark:bg-slate-950/20">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                        Video darken
                      </p>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            Filter:
                          </label>
                          <select
                            value={
                              timelineSettings?.videoFilter === "darken"
                                ? "darken"
                                : "none"
                            }
                            onChange={async (e) => {
                              const v =
                                e.target.value === "darken" ? "darken" : "none";
                              setTimelineSettings((prev) => ({
                                ...(prev || {}),
                                videoFilter: v,
                              }));
                              if (currentProjectId) {
                                try {
                                  await fetch(
                                    `/api/quote-videos/projects/${currentProjectId}`,
                                    {
                                      method: "PATCH",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        timeline_settings: {
                                          ...(timelineSettings || {}),
                                          videoFilter: v,
                                        },
                                      }),
                                    },
                                  );
                                } catch (_) {}
                              }
                            }}
                            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm px-3 py-2"
                          >
                            <option value="none">None</option>
                            <option value="darken">Darken</option>
                          </select>
                        </div>
                        {timelineSettings?.videoFilter === "darken" && (
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              Darkening:
                            </label>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={5}
                              value={(() => {
                                const opacity =
                                  typeof timelineSettings?.videoOpacity ===
                                  "number"
                                    ? timelineSettings.videoOpacity
                                    : 1;
                                return Math.round(((1 - opacity) / 0.8) * 100);
                              })()}
                              onChange={(e) => {
                                const pct = Number(e.target.value);
                                const opacity = 1 - (pct / 100) * 0.8;
                                setTimelineSettings((prev) => ({
                                  ...(prev || {}),
                                  videoOpacity: opacity,
                                }));
                              }}
                              onMouseUp={async (e) => {
                                if (!currentProjectId) return;
                                const pct = Number(e.target.value);
                                const opacity = 1 - (pct / 100) * 0.8;
                                try {
                                  await fetch(
                                    `/api/quote-videos/projects/${currentProjectId}`,
                                    {
                                      method: "PATCH",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        timeline_settings: {
                                          ...(timelineSettings || {}),
                                          videoOpacity: opacity,
                                        },
                                      }),
                                    },
                                  );
                                } catch (_) {}
                              }}
                              className="h-2 w-28 accent-slate-500"
                            />
                            <span className="text-sm tabular-nums font-medium text-slate-700 dark:text-slate-300 w-10">
                              {(() => {
                                const opacity =
                                  typeof timelineSettings?.videoOpacity ===
                                  "number"
                                    ? timelineSettings.videoOpacity
                                    : 1;
                                return Math.round(((1 - opacity) / 0.8) * 100);
                              })()}
                              %
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {timelineSettings?.videoFilter === "darken"
                          ? "Darkening: 0% = no change, 100% = maximum. Filter adds extra darkening."
                          : "Choose Darken to dim the video and adjust strength."}
                      </p>
                    </div>
                    <div className="flex-1 min-h-[320px] w-full">
                      {(() => {
                        const scenes = Array.isArray(project?.scenes)
                          ? project.scenes
                          : [];
                        const scenesWithVideo = scenes.filter((s) =>
                          (s.selected_video_url || "").trim(),
                        );
                        const hasScenesWithVideo = scenesWithVideo.length > 0;
                        // Use numeric scene_id (index) so TimelineEditor sort preserves order; match scenes/durations to same order
                        const editorVideos = hasScenesWithVideo
                          ? scenesWithVideo.map((s, i) => ({
                              scene_id: i,
                              video_url: (s.selected_video_url || "").trim(),
                            }))
                          : animationVideoUrl
                            ? [{ scene_id: 0, video_url: animationVideoUrl }]
                            : [];
                        const editorScenes = hasScenesWithVideo
                          ? scenesWithVideo.map((s, i) => ({
                              id: i,
                              duration: s.duration,
                            }))
                          : animationVideoUrl
                            ? [{ id: 0 }]
                            : [];
                        const editorSceneDurations = hasScenesWithVideo
                          ? Object.fromEntries(
                              scenesWithVideo.map((s, i) => [
                                i,
                                Math.max(
                                  1,
                                  Math.min(
                                    60,
                                    Math.round(Number(s.duration) || 8),
                                  ),
                                ),
                              ]),
                            )
                          : animationVideoUrl
                            ? { 0: durationSeconds }
                            : {};
                        const getSceneDurationSecondsForEditor = (scene) => {
                          if (!scene) return 8;
                          const d =
                            scene.duration != null
                              ? Number(scene.duration)
                              : null;
                          if (Number.isFinite(d))
                            return Math.max(1, Math.min(60, Math.round(d)));
                          if (!hasScenesWithVideo && scene.id === 0)
                            return durationSeconds;
                          return 8;
                        };
                        const hasVideo = editorVideos.length > 0;
                        return hasVideo ? (
                          <TimelineEditor
                            ref={timelineEditorRef}
                            projectId={currentProjectId}
                            projectPatchBasePath="/api/quote-videos/projects"
                            requireVoiceover={false}
                            quoteText={quoteText.trim() || undefined}
                            grainOverlayUrl={
                              grainOverlayUrl.trim() || undefined
                            }
                            grainOpacity={grainOpacity}
                            initialTimelineSettings={timelineSettings}
                            onTimelineSettingsSaved={onTimelineSettingsSaved}
                            videos={editorVideos}
                            voiceoverUrl={null}
                            backgroundMusicUrl={musicUrl || null}
                            voiceoverDuration={null}
                            sceneDurations={editorSceneDurations}
                            getSceneDurationSeconds={
                              getSceneDurationSecondsForEditor
                            }
                            scriptData={{ scenes: editorScenes }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full min-h-[320px] text-gray-500 dark:text-gray-400 text-sm p-6 text-center">
                            Complete Step 3 (Generate video) to use the timeline
                            editor.
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {finalVideoUrl && (
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-900/50">
                      <div className="px-3 py-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Rendered Video
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setShowRenderPayloadModal(true)}
                            className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 transition"
                            title="Show render payload JSON"
                            aria-label="Show render payload"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await fetch(
                                  `/api/quote-videos/render-status?project_id=${encodeURIComponent(currentProjectId || "")}`,
                                  { method: "DELETE" },
                                );
                                const data = await res.json();
                                if (data.success) {
                                  setFinalVideoUrl(null);
                                  setLastRenderPayload(null);
                                  loadProject(currentProjectId);
                                } else {
                                  await alert(
                                    data.error ||
                                      "Failed to delete rendered video",
                                    "error",
                                  );
                                }
                              } catch (e) {
                                await alert(
                                  "Failed to delete rendered video",
                                  "error",
                                );
                              }
                            }}
                            className="p-1.5 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:bg-red-900/30 transition"
                            title="Delete rendered video"
                            aria-label="Delete rendered video"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-center p-4">
                        <div className="w-full max-w-[320px] aspect-[9/16] bg-black rounded overflow-hidden">
                          <video
                            src={finalVideoUrl}
                            controls
                            className="w-full h-full object-contain"
                            playsInline
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-gray-200 dark:border-gray-700 pt-4 mt-auto">
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {finalVideoUrl ? (
                        <span className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium">
                          ✓ Video Complete
                        </span>
                      ) : (
                        <span className="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium">
                          Assemble and render via ShotStack
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleAssemble}
                        disabled={
                          assembling ||
                          !quoteText.trim() ||
                          ((Array.isArray(project?.scenes)
                            ? project.scenes
                            : []
                          ).filter((s) => (s.selected_video_url || "").trim())
                            .length === 0 &&
                            !animationVideoUrl.trim())
                        }
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                        title="Render via ShotStack"
                      >
                        {assembling
                          ? "Starting render…"
                          : finalVideoUrl
                            ? "Render Again"
                            : "Render Final Video"}
                      </button>
                      <button
                        type="button"
                        onClick={() => goToStep(4)}
                        className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 whitespace-nowrap"
                      >
                        ← Back
                      </button>
                      {finalVideoUrl && (
                        <button
                          type="button"
                          onClick={() => goToStep(6)}
                          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 whitespace-nowrap"
                        >
                          Continue to Post →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 p-6 sm:p-8 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">
                    Step 6: Post
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Download your video or post to social media.
                  </p>
                </div>

                {finalVideoUrl && (
                  <>
                    <div className="mb-8 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-900/50">
                      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-100/80 dark:bg-gray-800/80">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Final video
                        </span>
                      </div>
                      <div className="aspect-[9/16] max-w-[320px] mx-auto bg-black">
                        <video
                          src={finalVideoUrl}
                          controls
                          className="w-full h-full object-contain"
                          playsInline
                        />
                      </div>
                    </div>

                    <div className="mb-8">
                      <a
                        href={finalVideoUrl}
                        download
                        className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
                      >
                        <span>📥</span>
                        Download Video
                      </a>
                    </div>

                    <div className="mb-8">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                        Post to Social Media
                      </h3>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Quote text
                        </label>
                        <div className="px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-gray-300 text-sm max-h-32 overflow-y-auto">
                          {quoteText || "—"}
                        </div>
                      </div>

                      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                        <div className="flex border-b border-gray-200 dark:border-gray-700">
                          {["instagram", "youtube", "tiktok"].map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setSocialTab(p)}
                              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition ${
                                socialTab === p
                                  ? p === "instagram"
                                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                    : p === "youtube"
                                      ? "bg-red-600 text-white"
                                      : "bg-black text-white"
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                              }`}
                            >
                              {p === "instagram" && (
                                <SiInstagram className="w-5 h-5" />
                              )}
                              {p === "youtube" && (
                                <SiYoutube className="w-5 h-5" />
                              )}
                              {p === "tiktok" && (
                                <SiTiktok className="w-5 h-5" />
                              )}
                              {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                          ))}
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-950">
                          {socialTab === "instagram" && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Caption
                                </label>
                                <div className="flex gap-2 mb-1">
                                  <textarea
                                    value={instagramCaption}
                                    onChange={(e) =>
                                      setInstagramCaption(e.target.value)
                                    }
                                    placeholder="Enter caption for Instagram"
                                    className="flex-1 min-h-[100px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-y"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleGenerateCaption("instagram")
                                    }
                                    disabled={
                                      !!generatingCaptionFor ||
                                      !quoteText?.trim()
                                    }
                                    className="self-start px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                  >
                                    {generatingCaptionFor === "instagram"
                                      ? "Generating…"
                                      : "Generate"}
                                  </button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {instagramCaption.length} / 2200
                                </p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Reel cover image
                                </label>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setInstagramCoverUrl(null)}
                                    className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center text-xs font-medium transition ${
                                      !instagramCoverUrl
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                                    }`}
                                  >
                                    Default
                                  </button>
                                  {postStepImageUrls.map((url, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setInstagramCoverUrl(url)}
                                      className={`w-16 h-16 rounded-lg border-2 overflow-hidden shrink-0 transition ${instagramCoverUrl === url ? "border-blue-500 ring-2 ring-blue-500/50" : "border-gray-300 dark:border-gray-600 hover:border-gray-400"}`}
                                    >
                                      <img
                                        src={url}
                                        alt={`Image ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </button>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Optional. Recommended: 420×654px.
                                </p>
                              </div>
                              {instagramOAuthError && (
                                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 flex items-start justify-between gap-3">
                                  <div className="text-sm text-amber-800 dark:text-amber-200">
                                    <p className="font-medium">
                                      Instagram connection failed (
                                      {instagramOAuthError})
                                    </p>
                                    <p className="mt-1 text-amber-700 dark:text-amber-300">
                                      {instagramOAuthError ===
                                      "redirect_uri_mismatch"
                                        ? "The redirect URI in your Meta app must match exactly. In Meta: Instagram → API setup → Valid OAuth Redirect URIs, add: your-site.com/api/auth/instagram/callback (same protocol and domain as this page)."
                                        : "Try again or check your Meta app credentials. If it keeps failing, ensure Valid OAuth Redirect URIs in Meta matches your callback URL exactly."}
                                    </p>
                                    <a
                                      href={
                                        "/api/auth/instagram?return_to=" +
                                        encodeURIComponent(returnToForOAuth)
                                      }
                                      className="inline-flex items-center gap-2 mt-2 font-medium text-amber-800 dark:text-amber-200 underline hover:no-underline"
                                    >
                                      <SiInstagram className="w-4 h-4" /> Try
                                      again
                                    </a>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setInstagramOAuthError(null)}
                                    className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 shrink-0"
                                    aria-label="Dismiss"
                                  >
                                    ×
                                  </button>
                                </div>
                              )}
                              <div className="pt-2">
                                {instagramStatusLoading ? (
                                  <div className="flex items-center justify-center gap-3 bg-gray-200 dark:bg-gray-700 text-gray-500 py-4 rounded-lg">
                                    <SiInstagram className="w-7 h-7" />{" "}
                                    Checking…
                                  </div>
                                ) : instagramConnected ? (
                                  <div className="flex flex-col gap-2">
                                    <button
                                      onClick={() =>
                                        handlePostToSocial("instagram")
                                      }
                                      disabled={posting}
                                      className="flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
                                    >
                                      <SiInstagram className="w-7 h-7" /> Post
                                      to Instagram
                                    </button>
                                    <div className="flex items-center gap-3 flex-wrap">
                                      <button
                                        type="button"
                                        onClick={handleSwitchInstagramAccount}
                                        disabled={instagramSwitchLoading}
                                        className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
                                      >
                                        {instagramSwitchLoading
                                          ? "Switching…"
                                          : "Switch account"}
                                      </button>
                                      <span className="text-gray-300 dark:text-gray-600">
                                        |
                                      </span>
                                      <button
                                        type="button"
                                        onClick={handleDisconnectInstagram}
                                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 underline"
                                      >
                                        Disconnect Instagram
                                      </button>
                                    </div>
                                    {instagramTokenDebug && (
                                      <div className="mt-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-left text-xs font-mono break-all">
                                        <div className="font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                          Token (debug)
                                        </div>
                                        <div>
                                          Preview:{" "}
                                          {instagramTokenDebug.access_token_preview ??
                                            "—"}
                                        </div>
                                        {instagramTokenDebug.access_token !=
                                          null && (
                                          <div className="mt-1">
                                            Token:{" "}
                                            {instagramTokenDebug.access_token}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <a
                                    href={
                                      "/api/auth/instagram?return_to=" +
                                      encodeURIComponent(returnToForOAuth)
                                    }
                                    className="flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-lg font-medium hover:opacity-90 no-underline"
                                  >
                                    <SiInstagram className="w-7 h-7" /> Connect
                                    Instagram
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                          {socialTab === "youtube" && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Caption (title + description)
                                </label>
                                <div className="flex gap-2 mb-1">
                                  <textarea
                                    value={youtubeCaption}
                                    onChange={(e) =>
                                      setYoutubeCaption(e.target.value)
                                    }
                                    placeholder="Enter caption for YouTube"
                                    className="flex-1 min-h-[100px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-y"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleGenerateCaption("youtube")
                                    }
                                    disabled={
                                      !!generatingCaptionFor ||
                                      !quoteText?.trim()
                                    }
                                    className="self-start px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                  >
                                    {generatingCaptionFor === "youtube"
                                      ? "Generating…"
                                      : "Generate"}
                                  </button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {youtubeCaption.length} / 5000
                                </p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Thumbnail image
                                </label>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setYoutubeThumbnailUrl(null)}
                                    className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center text-xs font-medium transition ${
                                      !youtubeThumbnailUrl
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                                    }`}
                                  >
                                    Default
                                  </button>
                                  {postStepImageUrls.map((url, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() =>
                                        setYoutubeThumbnailUrl(url)
                                      }
                                      className={`w-16 h-16 rounded-lg border-2 overflow-hidden shrink-0 transition ${youtubeThumbnailUrl === url ? "border-blue-500 ring-2 ring-blue-500/50" : "border-gray-300 dark:border-gray-600 hover:border-gray-400"}`}
                                    >
                                      <img
                                        src={url}
                                        alt={`Image ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </button>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Optional. Recommended: 1280×720px (16:9). Max
                                  2MB. JPEG or PNG.
                                </p>
                              </div>
                              <div className="pt-2">
                                {youtubeStatusLoading ? (
                                  <div className="flex items-center justify-center gap-2 py-4 text-gray-500 dark:text-gray-400">
                                    Checking YouTube connection…
                                  </div>
                                ) : youtubeConnected ? (
                                  <div className="flex flex-col gap-2">
                                    <button
                                      onClick={() =>
                                        handlePostToSocial("youtube")
                                      }
                                      disabled={posting}
                                      className="flex items-center justify-center gap-3 bg-red-600 text-white py-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                                    >
                                      <SiYoutube className="w-7 h-7" /> Post to
                                      YouTube
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleDisconnectYouTube}
                                      className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 underline"
                                    >
                                      Disconnect YouTube
                                    </button>
                                    {youtubeTokenDebug && (
                                      <div className="mt-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-left text-xs font-mono break-all">
                                        <div className="font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                          Token (debug)
                                        </div>
                                        <div>
                                          Preview:{" "}
                                          {youtubeTokenDebug.access_token_preview ??
                                            "—"}
                                        </div>
                                        {youtubeTokenDebug.access_token !=
                                          null && (
                                          <div className="mt-1">
                                            Token:{" "}
                                            {youtubeTokenDebug.access_token}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <a
                                    href={
                                      "/api/auth/youtube?return_to=" +
                                      encodeURIComponent(returnToForOAuth)
                                    }
                                    className="flex items-center justify-center gap-3 bg-red-600 text-white py-4 rounded-lg font-medium hover:bg-red-700 no-underline"
                                  >
                                    <SiYoutube className="w-7 h-7" /> Connect
                                    YouTube
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                          {socialTab === "tiktok" && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Caption
                                </label>
                                <div className="flex gap-2 mb-1">
                                  <textarea
                                    value={tiktokCaption}
                                    onChange={(e) =>
                                      setTiktokCaption(e.target.value)
                                    }
                                    placeholder="Enter caption for TikTok"
                                    className="flex-1 min-h-[100px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-y"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleGenerateCaption("tiktok")
                                    }
                                    disabled={
                                      !!generatingCaptionFor ||
                                      !quoteText?.trim()
                                    }
                                    className="self-start px-4 py-2 rounded-lg bg-black text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                  >
                                    {generatingCaptionFor === "tiktok"
                                      ? "Generating…"
                                      : "Generate"}
                                  </button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {tiktokCaption.length} chars
                                </p>
                              </div>
                              <div className="pt-2">
                                <button
                                  onClick={() => handlePostToSocial("tiktok")}
                                  disabled={posting}
                                  className="w-full flex items-center justify-center gap-3 bg-black text-white py-4 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
                                >
                                  <SiTiktok className="w-7 h-7" /> Post to
                                  TikTok
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-4 mt-8">
                  <button
                    type="button"
                    onClick={() => goToStep(5)}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    ← Back to Render
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {postProgress && (
          <div
            className="fixed inset-0 z-[95] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-busy="true"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Posting to {postProgress.platform}…
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {postProgress.status} This may take 1–2 minutes.
              </p>
            </div>
          </div>
        )}

        {(expandedImageUrl || expandedVideoUrl) && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setExpandedImageUrl(null);
              setExpandedVideoUrl(null);
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Expanded preview"
          >
            <div
              className="relative max-h-[90vh] max-w-[90vw] w-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {expandedVideoUrl ? (
                <video
                  src={expandedVideoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[90vh] max-w-full w-auto object-contain rounded-lg shadow-2xl"
                />
              ) : (
                <img
                  src={expandedImageUrl}
                  alt="Preview"
                  className="max-h-[90vh] max-w-full w-auto object-contain rounded-lg shadow-2xl"
                />
              )}
              <button
                type="button"
                onClick={() => {
                  setExpandedImageUrl(null);
                  setExpandedVideoUrl(null);
                }}
                className="absolute -top-2 -right-2 p-2 rounded-full bg-gray-900/90 hover:bg-gray-800 text-white shadow-lg"
                aria-label="Close preview"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {sceneVideoInfo && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60"
            onClick={() => setSceneVideoInfo(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-info-title"
          >
            <div
              className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2
                  id="video-info-title"
                  className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                >
                  Video info — {sceneVideoInfo.label}
                </h2>
                <button
                  type="button"
                  onClick={() => setSceneVideoInfo(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                  aria-label="Close"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1 text-sm text-gray-700 dark:text-gray-300 space-y-3">
                {sceneVideoInfo.metadata ? (
                  <>
                    {sceneVideoInfo.metadata.timestamp && (
                      <p>
                        <span className="font-medium text-gray-500 dark:text-gray-400">
                          Generated:
                        </span>{" "}
                        {new Date(
                          sceneVideoInfo.metadata.timestamp,
                        ).toLocaleString()}
                      </p>
                    )}
                    {sceneVideoInfo.metadata.model_endpoint && (
                      <p>
                        <span className="font-medium text-gray-500 dark:text-gray-400">
                          Model:
                        </span>{" "}
                        {sceneVideoInfo.metadata.model_endpoint}
                      </p>
                    )}
                    {sceneVideoInfo.metadata.prompt_used != null && (
                      <div>
                        <p className="font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Prompt used
                        </p>
                        <p className="whitespace-pre-wrap rounded bg-gray-50 dark:bg-gray-800 p-2 text-xs">
                          {sceneVideoInfo.metadata.prompt_used}
                        </p>
                      </div>
                    )}
                    {sceneVideoInfo.metadata.negative_prompt_used != null &&
                      sceneVideoInfo.metadata.negative_prompt_used !== "" && (
                        <div>
                          <p className="font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Avoid
                          </p>
                          <p className="whitespace-pre-wrap rounded bg-gray-50 dark:bg-gray-800 p-2 text-xs">
                            {sceneVideoInfo.metadata.negative_prompt_used}
                          </p>
                        </div>
                      )}
                    {sceneVideoInfo.metadata.storage?.path && (
                      <p
                        className="text-xs text-gray-500 dark:text-gray-400 truncate"
                        title={sceneVideoInfo.metadata.storage.path}
                      >
                        Path: {sceneVideoInfo.metadata.storage.path}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    No generation metadata for this video.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <ReferenceGalleryModal
          open={showReferenceGalleryModal}
          onClose={() => setShowReferenceGalleryModal(false)}
          history={project?.reference_image_history}
          currentReferenceUrl={
            referenceImageUrl || project?.reference_image_url
          }
          onSelect={(url) => setReferenceImageUrl(url)}
          projectId={project?.id}
          onDeleted={() => project?.id && loadProject(project.id)}
        />

        {videoPromptReview && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-prompt-review-title"
          >
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h2
                  id="video-prompt-review-title"
                  className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                >
                  Review video prompt
                </h2>
                {videoPromptReview.cost > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Cost: ${videoPromptReview.cost.toFixed(4)}
                  </p>
                )}
              </div>
              <div className="p-4 flex-1 overflow-hidden flex flex-col min-h-0">
                <textarea
                  value={videoPromptReviewDraft}
                  onChange={(e) => setVideoPromptReviewDraft(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 resize-y"
                  placeholder="Motion prompt..."
                />
              </div>
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setVideoPromptReview(null);
                    setVideoPromptReviewDraft("");
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveVideoPromptReview}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        <SceneImageGalleryModal
          open={showSceneImageGalleryModal}
          onClose={() => setShowSceneImageGalleryModal(false)}
          images={galleryImagesLoading ? [] : galleryImages}
          currentSelectedUrl={(() => {
            const scenes = Array.isArray(project?.scenes) ? project.scenes : [];
            const useScenes = scenes.length > 0;
            const safeIdx = useScenes
              ? Math.min(currentSceneIndex, Math.max(0, scenes.length - 1))
              : 0;
            const scene = useScenes ? scenes[safeIdx] : null;
            if (!scene) return backgroundImageUrl || "";
            const urls = Array.isArray(scene.image_urls)
              ? scene.image_urls
              : [];
            const idx =
              typeof scene.selected_image_index === "number"
                ? scene.selected_image_index
                : 0;
            return (urls[idx] || "").trim();
          })()}
          onSelect={handleSelectFromGallery}
          onDeleted={() => {
            if (currentProjectId) {
              loadProject(currentProjectId);
              fetch(
                `/api/quote-videos/projects/${currentProjectId}/generated-images`,
              )
                .then((r) => r.json())
                .then((data) => {
                  if (data.success && Array.isArray(data.images))
                    setGalleryImages(data.images);
                });
            }
          }}
          projectId={currentProjectId}
          title="Select scene image from gallery"
        />

        {showVideoHistoryModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-history-modal-title"
            onClick={() => {
              setShowVideoHistoryModal(false);
              setVideoHistoryTargetSceneId(null);
            }}
          >
            <div
              className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <h2
                  id="video-history-modal-title"
                  className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                >
                  Select from history
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowVideoHistoryModal(false);
                    setVideoHistoryTargetSceneId(null);
                  }}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
                  aria-label="Close"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {videoHistoryTargetSceneId
                    ? "Choose a previously generated video (from any project or scene) to use for this scene."
                    : "Choose a previously generated video (from any project or scene) to use as the current background clip."}
                </p>
                {globalVideoHistoryLoading ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Loading history…
                  </p>
                ) : globalVideoHistoryEntries.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No video history yet. Generate a video to add entries here.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-4">
                    {(() => {
                      const currentUrl = videoHistoryTargetSceneId
                        ? (
                            project?.scenes?.find(
                              (s) => s.id === videoHistoryTargetSceneId,
                            )?.selected_video_url || ""
                          ).trim()
                        : (animationVideoUrl || "").trim();
                      const selected = globalVideoHistoryEntries.find(
                        (e) => (e.url || "").trim() === currentUrl,
                      );
                      const rest = globalVideoHistoryEntries.filter(
                        (e) => (e.url || "").trim() !== currentUrl,
                      );
                      const orderedEntries = selected
                        ? [selected, ...rest]
                        : globalVideoHistoryEntries;
                      return orderedEntries.map((entry, i) => {
                        const isCurrent =
                          (entry.url || "").trim() === currentUrl;
                        const subtitle =
                          [entry.project_name, entry.scene_label]
                            .filter(Boolean)
                            .join(" · ") || null;
                        return (
                          <div
                            key={
                              entry.id ||
                              (entry.url || "") + (entry.created_at || i)
                            }
                            className={`flex flex-col rounded-lg border overflow-hidden ${isCurrent ? "border-blue-500 ring-2 ring-blue-500/30" : "border-gray-200 dark:border-gray-600"}`}
                          >
                            <video
                              src={entry.url}
                              className="w-40 aspect-video object-cover bg-black"
                              muted
                              preload="metadata"
                              playsInline
                            />
                            <div className="p-3 bg-white dark:bg-gray-800">
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {entry.duration_seconds ?? 8}s
                                {subtitle && (
                                  <span
                                    className="block text-[10px] opacity-80 mt-0.5 truncate"
                                    title={subtitle}
                                  >
                                    {subtitle}
                                  </span>
                                )}
                                {entry.created_at && (
                                  <span className="block text-[10px] opacity-80 mt-0.5">
                                    {new Date(entry.created_at).toLocaleString(
                                      undefined,
                                      {
                                        dateStyle: "short",
                                        timeStyle: "short",
                                      },
                                    )}
                                  </span>
                                )}
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  if (videoHistoryTargetSceneId) {
                                    handleSelectVideoFromHistoryForScene(
                                      entry,
                                      videoHistoryTargetSceneId,
                                    );
                                  } else {
                                    handleSelectVideoFromHistory(entry);
                                  }
                                  setShowVideoHistoryModal(false);
                                  setVideoHistoryTargetSceneId(null);
                                }}
                                disabled={isCurrent}
                                className="mt-2 w-full text-sm py-2 rounded bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                              >
                                {isCurrent ? "Current" : "Use this"}
                              </button>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showMusicCollectionPicker && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="music-collection-picker-title"
            onClick={() => setShowMusicCollectionPicker(false)}
          >
            <div
              className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <h2
                  id="music-collection-picker-title"
                  className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                >
                  Select music from collection
                </h2>
                <button
                  type="button"
                  onClick={() => setShowMusicCollectionPicker(false)}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                {loadingMusicCollection ? (
                  <div className="flex items-center gap-2 py-8 text-gray-500 dark:text-gray-400">
                    <div className="animate-spin h-5 w-5 border-2 border-violet-600 border-t-transparent rounded-full" />
                    Loading…
                  </div>
                ) : availableMusicFromCollection.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-8">
                    No music in collection for this project. Generate music in
                    this step first.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {availableMusicFromCollection.map((m) => {
                      const isSelected = musicUrl === m.music_url;
                      const durationStr = m.duration_ms
                        ? `${Math.floor(m.duration_ms / 60000)}m ${Math.round((m.duration_ms % 60000) / 1000)}s`
                        : null;
                      const promptPreview = (
                        m.prompt ||
                        m.background_music_prompt ||
                        ""
                      ).slice(0, 80);
                      return (
                        <li
                          key={m.id}
                          className={
                            "rounded-lg border p-3 flex flex-col sm:flex-row sm:items-center gap-3 " +
                            (isSelected
                              ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-600"
                              : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50")
                          }
                        >
                          <div className="flex-1 min-w-0">
                            {durationStr && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                                {durationStr}
                              </span>
                            )}
                            <p
                              className="text-sm text-gray-700 dark:text-gray-300 truncate"
                              title={m.prompt || m.background_music_prompt}
                            >
                              {promptPreview || "—"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {m.music_url && (
                              <audio
                                src={m.music_url}
                                controls
                                className="h-9 max-w-[200px]"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => setMusicDetailsModal(m)}
                              className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-400"
                              title="Track details"
                              aria-label="Track details"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const res = await fetch(
                                    "/api/quote-videos/select-music",
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        project_id: currentProjectId,
                                        music_id: m.id,
                                      }),
                                    },
                                  );
                                  const result = await res.json();
                                  if (result.success && result.music_url) {
                                    setMusicUrl(result.music_url);
                                    loadProject();
                                    setShowMusicCollectionPicker(false);
                                  } else {
                                    await alert(
                                      result.error || "Failed to select music",
                                      "error",
                                    );
                                  }
                                } catch (err) {
                                  await alert("Error: " + err.message, "error");
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
                            >
                              {isSelected ? "Selected" : "Use this"}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {musicDetailsModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="music-details-title"
            onClick={() => setMusicDetailsModal(null)}
          >
            <div
              className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <h2
                  id="music-details-title"
                  className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                >
                  Music details
                </h2>
                <button
                  type="button"
                  onClick={() => setMusicDetailsModal(null)}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="p-4 overflow-y-auto space-y-4">
                {musicDetailsModal.duration_ms != null && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                      Duration
                    </p>
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      {Math.floor(musicDetailsModal.duration_ms / 60000)}m{" "}
                      {Math.round(
                        (musicDetailsModal.duration_ms % 60000) / 1000,
                      )}
                      s
                    </p>
                  </div>
                )}
                {musicDetailsModal.cost != null && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                      Cost
                    </p>
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      ${Number(musicDetailsModal.cost).toFixed(4)}
                    </p>
                  </div>
                )}
                {musicDetailsModal.model_endpoint && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                      Model
                    </p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 break-all">
                      {musicDetailsModal.model_endpoint}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                    Prompt
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {musicDetailsModal.prompt ||
                      musicDetailsModal.background_music_prompt ||
                      "—"}
                  </p>
                </div>
                {musicDetailsModal.negative_prompt && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                      Negative prompt
                    </p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {musicDetailsModal.negative_prompt}
                    </p>
                  </div>
                )}
                {musicDetailsModal.music_url && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Preview
                    </p>
                    <audio
                      src={musicDetailsModal.music_url}
                      controls
                      className="w-full h-9"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showRenderPayloadModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="render-payload-modal-title"
            onClick={() => setShowRenderPayloadModal(false)}
          >
            <div
              className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <h2
                  id="render-payload-modal-title"
                  className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                >
                  Rendered Video Payload (JSON)
                </h2>
                <button
                  type="button"
                  onClick={() => setShowRenderPayloadModal(false)}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="p-4 overflow-auto flex-1">
                {lastRenderPayload ? (
                  <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 whitespace-pre-wrap break-words">
                    {JSON.stringify(lastRenderPayload, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No payload available. Render a video to see the payload.
                  </p>
                )}
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
                {lastRenderPayload && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        JSON.stringify(lastRenderPayload, null, 2),
                      );
                      setShowRenderPayloadModal(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 text-sm font-medium"
                  >
                    Copy JSON
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowRenderPayloadModal(false)}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuoteVideosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[40vh]">
          <p className="text-gray-500 dark:text-gray-400">Loading…</p>
        </div>
      }
    >
      <QuoteVideosContent />
    </Suspense>
  );
}
