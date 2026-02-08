"use client";

import { useEffect, useState, useRef, Fragment } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toast";
import { Trash2, Info } from "lucide-react";
import { MUSIC_MODELS, getMusicModelById } from "@/data/music-models";
import TimelineEditor from "@/components/admin/TimelineEditor";

export default function VideoGeneratorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { alert, confirm } = useToast();

  const DEFAULT_VIDEO_NEGATIVE_PROMPT =
    "lip-sync/speaking, breathing/chest rise-fall, background music/soundtrack/singing, text overlays, logos/watermarks, flicker/jitter, warping/morphing, camera shake";

  const DEFAULT_MUSIC_NEGATIVE_PROMPT =
    "meditation, spa, relaxation, calming, soothing, therapeutic, ambient chill, lo-fi, wellness, sound healing, binaural, nature sounds, yoga, mindfulness, zen, peaceful, serene, tranquil, massage, healing music, spa music, new age, chillout, ASMR";

  // Initialize step from URL if available to prevent flash on refresh
  const initialStep = (() => {
    const urlStep = searchParams.get("step");
    const urlProjectId = searchParams.get("project_id");
    // If we have a project_id in URL, start at that step (or 1 if no step specified)
    if (urlProjectId) {
      return urlStep ? parseInt(urlStep) : 1;
    }
    return 0; // Otherwise start at project selection
  })();

  const [step, setStep] = useState(initialStep);
  const [maxStepReached, setMaxStepReached] = useState(0);
  const [loading, setLoading] = useState(false);
  const [continuingToVideos, setContinuingToVideos] = useState(false);

  // Step 1: Topic & Character Selection
  const [topic, setTopic] = useState("");
  const [topicCategories, setTopicCategories] = useState([]);
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryInputFocused, setCategoryInputFocused] = useState(false);
  const [topics, setTopics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [generatingTopics, setGeneratingTopics] = useState(false);
  const [topicMode, setTopicMode] = useState("manual"); // manual, generate, select
  const [showTopicLibrary, setShowTopicLibrary] = useState(false);
  const [topicInputFocused, setTopicInputFocused] = useState(false);
  const [modalFilterCategory, setModalFilterCategory] = useState("all");
  const [modalFilterStatus, setModalFilterStatus] = useState("all");
  const [modalSortOrder, setModalSortOrder] = useState("newest");
  const [aiGenerateCategories, setAiGenerateCategories] = useState([]);
  const [aiGenerateCount, setAiGenerateCount] = useState(10);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [generatedTopics, setGeneratedTopics] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState(null);
  const [loadingProject, setLoadingProject] = useState(false);
  const [firebaseEnv, setFirebaseEnv] = useState(null);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [currentProjectName, setCurrentProjectName] = useState("");
  const [editingProjectName, setEditingProjectName] = useState(false);
  const [openProjectMenuId, setOpenProjectMenuId] = useState(null);
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [deletingVideoVersionKey, setDeletingVideoVersionKey] = useState(null);
  const projectMenuRef = useRef(null);
  const [sceneCount, setSceneCount] = useState(4); // Default 4 scenes
  const [locationCount, setLocationCount] = useState(null); // null = all different, number = that many locations
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectingLocations, setSelectingLocations] = useState(false);
  const [locationMapping, setLocationMapping] = useState({}); // { scene_id: location_id }
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationPickerSceneId, setLocationPickerSceneId] = useState(null);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [showLocationTypeModal, setShowLocationTypeModal] = useState(false);
  const [locationTypeSceneId, setLocationTypeSceneId] = useState(null);
  const [locationGenerationKeywords, setLocationGenerationKeywords] =
    useState("");
  const [showActionGenerateModal, setShowActionGenerateModal] = useState(false);
  const [actionGenerateSceneId, setActionGenerateSceneId] = useState(null);
  const [actionGenerationKeywords, setActionGenerationKeywords] = useState("");
  const [showCameraMovementGenerateModal, setShowCameraMovementGenerateModal] =
    useState(false);
  const [cameraMovementGenerateSceneId, setCameraMovementGenerateSceneId] =
    useState(null);
  const [
    cameraMovementGenerationKeywords,
    setCameraMovementGenerationKeywords,
  ] = useState("");
  const [
    showCharacterMotionGenerateModal,
    setShowCharacterMotionGenerateModal,
  ] = useState(false);
  const [characterMotionGenerateSceneId, setCharacterMotionGenerateSceneId] =
    useState(null);
  const [
    characterMotionGenerationKeywords,
    setCharacterMotionGenerationKeywords,
  ] = useState("");
  const [locationFilters, setLocationFilters] = useState({
    category: null, // 'indoor' or 'outdoor' or null
    lighting: [],
    atmosphere: [],
    key_elements: [],
  });
  const [showFilterModal, setShowFilterModal] = useState(null); // 'lighting', 'atmosphere', 'key_elements', or null

  // Prompt generation review (Step 3 + Step 4)
  // We show a confirm dialog before calling AI, then a review modal after.
  const [promptReviewModal, setPromptReviewModal] = useState(null);
  const [promptReviewDraft, setPromptReviewDraft] = useState("");
  const [applyingPromptReview, setApplyingPromptReview] = useState(false);

  // Actions
  const [actionMapping, setActionMapping] = useState({}); // { scene_id: action_id }
  const [showActionPicker, setShowActionPicker] = useState(false);
  const [actionPickerSceneId, setActionPickerSceneId] = useState(null);
  const [availableActions, setAvailableActions] = useState([]);

  // Step 4 libraries
  const [cameraMovementMapping, setCameraMovementMapping] = useState({}); // { scene_id: movement_id }
  const [characterMotionMapping, setCharacterMotionMapping] = useState({}); // { scene_id: motion_id }
  const [availableCameraMovements, setAvailableCameraMovements] = useState([]);
  const [availableCharacterMotions, setAvailableCharacterMotions] = useState(
    [],
  );
  const [showCameraMovementPicker, setShowCameraMovementPicker] =
    useState(false);
  const [cameraMovementPickerSceneId, setCameraMovementPickerSceneId] =
    useState(null);
  const [showCharacterMotionPicker, setShowCharacterMotionPicker] =
    useState(false);
  const [characterMotionPickerSceneId, setCharacterMotionPickerSceneId] =
    useState(null);
  const [videoPromptTemperatureByScene, setVideoPromptTemperatureByScene] =
    useState({}); // { scene_id: 0.8 }

  // Step 2: Script Generation
  const [scriptData, setScriptData] = useState(null);
  const [generatingVoiceover, setGeneratingVoiceover] = useState(false);
  const [voiceoverDuration, setVoiceoverDuration] = useState(null);
  const [voiceSettings, setVoiceSettings] = useState({
    stability: 0.65,
    similarity_boost: 0.75,
    style: 0.1,
    use_speaker_boost: true,
  });
  const [scriptSaving, setScriptSaving] = useState(false);
  const [scriptSaved, setScriptSaved] = useState(false);
  const [elevenLabsInfo, setElevenLabsInfo] = useState(null);
  const [loadingElevenLabsInfo, setLoadingElevenLabsInfo] = useState(false);
  const [projectCosts, setProjectCosts] = useState(null);

  // Step 3: Image Generation
  const [generatingSceneId, setGeneratingSceneId] = useState(null);
  const [regeneratingPromptSceneId, setRegeneratingPromptSceneId] =
    useState(null);
  const [images, setImages] = useState([]); // [{ scene_id, image_url }]
  const [fluxProCost, setFluxProCost] = useState(null); // Dynamic cost from API (NO FALLBACK)
  const [fluxProEndpointId, setFluxProEndpointId] = useState(null);
  const [multipleAnglesUnitCost, setMultipleAnglesUnitCost] = useState(null);
  const [multipleAnglesEndpointId, setMultipleAnglesEndpointId] =
    useState(null);
  const [showFluxSettings, setShowFluxSettings] = useState(false);
  const [fluxSettings, setFluxSettings] = useState({
    output_format: "png",
    num_images: 1,
  });
  const imagePromptSaveTimers = useRef({});
  const motionPromptSaveTimers = useRef({});
  const videoNegativePromptSaveTimers = useRef({});
  const videoDurationSaveTimers = useRef({});
  const [selectedReferenceImages, setSelectedReferenceImages] = useState({}); // Track selected reference per scene: { sceneId: imageUrl }
  const [selectedSceneImages, setSelectedSceneImages] = useState({}); // Track selected generated image index per scene: { sceneId: imageIndex }
  const [expandedImage, setExpandedImage] = useState(null); // Track expanded full-size image { sceneId, imageIndex, url }
  const [angleEditModal, setAngleEditModal] = useState(null); // { sceneId, imageIndex, url }
  const [angleEditSettings, setAngleEditSettings] = useState({
    horizontal_angle: 0,
    vertical_angle: 0,
    zoom: 5,
    num_images: 1,
  });
  const [editingImageAngleKey, setEditingImageAngleKey] = useState(null);
  const [imageDetailsModal, setImageDetailsModal] = useState(null);
  const [loadingImageDetails, setLoadingImageDetails] = useState(false);
  const [imageDetailsError, setImageDetailsError] = useState(null);
  const [showCharacterReferenceModal, setShowCharacterReferenceModal] =
    useState(false);
  const [characterReferenceModalSceneId, setCharacterReferenceModalSceneId] =
    useState(null);
  const [allCharacterReferences, setAllCharacterReferences] = useState([]);
  const [loadingCharacterReferences, setLoadingCharacterReferences] =
    useState(false);

  // Step 4: Video Generation
  const [videos, setVideos] = useState([]);
  const [generatingVideoSceneId, setGeneratingVideoSceneId] = useState(null);
  const [generatingVideoPromptSceneId, setGeneratingVideoPromptSceneId] =
    useState(null);
  const [videoDetailsModal, setVideoDetailsModal] = useState(null);
  const [loadingVideoDetails, setLoadingVideoDetails] = useState(false);
  const [videoDetailsError, setVideoDetailsError] = useState(null);
  const [musicDetailsModal, setMusicDetailsModal] = useState(null); // music object for details modal
  const [voiceoverUrl, setVoiceoverUrl] = useState(null);
  const [falVideoUnitCost, setFalVideoUnitCost] = useState(null);
  const [falVideoPricingUnit, setFalVideoPricingUnit] = useState(null);
  const [loadingFalVideoPricing, setLoadingFalVideoPricing] = useState(false);

  // Fill missing per-scene negative prompts with a sensible default (do not overwrite explicit empty strings)
  useEffect(() => {
    if (step !== 4) return;
    if (!currentProjectId) return;
    if (!scriptData?.scenes?.length) return;

    const scenesNeedingDefault = scriptData.scenes.filter(
      (s) =>
        s &&
        (s.video_negative_prompt === undefined ||
          s.video_negative_prompt === null),
    );
    if (scenesNeedingDefault.length === 0) return;

    const nextScenes = scriptData.scenes.map((s) => {
      if (!s) return s;
      if (
        s.video_negative_prompt === undefined ||
        s.video_negative_prompt === null
      ) {
        return { ...s, video_negative_prompt: DEFAULT_VIDEO_NEGATIVE_PROMPT };
      }
      return s;
    });
    setScriptData({ ...scriptData, scenes: nextScenes });

    // Best-effort persist (non-blocking)
    try {
      const persistPromises = scenesNeedingDefault
        .filter((s) => s?.id)
        .map((s) =>
          fetch(`/api/projects/${currentProjectId}/scenes/${s.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              video_negative_prompt: DEFAULT_VIDEO_NEGATIVE_PROMPT,
            }),
          }),
        );
      Promise.allSettled(persistPromises).catch(() => {});
    } catch {}
  }, [step, currentProjectId, scriptData?.scenes?.length]);

  const clampDurationSeconds = (value, fallback = 8) => {
    const n = Number(value);
    const numeric = Number.isFinite(n) ? n : fallback;
    return Math.max(1, Math.min(15, Math.round(numeric)));
  };

  const isPerSecondUnit = (unit) => {
    if (!unit) return false;
    const normalized = String(unit).toLowerCase();
    return (
      normalized === "s" ||
      normalized === "sec" ||
      normalized === "second" ||
      normalized === "seconds" ||
      normalized.includes("second")
    );
  };

  const getEstimatedI2VCostForScene = (durationSeconds) => {
    if (falVideoUnitCost == null) return null;
    const multiplier = isPerSecondUnit(falVideoPricingUnit)
      ? clampDurationSeconds(durationSeconds, 8)
      : 1;
    return falVideoUnitCost * multiplier;
  };

  const getSceneDurationSeconds = (scene) => {
    return clampDurationSeconds(scene?.duration, 8);
  };

  const uniqueStringsPreserveOrder = (values) => {
    const out = [];
    const seen = new Set();
    for (const v of values || []) {
      if (!v || typeof v !== "string") continue;
      if (seen.has(v)) continue;
      seen.add(v);
      out.push(v);
    }
    return out;
  };

  const toSceneKey = (id) => {
    if (id === null || id === undefined) return null;
    return String(id);
  };

  const getAllVideoUrlsForScene = (scene, fallbackSelectedVideoUrl) => {
    const urls = Array.isArray(scene?.video_urls) ? scene.video_urls : [];
    return uniqueStringsPreserveOrder([
      ...(urls || []),
      scene?.selected_video_url,
      fallbackSelectedVideoUrl,
    ]);
  };

  const getSelectedVideoUrlForScene = (scene) => {
    const sceneId = toSceneKey(scene?.id);
    if (!sceneId) return null;
    const fromVideosState = videos.find(
      (v) => toSceneKey(v?.scene_id) === sceneId,
    )?.video_url;

    const allUrls = getAllVideoUrlsForScene(scene, fromVideosState);

    if (
      scene?.selected_video_url &&
      allUrls.includes(scene.selected_video_url)
    ) {
      return scene.selected_video_url;
    }

    if (fromVideosState && allUrls.includes(fromVideosState)) {
      return fromVideosState;
    }

    return allUrls.length > 0 ? allUrls[allUrls.length - 1] : null;
  };

  const deriveSelectedVideosFromScenes = (scenes) => {
    const out = [];
    for (const scene of scenes || []) {
      const url =
        scene?.selected_video_url ||
        (Array.isArray(scene?.video_urls) && scene.video_urls.length > 0
          ? scene.video_urls[scene.video_urls.length - 1]
          : null);
      const sid = toSceneKey(scene?.id);
      if (sid && url) out.push({ scene_id: sid, video_url: url });
    }
    return out.sort((a, b) => Number(a.scene_id) - Number(b.scene_id));
  };

  const getLibraryItemNameById = (items, id) => {
    if (!id) return null;
    const normalized = String(id);
    const found = (items || []).find((it) => String(it?.id) === normalized);
    return found?.name || null;
  };

  const stringifyJson = (value) => {
    try {
      return JSON.stringify(value ?? null, null, 2);
    } catch {
      return String(value);
    }
  };

  const loadVideoDetailsForScene = async (sceneId, videoUrl) => {
    const sid = toSceneKey(sceneId);
    if (!sid || !videoUrl) return;
    if (!currentProjectId) {
      await alert("No active project selected", "error");
      return;
    }

    setVideoDetailsError(null);
    setLoadingVideoDetails(true);
    try {
      const response = await fetch(
        `/api/projects/${currentProjectId}/scenes/${sid}`,
        { cache: "no-store" },
      );
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to load scene metadata");
      }

      const scene = result.scene || null;
      const history = Array.isArray(scene?.video_generation_history)
        ? scene.video_generation_history
        : [];
      const matched = history.find((h) => h?.video_url === videoUrl) || null;
      const last = scene?.last_video_generation_metadata || null;
      const metadata =
        matched || (last?.video_url === videoUrl ? last : null) || null;

      setVideoDetailsModal((prev) => {
        if (!prev) return prev;
        if (prev.sceneId !== sid || prev.videoUrl !== videoUrl) return prev;
        return {
          sceneId: sid,
          videoUrl,
          scene,
          metadata,
        };
      });
    } catch (error) {
      console.error("Error loading video details:", error);
      setVideoDetailsError(error.message || "Failed to load video details");
    } finally {
      setLoadingVideoDetails(false);
    }
  };

  const handleOpenVideoDetailsModal = async (sceneId, videoUrl) => {
    const sid = toSceneKey(sceneId);
    if (!sid || !videoUrl) return;
    setVideoDetailsModal({
      sceneId: sid,
      videoUrl,
      scene: null,
      metadata: null,
    });
    await loadVideoDetailsForScene(sid, videoUrl);
  };

  const handleCloseVideoDetailsModal = () => {
    setVideoDetailsModal(null);
    setVideoDetailsError(null);
    setLoadingVideoDetails(false);
  };

  const loadImageDetailsForScene = async (
    sceneId,
    imageUrl,
    { imageIndex = null, localPrompt = null } = {},
  ) => {
    const sid = toSceneKey(sceneId);
    if (!sid || !imageUrl) return;
    if (!currentProjectId) {
      await alert("No active project selected", "error");
      return;
    }

    setImageDetailsError(null);
    setLoadingImageDetails(true);
    try {
      const response = await fetch(
        `/api/projects/${currentProjectId}/scenes/${sid}`,
        { cache: "no-store" },
      );
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to load scene metadata");
      }

      const scene = result.scene || null;
      const history = Array.isArray(scene?.generation_history)
        ? scene.generation_history
        : [];
      const matched = history.find((h) => h?.image_url === imageUrl) || null;
      const last = scene?.last_generation_metadata || null;
      const metadata =
        matched || (last?.image_url === imageUrl ? last : null) || null;

      setImageDetailsModal((prev) => {
        if (!prev) return prev;
        if (prev.sceneId !== sid || prev.imageUrl !== imageUrl) return prev;
        return {
          sceneId: sid,
          imageUrl,
          imageIndex,
          localPrompt,
          scene,
          metadata,
        };
      });
    } catch (error) {
      console.error("Error loading image details:", error);
      setImageDetailsError(error.message || "Failed to load image details");
    } finally {
      setLoadingImageDetails(false);
    }
  };

  const handleOpenImageDetailsModal = async (
    sceneId,
    imageUrl,
    { imageIndex = null, localPrompt = null } = {},
  ) => {
    const sid = toSceneKey(sceneId);
    if (!sid || !imageUrl) return;
    setImageDetailsModal({
      sceneId: sid,
      imageUrl,
      imageIndex,
      localPrompt,
      scene: null,
      metadata: null,
    });
    await loadImageDetailsForScene(sid, imageUrl, { imageIndex, localPrompt });
  };

  const handleCloseImageDetailsModal = () => {
    setImageDetailsModal(null);
    setImageDetailsError(null);
    setLoadingImageDetails(false);
  };

  const handleSelectVideoForScene = async (sceneId, videoUrl) => {
    if (!sceneId || !videoUrl) return;

    const sid = toSceneKey(sceneId);
    if (!sid) return;

    setScriptData((prev) => {
      if (!prev?.scenes) return prev;
      const nextScenes = prev.scenes.map((s) => {
        if (toSceneKey(s.id) !== sid) return s;
        const existingUrls = Array.isArray(s.video_urls) ? s.video_urls : [];
        const nextUrls = uniqueStringsPreserveOrder([
          ...existingUrls,
          videoUrl,
        ]);
        return {
          ...s,
          video_urls: nextUrls,
          selected_video_url: videoUrl,
        };
      });
      return { ...prev, scenes: nextScenes };
    });

    setVideos((prev) => {
      const byScene = new Map((prev || []).map((v) => [v.scene_id, v]));
      byScene.set(sid, { scene_id: sid, video_url: videoUrl });
      return Array.from(byScene.values()).sort(
        (a, b) => Number(a.scene_id) - Number(b.scene_id),
      );
    });

    try {
      if (!currentProjectId) return;
      await fetch(`/api/projects/${currentProjectId}/scenes/${sid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected_video_url: videoUrl }),
      });
    } catch (error) {
      console.error("Error saving selected video:", error);
    }
  };

  const handleRemoveVideoVersion = async (sceneId, videoUrl) => {
    if (!sceneId || !videoUrl) return;
    if (!currentProjectId) {
      await alert("No active project selected", "error");
      return;
    }

    const sid = toSceneKey(sceneId);
    if (!sid) return;

    const confirmed = await confirm(
      "Delete this video version? This will also remove it from Firebase Storage.",
    );
    if (!confirmed) return;

    const deletingKey = `${sid}::${videoUrl}`;
    setDeletingVideoVersionKey(deletingKey);

    try {
      await fetch("/api/video-generator/delete-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_url: videoUrl,
          project_id: currentProjectId,
          scene_id: sid,
        }),
      });

      let nextSelectedUrl = null;
      let nextVideoUrls = [];

      setScriptData((prev) => {
        if (!prev?.scenes) return prev;
        const nextScenes = prev.scenes.map((s) => {
          if (toSceneKey(s.id) !== sid) return s;

          const existingUrls = Array.isArray(s.video_urls) ? s.video_urls : [];
          nextVideoUrls = existingUrls.filter((u) => u !== videoUrl);
          const currentSelected = getSelectedVideoUrlForScene(s);

          nextSelectedUrl =
            currentSelected === videoUrl
              ? nextVideoUrls.length > 0
                ? nextVideoUrls[nextVideoUrls.length - 1]
                : null
              : currentSelected;

          return {
            ...s,
            video_urls: nextVideoUrls,
            selected_video_url: nextSelectedUrl,
          };
        });
        return { ...prev, scenes: nextScenes };
      });

      setVideos((prev) => {
        const byScene = new Map((prev || []).map((v) => [v.scene_id, v]));
        const current = byScene.get(sid);

        if (current?.video_url === videoUrl) {
          if (nextSelectedUrl) {
            byScene.set(sid, {
              scene_id: sid,
              video_url: nextSelectedUrl,
            });
          } else {
            byScene.delete(sid);
          }
        }

        return Array.from(byScene.values()).sort(
          (a, b) => Number(a.scene_id) - Number(b.scene_id),
        );
      });

      await fetch(`/api/projects/${currentProjectId}/scenes/${sid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_urls: nextVideoUrls,
          selected_video_url: nextSelectedUrl,
        }),
      });

      await alert("Video version deleted", "success");
    } catch (error) {
      console.error("Error deleting video version:", error);
      await alert("Failed to delete video version", "error");
    } finally {
      setDeletingVideoVersionKey(null);
    }
  };

  // Step 5: Background Music
  const [backgroundMusicUrl, setBackgroundMusicUrl] = useState(null);
  const [backgroundMusicPrompt, setBackgroundMusicPrompt] = useState("");
  const [musicPrompt, setMusicPrompt] = useState("");
  const [musicNegativePrompt, setMusicNegativePrompt] = useState(
    DEFAULT_MUSIC_NEGATIVE_PROMPT,
  );
  const [generatingBackgroundMusic, setGeneratingBackgroundMusic] =
    useState(false);
  const [musicModelEndpoint, setMusicModelEndpoint] = useState(null);
  const [musicUnitCost, setMusicUnitCost] = useState(null);
  const [musicPricingUnit, setMusicPricingUnit] = useState(null);
  const [loadingMusicPricing, setLoadingMusicPricing] = useState(false);
  const [musicDefaultDescription, setMusicDefaultDescription] = useState("");
  const [useCompositionPlan, setUseCompositionPlan] = useState(false);
  const [musicCompositionPlan, setMusicCompositionPlan] = useState({
    positive_global_styles: [],
    negative_global_styles: [],
    sections: [],
  });
  const [generatingMusicPlan, setGeneratingMusicPlan] = useState(false);
  const [generatingMusicPrompt, setGeneratingMusicPrompt] = useState(false);
  const [availableMusicThemes, setAvailableMusicThemes] = useState([]);
  const [defaultMusicThemeId, setDefaultMusicThemeId] = useState(null);
  const [selectedMusicThemeId, setSelectedMusicThemeId] = useState(null);
  const [showMusicThemePicker, setShowMusicThemePicker] = useState(false);
  const [availableMusicFromCollection, setAvailableMusicFromCollection] =
    useState([]);
  const [loadingMusicCollection, setLoadingMusicCollection] = useState(false);
  const [showMusicCollectionPicker, setShowMusicCollectionPicker] =
    useState(false);
  const [availableInstruments, setAvailableInstruments] = useState([]);
  const [selectedInstrumentIds, setSelectedInstrumentIds] = useState([]);
  const [useInstrumentPalette, setUseInstrumentPalette] = useState(true);
  const [selectedMusicModelId, setSelectedMusicModelId] = useState("stable-audio-25");
  const [isPlayingWithVoiceover, setIsPlayingWithVoiceover] = useState(false);
  const playWithVoiceoverRef = useRef({ voiceover: null, music: null });

  // Step 6: Final Video
  const [finalVideoUrl, setFinalVideoUrl] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isAssembling, setIsAssembling] = useState(false);
  const timelineEditorRef = useRef(null);
  const [timelineSettings, setTimelineSettings] = useState(null);

  // Scene linking/grouping (persisted on project doc as `scene_group`)
  const [sceneGroups, setSceneGroups] = useState([]);
  const [savingSceneGroups, setSavingSceneGroups] = useState(false);
  const [savingSceneLinkKey, setSavingSceneLinkKey] = useState(null);
  const [sceneGroupsTouched, setSceneGroupsTouched] = useState(false);

  function buildAutoSceneGroups(nextSceneCount, nextLocationCount) {
    const total = Number(nextSceneCount);
    if (!Number.isFinite(total) || total <= 0) return [];

    // null means "all different" (no grouping)
    const desiredLocations =
      nextLocationCount === null || nextLocationCount === undefined
        ? total
        : Math.max(1, Math.min(total, Number(nextLocationCount)));

    // If every scene has its own location, keep as singletons
    if (desiredLocations >= total) {
      return Array.from({ length: total }, (_, idx) => [idx + 1]);
    }

    // If only one location, group all scenes
    if (desiredLocations === 1) {
      return [Array.from({ length: total }, (_, idx) => idx + 1)];
    }

    // Otherwise, distribute scenes into consecutive groups as evenly as possible
    const base = Math.floor(total / desiredLocations);
    const remainder = total % desiredLocations;
    const groups = [];
    let current = 1;
    for (let i = 0; i < desiredLocations; i++) {
      const size = base + (i < remainder ? 1 : 0);
      const group = [];
      for (let j = 0; j < size; j++) {
        group.push(current);
        current++;
      }
      if (group.length) groups.push(group);
    }
    return groups;
  }

  function groupsSignature(groups) {
    if (!Array.isArray(groups)) return "";
    return groups
      .map((g) =>
        Array.isArray(g) ? g.map((id) => sceneKey(id)).join(",") : "",
      )
      .join("|");
  }

  function decodeSceneGroups(rawGroups) {
    // Supports:
    // - Legacy (desired) format: [[1,2],[3]]
    // - Firestore-safe format: [{ scene_ids: [1,2] }, { scene_ids: [3] }]
    if (!Array.isArray(rawGroups)) return [];
    return rawGroups
      .map((g) => {
        if (Array.isArray(g)) return g;
        if (g && typeof g === "object") {
          if (Array.isArray(g.scene_ids)) return g.scene_ids;
          if (Array.isArray(g.sceneIds)) return g.sceneIds;
          if (Array.isArray(g.ids)) return g.ids;
        }
        return null;
      })
      .filter(Boolean);
  }

  function encodeSceneGroupsForFirestore(groups) {
    // Firestore does not allow nested arrays, so we store as array of objects.
    // Example: [[1,2],[3]] -> [{scene_ids:[1,2]},{scene_ids:[3]}]
    if (!Array.isArray(groups)) return [];
    return groups
      .filter((g) => Array.isArray(g) && g.length > 0)
      .map((g) => ({ scene_ids: g }));
  }

  function normalizeSceneId(id) {
    const n = Number(id);
    return Number.isInteger(n) ? n : id;
  }

  function sceneKey(id) {
    return String(normalizeSceneId(id));
  }

  function normalizeSceneGroups(rawGroups, sceneIdsInOrder) {
    const sceneIds = Array.isArray(sceneIdsInOrder)
      ? sceneIdsInOrder.map(normalizeSceneId)
      : [];
    if (sceneIds.length === 0) return [];

    const orderIndex = new Map(sceneIds.map((id, idx) => [sceneKey(id), idx]));
    const validKeys = new Set(orderIndex.keys());

    const incomingGroups = decodeSceneGroups(rawGroups);
    const seen = new Set();
    const cleanedGroups = [];

    for (const group of incomingGroups) {
      if (!Array.isArray(group)) continue;
      const cleaned = [];
      for (const item of group) {
        const normalized = normalizeSceneId(item);
        const key = sceneKey(normalized);
        if (!validKeys.has(key)) continue;
        if (seen.has(key)) continue;
        seen.add(key);
        cleaned.push(normalized);
      }
      if (cleaned.length > 0) {
        cleaned.sort(
          (a, b) =>
            (orderIndex.get(sceneKey(a)) ?? 0) -
            (orderIndex.get(sceneKey(b)) ?? 0),
        );
        cleanedGroups.push(cleaned);
      }
    }

    // If nothing loaded, default to singletons
    const baseGroups =
      cleanedGroups.length > 0 ? cleanedGroups : sceneIds.map((id) => [id]);

    // Append any missing scenes as singletons
    for (const id of sceneIds) {
      const key = sceneKey(id);
      if (!seen.has(key)) {
        baseGroups.push([id]);
        seen.add(key);
      }
    }

    // Sort groups by earliest scene position for stable UI
    baseGroups.sort((ga, gb) => {
      const aMin = Math.min(
        ...ga.map((id) => orderIndex.get(sceneKey(id)) ?? 0),
      );
      const bMin = Math.min(
        ...gb.map((id) => orderIndex.get(sceneKey(id)) ?? 0),
      );
      return aMin - bMin;
    });

    return baseGroups;
  }

  function areScenesLinked(groups, aId, bId) {
    const aKey = sceneKey(aId);
    const bKey = sceneKey(bId);
    if (aKey === bKey) return true;
    if (!Array.isArray(groups)) return false;
    return groups.some(
      (g) =>
        Array.isArray(g) &&
        g.some((x) => sceneKey(x) === aKey) &&
        g.some((x) => sceneKey(x) === bKey),
    );
  }

  function getSceneGroupInfo(groups, sceneId, sceneIdsInOrder) {
    const sceneKeyId = sceneKey(sceneId);
    const normalized = normalizeSceneGroups(groups, sceneIdsInOrder);
    const group = normalized.find((g) =>
      g.some((x) => sceneKey(x) === sceneKeyId),
    );
    if (!group || group.length === 0) {
      const id = normalizeSceneId(sceneId);
      return { leaderId: id, isChild: false, group: [id] };
    }

    const leaderId = group[0];
    return {
      leaderId,
      isChild: sceneKey(leaderId) !== sceneKeyId,
      group,
    };
  }

  function toggleAdjacentSceneLink(groups, aId, bId, sceneIdsInOrder) {
    const sceneIds = Array.isArray(sceneIdsInOrder)
      ? sceneIdsInOrder.map(normalizeSceneId)
      : [];
    const normalized = normalizeSceneGroups(groups, sceneIds);
    const aKey = sceneKey(aId);
    const bKey = sceneKey(bId);

    const orderIndex = new Map(sceneIds.map((id, idx) => [sceneKey(id), idx]));
    const findGroupIndex = (key) =>
      normalized.findIndex((g) => g.some((x) => sceneKey(x) === key));

    const ai = findGroupIndex(aKey);
    const bi = findGroupIndex(bKey);
    if (ai === -1 || bi === -1) return normalized;

    const sortGroupsByOrder = (groupsToSort) => {
      groupsToSort.sort((ga, gb) => {
        const aMin = Math.min(
          ...ga.map((id) => orderIndex.get(sceneKey(id)) ?? 0),
        );
        const bMin = Math.min(
          ...gb.map((id) => orderIndex.get(sceneKey(id)) ?? 0),
        );
        return aMin - bMin;
      });
    };

    // Merge if currently separate
    if (ai !== bi) {
      const merged = [...normalized[ai], ...normalized[bi]];
      const next = normalized.filter((_, idx) => idx !== ai && idx !== bi);
      merged.sort(
        (x, y) =>
          (orderIndex.get(sceneKey(x)) ?? 0) -
          (orderIndex.get(sceneKey(y)) ?? 0),
      );
      next.push(merged);
      sortGroupsByOrder(next);
      return next;
    }

    // Split if currently linked (same group)
    const group = normalized[ai];
    const groupSorted = [...group].sort(
      (x, y) =>
        (orderIndex.get(sceneKey(x)) ?? 0) - (orderIndex.get(sceneKey(y)) ?? 0),
    );

    const aPos = orderIndex.get(aKey);
    const bPos = orderIndex.get(bKey);
    if (aPos === undefined || bPos === undefined) return normalized;

    // Break the chain between these two adjacent scenes
    const boundary = Math.min(aPos, bPos);
    const left = groupSorted.filter(
      (id) => (orderIndex.get(sceneKey(id)) ?? 0) <= boundary,
    );
    const right = groupSorted.filter(
      (id) => (orderIndex.get(sceneKey(id)) ?? 0) > boundary,
    );
    if (left.length === 0 || right.length === 0) return normalized;

    const next = normalized.filter((_, idx) => idx !== ai);
    next.push(left, right);
    sortGroupsByOrder(next);
    return next;
  }

  const handleToggleSceneLink = async (sceneId, nextId) => {
    if (!currentProjectId) return;
    if (!scriptData?.scenes?.length) return;

    const sceneIdsInOrder = scriptData.scenes.map((s) =>
      normalizeSceneId(s.id),
    );
    const linkKey = `${sceneKey(sceneId)}-${sceneKey(nextId)}`;

    const previous = sceneGroups;
    const nextGroups = toggleAdjacentSceneLink(
      previous,
      sceneId,
      nextId,
      sceneIdsInOrder,
    );
    if (groupsSignature(previous) === groupsSignature(nextGroups)) return;

    setSceneGroupsTouched(true);
    setSceneGroups(nextGroups);
    setSavingSceneGroups(true);
    setSavingSceneLinkKey(linkKey);

    try {
      const response = await fetch(`/api/projects/${currentProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scene_group: encodeSceneGroupsForFirestore(nextGroups),
        }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to save scene links");
      }
    } catch (error) {
      setSceneGroups(previous);
      await alert(
        "Failed to save scene links: " + (error?.message || String(error)),
        "error",
      );
    } finally {
      setSavingSceneGroups(false);
      setSavingSceneLinkKey(null);
    }
  };

  useEffect(() => {
    loadCharacters();
    loadTopics();
    loadCategories();
    loadProjects();
    loadAvailableActions();
    loadAvailableCameraMovements();
    loadAvailableCharacterMotions();
    loadFluxPricing();
    loadMultipleAnglesPricing();
    loadFalVideoPricing();
    loadMusicPricing("stable-audio-25");
    loadAvailableMusicThemes();
  }, []);

  useEffect(() => {
    fetch("/api/debug/firebase-env")
      .then((r) => r.json())
      .then(setFirebaseEnv)
      .catch(() => setFirebaseEnv({ error: "Failed to fetch" }));
  }, []);

  // Reload music pricing when model selection changes (Step 5)
  useEffect(() => {
    if (step === 5 && selectedMusicModelId) {
      loadMusicPricing(selectedMusicModelId);
    }
  }, [step, selectedMusicModelId]);

  // Close Step 0 project menu on outside click / Escape
  useEffect(() => {
    if (!openProjectMenuId) return;

    const onMouseDown = (e) => {
      if (!projectMenuRef.current) return;
      if (!projectMenuRef.current.contains(e.target)) {
        setOpenProjectMenuId(null);
      }
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpenProjectMenuId(null);
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openProjectMenuId]);

  // Step 1: Auto-group scenes based on user's Scene/Location counts.
  // Only applies until the user manually edits links.
  useEffect(() => {
    if (!currentProjectId) return;
    if (step !== 1) return;
    if (sceneGroupsTouched) return;
    if (!sceneCount) return;

    const auto = buildAutoSceneGroups(sceneCount, locationCount);
    const sceneIds = Array.from(
      { length: Number(sceneCount) },
      (_, idx) => idx + 1,
    );
    const normalized = normalizeSceneGroups(auto, sceneIds);
    setSceneGroups(normalized);

    // Persist to project so Step 3+ reflects the grouping.
    autoSaveStep1({ scene_group: encodeSceneGroupsForFirestore(normalized) });
  }, [sceneCount, locationCount, step, currentProjectId, sceneGroupsTouched]);

  // Ensure `sceneGroups` always matches the current scene list
  useEffect(() => {
    if (!scriptData?.scenes) return;
    const sceneIds = scriptData.scenes.map((s) => normalizeSceneId(s.id));
    setSceneGroups((prev) => normalizeSceneGroups(prev, sceneIds));
  }, [currentProjectId, scriptData?.scenes?.length]);

  // Check for project_id in URL and load project automatically
  const loadingProjectRef = useRef(false);
  loadingProjectRef.current = loadingProject;
  useEffect(() => {
    const projectId = searchParams.get("project_id");
    if (!projectId || currentProjectId === projectId) return;
    if (loadingProjectRef.current) return; // avoid overlapping loads

    const checkAndLoadProject = setInterval(() => {
      if (projects.length > 0) {
        clearInterval(checkAndLoadProject);
        const project = projects.find((p) => p.id === projectId);
        if (project && !loadingProjectRef.current) {
          handleSelectProject(project.id);
        }
      }
    }, 100);
    const timeoutId = setTimeout(() => clearInterval(checkAndLoadProject), 5000);

    return () => {
      clearInterval(checkAndLoadProject);
      clearTimeout(timeoutId);
    };
  }, [searchParams, projects, currentProjectId]);

  // Auto-save topic when it changes
  useEffect(() => {
    if (currentProjectId && topic && step === 1) {
      const debounce = setTimeout(() => {
        autoSaveStep1({ topic });
      }, 1000); // Debounce 1 second

      return () => clearTimeout(debounce);
    }
  }, [topic, currentProjectId, step]);

  // Auto-save categories when they change
  useEffect(() => {
    if (currentProjectId && topicCategories.length > 0 && step === 1) {
      autoSaveStep1({ categories: topicCategories });
    }
  }, [topicCategories, currentProjectId, step]);

  // Auto-save character when selected
  useEffect(() => {
    if (currentProjectId && selectedCharacter && step === 1) {
      autoSaveStep1({
        character: {
          character_id: selectedCharacter.character_id,
          name: selectedCharacter.name,
          gender: selectedCharacter.gender,
          age: selectedCharacter.age,
          voice_id: selectedCharacter.voice_id,
          image_urls: selectedCharacter.image_urls,
        },
      });
    }
  }, [selectedCharacter, currentProjectId, step]);

  // Auto-save scene count when it changes
  useEffect(() => {
    if (currentProjectId && sceneCount && step === 1) {
      autoSaveStep1({ scene_count: sceneCount });
    }
  }, [sceneCount, currentProjectId, step]);

  // Auto-save voice settings when they change
  useEffect(() => {
    if (currentProjectId && step === 2) {
      const debounce = setTimeout(() => {
        autoSaveStep1({ voice_settings: voiceSettings });
      }, 500);
      return () => clearTimeout(debounce);
    }
  }, [voiceSettings, currentProjectId, step]);

  // Auto-save script when manually edited
  useEffect(() => {
    if (currentProjectId && scriptData?.script && step === 2) {
      const debounce = setTimeout(() => {
        autoSaveStep1({ script: scriptData.script });
      }, 2000); // 2 second debounce for script edits
      return () => clearTimeout(debounce);
    }
  }, [scriptData?.script, currentProjectId, step]);

  // Auto-save selected music theme when it changes (Step 5)
  useEffect(() => {
    if (currentProjectId && step === 5) {
      fetch(`/api/projects/${currentProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selected_music_theme_id: selectedMusicThemeId ?? null,
        }),
      }).catch(() => {});
    }
  }, [currentProjectId, step, selectedMusicThemeId]);

  // Auto-save music prompt when it changes (Step 5, debounced)
  useEffect(() => {
    if (currentProjectId && step === 5) {
      const debounce = setTimeout(() => {
        fetch(`/api/projects/${currentProjectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ music_prompt: musicPrompt }),
        }).catch(() => {});
      }, 500);
      return () => clearTimeout(debounce);
    }
  }, [musicPrompt, currentProjectId, step]);

  // Auto-save music negative prompt when it changes (Step 5, debounced)
  useEffect(() => {
    if (currentProjectId && step === 5) {
      const debounce = setTimeout(() => {
        fetch(`/api/projects/${currentProjectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ music_negative_prompt: musicNegativePrompt }),
        }).catch(() => {});
      }, 500);
      return () => clearTimeout(debounce);
    }
  }, [musicNegativePrompt, currentProjectId, step]);

  // Load ElevenLabs info when on Step 2
  useEffect(() => {
    if (step === 2) {
      loadElevenLabsInfo();
    }
  }, [step]);

  // Update URL when step changes (for persistence)
  useEffect(() => {
    const urlStep = searchParams.get("step");
    const urlProjectId = searchParams.get("project_id");

    // Step 0 is the project list; keep the URL clean.
    if (step === 0) {
      if (urlStep || urlProjectId) {
        router.replace("/admin/video-generator");
      }
      return;
    }

    if (!currentProjectId) return;

    // Avoid replace loops by only updating when different.
    if (urlProjectId !== String(currentProjectId) || urlStep !== String(step)) {
      router.replace(
        `/admin/video-generator?project_id=${currentProjectId}&step=${step}`,
      );
    }
  }, [step, currentProjectId, searchParams, router]);

  // Update maxStepReached when user progresses forward
  useEffect(() => {
    if (step > maxStepReached) {
      setMaxStepReached(step);
    }
  }, [step, maxStepReached]);

  // Load music defaults when entering step 5
  useEffect(() => {
    if (step !== 5 || musicDefaultDescription) return;
    fetch("/api/video-generator/music-defaults")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.default_description) {
          setMusicDefaultDescription(data.default_description);
        }
      })
      .catch(() => {});
  }, [step, musicDefaultDescription]);

  // Load project-generated music, themes, and instruments when entering step 5
  useEffect(() => {
    if (step !== 5) return;
    loadAvailableMusicThemes();
    loadAvailableInstruments();
    if (currentProjectId) loadAvailableMusicFromCollection();
  }, [step, currentProjectId]);

  // Poll for final video URL when on step 6/7 and user has started a render (isAssembling)
  useEffect(() => {
    if ((step !== 6 && step !== 7) || !sessionId) return;
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/video-generator/assemble-video?session_id=${sessionId}`,
        );
        const data = await res.json();
        if (data.success && data.final_video_url) {
          setFinalVideoUrl(data.final_video_url);
          setIsAssembling(false);
        }
        // Do NOT set isAssembling(true) from poll – only when user clicks Render.
        // This ensures Step 6 always shows timeline editor first for editing.
      } catch {
        // ignore
      }
    };
    poll();
    if (finalVideoUrl) return;
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [step, finalVideoUrl, sessionId]);

  // Update selectedCharacter with full data when characters load
  useEffect(() => {
    if (
      selectedCharacter?.character_id &&
      characters.length > 0 &&
      !selectedCharacter.image_urls
    ) {
      const fullCharacter = characters.find(
        (c) => c.character_id === selectedCharacter.character_id,
      );
      if (fullCharacter) {
        setSelectedCharacter(fullCharacter);
      }
    }
  }, [characters, selectedCharacter]);

  const loadCharacters = async () => {
    try {
      const response = await fetch("/api/characters");
      const result = await response.json();
      if (result.success) {
        setCharacters(result.characters);
      }
    } catch (error) {
      console.error("Failed to load characters:", error);
    }
  };

  const loadFluxPricing = async () => {
    try {
      const response = await fetch("/api/video-generator/image2image-pricing", {
        cache: "no-store",
      });
      const result = await response.json();
      const unitCost = Number(result.cost);
      if (result.success && Number.isFinite(unitCost) && unitCost > 0) {
        setFluxProCost(unitCost);
        setFluxProEndpointId(result.endpoint_id || null);
        console.log(`Loaded Grok pricing: $${unitCost}/image`);
      } else {
        throw new Error(result.error || "Failed to load FAL pricing");
      }
    } catch (error) {
      console.error("CRITICAL: Failed to load FAL pricing:", error);
      alert(
        `Failed to load FAL AI pricing: ${error.message}. Cannot proceed with image generation.`,
      );
    }
  };

  const loadMultipleAnglesPricing = async () => {
    try {
      const response = await fetch(
        "/api/video-generator/multiple-angles-pricing",
        { cache: "no-store" },
      );
      const result = await response.json();
      const unitCost = Number(result.cost);
      if (result?.endpoint_id) {
        setMultipleAnglesEndpointId(result.endpoint_id);
      }

      if (result.success && Number.isFinite(unitCost) && unitCost > 0) {
        setMultipleAnglesUnitCost(unitCost);
      } else {
        setMultipleAnglesUnitCost(null);
        if (result?.error) {
          console.warn("Multiple-angles pricing unavailable:", result.error);
        }
      }
    } catch (error) {
      console.error("Failed to load multiple-angles pricing:", error);
      setMultipleAnglesUnitCost(null);
    }
  };

  const loadFalVideoPricing = async () => {
    setLoadingFalVideoPricing(true);
    try {
      const response = await fetch("/api/video-generator/image2video-pricing");
      const result = await response.json();
      if (result.success && result.cost) {
        setFalVideoUnitCost(result.cost);
        setFalVideoPricingUnit(result.unit || null);
        console.log(
          `Loaded FAL video pricing: $${result.cost}/${result.unit || "unit"}`,
        );
      } else {
        throw new Error(result.error || "Failed to load FAL video pricing");
      }
    } catch (error) {
      console.error("Failed to load FAL video pricing:", error);
      setFalVideoUnitCost(null);
      setFalVideoPricingUnit(null);
    } finally {
      setLoadingFalVideoPricing(false);
    }
  };

  const loadMusicPricing = async (modelId) => {
    const id = modelId ?? selectedMusicModelId ?? "stable-audio-25";
    setLoadingMusicPricing(true);
    try {
      const response = await fetch(
        `/api/video-generator/music-pricing?model_id=${encodeURIComponent(id)}`,
      );
      const result = await response.json();
      if (result.success && result.cost != null) {
        setMusicUnitCost(result.cost);
        setMusicPricingUnit(result.unit || "min");
        setMusicModelEndpoint(result.endpoint_id || null);
        console.log(
          `Loaded music pricing: $${result.cost}/${result.unit || "min"}`,
        );
      } else {
        throw new Error(result.error || "Failed to load music pricing");
      }
    } catch (error) {
      console.error("Failed to load music pricing:", error);
      setMusicUnitCost(null);
      setMusicPricingUnit(null);
      setMusicModelEndpoint(null);
    } finally {
      setLoadingMusicPricing(false);
    }
  };

  const loadTopics = async () => {
    try {
      const response = await fetch("/api/topics");
      const result = await response.json();
      if (result.success && result.topics) {
        setTopics(result.topics);
        console.log("Loaded topics:", result.topics.length);
      } else {
        console.error("Failed to load topics:", result.error || result.message);
        setTopics([]);
      }
    } catch (error) {
      console.error("Failed to load topics:", error);
      setTopics([]);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/topic-categories");
      const result = await response.json();
      if (result.success && result.categories) {
        setCategories(result.categories);
        console.log("Loaded categories:", result.categories.length);
      } else {
        console.error(
          "Failed to load categories:",
          result.error || result.message,
        );
        setCategories([]);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
      setCategories([]);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      const result = await response.json();
      if (result.success && result.projects) {
        setProjects(result.projects);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  };

  const handleRenameProjectFromList = async (project) => {
    try {
      const currentName = project?.project_name || "";
      const nextName = window.prompt("Rename project", currentName);
      if (nextName == null) return; // cancelled
      const trimmed = String(nextName).trim();
      if (!trimmed) {
        await alert("Project name cannot be empty", "warning");
        return;
      }

      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_name: trimmed }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to rename project");
      }

      setProjects((prev) =>
        prev.map((p) =>
          p.id === project.id ? { ...p, project_name: trimmed } : p,
        ),
      );

      if (currentProjectId === project.id) {
        setCurrentProjectName(trimmed);
      }
    } catch (error) {
      await alert("Failed to rename project: " + error.message, "error");
    } finally {
      setOpenProjectMenuId(null);
    }
  };

  const handleDeleteProjectFromList = async (project) => {
    if (!project?.id) return;
    if (deletingProjectId) return;

    const label = project?.project_name || project?.topic || "this project";
    const ok = await confirm(
      `Delete ${label}? This will delete all scenes too.`,
      "warning",
    );
    if (!ok) return;

    try {
      setDeletingProjectId(project.id);

      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to delete project");
      }

      setProjects((prev) => prev.filter((p) => p.id !== project.id));

      // If the deleted project was currently open, reset to Step 0 and clear URL
      if (currentProjectId === project.id) {
        setCurrentProjectId(null);
        setCurrentProjectName("");
        setTimelineSettings(null);
        setScriptData(null);
        setTopic("");
        setTopicCategories([]);
        setSelectedCharacter(null);
        setSceneGroups([]);
        setSceneGroupsTouched(false);
        setStep(0);
        setMaxStepReached(0);
        router.replace("/admin/video-generator");
      }
    } catch (error) {
      await alert("Failed to delete project: " + error.message, "error");
    } finally {
      setDeletingProjectId(null);
      setOpenProjectMenuId(null);
    }
  };

  const loadAvailableActions = async () => {
    try {
      const response = await fetch("/api/actions/list");
      const result = await response.json();
      if (result.success && result.actions) {
        setAvailableActions(result.actions);
      }
    } catch (error) {
      console.error("Failed to load actions:", error);
    }
  };

  const loadAvailableCameraMovements = async () => {
    try {
      const response = await fetch("/api/camera-movements/list");
      const result = await response.json();
      if (result.success && result.camera_movements) {
        setAvailableCameraMovements(result.camera_movements);
      }
    } catch (error) {
      console.error("Failed to load camera movements:", error);
    }
  };

  const loadAvailableCharacterMotions = async () => {
    try {
      const response = await fetch("/api/character-motions/list");
      const result = await response.json();
      if (result.success && result.character_motions) {
        setAvailableCharacterMotions(result.character_motions);
      }
    } catch (error) {
      console.error("Failed to load character motions:", error);
    }
  };

  const loadAvailableMusicThemes = async () => {
    try {
      const response = await fetch("/api/music-themes/list");
      const result = await response.json();
      if (result.success) {
        if (result.music_themes) setAvailableMusicThemes(result.music_themes);
        setDefaultMusicThemeId(result.default_theme_id || null);
      }
    } catch (error) {
      console.error("Failed to load music themes:", error);
    }
  };

  const loadAvailableInstruments = async () => {
    try {
      const response = await fetch("/api/instruments/list");
      const result = await response.json();
      if (result.success) {
        if (result.instruments) setAvailableInstruments(result.instruments);
      }
    } catch (error) {
      console.error("Failed to load instruments:", error);
    }
  };

  const loadAvailableMusicFromCollection = async () => {
    setLoadingMusicCollection(true);
    try {
      const url = currentProjectId
        ? `/api/video-generator/music-list?project_id=${currentProjectId}&limit=50`
        : "/api/video-generator/music-list?limit=50";
      const response = await fetch(url);
      const result = await response.json();
      if (result.success && result.music) {
        setAvailableMusicFromCollection(result.music);
      } else {
        setAvailableMusicFromCollection([]);
      }
    } catch (error) {
      console.error("Failed to load music collection:", error);
      setAvailableMusicFromCollection([]);
    } finally {
      setLoadingMusicCollection(false);
    }
  };

  const loadElevenLabsInfo = async () => {
    setLoadingElevenLabsInfo(true);
    try {
      const response = await fetch("/api/elevenlabs/user-info");
      const result = await response.json();
      if (result.success) {
        console.log("ElevenLabs info:", result);
        setElevenLabsInfo(result);
      } else {
        console.error("ElevenLabs API error:", result.error);
      }
    } catch (error) {
      console.error("Failed to load ElevenLabs info:", error);
    } finally {
      setLoadingElevenLabsInfo(false);
    }
  };

  const loadAllCharacterReferences = async (characterId) => {
    if (!characterId) return;

    setLoadingCharacterReferences(true);
    try {
      const response = await fetch(
        `/api/characters/${characterId}/all-references`,
      );
      const result = await response.json();

      if (result.success) {
        setAllCharacterReferences(result.references || []);
      } else {
        console.error("Failed to load character references:", result.error);
      }
    } catch (error) {
      console.error("Error loading character references:", error);
    } finally {
      setLoadingCharacterReferences(false);
    }
  };

  const handleOpenCharacterReferenceModal = async (sceneId) => {
    if (!selectedCharacter?.character_id) return;

    setCharacterReferenceModalSceneId(sceneId);
    setShowCharacterReferenceModal(true);
    await loadAllCharacterReferences(selectedCharacter.character_id);
  };

  // Helper function to get status display info
  const getProjectStatus = (project) => {
    const step = project.current_step || 0;
    const status = project.status || "draft";

    const statusMap = {
      0: {
        label: "Draft",
        color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
      },
      1: {
        label: "Step 1: Setup",
        color:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200",
      },
      2: {
        label: "Step 2: Script & Voiceover",
        color:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200",
      },
      3: {
        label: "Step 3: Scene images",
        color:
          "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200",
      },
      4: {
        label: "Step 4: Scene videos",
        color:
          "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200",
      },
      5: {
        label: "Step 5: Music",
        color:
          "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200",
      },
      6:
        status === "completed"
          ? {
              label: "✓ Completed",
              color:
                "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200",
            }
          : status === "rendering"
            ? {
                label: "Rendering...",
                color:
                  "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200",
            }
            : status === "failed"
              ? {
                  label: "Failed",
                  color:
                    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200",
                }
              : {
                  label: "Step 6: Assemble",
                  color:
                    "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-200",
                },
      7: {
        label: "Step 7: Post",
        color:
          "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200",
      },
    };

    return statusMap[step] || statusMap[0];
  };

  const handleCreateNewProject = async () => {
    setLoading(true);
    try {
      // Generate project name based on existing projects count
      const projectNumber = projects.length + 1;
      const projectName = `Project (${projectNumber})`;

      // Create new project in Firestore
      const response = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: projectName,
          status: "draft",
        }),
      });

      const result = await response.json();
      if (result.success) {
        setCurrentProjectId(result.project_id);
        setCurrentProjectName(projectName);
        setStep(1);
        setMaxStepReached(1);
      } else {
        await alert("Failed to create project: " + result.error, "error");
      }
    } catch (error) {
      await alert("Error creating project: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = async (projectId) => {
    setLoadingProject(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        cache: "no-store",
      });
      const result = await response.json();

      if (result.success) {
        setCurrentProjectId(projectId);
        setCurrentProjectName(
          result.project.project_name || "Untitled Project",
        );
        setScriptData(result.scriptData);

        // Initialize selected videos from scene docs so Step 4 can resume.
        // Fallback: hydrate from session videos (older data) if needed.
        const fromScenes = deriveSelectedVideosFromScenes(
          result.scriptData?.scenes,
        );
        const fromSession = (
          Array.isArray(result.sessionVideos) ? result.sessionVideos : []
        )
          .map((v) => ({
            scene_id: toSceneKey(v?.scene_id),
            video_url: v?.video_url,
          }))
          .filter((v) => v.scene_id && v.video_url);

        const merged = new Map();
        for (const v of fromSession) merged.set(v.scene_id, v);
        for (const v of fromScenes) merged.set(toSceneKey(v.scene_id), v);

        setVideos(
          Array.from(merged.values()).sort(
            (a, b) => Number(a.scene_id) - Number(b.scene_id),
          ),
        );

        setTopic(result.project.topic || "");
        setTopicCategories(result.project.categories || []);

        // Load persisted scene grouping (scene_group) if present
        if (result.scriptData?.scenes) {
          const sceneIds = result.scriptData.scenes.map((s) =>
            normalizeSceneId(s.id),
          );
          setSceneGroups(
            normalizeSceneGroups(result.project.scene_group, sceneIds),
          );
        } else {
          setSceneGroups([]);
        }

        // Load selected image indices for scenes
        if (result.scriptData?.scenes) {
          const imageSelections = {};
          result.scriptData.scenes.forEach((scene) => {
            if (scene.selected_image_index !== undefined) {
              imageSelections[scene.id] = scene.selected_image_index;
            }
          });
          setSelectedSceneImages(imageSelections);
        }

        // Load full character object including image_urls
        if (result.project.character?.character_id) {
          const fullCharacter = characters.find(
            (c) => c.character_id === result.project.character.character_id,
          );
          setSelectedCharacter(fullCharacter || result.project.character);
        } else {
          setSelectedCharacter(result.project.character || null);
        }

        setSceneCount(result.project.scene_count || 4);
        setVoiceSettings(
          result.project.voice_settings || {
            stability: 0.65,
            similarity_boost: 0.75,
            style: 0.1,
            use_speaker_boost: true,
          },
        );
        setVoiceoverUrl(result.project.voiceover_url || null);
        setSessionId(result.project.session_id || null);
        setFinalVideoUrl(result.project.final_video_url || null);
        setTimelineSettings(result.project.timeline_settings || null);
        setBackgroundMusicUrl(result.project.background_music_url || null);
        setBackgroundMusicPrompt(result.project.background_music_prompt || "");
        setMusicPrompt(
          result.project.music_prompt ??
            result.project.background_music_prompt ??
            "",
        );
        setMusicNegativePrompt(
          result.project.music_negative_prompt?.trim() ||
            DEFAULT_MUSIC_NEGATIVE_PROMPT,
        );
        setSelectedMusicThemeId(
          result.project.selected_music_theme_id ?? null,
        );
        console.log(
          "Loaded project costs on project select:",
          result.project.costs,
        );
        setProjectCosts(result.project.costs || null);

        // Load selected locations from scene docs.
        // Backward-compatible: migrate legacy project.location_mapping -> scenes[].location_id.
        const legacyLocationMapping = result.project.location_mapping || {};
        const nextLocationMapping = {};
        const locationMigrations = [];

        for (const scene of result.scriptData?.scenes || []) {
          const sid = scene?.id;
          if (sid == null) continue;

          if (scene.location_id) {
            nextLocationMapping[sid] = scene.location_id;
            continue;
          }

          const legacyLocId =
            legacyLocationMapping?.[sid] ??
            legacyLocationMapping?.[String(sid)];
          if (legacyLocId) {
            nextLocationMapping[sid] = legacyLocId;
            locationMigrations.push(
              fetch(`/api/projects/${projectId}/scenes/${sid}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ location_id: legacyLocId }),
              }),
            );
          }
        }

        setLocationMapping(nextLocationMapping);

        const locationIds = [...new Set(Object.values(nextLocationMapping))];
        if (locationIds.length > 0) {
          try {
            const locationPromises = locationIds.map(async (locationId) => {
              const locResponse = await fetch(`/api/locations/${locationId}`);
              const locResult = await locResponse.json();
              return locResult.success ? locResult.location : null;
            });

            const locations = await Promise.all(locationPromises);
            const validLocations = locations.filter((loc) => loc !== null);
            setSelectedLocations(validLocations);
            console.log(
              `Loaded ${validLocations.length} locations for project`,
            );
          } catch (locError) {
            console.error("Error loading locations:", locError);
            setSelectedLocations([]);
          }
        } else {
          setSelectedLocations([]);
        }

        if (locationMigrations.length > 0) {
          Promise.allSettled(locationMigrations).catch(() => {});
        }

        // Load action/camera/character selections from scene docs.
        // Backward-compatible: if legacy project-level mappings exist, migrate them into scenes.
        const scenes = result.scriptData?.scenes || [];

        const legacyActionMapping = result.project.action_mapping || {};
        const legacyCameraMovementMapping =
          result.project.camera_movement_mapping || {};
        const legacyCharacterMotionMapping =
          result.project.character_motion_mapping || {};

        const nextActionMapping = {};
        const nextCameraMovementMapping = {};
        const nextCharacterMotionMapping = {};

        const migrations = [];

        for (const scene of scenes) {
          const sid = scene?.id;
          if (sid == null) continue;

          if (scene.action_id) nextActionMapping[sid] = scene.action_id;
          if (scene.camera_movement_id)
            nextCameraMovementMapping[sid] = scene.camera_movement_id;
          if (scene.character_motion_id)
            nextCharacterMotionMapping[sid] = scene.character_motion_id;

          const legacyActionId =
            legacyActionMapping?.[sid] ?? legacyActionMapping?.[String(sid)];
          const legacyCamId =
            legacyCameraMovementMapping?.[sid] ??
            legacyCameraMovementMapping?.[String(sid)];
          const legacyCharId =
            legacyCharacterMotionMapping?.[sid] ??
            legacyCharacterMotionMapping?.[String(sid)];

          const updates = {};
          if (!scene.action_id && legacyActionId) {
            nextActionMapping[sid] = legacyActionId;
            updates.action_id = legacyActionId;
          }
          if (!scene.camera_movement_id && legacyCamId) {
            nextCameraMovementMapping[sid] = legacyCamId;
            updates.camera_movement_id = legacyCamId;
          }
          if (!scene.character_motion_id && legacyCharId) {
            nextCharacterMotionMapping[sid] = legacyCharId;
            updates.character_motion_id = legacyCharId;
          }

          if (Object.keys(updates).length > 0) {
            migrations.push(
              fetch(`/api/projects/${projectId}/scenes/${sid}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
              }),
            );
          }
        }

        setActionMapping(nextActionMapping);
        setCameraMovementMapping(nextCameraMovementMapping);
        setCharacterMotionMapping(nextCharacterMotionMapping);

        if (migrations.length > 0) {
          Promise.allSettled(migrations).catch(() => {});
        }

        // Resume from URL step if available, otherwise use saved position
        const urlStep = searchParams.get("step");
        const dbMaxStep =
          result.project.current_step || (result.project.script ? 2 : 1);
        const resumeStep = urlStep ? parseInt(urlStep) : dbMaxStep;
        setStep(resumeStep);
        setMaxStepReached(dbMaxStep);
      } else {
        await alert("Failed to load project: " + result.error, "error");
      }
    } catch (error) {
      await alert("Error loading project: " + error.message, "error");
    } finally {
      setLoadingProject(false);
    }
  };

  const handleUpdateProjectName = async (newName) => {
    if (!currentProjectId || !newName.trim()) return;

    try {
      const response = await fetch(`/api/projects/${currentProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: newName.trim(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        setCurrentProjectName(newName.trim());
        setEditingProjectName(false);
      }
    } catch (error) {
      console.error("Failed to update project name:", error);
    }
  };

  const handleSaveManualTopic = async () => {
    if (!topic.trim()) {
      await alert("Please enter a topic", "warning");
      return;
    }

    try {
      const response = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          categories: topicCategories,
          generated: false,
        }),
      });

      const result = await response.json();
      if (result.success) {
        await loadTopics();
      }
    } catch (error) {
      console.error("Failed to save topic:", error);
    }
  };

  const handleAddCategory = async (categoryName) => {
    const trimmed = categoryName.trim();
    if (!trimmed || topicCategories.includes(trimmed)) {
      return;
    }

    // Add to selected categories
    setTopicCategories([...topicCategories, trimmed]);
    setCategoryInput("");

    // Check if category exists in database, if not save it
    const categoryExists = categories.some(
      (cat) => cat.name.toLowerCase() === trimmed.toLowerCase(),
    );

    if (!categoryExists) {
      try {
        const response = await fetch("/api/topic-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });

        const result = await response.json();
        if (result.success) {
          // Reload categories to include the new one
          await loadCategories();
          console.log("New category saved:", trimmed);
        }
      } catch (error) {
        console.error("Failed to save new category:", error);
      }
    }
  };

  const handleRemoveCategory = (categoryToRemove) => {
    setTopicCategories(topicCategories.filter((c) => c !== categoryToRemove));
  };

  // Auto-save Step 1 data
  const autoSaveStep1 = async (updates) => {
    if (!currentProjectId) return;

    // Show saving indicator if script is being saved
    if (updates.script) {
      setScriptSaving(true);
      setScriptSaved(false);
    }

    try {
      const response = await fetch(`/api/projects/${currentProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updates,
          updated_at: new Date().toISOString(),
        }),
      });

      const result = await response.json();
      if (!result.success) {
        console.error("Failed to auto-save:", result.error);
      } else if (updates.script) {
        // Show saved indicator
        setScriptSaving(false);
        setScriptSaved(true);
        setTimeout(() => setScriptSaved(false), 2000); // Hide after 2 seconds
      }
    } catch (error) {
      console.error("Auto-save error:", error);
      if (updates.script) {
        setScriptSaving(false);
      }
    }
  };

  const handleCategoryKeyDown = (e) => {
    if (e.key === "Enter" && categoryInput.trim()) {
      e.preventDefault();
      handleAddCategory(categoryInput);
    }
  };

  const handleGenerateTopics = async () => {
    setGeneratingTopics(true);
    try {
      const response = await fetch("/api/topics/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: aiGenerateCount,
          categories:
            aiGenerateCategories.length > 0 ? aiGenerateCategories : null,
        }),
      });

      const result = await response.json();
      if (result.success) {
        await loadTopics();
        setGeneratedTopics(result.topics || []);
        setSuccessMessage(
          `Generated ${result.count} new topic${result.count !== 1 ? "s" : ""}!`,
        );
        setShowSuccessModal(true);
      } else {
        await alert("Failed to generate topics: " + result.error, "error");
      }
    } catch (error) {
      await alert("Error: " + error.message, "error");
    } finally {
      setGeneratingTopics(false);
    }
  };

  // Step 1: Generate Script
  const handleSelectLocations = async () => {
    if (!currentProjectId) {
      await alert("No project selected. Please start from Step 0.", "warning");
      return;
    }

    const effectiveLocationCount =
      locationCount === null ? sceneCount : locationCount;

    setSelectingLocations(true);
    try {
      const response = await fetch("/api/locations/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: currentProjectId,
          location_count: effectiveLocationCount,
          scene_count: sceneCount,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSelectedLocations(result.selected_locations);
        setLocationMapping(result.location_mapping);
        await alert(
          `Successfully selected ${result.selected_locations.length} locations!`,
          "success",
        );
      } else {
        await alert("Failed to select locations: " + result.error, "error");
      }
    } catch (error) {
      await alert("Error: " + error.message, "error");
    } finally {
      setSelectingLocations(false);
    }
  };

  const handleOpenLocationPicker = async (sceneId) => {
    try {
      // Fetch all available locations
      const response = await fetch("/api/locations/list");
      const result = await response.json();

      if (!result.success) {
        await alert("Failed to load locations", "error");
        return;
      }

      if (result.locations.length === 0) {
        await alert(
          "No locations available. Please seed or generate locations first.",
          "warning",
        );
        return;
      }

      setAvailableLocations(result.locations);
      setLocationPickerSceneId(sceneId);
      setShowLocationPicker(true);
    } catch (error) {
      await alert("Error loading locations: " + error.message, "error");
    }
  };

  const handleSelectLocationFromPicker = async (location) => {
    if (!currentProjectId || !locationPickerSceneId) return;

    try {
      // Persist selection on the scene doc
      const updateResponse = await fetch(
        `/api/projects/${currentProjectId}/scenes/${locationPickerSceneId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location_id: location.id,
          }),
        },
      );

      const updateResult = await updateResponse.json();
      if (updateResult.success) {
        // Update local state
        setLocationMapping({
          ...locationMapping,
          [locationPickerSceneId]: location.id,
        });

        if (scriptData?.scenes) {
          setScriptData({
            ...scriptData,
            scenes: scriptData.scenes.map((s) =>
              s.id === locationPickerSceneId
                ? { ...s, location_id: location.id }
                : s,
            ),
          });
        }

        // Add to selected locations if not already there
        if (!selectedLocations.find((loc) => loc.id === location.id)) {
          setSelectedLocations([...selectedLocations, location]);
        }

        setShowLocationPicker(false);
        await alert(`Location selected: ${location.name}`, "success");
      } else {
        await alert("Failed to update location", "error");
      }
    } catch (error) {
      await alert("Error selecting location: " + error.message, "error");
    }
  };

  const handleClearLocationForScene = async (sceneId) => {
    if (!currentProjectId || !sceneId) return;

    try {
      const updateResponse = await fetch(
        `/api/projects/${currentProjectId}/scenes/${sceneId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location_id: null }),
        },
      );

      const updateResult = await updateResponse.json();
      if (!updateResult.success) {
        await alert("Failed to clear location", "error");
        return;
      }

      setLocationMapping((prev) => {
        const next = { ...(prev || {}) };
        delete next[sceneId];
        delete next[String(sceneId)];
        return next;
      });

      if (scriptData?.scenes) {
        setScriptData({
          ...scriptData,
          scenes: scriptData.scenes.map((s) =>
            s.id === sceneId ? { ...s, location_id: null } : s,
          ),
        });
      }
    } catch (error) {
      await alert("Error clearing location: " + error.message, "error");
    }
  };

  const handleOpenActionPicker = async (sceneId) => {
    try {
      if (availableActions.length === 0) {
        await alert("No actions available. Seeding default actions...", "info");
        // Seed actions if none exist
        const seedResponse = await fetch("/api/actions/seed", {
          method: "POST",
        });
        const seedResult = await seedResponse.json();
        if (seedResult.success) {
          await loadAvailableActions();
        }
      }

      setActionPickerSceneId(sceneId);
      setShowActionPicker(true);
    } catch (error) {
      await alert("Error loading actions: " + error.message, "error");
    }
  };

  const handleSelectActionFromPicker = async (action) => {
    if (!currentProjectId || !actionPickerSceneId) return;

    try {
      // Persist selection on the scene doc
      const updateResponse = await fetch(
        `/api/projects/${currentProjectId}/scenes/${actionPickerSceneId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action_id: action.id,
          }),
        },
      );

      const updateResult = await updateResponse.json();
      if (updateResult.success) {
        // Update local state
        setActionMapping({
          ...actionMapping,
          [actionPickerSceneId]: action.id,
        });

        // Keep scriptData in sync
        if (scriptData?.scenes) {
          setScriptData({
            ...scriptData,
            scenes: scriptData.scenes.map((s) =>
              s.id === actionPickerSceneId ? { ...s, action_id: action.id } : s,
            ),
          });
        }

        setShowActionPicker(false);
        await alert(`Action selected: ${action.name}`, "success");
      } else {
        await alert("Failed to update action", "error");
      }
    } catch (error) {
      await alert("Error selecting action: " + error.message, "error");
    }
  };

  const handleClearActionForScene = async (sceneId) => {
    if (!currentProjectId || !sceneId) return;

    try {
      const updateResponse = await fetch(
        `/api/projects/${currentProjectId}/scenes/${sceneId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action_id: null }),
        },
      );

      const updateResult = await updateResponse.json();
      if (!updateResult.success) {
        await alert("Failed to clear action", "error");
        return;
      }

      setActionMapping((prev) => {
        const next = { ...(prev || {}) };
        delete next[sceneId];
        delete next[String(sceneId)];
        return next;
      });

      if (scriptData?.scenes) {
        setScriptData({
          ...scriptData,
          scenes: scriptData.scenes.map((s) =>
            s.id === sceneId ? { ...s, action_id: null } : s,
          ),
        });
      }
    } catch (error) {
      await alert("Error clearing action: " + error.message, "error");
    }
  };

  const handleOpenCameraMovementPicker = async (sceneId) => {
    try {
      if (availableCameraMovements.length === 0) {
        await alert(
          "No camera movements available. Seeding defaults...",
          "info",
        );
        const seedResponse = await fetch("/api/camera-movements/seed", {
          method: "POST",
        });
        const seedResult = await seedResponse.json();
        if (seedResult.success) {
          await loadAvailableCameraMovements();
        }
      }

      setCameraMovementPickerSceneId(sceneId);
      setShowCameraMovementPicker(true);
    } catch (error) {
      await alert("Error loading camera movements: " + error.message, "error");
    }
  };

  const handleSelectCameraMovementFromPicker = async (movement) => {
    if (!currentProjectId || !cameraMovementPickerSceneId) return;

    try {
      const updateResponse = await fetch(
        `/api/projects/${currentProjectId}/scenes/${cameraMovementPickerSceneId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            camera_movement_id: movement.id,
          }),
        },
      );

      const updateResult = await updateResponse.json();
      if (updateResult.success) {
        setCameraMovementMapping({
          ...cameraMovementMapping,
          [cameraMovementPickerSceneId]: movement.id,
        });

        if (scriptData?.scenes) {
          setScriptData({
            ...scriptData,
            scenes: scriptData.scenes.map((s) =>
              s.id === cameraMovementPickerSceneId
                ? { ...s, camera_movement_id: movement.id }
                : s,
            ),
          });
        }
        setShowCameraMovementPicker(false);
        await alert(`Camera movement selected: ${movement.name}`, "success");
      } else {
        await alert("Failed to update camera movement", "error");
      }
    } catch (error) {
      await alert("Error selecting camera movement: " + error.message, "error");
    }
  };

  const handleClearCameraMovementForScene = async (sceneId) => {
    if (!currentProjectId || !sceneId) return;
    try {
      const updateResponse = await fetch(
        `/api/projects/${currentProjectId}/scenes/${sceneId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            camera_movement_id: null,
          }),
        },
      );

      const updateResult = await updateResponse.json();
      if (updateResult.success) {
        setCameraMovementMapping((prev) => {
          const next = { ...prev };
          delete next[sceneId];
          return next;
        });

        if (scriptData?.scenes) {
          setScriptData({
            ...scriptData,
            scenes: scriptData.scenes.map((s) =>
              s.id === sceneId ? { ...s, camera_movement_id: null } : s,
            ),
          });
        }

        await alert("Camera movement cleared.", "success");
      } else {
        await alert("Failed to clear camera movement", "error");
      }
    } catch (error) {
      await alert("Error clearing camera movement: " + error.message, "error");
    }
  };

  const handleOpenCharacterMotionPicker = async (sceneId) => {
    try {
      if (availableCharacterMotions.length === 0) {
        await alert(
          "No character motions available. Seeding defaults...",
          "info",
        );
        const seedResponse = await fetch("/api/character-motions/seed", {
          method: "POST",
        });
        const seedResult = await seedResponse.json();
        if (seedResult.success) {
          await loadAvailableCharacterMotions();
        }
      }

      setCharacterMotionPickerSceneId(sceneId);
      setShowCharacterMotionPicker(true);
    } catch (error) {
      await alert("Error loading character motions: " + error.message, "error");
    }
  };

  const handleSelectCharacterMotionFromPicker = async (motion) => {
    if (!currentProjectId || !characterMotionPickerSceneId) return;

    try {
      const updateResponse = await fetch(
        `/api/projects/${currentProjectId}/scenes/${characterMotionPickerSceneId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            character_motion_id: motion.id,
          }),
        },
      );

      const updateResult = await updateResponse.json();
      if (updateResult.success) {
        setCharacterMotionMapping({
          ...characterMotionMapping,
          [characterMotionPickerSceneId]: motion.id,
        });

        if (scriptData?.scenes) {
          setScriptData({
            ...scriptData,
            scenes: scriptData.scenes.map((s) =>
              s.id === characterMotionPickerSceneId
                ? { ...s, character_motion_id: motion.id }
                : s,
            ),
          });
        }
        setShowCharacterMotionPicker(false);
        await alert(`Character motion selected: ${motion.name}`, "success");
      } else {
        await alert("Failed to update character motion", "error");
      }
    } catch (error) {
      await alert(
        "Error selecting character motion: " + error.message,
        "error",
      );
    }
  };

  const handleClearCharacterMotionForScene = async (sceneId) => {
    if (!currentProjectId || !sceneId) return;
    try {
      const updateResponse = await fetch(
        `/api/projects/${currentProjectId}/scenes/${sceneId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            character_motion_id: null,
          }),
        },
      );

      const updateResult = await updateResponse.json();
      if (updateResult.success) {
        setCharacterMotionMapping((prev) => {
          const next = { ...prev };
          delete next[sceneId];
          return next;
        });

        if (scriptData?.scenes) {
          setScriptData({
            ...scriptData,
            scenes: scriptData.scenes.map((s) =>
              s.id === sceneId ? { ...s, character_motion_id: null } : s,
            ),
          });
        }

        await alert("Character motion cleared.", "success");
      } else {
        await alert("Failed to clear character motion", "error");
      }
    } catch (error) {
      await alert("Error clearing character motion: " + error.message, "error");
    }
  };

  const handleChangeSceneLocation = async (sceneId) => {
    if (!currentProjectId) {
      await alert("No project selected.", "warning");
      return;
    }

    try {
      // Fetch all available locations
      const response = await fetch("/api/locations/list");
      const result = await response.json();

      if (!result.success) {
        await alert("Failed to load locations", "error");
        return;
      }

      const allLocations = result.locations || [];

      if (allLocations.length === 0) {
        await alert(
          "No locations available. Please seed or generate locations first.",
          "warning",
        );
        return;
      }

      // Filter out the current location for this scene (if exists)
      const currentLocationId = locationMapping[sceneId];
      const availableLocations = currentLocationId
        ? allLocations.filter((loc) => loc.id !== currentLocationId)
        : allLocations;

      if (availableLocations.length === 0) {
        await alert(
          "No other locations available. Try generating a new one!",
          "warning",
        );
        return;
      }

      // Pick a random location
      const newLocation =
        availableLocations[
          Math.floor(Math.random() * availableLocations.length)
        ];

      // Persist selection on the scene doc
      const updateResponse = await fetch(
        `/api/projects/${currentProjectId}/scenes/${sceneId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location_id: newLocation.id,
          }),
        },
      );

      const updateResult = await updateResponse.json();
      if (updateResult.success) {
        // Update local state
        setLocationMapping({
          ...locationMapping,
          [sceneId]: newLocation.id,
        });

        if (scriptData?.scenes) {
          setScriptData({
            ...scriptData,
            scenes: scriptData.scenes.map((s) =>
              s.id === sceneId ? { ...s, location_id: newLocation.id } : s,
            ),
          });
        }

        // Add to selected locations if not already there
        if (!selectedLocations.find((loc) => loc.id === newLocation.id)) {
          setSelectedLocations([...selectedLocations, newLocation]);
        }

        await alert(`Location changed to: ${newLocation.name}`, "success");
      } else {
        await alert("Failed to update location", "error");
      }
    } catch (error) {
      await alert("Error changing location: " + error.message, "error");
    }
  };

  const handleOpenLocationTypeModal = (sceneId) => {
    setLocationTypeSceneId(sceneId);
    setShowLocationTypeModal(true);
  };

  const handleOpenActionGenerateModal = (sceneId) => {
    setActionGenerateSceneId(sceneId);
    setShowActionGenerateModal(true);
  };

  const handleOpenCameraMovementGenerateModal = (sceneId) => {
    setCameraMovementGenerateSceneId(sceneId);
    setShowCameraMovementGenerateModal(true);
  };

  const handleOpenCharacterMotionGenerateModal = (sceneId) => {
    setCharacterMotionGenerateSceneId(sceneId);
    setShowCharacterMotionGenerateModal(true);
  };

  const handleGenerateNewAction = async (sceneId, keywords = "") => {
    if (!currentProjectId) {
      await alert("No project selected.", "warning");
      return;
    }

    setShowActionGenerateModal(false);
    setActionGenerationKeywords(""); // Reset keywords
    setGeneratingSceneId(sceneId); // Reuse loading state
    try {
      // Generate 1 new action with AI
      const requestBody = {
        count: 1,
        project_id: currentProjectId,
        keywords:
          keywords.trim() || "contemplative, quiet moment, introspective",
      };

      const response = await fetch("/api/actions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!result.success || !result.actions || result.actions.length === 0) {
        await alert("Failed to generate action", "error");
        return;
      }

      const newAction = result.actions[0];
      const cost = result.cost || 0;

      // Persist selection on the scene doc
      const updateResponse = await fetch(
        `/api/projects/${currentProjectId}/scenes/${sceneId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action_id: newAction.id,
          }),
        },
      );

      const updateResult = await updateResponse.json();
      if (updateResult.success) {
        // Update local state
        setActionMapping({
          ...actionMapping,
          [sceneId]: newAction.id,
        });

        if (scriptData?.scenes) {
          setScriptData({
            ...scriptData,
            scenes: scriptData.scenes.map((s) =>
              s.id === sceneId ? { ...s, action_id: newAction.id } : s,
            ),
          });
        }

        // Add to available actions
        setAvailableActions([...availableActions, newAction]);

        // Reload project costs
        const projectResponse = await fetch(
          `/api/projects/${currentProjectId}`,
        );
        const projectResult = await projectResponse.json();
        if (projectResult.success) {
          setProjectCosts(projectResult.project.costs || null);
        }

        await alert(
          `✨ New action generated: ${newAction.name}\nCost: $${cost.toFixed(4)}`,
          "success",
        );
      } else {
        await alert("Failed to update action mapping", "error");
      }
    } catch (error) {
      await alert("Error generating action: " + error.message, "error");
    } finally {
      setGeneratingSceneId(null);
    }
  };

  const handleGenerateNewLocation = async (
    sceneId,
    locationType = null,
    keywords = "",
  ) => {
    if (!currentProjectId) {
      await alert("No project selected.", "warning");
      return;
    }

    setShowLocationTypeModal(false);
    setLocationGenerationKeywords(""); // Reset keywords
    setGeneratingSceneId(sceneId); // Reuse loading state
    try {
      // Generate 1 new location with AI
      const requestBody = {
        count: 1,
        project_id: currentProjectId,
      };
      if (locationType) {
        requestBody.type = locationType;
      }
      if (keywords && keywords.trim()) {
        requestBody.keywords = keywords.trim();
      }

      const response = await fetch("/api/locations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (
        !result.success ||
        !result.locations ||
        result.locations.length === 0
      ) {
        await alert("Failed to generate location", "error");
        return;
      }

      const newLocation = result.locations[0];
      const cost = result.cost || 0;

      // Persist selection on the scene doc
      const updateResponse = await fetch(
        `/api/projects/${currentProjectId}/scenes/${sceneId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location_id: newLocation.id,
          }),
        },
      );

      const updateResult = await updateResponse.json();
      if (updateResult.success) {
        // Update local state
        setLocationMapping({
          ...locationMapping,
          [sceneId]: newLocation.id,
        });

        if (scriptData?.scenes) {
          setScriptData({
            ...scriptData,
            scenes: scriptData.scenes.map((s) =>
              s.id === sceneId ? { ...s, location_id: newLocation.id } : s,
            ),
          });
        }

        // Add to selected locations
        setSelectedLocations([...selectedLocations, newLocation]);

        // Reload project costs
        const projectResponse = await fetch(
          `/api/projects/${currentProjectId}`,
        );
        const projectResult = await projectResponse.json();
        if (projectResult.success) {
          setProjectCosts(projectResult.project.costs || null);
        }

        await alert(
          `✨ New location generated: ${newLocation.name}\nCost: $${cost.toFixed(4)}`,
          "success",
        );
      } else {
        await alert("Failed to update location mapping", "error");
      }
    } catch (error) {
      await alert("Error generating location: " + error.message, "error");
    } finally {
      setGeneratingSceneId(null);
    }
  };

  const handleGenerateNewCameraMovement = async (sceneId, keywords = "") => {
    if (!currentProjectId) {
      await alert("No project selected.", "warning");
      return;
    }

    setShowCameraMovementGenerateModal(false);
    setCameraMovementGenerationKeywords("");
    setGeneratingSceneId(sceneId);

    try {
      const requestBody = {
        count: 1,
        project_id: currentProjectId,
        keywords: keywords.trim() || "slow, cinematic, intimate",
      };

      const response = await fetch("/api/camera-movements/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      const newMovement =
        (result.camera_movements && result.camera_movements[0]) ||
        (result.movements && result.movements[0]);

      if (!result.success || !newMovement) {
        await alert(
          result?.error || "Failed to generate camera movement",
          "error",
        );
        return;
      }

      const cost = result.cost || 0;

      const updateResponse = await fetch(
        `/api/projects/${currentProjectId}/scenes/${sceneId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            camera_movement_id: newMovement.id,
          }),
        },
      );

      const updateResult = await updateResponse.json();
      if (!updateResult.success) {
        await alert("Failed to update camera movement mapping", "error");
        return;
      }

      setCameraMovementMapping({
        ...cameraMovementMapping,
        [sceneId]: newMovement.id,
      });

      if (scriptData?.scenes) {
        setScriptData({
          ...scriptData,
          scenes: scriptData.scenes.map((s) =>
            s.id === sceneId ? { ...s, camera_movement_id: newMovement.id } : s,
          ),
        });
      }

      setAvailableCameraMovements((prev) => {
        if (prev.some((m) => m.id === newMovement.id)) return prev;
        return [...prev, newMovement];
      });

      // Reload project costs
      const projectResponse = await fetch(`/api/projects/${currentProjectId}`);
      const projectResult = await projectResponse.json();
      if (projectResult.success) {
        setProjectCosts(projectResult.project.costs || null);
      }

      await alert(
        `✨ New camera movement generated: ${newMovement.name}\nCost: $${cost.toFixed(4)}`,
        "success",
      );
    } catch (error) {
      await alert(
        "Error generating camera movement: " + error.message,
        "error",
      );
    } finally {
      setGeneratingSceneId(null);
    }
  };

  const handleGenerateNewCharacterMotion = async (sceneId, keywords = "") => {
    if (!currentProjectId) {
      await alert("No project selected.", "warning");
      return;
    }

    setShowCharacterMotionGenerateModal(false);
    setCharacterMotionGenerationKeywords("");
    setGeneratingSceneId(sceneId);

    try {
      const requestBody = {
        count: 1,
        project_id: currentProjectId,
        keywords: keywords.trim() || "subtle, natural, gentle",
      };

      const response = await fetch("/api/character-motions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      const newMotion =
        (result.character_motions && result.character_motions[0]) ||
        (result.motions && result.motions[0]);

      if (!result.success || !newMotion) {
        await alert(
          result?.error || "Failed to generate character motion",
          "error",
        );
        return;
      }

      const cost = result.cost || 0;

      const updateResponse = await fetch(
        `/api/projects/${currentProjectId}/scenes/${sceneId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            character_motion_id: newMotion.id,
          }),
        },
      );

      const updateResult = await updateResponse.json();
      if (!updateResult.success) {
        await alert("Failed to update character motion mapping", "error");
        return;
      }

      setCharacterMotionMapping({
        ...characterMotionMapping,
        [sceneId]: newMotion.id,
      });

      if (scriptData?.scenes) {
        setScriptData({
          ...scriptData,
          scenes: scriptData.scenes.map((s) =>
            s.id === sceneId ? { ...s, character_motion_id: newMotion.id } : s,
          ),
        });
      }

      setAvailableCharacterMotions((prev) => {
        if (prev.some((m) => m.id === newMotion.id)) return prev;
        return [...prev, newMotion];
      });

      // Reload project costs
      const projectResponse = await fetch(`/api/projects/${currentProjectId}`);
      const projectResult = await projectResponse.json();
      if (projectResult.success) {
        setProjectCosts(projectResult.project.costs || null);
      }

      await alert(
        `✨ New character motion generated: ${newMotion.name}\nCost: $${cost.toFixed(4)}`,
        "success",
      );
    } catch (error) {
      await alert(
        "Error generating character motion: " + error.message,
        "error",
      );
    } finally {
      setGeneratingSceneId(null);
    }
  };

  const handleGenerateScript = async () => {
    if (!topic.trim() || !selectedCharacter) {
      await alert("Please enter a topic and select a character", "warning");
      return;
    }

    if (!currentProjectId) {
      await alert("No project selected. Please start from Step 0.", "warning");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/video-generator/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: currentProjectId,
          topic,
          categories: topicCategories,
          selected_character: selectedCharacter,
          scene_count: sceneCount,
          location_count: locationCount,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setScriptData(result.data);
        // Clear voiceover since script changed
        setVoiceoverUrl(null);
        setVoiceoverDuration(null);
        // Reload project costs
        const projectResponse = await fetch(
          `/api/projects/${currentProjectId}`,
        );
        const projectResult = await projectResponse.json();
        if (projectResult.success) {
          setProjectCosts(projectResult.project.costs || null);
        }
        setStep(2);
      } else {
        await alert("Failed to generate script: " + result.error, "error");
      }
    } catch (error) {
      await alert("Error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Generate Voiceover
  const handleGenerateVoiceover = async () => {
    if (!currentProjectId) {
      await alert("No project selected. Please start from Step 0.", "warning");
      return;
    }

    setGeneratingVoiceover(true);
    setVoiceoverDuration(null); // Clear duration when regenerating
    try {
      const response = await fetch("/api/video-generator/generate-voiceover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: currentProjectId,
          script: scriptData.script,
          character: selectedCharacter,
          voice_settings: voiceSettings,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setVoiceoverUrl(result.voiceover_url);
        setSessionId(result.session_id);
        // Duration will be calculated when audio loads
        // Refresh ElevenLabs credits after generation
        loadElevenLabsInfo();
        // Reload project costs
        const projectResponse = await fetch(
          `/api/projects/${currentProjectId}`,
        );
        const projectResult = await projectResponse.json();
        if (projectResult.success) {
          setProjectCosts(projectResult.project.costs || null);
        }
      } else {
        await alert("Failed to generate voiceover: " + result.error, "error");
      }
    } catch (error) {
      await alert("Error: " + error.message, "error");
    } finally {
      setGeneratingVoiceover(false);
    }
  };

  // Step 3: Generate Single Scene Image
  const handleGenerateSingleImage = async (sceneId) => {
    // Use sessionId if available, otherwise use project_id as fallback
    const effectiveSessionId = sessionId || currentProjectId;

    if (!effectiveSessionId) {
      await alert("Project ID is missing. Please reload the page.", "warning");
      return;
    }

    setLoading(true);
    setGeneratingSceneId(sceneId);
    try {
      // Get the scene from current scriptData
      const scene = scriptData?.scenes?.find((s) => s.id === sceneId);

      if (!scene) {
        await alert(
          "Scene not found. Please try refreshing the page.",
          "error",
        );
        setLoading(false);
        setGeneratingSceneId(null);
        return;
      }

      console.log(`[Generate Another] Scene ${sceneId} found`);
      console.log(`[Generate Another] Current prompt:`, scene.image_prompt);

      const promptUsedForNewImage = scene.image_prompt || "";

      // Get character reference image (use selected reference for this scene, or default to first)
      const characterImageUrl =
        selectedReferenceImages[sceneId] ||
        selectedCharacter?.image_urls?.[0] ||
        null;

      // Get location and action for this scene
      const locationId = locationMapping[sceneId];
      const selectedLocation = selectedLocations.find(
        (loc) => loc.id === locationId,
      );
      const actionId = actionMapping[sceneId];
      const selectedAction = availableActions.find((a) => a.id === actionId);

      const response = await fetch(
        "/api/video-generator/generate-single-image",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: effectiveSessionId,
            project_id: currentProjectId,
            scene_id: sceneId,
            image_prompt: scene.image_prompt,
            character_image_url: characterImageUrl,
            character_id: selectedCharacter?.id,
            flux_settings: fluxSettings,
            location: selectedLocation || null,
            action: selectedAction || null,
          }),
        },
      );

      const result = await response.json();
      if (result.success) {
        // Update the scene in scriptData locally
        const updatedScenes = scriptData.scenes.map((s) => {
          if (s.id === sceneId) {
            const existingUrls = Array.isArray(s.image_urls)
              ? s.image_urls
              : [];
            const existingPrompts = Array.isArray(s.image_prompts)
              ? s.image_prompts
              : [];
            return {
              ...s,
              image_urls: [...existingUrls, result.image_url],
              image_prompts: [...existingPrompts, promptUsedForNewImage],
            };
          }
          return s;
        });
        const updatedScriptData = { ...scriptData, scenes: updatedScenes };
        setScriptData(updatedScriptData);

        // Save image_urls to scene document in subcollection
        const updatedScene = updatedScenes.find((s) => s.id === sceneId);
        await fetch(`/api/projects/${currentProjectId}/scenes/${sceneId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_urls: updatedScene?.image_urls || [],
            image_prompts: updatedScene?.image_prompts || [],
          }),
        });

        // Reload project to get updated costs
        const projectResponse = await fetch(
          `/api/projects/${currentProjectId}`,
        );
        const projectResult = await projectResponse.json();
        if (projectResult.success) {
          console.log("Reloaded project costs:", projectResult.project.costs);
          setProjectCosts(projectResult.project.costs || null);
        }
      } else {
        const errorMsg = result.message
          ? `${result.error}: ${result.message}`
          : result.error;
        await alert("Failed to generate image: " + errorMsg, "error");
      }
    } catch (error) {
      await alert("Error generating image: " + error.message, "error");
    } finally {
      setLoading(false);
      setGeneratingSceneId(null);
    }
  };

  const handleOpenAngleEditModal = (sceneId, imageIndex, url) => {
    setAngleEditModal({ sceneId, imageIndex, url });
    setAngleEditSettings({
      horizontal_angle: 0,
      vertical_angle: 0,
      zoom: 5,
      num_images: 1,
    });
  };

  const handleGenerateAngleEdit = async () => {
    if (!angleEditModal) return;
    if (!currentProjectId) {
      await alert("No project selected", "warning");
      return;
    }
    if (!selectedCharacter?.id) {
      await alert("No character selected", "warning");
      return;
    }

    const { sceneId, url, imageIndex } = angleEditModal;
    const key = `${sceneId}::${url}`;
    setEditingImageAngleKey(key);
    // Close modal immediately so the user can keep working.
    setAngleEditModal(null);
    setLoading(true);

    try {
      const response = await fetch("/api/video-generator/edit-image-angles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: currentProjectId,
          scene_id: sceneId,
          character_id: selectedCharacter.id,
          source_image_url: url,
          ...angleEditSettings,
          output_format: "png",
        }),
      });

      const result = await response.json();
      if (!result.success) {
        const msg = result.message
          ? `${result.error}: ${result.message}`
          : result.error;
        await alert(
          "Failed to change angle: " + (msg || "Unknown error"),
          "error",
        );
        return;
      }

      const newUrls = Array.isArray(result.image_urls) ? result.image_urls : [];
      if (newUrls.length === 0) {
        await alert("No images were returned", "error");
        return;
      }

      // Append new variants to the scene's image_urls (preserve ordering)
      const sourceScene = scriptData?.scenes?.find((s) => s.id === sceneId);
      const prevLen = Array.isArray(sourceScene?.image_urls)
        ? sourceScene.image_urls.length
        : 0;
      const sourcePrompts = Array.isArray(sourceScene?.image_prompts)
        ? sourceScene.image_prompts
        : [];
      const promptUsedForSourceImage =
        (Number.isFinite(Number(imageIndex))
          ? sourcePrompts[Math.floor(Number(imageIndex))]
          : null) ||
        sourceScene?.image_prompt ||
        "";

      const updatedScenes = (scriptData?.scenes || []).map((s) => {
        if (s.id !== sceneId) return s;
        const existingUrls = Array.isArray(s.image_urls) ? s.image_urls : [];
        const existingPrompts = Array.isArray(s.image_prompts)
          ? s.image_prompts
          : [];
        return {
          ...s,
          image_urls: [...existingUrls, ...newUrls],
          image_prompts: [
            ...existingPrompts,
            ...newUrls.map(() => promptUsedForSourceImage),
          ],
        };
      });

      const updatedScriptData = { ...scriptData, scenes: updatedScenes };
      setScriptData(updatedScriptData);

      // Persist image_urls to the scene document
      const updatedScene = updatedScenes.find((s) => s.id === sceneId);
      await fetch(`/api/projects/${currentProjectId}/scenes/${sceneId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_urls: updatedScene?.image_urls || [],
          image_prompts: updatedScene?.image_prompts || [],
        }),
      });

      // Select the first newly created variant
      await handleSelectSceneImage(sceneId, prevLen);

      // Reload project costs
      const projectResponse = await fetch(`/api/projects/${currentProjectId}`);
      const projectResult = await projectResponse.json();
      if (projectResult.success) {
        setProjectCosts(projectResult.project.costs || null);
      }
    } catch (error) {
      await alert("Error changing angle: " + error.message, "error");
    } finally {
      setLoading(false);
      setEditingImageAngleKey(null);
    }
  };

  // Step 3: Regenerate Single Image
  const handleRegenerateImage = async (sceneId, imageIndex = null) => {
    setLoading(true);
    setGeneratingSceneId(sceneId); // Show loading indicator
    try {
      const scene = scriptData.scenes.find((s) => s.id === sceneId);
      // Use selected reference for this scene, or default to first
      const characterImageUrl =
        selectedReferenceImages[sceneId] ||
        selectedCharacter?.image_urls?.[0] ||
        null;

      // Get location and action for this scene
      const locationId = locationMapping[sceneId];
      const selectedLocation = selectedLocations.find(
        (loc) => loc.id === locationId,
      );
      const actionId = actionMapping[sceneId];
      const selectedAction = availableActions.find((a) => a.id === actionId);

      const response = await fetch("/api/video-generator/regenerate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          project_id: currentProjectId,
          scene_id: sceneId,
          image_prompt: scene.image_prompt,
          character_image_url: characterImageUrl,
          character_id: selectedCharacter?.id,
          flux_settings: fluxSettings,
          location: selectedLocation || null,
          action: selectedAction || null,
        }),
      });

      const result = await response.json();
      if (result.success) {
        const promptUsedForRegeneratedImage = scene.image_prompt || "";

        // Replace the specific image by index, or the last one if no index provided
        const updatedScenes = scriptData.scenes.map((s) => {
          if (s.id === sceneId) {
            const existingUrls = Array.isArray(s.image_urls)
              ? s.image_urls
              : [];
            let updatedUrls;

            const normalizedPrompts = Array.isArray(s.image_prompts)
              ? s.image_prompts.slice(0, existingUrls.length)
              : [];
            while (normalizedPrompts.length < existingUrls.length) {
              normalizedPrompts.push(s.image_prompt || "");
            }
            let updatedPrompts;

            if (imageIndex !== null && imageIndex < existingUrls.length) {
              // Replace the specific image at the given index
              updatedUrls = existingUrls.map((url, idx) =>
                idx === imageIndex ? result.image_url : url,
              );
              updatedPrompts = normalizedPrompts.map((p, idx) =>
                idx === imageIndex ? promptUsedForRegeneratedImage : p,
              );
              console.log(
                `Replaced image at index ${imageIndex} for scene ${sceneId}`,
              );
            } else {
              // Fallback: Replace the last image
              updatedUrls =
                existingUrls.length > 0
                  ? [...existingUrls.slice(0, -1), result.image_url]
                  : [result.image_url];
              updatedPrompts =
                existingUrls.length > 0
                  ? [
                      ...normalizedPrompts.slice(0, -1),
                      promptUsedForRegeneratedImage,
                    ]
                  : [promptUsedForRegeneratedImage];
              console.log(`Replaced last image for scene ${sceneId}`);
            }

            return {
              ...s,
              image_urls: updatedUrls,
              image_prompts: updatedPrompts,
            };
          }
          return s;
        });
        const updatedScriptData = { ...scriptData, scenes: updatedScenes };
        setScriptData(updatedScriptData);

        // Save image_urls to scene document in subcollection
        const scene = updatedScenes.find((s) => s.id === sceneId);
        await fetch(`/api/projects/${currentProjectId}/scenes/${sceneId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_urls: scene.image_urls,
            image_prompts: scene.image_prompts || [],
          }),
        });

        // Reload project to get updated costs
        const projectResponse = await fetch(
          `/api/projects/${currentProjectId}`,
        );
        const projectResult = await projectResponse.json();
        if (projectResult.success) {
          console.log("Reloaded project costs:", projectResult.project.costs);
          setProjectCosts(projectResult.project.costs || null);
        }
      } else {
        await alert("Failed to regenerate: " + result.error, "error");
      }
    } catch (error) {
      await alert("Error: " + error.message, "error");
    } finally {
      setLoading(false);
      setGeneratingSceneId(null); // Hide loading indicator
    }
  };

  // Step 3: Regenerate Image Prompt with AI
  const handleRegenerateImagePrompt = async (sceneId) => {
    if (!currentProjectId) {
      await alert("No project selected. Please start from Step 0.", "warning");
      return;
    }

    if (!scriptData?.scenes || scriptData.scenes.length === 0) {
      await alert(
        "Script data is missing. Please generate the script first.",
        "warning",
      );
      return;
    }

    const existingScene = scriptData.scenes.find((s) => s.id === sceneId);
    if (!existingScene) {
      await alert("Scene not found. Please refresh and try again.", "error");
      return;
    }

    const ok = await confirm(
      `Generate a new image prompt for Scene ${sceneId}?\n\nYou will review it before saving.`,
      {
        title: "Regenerate Image Prompt",
        confirmText: "Generate",
        cancelText: "Cancel",
      },
    );
    if (!ok) return;

    setLoading(true);
    setRegeneratingPromptSceneId(sceneId);
    try {
      const scene = existingScene;

      // Get selected action for this scene
      const actionId = actionMapping[sceneId];
      const selectedAction = actionId
        ? availableActions.find((a) => a.id === actionId)
        : null;

      const response = await fetch(
        "/api/video-generator/regenerate-image-prompt",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scene_id: sceneId,
            voiceover: scene.voiceover,
            scene_index: sceneId - 1,
            total_scenes: scriptData.scenes.length,
            project_id: currentProjectId,
            location_count: locationCount,
            action: selectedAction, // Pass the full action object
          }),
        },
      );

      const result = await response.json();
      if (result.success) {
        const generatedPrompt = result.image_prompt || "";

        setPromptReviewModal({
          kind: "image_prompt",
          sceneId,
          title: "Review New Image Prompt",
          originalPrompt: scene?.image_prompt || "",
          generatedPrompt,
          cost: result.cost || 0,
        });
        setPromptReviewDraft(generatedPrompt);

        // Reload project to get updated costs
        const projectResponse = await fetch(
          `/api/projects/${currentProjectId}`,
        );
        const projectResult = await projectResponse.json();
        if (projectResult.success) {
          console.log("Reloaded project costs:", projectResult.project.costs);
          setProjectCosts(projectResult.project.costs || null);
        }

        // Note: cost has already been incurred by generation.
      } else {
        await alert("Failed to regenerate prompt: " + result.error, "error");
      }
    } catch (error) {
      await alert("Error regenerating prompt: " + error.message, "error");
    } finally {
      setLoading(false);
      setRegeneratingPromptSceneId(null);
    }
  };

  const handleDiscardPromptReview = () => {
    setPromptReviewModal(null);
    setPromptReviewDraft("");
  };

  const handleAcceptPromptReview = async () => {
    if (!promptReviewModal) return;
    if (!currentProjectId) {
      await alert("No project selected.", "warning");
      return;
    }

    const { kind, sceneId } = promptReviewModal;
    const field = kind === "motion_prompt" ? "motion_prompt" : "image_prompt";
    const nextValue = promptReviewDraft || "";

    setApplyingPromptReview(true);
    try {
      // Update local state
      setScriptData((prev) => {
        if (!prev?.scenes) return prev;
        return {
          ...prev,
          scenes: prev.scenes.map((s) =>
            s.id === sceneId ? { ...s, [field]: nextValue } : s,
          ),
        };
      });

      // Persist to Firestore
      await fetch(`/api/projects/${currentProjectId}/scenes/${sceneId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: nextValue }),
      });

      setPromptReviewModal(null);
      setPromptReviewDraft("");
      await alert("Prompt saved.", "success");
    } catch (error) {
      await alert("Failed to save prompt: " + error.message, "error");
    } finally {
      setApplyingPromptReview(false);
    }
  };

  // Step 3: Auto-save Image Prompt (debounced)
  const handleImagePromptChange = (sceneId, newImagePrompt) => {
    // Update local state immediately
    const updatedScenes = scriptData.scenes.map((scene) => {
      if (scene.id === sceneId) {
        return { ...scene, image_prompt: newImagePrompt };
      }
      return scene;
    });
    setScriptData({ ...scriptData, scenes: updatedScenes });

    // Clear existing timer for this scene
    if (imagePromptSaveTimers.current[sceneId]) {
      clearTimeout(imagePromptSaveTimers.current[sceneId]);
    }

    // Set new timer to save after 1 second of no typing
    imagePromptSaveTimers.current[sceneId] = setTimeout(async () => {
      try {
        await fetch(`/api/projects/${currentProjectId}/scenes/${sceneId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_prompt: newImagePrompt,
          }),
        });
        console.log(`Auto-saved image prompt for scene ${sceneId}`);
      } catch (error) {
        console.error("Error auto-saving image prompt:", error);
      }
    }, 1000);
  };

  // Step 3: Download Image
  const handleDownloadImage = async (imageUrl, sceneId, versionIdx) => {
    try {
      const filename = `scene_${sceneId}_v${versionIdx + 1}.png`;
      const downloadUrl = `/api/download-image?url=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(filename)}`;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
      await alert("Failed to download image", "error");
    }
  };

  // Step 3: Select Primary Image for Scene
  const handleSelectSceneImage = async (sceneId, imageIndex) => {
    if (!currentProjectId) return;

    try {
      // Update local state
      setSelectedSceneImages({
        ...selectedSceneImages,
        [sceneId]: imageIndex,
      });

      // Save to Firestore
      await fetch(`/api/projects/${currentProjectId}/scenes/${sceneId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selected_image_index: imageIndex,
        }),
      });

      await alert(
        `Image ${imageIndex + 1} selected for scene ${sceneId}`,
        "success",
      );
    } catch (error) {
      console.error("Error selecting image:", error);
      await alert("Failed to select image", "error");
    }
  };

  // Step 3: Remove Generated Image
  const handleRemoveImage = async (sceneId, imageIndex) => {
    const confirmed = await confirm(
      `Remove this generated image? This cannot be undone.`,
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const scene = scriptData.scenes.find((s) => s.id === sceneId);
      const imageUrlToDelete = scene.image_urls[imageIndex];
      const updatedUrls = scene.image_urls.filter(
        (_, idx) => idx !== imageIndex,
      );
      const existingPrompts = Array.isArray(scene.image_prompts)
        ? scene.image_prompts
        : [];
      const updatedPrompts = existingPrompts.filter(
        (_, idx) => idx !== imageIndex,
      );

      // Delete image from Cloud Storage and update character project
      await fetch("/api/video-generator/delete-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrlToDelete,
          project_id: currentProjectId,
          character_id: selectedCharacter?.character_id,
          scene_id: sceneId,
        }),
      });

      // Update local state
      const updatedScenes = scriptData.scenes.map((s) => {
        if (s.id === sceneId) {
          return {
            ...s,
            image_urls: updatedUrls,
            image_prompts: updatedPrompts,
          };
        }
        return s;
      });
      setScriptData({ ...scriptData, scenes: updatedScenes });

      // Save to Firestore
      await fetch(`/api/projects/${currentProjectId}/scenes/${sceneId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_urls: updatedUrls,
          image_prompts: updatedPrompts,
        }),
      });
    } catch (error) {
      await alert("Error removing image: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const getSelectedImageUrlForScene = (scene) => {
    const sceneId = normalizeSceneId(scene?.id);
    if (!sceneId) return null;

    // If scenes are linked via `sceneGroups`, child scenes should inherit
    // the leader scene's selected image.
    const { leaderId } = getSceneGroupInfo(
      sceneGroups,
      sceneId,
      sceneIdsInOrder,
    );
    const leaderKey = normalizeSceneId(leaderId);
    const leaderScene =
      scriptData?.scenes?.find((s) => normalizeSceneId(s.id) === leaderKey) ||
      scene;

    const imageUrls = leaderScene?.image_urls;
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) return null;

    // Require explicit selection (either locally or persisted).
    const selectedIndex =
      selectedSceneImages[leaderKey] ?? leaderScene?.selected_image_index;
    if (selectedIndex === undefined || selectedIndex === null) return null;

    const numericIndex = Number(selectedIndex);
    if (!Number.isFinite(numericIndex)) return null;

    const safeIndex = Math.max(
      0,
      Math.min(imageUrls.length - 1, Math.floor(numericIndex)),
    );
    return imageUrls[safeIndex] || null;
  };

  const getSelectedImagePromptForScene = (scene) => {
    const sceneId = normalizeSceneId(scene?.id);
    if (!sceneId) return scene?.image_prompt || "";

    const { leaderId } = getSceneGroupInfo(
      sceneGroups,
      sceneId,
      sceneIdsInOrder,
    );
    const leaderKey = normalizeSceneId(leaderId);
    const leaderScene =
      scriptData?.scenes?.find((s) => normalizeSceneId(s.id) === leaderKey) ||
      scene;

    const imageUrls = leaderScene?.image_urls;
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return leaderScene?.image_prompt || scene?.image_prompt || "";
    }

    const selectedIndex =
      selectedSceneImages[leaderKey] ?? leaderScene?.selected_image_index;
    if (selectedIndex === undefined || selectedIndex === null) {
      return leaderScene?.image_prompt || scene?.image_prompt || "";
    }

    const numericIndex = Number(selectedIndex);
    if (!Number.isFinite(numericIndex)) {
      return leaderScene?.image_prompt || scene?.image_prompt || "";
    }

    const safeIndex = Math.max(
      0,
      Math.min(imageUrls.length - 1, Math.floor(numericIndex)),
    );

    const prompts = Array.isArray(leaderScene?.image_prompts)
      ? leaderScene.image_prompts
      : null;
    return (
      (prompts ? prompts[safeIndex] : null) ||
      leaderScene?.image_prompt ||
      scene?.image_prompt ||
      ""
    );
  };

  const handleMotionPromptChange = async (sceneId, newMotionPrompt) => {
    if (!scriptData?.scenes) return;

    const updatedScenes = scriptData.scenes.map((scene) => {
      if (scene.id === sceneId) {
        return { ...scene, motion_prompt: newMotionPrompt };
      }
      return scene;
    });
    setScriptData({ ...scriptData, scenes: updatedScenes });

    if (motionPromptSaveTimers.current[sceneId]) {
      clearTimeout(motionPromptSaveTimers.current[sceneId]);
    }

    motionPromptSaveTimers.current[sceneId] = setTimeout(async () => {
      try {
        if (!currentProjectId) return;
        await fetch(`/api/projects/${currentProjectId}/scenes/${sceneId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            motion_prompt: newMotionPrompt,
          }),
        });
      } catch (error) {
        console.error("Error auto-saving motion prompt:", error);
      }
    }, 750);
  };

  const handleVideoNegativePromptChange = async (
    sceneId,
    newNegativePrompt,
  ) => {
    if (!scriptData?.scenes) return;

    const updatedScenes = scriptData.scenes.map((scene) => {
      if (scene.id === sceneId) {
        return { ...scene, video_negative_prompt: newNegativePrompt };
      }
      return scene;
    });
    setScriptData({ ...scriptData, scenes: updatedScenes });

    if (videoNegativePromptSaveTimers.current[sceneId]) {
      clearTimeout(videoNegativePromptSaveTimers.current[sceneId]);
    }

    videoNegativePromptSaveTimers.current[sceneId] = setTimeout(async () => {
      try {
        if (!currentProjectId) return;
        await fetch(`/api/projects/${currentProjectId}/scenes/${sceneId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            video_negative_prompt: newNegativePrompt,
          }),
        });
      } catch (error) {
        console.error("Error auto-saving video negative prompt:", error);
      }
    }, 750);
  };

  const handleVideoDurationChange = async (sceneId, nextDurationSeconds) => {
    if (!scriptData?.scenes) return;

    const clamped = clampDurationSeconds(nextDurationSeconds, 8);

    const updatedScenes = scriptData.scenes.map((scene) => {
      if (scene.id === sceneId) {
        return { ...scene, duration: clamped };
      }
      return scene;
    });
    setScriptData({ ...scriptData, scenes: updatedScenes });

    if (videoDurationSaveTimers.current[sceneId]) {
      clearTimeout(videoDurationSaveTimers.current[sceneId]);
    }

    videoDurationSaveTimers.current[sceneId] = setTimeout(async () => {
      try {
        if (!currentProjectId) return;
        await fetch(`/api/projects/${currentProjectId}/scenes/${sceneId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            duration: clamped,
          }),
        });
      } catch (error) {
        console.error("Error auto-saving video duration:", error);
      }
    }, 750);
  };

  const handleGenerateVideoForScene = async (sceneId) => {
    if (!currentProjectId) {
      await alert("No project selected. Please start from Step 0.", "warning");
      return;
    }

    if (!sessionId) {
      await alert(
        "Session ID is missing. Please regenerate the voiceover first.",
        "warning",
      );
      return;
    }

    if (!scriptData?.scenes || scriptData.scenes.length === 0) {
      await alert(
        "Script data is missing. Please generate the script first.",
        "warning",
      );
      return;
    }

    const scene = scriptData.scenes.find((s) => s.id === sceneId);
    if (!scene) {
      await alert("Scene not found. Please refresh and try again.", "error");
      return;
    }

    const selectedImageUrl = getSelectedImageUrlForScene(scene);
    if (!selectedImageUrl) {
      await alert(
        `Scene ${sceneId} has no selected image. Generate/select an image first.`,
        "warning",
      );
      return;
    }

    setGeneratingVideoSceneId(sceneId);
    setLoading(true);
    try {
      const durationSeconds = getSceneDurationSeconds(scene);
      const response = await fetch("/api/video-generator/generate-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: currentProjectId,
          session_id: sessionId,
          images: [
            {
              scene_id: sceneId,
              image_url: selectedImageUrl,
              duration: durationSeconds,
            },
          ],
          script_data: scriptData,
          voiceover_url: voiceoverUrl,
        }),
      });

      const result = await response.json();
      if (result.success) {
        const returnedVideos = result.videos || [];
        const newVideoForScene = returnedVideos.find(
          (v) => toSceneKey(v?.scene_id) === toSceneKey(sceneId),
        );

        // Fill missing selections from session (best-effort), then select the newly generated one.
        setVideos((prev) => {
          const byScene = new Map((prev || []).map((v) => [v.scene_id, v]));
          for (const v of returnedVideos) {
            if (!v?.scene_id || !v?.video_url) continue;
            const key = toSceneKey(v.scene_id);
            if (!key) continue;
            if (!byScene.has(key)) byScene.set(key, { ...v, scene_id: key });
          }
          if (newVideoForScene?.video_url) {
            const key = toSceneKey(sceneId);
            if (!key)
              return Array.from(byScene.values()).sort(
                (a, b) => Number(a.scene_id) - Number(b.scene_id),
              );
            byScene.set(key, {
              scene_id: key,
              video_url: newVideoForScene.video_url,
            });
          }
          return Array.from(byScene.values()).sort(
            (a, b) => Number(a.scene_id) - Number(b.scene_id),
          );
        });

        // Update local scene versions + selection, and persist the selection.
        if (newVideoForScene?.video_url) {
          await handleSelectVideoForScene(sceneId, newVideoForScene.video_url);
        }

        // Reload project costs
        const projectResponse = await fetch(
          `/api/projects/${currentProjectId}`,
        );
        const projectResult = await projectResponse.json();
        if (projectResult.success) {
          setProjectCosts(projectResult.project.costs || null);
        }
      } else {
        await alert(
          "Failed to generate video: " + (result.error || "Unknown error"),
          "error",
        );
      }
    } catch (error) {
      await alert("Error: " + error.message, "error");
    } finally {
      setLoading(false);
      setGeneratingVideoSceneId(null);
    }
  };

  const handleGenerateVideoPromptForScene = async (sceneId) => {
    if (!currentProjectId) {
      await alert("No project selected. Please start from Step 0.", "warning");
      return;
    }

    if (!scriptData?.scenes || scriptData.scenes.length === 0) {
      await alert(
        "Script data is missing. Please generate the script first.",
        "warning",
      );
      return;
    }

    const scene = scriptData.scenes.find((s) => s.id === sceneId);
    if (!scene) {
      await alert("Scene not found. Please refresh and try again.", "error");
      return;
    }

    const selectedImagePrompt = getSelectedImagePromptForScene(scene);

    // Get selected action for this scene (optional)
    const actionId = actionMapping[sceneId];
    const selectedAction = actionId
      ? availableActions.find((a) => a.id === actionId)
      : null;

    const cameraMovementId = cameraMovementMapping[sceneId];
    const selectedCameraMovement = cameraMovementId
      ? availableCameraMovements.find((m) => m.id === cameraMovementId)
      : null;

    const characterMotionId = characterMotionMapping[sceneId];
    const selectedCharacterMotion = characterMotionId
      ? availableCharacterMotions.find((m) => m.id === characterMotionId)
      : null;

    const ok = await confirm(
      `Generate a new video prompt for Scene ${sceneId}?\n\nYou will review it before saving.`,
      {
        title: "Generate Video Prompt",
        confirmText: "Generate",
        cancelText: "Cancel",
      },
    );
    if (!ok) return;

    setGeneratingVideoPromptSceneId(sceneId);
    try {
      const response = await fetch(
        "/api/video-generator/generate-video-prompt",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scene_id: sceneId,
            voiceover: scene.voiceover,
            image_prompt: selectedImagePrompt || "",
            scene_index: sceneId - 1,
            total_scenes: scriptData.scenes.length,
            project_id: currentProjectId,
            action: selectedAction,
            camera_movement: selectedCameraMovement,
            character_motion: selectedCharacterMotion,
            temperature: videoPromptTemperatureByScene[sceneId] ?? 0.8,
          }),
        },
      );

      const result = await response.json();
      if (result.success) {
        const generatedPrompt = result.motion_prompt || "";

        setPromptReviewModal({
          kind: "motion_prompt",
          sceneId,
          title: "Review New Video Prompt",
          originalPrompt: scene?.motion_prompt || "",
          generatedPrompt,
          cost: result.cost || 0,
        });
        setPromptReviewDraft(generatedPrompt);

        // Reload project costs
        const projectResponse = await fetch(
          `/api/projects/${currentProjectId}`,
        );
        const projectResult = await projectResponse.json();
        if (projectResult.success) {
          setProjectCosts(projectResult.project.costs || null);
        }

        // Note: cost has already been incurred by generation.
      } else {
        await alert(
          "Failed to generate video prompt: " +
            (result.error || "Unknown error"),
          "error",
        );
      }
    } catch (error) {
      await alert("Error generating video prompt: " + error.message, "error");
    } finally {
      setGeneratingVideoPromptSceneId(null);
    }
  };

  // Step 3: Generate Videos
  const handleGenerateVideos = async () => {
    setLoading(true);
    try {
      const imagesWithDuration = (images || []).map((img) => {
        const scene = scriptData?.scenes?.find((s) => s.id === img.scene_id);
        return {
          ...img,
          duration: getSceneDurationSeconds(scene),
        };
      });

      const response = await fetch("/api/video-generator/generate-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: currentProjectId,
          session_id: sessionId,
          images: imagesWithDuration,
          script_data: scriptData,
          voiceover_url: voiceoverUrl,
        }),
      });

      const result = await response.json();
      if (result.success) {
        const returnedVideos = result.videos || [];

        // Treat the newly generated set as the default selected set.
        setVideos(
          returnedVideos
            .map((v) => ({ ...v, scene_id: toSceneKey(v?.scene_id) }))
            .filter((v) => v.scene_id && v.video_url),
        );

        // Append versions locally and persist selected_video_url per scene.
        try {
          if (scriptData?.scenes) {
            const bySceneId = new Map(
              returnedVideos
                .filter((v) => v?.scene_id && v?.video_url)
                .map((v) => [v.scene_id, v.video_url]),
            );

            const nextScenes = scriptData.scenes.map((s) => {
              const nextUrl = bySceneId.get(s.id);
              if (!nextUrl) return s;
              const existingUrls = Array.isArray(s.video_urls)
                ? s.video_urls
                : [];
              const nextUrls = uniqueStringsPreserveOrder([
                ...existingUrls,
                nextUrl,
              ]);
              return {
                ...s,
                video_urls: nextUrls,
                selected_video_url: nextUrl,
              };
            });
            setScriptData({ ...scriptData, scenes: nextScenes });

            if (currentProjectId) {
              const persistPromises = returnedVideos
                .filter((v) => v?.scene_id && v?.video_url)
                .map((v) =>
                  fetch(
                    `/api/projects/${currentProjectId}/scenes/${v.scene_id}`,
                    {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ selected_video_url: v.video_url }),
                    },
                  ),
                );
              Promise.allSettled(persistPromises).catch(() => {});
            }
          }
        } catch (e) {
          console.warn("Failed to persist selected videos after generation", e);
        }

        // Reload project costs
        const projectResponse = await fetch(
          `/api/projects/${currentProjectId}`,
        );
        const projectResult = await projectResponse.json();
        if (projectResult.success) {
          setProjectCosts(projectResult.project.costs || null);
        }
        // Best-effort: persist step transition for resume.
        try {
          if (currentProjectId) {
            await fetch(`/api/projects/${currentProjectId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ current_step: 4 }),
            });
          }
        } catch {}
        setStep(4);
      } else {
        await alert("Failed to generate videos: " + result.error, "error");
      }
    } catch (error) {
      await alert("Error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Play music with voiceover (preview mix)
  const handlePlayWithVoiceover = () => {
    if (isPlayingWithVoiceover) {
      const { voiceover, music } = playWithVoiceoverRef.current;
      if (voiceover) voiceover.pause();
      if (music) music.pause();
      playWithVoiceoverRef.current = { voiceover: null, music: null };
      setIsPlayingWithVoiceover(false);
      return;
    }
    if (!voiceoverUrl || !backgroundMusicUrl) return;

    const voiceoverAudio = new Audio(voiceoverUrl);
    const musicAudio = new Audio(backgroundMusicUrl);
    musicAudio.volume = 0.25; // Match assembly mix

    playWithVoiceoverRef.current = { voiceover: voiceoverAudio, music: musicAudio };

    const cleanup = () => {
      playWithVoiceoverRef.current = { voiceover: null, music: null };
      setIsPlayingWithVoiceover(false);
    };

    voiceoverAudio.onended = () => {
      musicAudio.pause();
      cleanup();
    };
    voiceoverAudio.onerror = cleanup;
    musicAudio.onerror = cleanup;

    voiceoverAudio.play();
    musicAudio.play();
    setIsPlayingWithVoiceover(true);
  };

  // Step 6: Render from timeline editor (ShotStack Studio)
  const handleRenderFromEditor = async () => {
    const edit = timelineEditorRef.current?.getEdit?.();
    if (!edit?.timeline || !edit?.output) {
      await alert("Timeline editor not ready. Please wait for it to load.", "error");
      return;
    }
    if (!currentProjectId || !sessionId) {
      await alert("Missing project or session.", "error");
      return;
    }
    setLoading(true);
    setIsAssembling(false);
    try {
      const response = await fetch("/api/video-generator/assemble-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: currentProjectId,
          session_id: sessionId,
          edit,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setIsAssembling(true);
        const projectResponse = await fetch(
          `/api/projects/${currentProjectId}`,
        );
        const projectResult = await projectResponse.json();
        if (projectResult.success) {
          setProjectCosts(projectResult.project.costs || null);
        }
      } else {
        await alert("Failed to render video: " + (result.error || result.message), "error");
      }
    } catch (error) {
      await alert("Error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Post to Social Media
  const handlePostToSocial = async (platform) => {
    setLoading(true);
    try {
      const response = await fetch("/api/video-generator/post-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          platform,
          video_url: finalVideoUrl,
          caption: scriptData.script,
        }),
      });

      const result = await response.json();
      if (result.success) {
        await alert(`Posted to ${platform} successfully!`, "success");
      } else {
        await alert(`Failed to post to ${platform}: ` + result.error, "error");
      }
    } catch (error) {
      await alert("Error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const sceneIdsInOrder = scriptData?.scenes
    ? scriptData.scenes.map((s) => normalizeSceneId(s.id))
    : [];

  const requiredImageSceneIds = scriptData?.scenes
    ? scriptData.scenes
        .map((s) => normalizeSceneId(s.id))
        .filter((id) => {
          const { isChild } = getSceneGroupInfo(
            sceneGroups,
            id,
            sceneIdsInOrder,
          );
          return !isChild;
        })
    : [];

  const hasExplicitSelectedImageForScene = (sceneId) => {
    const normalizedId = normalizeSceneId(sceneId);
    const scene = scriptData?.scenes?.find(
      (s) => normalizeSceneId(s.id) === normalizedId,
    );
    if (
      !scene ||
      !Array.isArray(scene.image_urls) ||
      scene.image_urls.length === 0
    ) {
      return false;
    }

    const selectedIndex =
      selectedSceneImages[normalizedId] ?? scene.selected_image_index;
    if (selectedIndex === undefined || selectedIndex === null) return false;

    const numericIndex = Number(selectedIndex);
    if (!Number.isFinite(numericIndex)) return false;
    const idx = Math.floor(numericIndex);
    return idx >= 0 && idx < scene.image_urls.length;
  };

  const canContinueToVideos =
    requiredImageSceneIds.length > 0 &&
    requiredImageSceneIds.every((id) => hasExplicitSelectedImageForScene(id));

  const updateProjectCurrentStep = async (nextStep) => {
    if (!currentProjectId) return { ok: false, error: "No project selected" };
    try {
      const response = await fetch(`/api/projects/${currentProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_step: nextStep }),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        return { ok: false, error: result?.error || "Failed to update step" };
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error?.message || "Failed to update step" };
    }
  };

  const handleContinueToVideos = async () => {
    if (!canContinueToVideos) return;
    setContinuingToVideos(true);
    const { ok, error } = await updateProjectCurrentStep(4);
    if (!ok) {
      await alert("Could not save progress (current_step). " + error, "error");
      setContinuingToVideos(false);
      return;
    }
    setContinuingToVideos(false);
    setStep(4);
  };

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] space-y-6 text-gray-900 dark:text-gray-100">
      {/* Firebase Env (debug) – dev only */}
      {process.env.NODE_ENV === "development" && (
        <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/40">
          <div className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
            Firebase env (debug)
          </div>
          {!firebaseEnv ? (
            <div className="text-amber-700 dark:text-amber-300">Loading…</div>
          ) : firebaseEnv.error ? (
            <div className="text-red-600 dark:text-red-400">{firebaseEnv.error}</div>
          ) : (
            <div className="grid gap-1 font-mono text-amber-800 dark:text-amber-300">
              <div>Client project: <span className="font-bold">{firebaseEnv.client?.projectId ?? "—"}</span></div>
              <div>Admin project: <span className="font-bold">{firebaseEnv.admin?.projectId ?? "—"}</span></div>
              <div>Admin configured: {firebaseEnv.admin?.configured ? "✓" : "✗"}</div>
              {firebaseEnv.match !== undefined && (
                <div className={firebaseEnv.match ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-500"}>
                  Match: {firebaseEnv.match ? "✓" : "✗ Mismatch"}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Header with Steps */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          {/* Left Side - Project Name or Title */}
          <div className="flex-1 min-w-0">
            {step > 0 && currentProjectName ? (
              <div className="flex flex-col gap-2">
                {editingProjectName ? (
                  <input
                    type="text"
                    value={currentProjectName}
                    onChange={(e) => setCurrentProjectName(e.target.value)}
                    onBlur={() => handleUpdateProjectName(currentProjectName)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUpdateProjectName(currentProjectName);
                      }
                      if (e.key === "Escape") {
                        setEditingProjectName(false);
                      }
                    }}
                    autoFocus
                    className="px-3 py-1 border rounded-lg text-2xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 dark:border-gray-700"
                  />
                ) : (
                  <div
                    onClick={() => setEditingProjectName(true)}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition dark:bg-gray-800/60 dark:hover:bg-gray-800"
                  >
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {currentProjectName}
                    </span>
                    <svg
                      className="w-5 h-5 text-gray-500 dark:text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </div>
                )}
                {topic && (
                  <div className="text-sm text-gray-600 mt-2 dark:text-gray-300">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 shrink-0 dark:text-gray-400">
                        📝 Topic:
                      </span>
                      <span className="font-medium break-words">{topic}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {topic && (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 shrink-0 dark:text-gray-400">
                        📝 Topic:
                      </span>
                      <span className="font-medium break-words">{topic}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Side - Total Spending & Navigation */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Total Spending */}
            {projectCosts && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 dark:bg-green-950/30 dark:border-green-900">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-green-700 font-medium dark:text-green-200">
                    💰 Total Spent:
                  </span>
                  <span className="font-semibold text-green-900 dark:text-green-100">
                    ${(projectCosts.total || 0).toFixed(4)}
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="flex gap-2">
              <a
                href="/admin/projects"
                target="_blank"
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
              >
                📋 Projects
              </a>
              <a
                href="/admin/budget"
                target="_blank"
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
              >
                💰 Budget
              </a>
            </div>
          </div>
        </div>

        {/* Progress Steps - Only show if past Step 0 */}
        {step > 0 && (
          <div className="flex items-center justify-center">
            {[
              { num: 1, label: "Topic & Character" },
              { num: 2, label: "Script & Voice" },
              { num: 3, label: "Scenes" },
              { num: 4, label: "Videos" },
              { num: 5, label: "Music" },
              { num: 6, label: "Assemble" },
              { num: 7, label: "Post" },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div
                  onClick={() => {
                    if (s.num <= maxStepReached) {
                      setStep(s.num);
                    }
                  }}
                  className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full text-sm sm:text-base font-semibold transition-all ${
                    s.num === step
                      ? "bg-blue-600 text-white cursor-pointer hover:bg-blue-700 ring-2 ring-blue-300"
                      : s.num <= maxStepReached
                        ? "bg-blue-500 text-white cursor-pointer hover:bg-blue-700"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {s.num}
                </div>
                <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium hidden md:inline whitespace-nowrap">
                  {s.label}
                </span>
                {idx < 6 && (
                  <div
                    className={`flex-1 h-1 mx-1 sm:mx-4 ${
                      step > s.num
                        ? "bg-blue-600"
                        : "bg-gray-200 dark:bg-gray-800"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 0: Create New or Continue Existing */}
      {step === 0 && (
        <div className="admin-card p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            Get Started
          </h2>

          {/* Create New Project */}
          <div
            onClick={handleCreateNewProject}
            className="border-2 border-gray-200 rounded-lg p-8 cursor-pointer hover:border-blue-500 hover:shadow-lg transition group mb-8 dark:border-gray-800"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-500 transition flex-shrink-0 dark:bg-blue-500/20 dark:group-hover:bg-blue-500">
                <svg
                  className="w-8 h-8 text-blue-600 group-hover:text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1 dark:text-gray-100">
                  Create New Project
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Start fresh with a new topic and character to generate a
                  complete video
                </p>
              </div>
            </div>
          </div>

          {/* Existing Projects List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Continue Existing Project
                {projects.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                    ({projects.length})
                  </span>
                )}
              </h3>
              {projects.length > 0 && (
                <a
                  href="/admin/projects"
                  target="_blank"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Manage All →
                </a>
              )}
            </div>

            {projects.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center dark:border-gray-800">
                <div className="text-gray-400 mb-2">
                  <svg
                    className="w-12 h-12 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm dark:text-gray-300">
                  No existing projects
                </p>
                <p className="text-gray-400 text-xs mt-1 dark:text-gray-400">
                  Create your first project to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {projects.slice(0, 10).map((project) => (
                  <div
                    key={project.id}
                    onClick={() => {
                      if (deletingProjectId === project.id) return;
                      handleSelectProject(project.id);
                    }}
                    className={`relative border rounded-lg p-4 transition hover:shadow-md hover:border-blue-400 bg-gray-50 dark:bg-gray-900/40 dark:border-gray-800 ${
                      deletingProjectId === project.id
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Project Name & Status */}
                        <div className="mb-2 flex items-center gap-2 flex-wrap">
                          {project.project_name && (
                            <span className="inline-block text-xs font-semibold text-gray-700 bg-gray-200 px-2 py-1 rounded dark:bg-gray-800 dark:text-gray-200">
                              {project.project_name}
                            </span>
                          )}
                          <span
                            className={`inline-block text-xs font-medium px-2 py-1 rounded ${getProjectStatus(project).color}`}
                          >
                            {getProjectStatus(project).label}
                          </span>
                        </div>

                        {/* Topic */}
                        <h4 className="text-sm font-medium text-gray-900 mb-1 dark:text-gray-100">
                          {project.topic || "Untitled"}
                        </h4>

                        {/* Character & Dates */}
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-2 dark:text-gray-400">
                          <span>
                            👤 {project.character?.name || "No character"}
                          </span>
                          <span>
                            📅{" "}
                            {new Date(project.created_at).toLocaleDateString()}
                          </span>
                          {project.updated_at &&
                            project.updated_at !== project.created_at && (
                              <span>
                                🔄{" "}
                                {new Date(
                                  project.updated_at,
                                ).toLocaleDateString()}
                              </span>
                            )}
                          {project.costs && (
                            <span className="font-medium text-green-600">
                              💰 $
                              {(
                                (project.costs.claude || 0) +
                                (project.costs.elevenlabs || 0) +
                                (project.costs.fal_images || 0) +
                                (project.costs.fal_videos || 0) +
                                (project.costs.shotstack || 0)
                              ).toFixed(4)}
                            </span>
                          )}
                        </div>

                        {/* Categories */}
                        {project.categories &&
                          project.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {project.categories.map((cat, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded"
                                >
                                  {cat}
                                </span>
                              ))}
                            </div>
                          )}
                      </div>
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (deletingProjectId === project.id) return;
                            setOpenProjectMenuId((prev) =>
                              prev === project.id ? null : project.id,
                            );
                          }}
                          disabled={deletingProjectId === project.id}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                          aria-label="Project actions"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 14a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {openProjectMenuId === project.id && (
                      <div
                        ref={projectMenuRef}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className="absolute right-3 top-12 z-20 w-44 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden dark:border-gray-800 dark:bg-gray-900"
                      >
                        <button
                          type="button"
                          onClick={() => handleRenameProjectFromList(project)}
                          disabled={deletingProjectId === project.id}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProjectFromList(project)}
                          disabled={deletingProjectId === project.id}
                          className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition disabled:opacity-60 disabled:cursor-not-allowed dark:text-red-300 dark:hover:bg-red-950/30"
                        >
                          {deletingProjectId === project.id ? (
                            <span className="inline-flex items-center gap-2">
                              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                              Deleting...
                            </span>
                          ) : (
                            "Delete"
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {projects.length > 10 && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                Showing 10 most recent projects.{" "}
                <a
                  href="/admin/projects"
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  View all {projects.length}
                </a>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Topic Library Modal */}
      {showTopicLibrary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold">Topic Library</h2>
              <button
                onClick={() => setShowTopicLibrary(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {topics.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No topics in library yet</p>
                  <button
                    onClick={() => {
                      setShowTopicLibrary(false);
                      setTopicMode("generate");
                    }}
                    className="text-purple-600 hover:underline"
                  >
                    Generate topics with AI first →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Filter & Sort */}
                  <div className="flex items-center gap-4 flex-wrap mb-4 pb-4 border-b">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        Category:
                      </label>
                      <select
                        value={modalFilterCategory}
                        onChange={(e) => setModalFilterCategory(e.target.value)}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="all">All</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        Status:
                      </label>
                      <select
                        value={modalFilterStatus}
                        onChange={(e) => setModalFilterStatus(e.target.value)}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="all">All</option>
                        <option value="unused">Unused</option>
                        <option value="used">Used</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        Sort:
                      </label>
                      <select
                        value={modalSortOrder}
                        onChange={(e) => setModalSortOrder(e.target.value)}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-gray-600">
                        {
                          topics.filter((t) => {
                            const categoryMatch =
                              modalFilterCategory === "all" ||
                              (Array.isArray(t.categories)
                                ? t.categories.includes(modalFilterCategory)
                                : t.category === modalFilterCategory);
                            const statusMatch =
                              modalFilterStatus === "all" ||
                              (modalFilterStatus === "unused" &&
                                !t.generated) ||
                              (modalFilterStatus === "used" && t.generated);
                            return categoryMatch && statusMatch;
                          }).length
                        }{" "}
                        {modalFilterCategory === "all" &&
                        modalFilterStatus === "all"
                          ? "total topics"
                          : "topics"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {topics
                      .filter((t) => {
                        // Category filter
                        const categoryMatch =
                          modalFilterCategory === "all" ||
                          (Array.isArray(t.categories)
                            ? t.categories.includes(modalFilterCategory)
                            : t.category === modalFilterCategory);

                        // Status filter
                        const statusMatch =
                          modalFilterStatus === "all" ||
                          (modalFilterStatus === "unused" && !t.generated) ||
                          (modalFilterStatus === "used" && t.generated);

                        return categoryMatch && statusMatch;
                      })
                      .sort((a, b) => {
                        const dateA = new Date(a.created_at || 0);
                        const dateB = new Date(b.created_at || 0);
                        return modalSortOrder === "newest"
                          ? dateB - dateA
                          : dateA - dateB;
                      })
                      .map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            setTopic(t.topic);
                            setTopicCategories(
                              Array.isArray(t.categories)
                                ? t.categories
                                : t.category
                                  ? [t.category]
                                  : [],
                            );
                            setShowTopicLibrary(false);
                          }}
                          className={`border rounded-lg p-4 cursor-pointer transition hover:shadow-md bg-white relative ${
                            topic === t.topic
                              ? "border-green-600 bg-green-50"
                              : "border-gray-200 hover:border-gray-300"
                          } ${t.generated ? "opacity-60" : ""}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-start gap-2 mb-2">
                                <p className="text-sm font-medium text-gray-900 flex-1">
                                  {t.topic}
                                </p>
                                {t.generated && (
                                  <span className="flex-shrink-0 inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                    ✓ Used
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {Array.isArray(t.categories)
                                  ? t.categories.map((cat, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                                      >
                                        {cat}
                                      </span>
                                    ))
                                  : t.category && (
                                      <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                        {t.category}
                                      </span>
                                    )}
                                {!t.generated && (
                                  <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                    New
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* No results message */}
                  {topics.filter((t) => {
                    const categoryMatch =
                      modalFilterCategory === "all" ||
                      (Array.isArray(t.categories)
                        ? t.categories.includes(modalFilterCategory)
                        : t.category === modalFilterCategory);
                    const statusMatch =
                      modalFilterStatus === "all" ||
                      (modalFilterStatus === "unused" && !t.generated) ||
                      (modalFilterStatus === "used" && t.generated);
                    return categoryMatch && statusMatch;
                  }).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-2">
                        No topics found with current filters
                      </p>
                      <button
                        onClick={() => {
                          setModalFilterCategory("all");
                          setModalFilterStatus("all");
                        }}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t bg-gray-50 dark:bg-gray-950/40 dark:border-gray-800">
              <button
                onClick={() => setShowTopicLibrary(false)}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl animate-in zoom-in duration-300 dark:bg-gray-900 dark:border dark:border-gray-800">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-500">
                <svg
                  className="w-10 h-10 text-white animate-in slide-in-from-top duration-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
              Success!
            </h3>
            <p className="text-gray-600 mb-8 text-lg dark:text-gray-300">
              {successMessage}
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Topic & Character Selection */}
      {step === 1 && (
        <div className="admin-card-solid p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-3">
              Step 1: Choose Topic & Character
            </h2>
            <div className="flex flex-wrap gap-2">
              <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-blue-700">🤖 Claude:</span>
                <span className="font-semibold text-blue-900">
                  {process.env.NEXT_PUBLIC_CLAUDE_MODEL?.replace(
                    "claude-sonnet-4-",
                    "Sonnet 4.",
                  ) || "Sonnet 4"}
                </span>
              </div>
              <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-blue-700">📥 Claude Input:</span>
                <span className="font-semibold text-blue-900">
                  $
                  {(
                    parseFloat(
                      process.env.NEXT_PUBLIC_CLAUDE_INPUT_PER_MILLION ||
                        "3.00",
                    ) / 1000000
                  ).toFixed(6)}
                  /tok
                </span>
              </div>
              <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-blue-700">📤 Claude Output:</span>
                <span className="font-semibold text-blue-900">
                  $
                  {(
                    parseFloat(
                      process.env.NEXT_PUBLIC_CLAUDE_OUTPUT_PER_MILLION ||
                        "15.00",
                    ) / 1000000
                  ).toFixed(6)}
                  /tok
                </span>
              </div>
              {projectCosts?.step1?.claude > 0 && (
                <div className="bg-gray-50 border border-gray-300 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap dark:bg-gray-900 dark:border-gray-800">
                  <span className="text-gray-700 dark:text-gray-300">
                    💰 Step 1 Cost:
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    ${projectCosts.step1.claude.toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Topic Selection - Three Options */}
          <div className="mb-8">
            <label className="admin-label mb-3">Video Topic</label>

            {/* Mode Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setTopicMode("manual")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  topicMode === "manual"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                ✏️ Enter Manually
              </button>
              <button
                onClick={() => setTopicMode("generate")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  topicMode === "generate"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                🤖 Generate with AI
              </button>
            </div>

            {/* Manual Entry Mode */}
            {topicMode === "manual" && (
              <div className="space-y-4">
                <div>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        onFocus={() => setTopicInputFocused(true)}
                        onBlur={() =>
                          setTimeout(() => setTopicInputFocused(false), 200)
                        }
                        placeholder="e.g., How I manifested my dream job"
                        className="w-full px-4 py-3 border rounded-lg text-lg bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 dark:border-gray-700"
                      />

                      {/* Topic Suggestions Dropdown */}
                      {topicInputFocused && topics.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto dark:bg-gray-900 dark:border-gray-800">
                          {topics
                            .filter(
                              (t) =>
                                topic === "" ||
                                t.topic
                                  .toLowerCase()
                                  .includes(topic.toLowerCase()),
                            )
                            .slice(0, 10)
                            .map((t) => (
                              <button
                                key={t.id}
                                onClick={() => {
                                  setTopic(t.topic);
                                  setTopicCategories(
                                    Array.isArray(t.categories)
                                      ? t.categories
                                      : t.category
                                        ? [t.category]
                                        : [],
                                  );
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 dark:hover:bg-gray-800 dark:border-gray-800"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm text-gray-900 flex-1 dark:text-gray-100">
                                    {t.topic}
                                  </p>
                                  {t.generated && (
                                    <span className="flex-shrink-0 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                      Used
                                    </span>
                                  )}
                                </div>
                                {(Array.isArray(t.categories)
                                  ? t.categories
                                  : t.category
                                    ? [t.category]
                                    : []
                                ).length > 0 && (
                                  <div className="flex gap-1 mt-1">
                                    {(Array.isArray(t.categories)
                                      ? t.categories
                                      : [t.category]
                                    ).map((cat, idx) => (
                                      <span
                                        key={idx}
                                        className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded dark:bg-gray-800 dark:text-gray-300"
                                      >
                                        {cat}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </button>
                            ))}
                          {topics.filter(
                            (t) =>
                              topic === "" ||
                              t.topic
                                .toLowerCase()
                                .includes(topic.toLowerCase()),
                          ).length === 0 && (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                              No matching topics found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setShowTopicLibrary(true)}
                      className="group px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200 whitespace-nowrap flex items-center gap-2"
                    >
                      <svg
                        className="w-5 h-5 group-hover:scale-110 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                      Browse Library
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Type your custom topic or select from suggestions
                    </p>
                    <a
                      href="/admin/topics"
                      target="_blank"
                      className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                    >
                      ⚙️ Manage Topics
                    </a>
                  </div>
                </div>

                <div>
                  <label className="admin-label mb-2">Categories (Tags)</label>

                  {/* Selected Categories Display */}
                  {topicCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {topicCategories.map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                        >
                          {cat}
                          <button
                            onClick={() => handleRemoveCategory(cat)}
                            className="hover:text-blue-900"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Category Input with Suggestions */}
                  <div className="relative">
                    <input
                      type="text"
                      value={categoryInput}
                      onChange={(e) => setCategoryInput(e.target.value)}
                      onKeyDown={handleCategoryKeyDown}
                      onFocus={() => setCategoryInputFocused(true)}
                      onBlur={() =>
                        setTimeout(() => setCategoryInputFocused(false), 200)
                      }
                      placeholder="Type category or select from suggestions..."
                      className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 dark:border-gray-700"
                    />

                    {/* Suggestions Dropdown */}
                    {categoryInputFocused && categories.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto dark:bg-gray-900 dark:border-gray-800">
                        {categories
                          .filter(
                            (cat) =>
                              !topicCategories.includes(cat.name) &&
                              (categoryInput === "" ||
                                cat.name
                                  .toLowerCase()
                                  .includes(categoryInput.toLowerCase())),
                          )
                          .map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => handleAddCategory(cat.name)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm dark:hover:bg-gray-800"
                            >
                              {cat.name}
                            </button>
                          ))}
                        {/* Option to add as custom if not in suggestions */}
                        {categoryInput &&
                          !categories.some(
                            (cat) =>
                              cat.name.toLowerCase() ===
                              categoryInput.toLowerCase(),
                          ) && (
                            <button
                              onClick={() => handleAddCategory(categoryInput)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm border-t text-blue-600 dark:hover:bg-gray-800 dark:border-gray-800"
                            >
                              + Add &quot;{categoryInput}&quot; as new category
                            </button>
                          )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Press Enter or click suggestions to add categories. Type
                      custom categories if needed.
                    </p>
                    <a
                      href="/admin/categories"
                      target="_blank"
                      className="text-xs text-blue-600 hover:underline whitespace-nowrap ml-2"
                    >
                      ⚙️ Manage Categories
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Generate with AI Mode */}
            {topicMode === "generate" && (
              <div className="space-y-4">
                {/* Number of Topics */}
                <div>
                  <label className="admin-label mb-2">
                    Number of Topics to Generate
                  </label>
                  <select
                    value={aiGenerateCount}
                    onChange={(e) => setAiGenerateCount(Number(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 dark:border-gray-700"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "topic" : "topics"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Optional Category Selection */}
                <div>
                  <label className="admin-label mb-2">
                    Target Categories (Optional)
                  </label>

                  {/* Selected Categories Display */}
                  {aiGenerateCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {aiGenerateCategories.map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm dark:bg-purple-900/40 dark:text-purple-200"
                        >
                          {cat}
                          <button
                            onClick={() =>
                              setAiGenerateCategories(
                                aiGenerateCategories.filter((c) => c !== cat),
                              )
                            }
                            className="hover:text-purple-900"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Category Selection Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          if (aiGenerateCategories.includes(cat.name)) {
                            setAiGenerateCategories(
                              aiGenerateCategories.filter(
                                (c) => c !== cat.name,
                              ),
                            );
                          } else {
                            setAiGenerateCategories([
                              ...aiGenerateCategories,
                              cat.name,
                            ]);
                          }
                        }}
                        className={`px-3 py-1 rounded-lg text-sm transition ${
                          aiGenerateCategories.includes(cat.name)
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Leave empty to let AI choose from all categories
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 text-center">
                  <p className="text-gray-700 mb-4 font-medium">
                    Generate comforting topic ideas using AI
                  </p>
                  <button
                    onClick={handleGenerateTopics}
                    disabled={generatingTopics}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 mx-auto"
                  >
                    {generatingTopics ? (
                      <>
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        Generating {aiGenerateCount} topic
                        {aiGenerateCount !== 1 ? "s" : ""}...
                      </>
                    ) : (
                      <>
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
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        Generate {aiGenerateCount} Topic{" "}
                        {aiGenerateCount !== 1 ? "Ideas" : "Idea"}
                      </>
                    )}
                  </button>

                  {generatingTopics && (
                    <div className="mt-4 bg-white dark:bg-gray-900 rounded-lg p-4 border border-purple-200 dark:border-purple-900/60">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1">
                          <div className="w-full bg-purple-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-pulse shadow-lg"
                              style={{
                                width: "100%",
                                animation: "pulse 1.5s ease-in-out infinite",
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-purple-700 font-medium dark:text-purple-200">
                        ✨ Creating {aiGenerateCount} comforting topic
                        {aiGenerateCount !== 1 ? "s" : ""} for you...
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-3">
                    {aiGenerateCategories.length > 0
                      ? `AI will create topics in: ${aiGenerateCategories.join(", ")}`
                      : "AI will create validating, reassuring topics"}
                  </p>
                </div>

                {topic && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">
                      Selected Topic:
                    </p>
                    <p className="font-medium">{topic}</p>
                  </div>
                )}

                {/* Generated Topics Display */}
                {generatedTopics.length > 0 && (
                  <div className="border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Generated Topics ({generatedTopics.length})
                      </h3>
                      <button
                        onClick={() => setGeneratedTopics([])}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {generatedTopics.map((t, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setTopic(t.topic);
                            setTopicCategories(
                              Array.isArray(t.categories)
                                ? t.categories
                                : t.category
                                  ? [t.category]
                                  : [],
                            );
                            setTopicMode("manual");
                          }}
                          className="border border-gray-200 rounded-lg p-3 hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition"
                        >
                          <p className="text-sm text-gray-900 mb-2">
                            {t.topic}
                          </p>
                          {(Array.isArray(t.categories)
                            ? t.categories
                            : t.category
                              ? [t.category]
                              : []
                          ).length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {(Array.isArray(t.categories)
                                ? t.categories
                                : [t.category]
                              ).map((cat, cidx) => (
                                <span
                                  key={cidx}
                                  className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded"
                                >
                                  {cat}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Click any topic to use it
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Character Selection */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Select Character
              </label>
              <a
                href="/admin/characters"
                target="_blank"
                className="text-xs text-blue-600 hover:underline"
              >
                ⚙️ Manage Characters
              </a>
            </div>
            {characters.length === 0 ? (
              <div className="bg-gray-50 border rounded-lg p-6 text-center">
                <p className="text-gray-500 mb-3">No characters found</p>
                <a
                  href="/admin/characters"
                  className="text-blue-600 hover:underline"
                >
                  Create characters first →
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {characters.map((char) => (
                  <div
                    key={char.character_id}
                    onClick={() => setSelectedCharacter(char)}
                    className={`border-2 rounded-lg p-3 cursor-pointer transition hover:shadow-md ${
                      selectedCharacter?.character_id === char.character_id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {/* Character Image */}
                    {char.image_urls && char.image_urls.length > 0 ? (
                      <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                        <img
                          src={char.image_urls[0]}
                          alt={char.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                        <span className="text-4xl">
                          {char.gender === "male"
                            ? "👨"
                            : char.gender === "female"
                              ? "👩"
                              : "🧑"}
                        </span>
                      </div>
                    )}

                    {/* Character Info */}
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        {char.name || "Unnamed"}
                      </p>
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                        <span>{char.gender}</span>
                        <span>•</span>
                        <span>{char.age}</span>
                      </div>
                    </div>

                    {/* Selected Indicator */}
                    {selectedCharacter?.character_id === char.character_id && (
                      <div className="mt-2 text-center">
                        <span className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          ✓ Selected
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scene Count Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Number of Scenes
            </label>
            <div className="flex gap-3">
              {[3, 4, 5, 6, 8].map((count) => (
                <button
                  key={count}
                  onClick={() => setSceneCount(count)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition ${
                    sceneCount === count
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {count} scenes
                  <div className="text-xs text-gray-500 mt-1">
                    {count * 8}s total
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Each scene is 8 seconds. Total video duration: {sceneCount * 8}{" "}
              seconds • Target script length: ~{sceneCount * 8 * 12} characters
            </p>
          </div>

          {/* Location Count Selection */}
          <div className="mb-8">
            <label className="admin-label mb-3">
              Number of Different Locations
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setLocationCount(null)}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition ${
                  locationCount === null
                    ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
                }`}
              >
                All Different
                <div className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                  {sceneCount} locations
                </div>
              </button>
              {[2, 3, 4]
                .filter((count) => count <= sceneCount)
                .map((count) => (
                  <button
                    key={count}
                    onClick={() => setLocationCount(count)}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition ${
                      locationCount === count
                        ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
                    }`}
                  >
                    {count} Locations
                    <div className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                      ~{Math.ceil(sceneCount / count)} scenes each
                    </div>
                  </button>
                ))}
            </div>
            <p className="text-xs text-gray-500 mt-2 dark:text-gray-400">
              {locationCount === null
                ? "Every scene will have a unique location"
                : `Scenes will be grouped across ${locationCount} different locations`}
            </p>
          </div>

          {/* Location Info Note */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/30 dark:border-blue-900">
            <div className="flex items-start gap-2">
              <span className="text-blue-600">📍</span>
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 text-sm mb-1">
                  Locations Per Scene
                </h4>
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  After generating the script, you&apos;ll assign locations to
                  each scene individually in Step 3. You can either select from
                  the library or generate new ones with AI.
                </p>
              </div>
            </div>
          </div>

          {scriptData ? (
            <>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-blue-600 text-white py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700"
                >
                  Continue →
                </button>
              </div>
              <div className="text-center mt-3">
                <button
                  onClick={async () => {
                    const confirmed = await confirm(
                      "⚠️ Regenerating will overwrite your existing script and incur additional API costs. Continue?",
                      "warning",
                    );
                    if (confirmed) {
                      handleGenerateScript();
                    }
                  }}
                  disabled={loading || !topic.trim() || !selectedCharacter}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Regenerating..." : "Regenerate Script"}
                </button>
              </div>
            </>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={() => setStep(0)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                ← Back
              </button>
              <button
                onClick={handleGenerateScript}
                disabled={loading || !topic.trim() || !selectedCharacter}
                className="flex-1 bg-blue-600 text-white py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Generating Script..." : "Generate Script →"}
              </button>
            </div>
          )}

          {/* Script Generation Loading Bar */}
          {loading && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="text-sm font-medium text-blue-900">
                  Generating your script with AI...
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full animate-pulse"
                  style={{ width: "100%" }}
                ></div>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                This usually takes 10-15 seconds
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Script & Voiceover */}
      {step === 2 && scriptData && (
        <div className="admin-card p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-3">
              Step 2: Script & Voiceover
            </h2>
            <div className="flex flex-wrap gap-2">
              <div className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap dark:bg-blue-900/40 dark:text-blue-200">
                📝 {scriptData.scenes?.length || sceneCount} scenes
              </div>
              <div className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap dark:bg-purple-900/40 dark:text-purple-200">
                ⏱️ {(scriptData.scenes?.length || sceneCount) * 8}s
              </div>
              <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-blue-700">🤖 Claude:</span>
                <span className="font-semibold text-blue-900">
                  {process.env.NEXT_PUBLIC_CLAUDE_MODEL?.replace(
                    "claude-sonnet-4-",
                    "Sonnet 4.",
                  ) || "Sonnet 4"}
                </span>
              </div>
              <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-blue-700">📥 Claude Input:</span>
                <span className="font-semibold text-blue-900">
                  $
                  {(
                    parseFloat(
                      process.env.NEXT_PUBLIC_CLAUDE_INPUT_PER_MILLION ||
                        "3.00",
                    ) / 1000000
                  ).toFixed(6)}
                  /tok
                </span>
              </div>
              <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-blue-700">📤 Claude Output:</span>
                <span className="font-semibold text-blue-900">
                  $
                  {(
                    parseFloat(
                      process.env.NEXT_PUBLIC_CLAUDE_OUTPUT_PER_MILLION ||
                        "15.00",
                    ) / 1000000
                  ).toFixed(6)}
                  /tok
                </span>
              </div>
              {projectCosts?.step2?.claude > 0 && (
                <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-blue-700">🤖 Claude:</span>
                  <span className="font-semibold text-blue-900">
                    ${projectCosts.step2.claude.toFixed(4)}
                  </span>
                </div>
              )}
              {projectCosts?.step2?.elevenlabs > 0 && (
                <div className="bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-purple-700">🎤 ElevenLabs:</span>
                  <span className="font-semibold text-purple-900">
                    ${projectCosts.step2.elevenlabs.toFixed(4)}
                  </span>
                </div>
              )}
              {projectCosts?.step2?.total > 0 && (
                <div className="bg-gray-50 border border-gray-300 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap dark:bg-gray-950/40 dark:border-gray-800">
                  <span className="text-gray-700 dark:text-gray-300">
                    💰 Step 2 Total:
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    ${projectCosts.step2.total.toFixed(4)}
                  </span>
                </div>
              )}
              {elevenLabsInfo && elevenLabsInfo.character_limit && (
                <div className="bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-purple-700">🎤 ElevenLabs:</span>
                  <span className="font-semibold text-purple-900">
                    {elevenLabsInfo.characters_remaining?.toLocaleString() || 0}
                  </span>
                  <span className="text-purple-600">
                    / {elevenLabsInfo.character_limit?.toLocaleString()}
                  </span>
                </div>
              )}
              {elevenLabsInfo &&
                elevenLabsInfo.tier &&
                elevenLabsInfo.cost_per_char !== undefined && (
                  <div className="bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                    <span className="text-green-700">
                      📊 ElevenLabs {elevenLabsInfo.tier}:
                    </span>
                    <span className="font-semibold text-green-900">
                      ${elevenLabsInfo.cost_per_char.toFixed(6)}/char
                    </span>
                  </div>
                )}
            </div>
          </div>

          {/* Full Script */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <label className="block font-semibold">
                  Full Voiceover Script:
                </label>
                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded dark:bg-gray-800 dark:text-gray-300">
                  {scriptData?.script?.length || 0} / {sceneCount * 8 * 12}{" "}
                  chars
                </span>
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded dark:bg-blue-950/30 dark:text-blue-200">
                  ~{Math.round((scriptData?.script?.length || 0) / 14.5)}s
                  estimated
                </span>
                {scriptSaving && (
                  <span className="text-xs text-gray-500 flex items-center gap-1 dark:text-gray-400">
                    <div className="animate-spin h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                    Saving...
                  </span>
                )}
                {scriptSaved && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    ✓ Saved
                  </span>
                )}
              </div>
              <button
                onClick={async () => {
                  if (
                    await confirm(
                      "This will generate a completely new script and overwrite the current one. Continue?",
                    )
                  ) {
                    handleGenerateScript();
                  }
                }}
                disabled={loading}
                className="text-sm bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                {loading ? "Regenerating..." : "🔄 Regenerate Script"}
              </button>
            </div>
            <textarea
              value={scriptData.script}
              onChange={(e) =>
                setScriptData({ ...scriptData, script: e.target.value })
              }
              rows={12}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 dark:border-gray-700"
              placeholder="Your script here..."
            />
            <div className="text-xs text-gray-500 mt-2 space-y-1 dark:text-gray-400">
              <p>
                Edit your script before generating the voiceover. This will be
                the narration for your entire video.
              </p>
              <p className="text-purple-600">
                💡 <strong>Tip:</strong> Add pauses using:{" "}
                <code className="bg-gray-100 px-1 py-0.5 rounded dark:bg-gray-800 dark:text-gray-200">
                  [pause:2s]
                </code>{" "}
                or{" "}
                <code className="bg-gray-100 px-1 py-0.5 rounded dark:bg-gray-800 dark:text-gray-200">
                  [pause:500ms]
                </code>{" "}
                or{" "}
                <code className="bg-gray-100 px-1 py-0.5 rounded dark:bg-gray-800 dark:text-gray-200">
                  [pause]
                </code>{" "}
                (1s default)
              </p>
            </div>
          </div>

          {/* Voiceover Generation */}
          <div className="mb-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 dark:bg-purple-950/30 dark:border-purple-900">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">Generate Voiceover</h3>
                  <a
                    href="/admin/characters"
                    target="_blank"
                    className="text-xs bg-white border border-purple-300 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-1.5 font-medium dark:bg-gray-900 dark:border-purple-900 dark:text-purple-200 dark:hover:bg-purple-950/40"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    Manage Characters
                  </a>
                </div>
                {/* ElevenLabs Credits Display */}
                {elevenLabsInfo &&
                  elevenLabsInfo.character_limit &&
                  elevenLabsInfo.character_count !== undefined && (
                    <div className="flex items-center gap-2 text-xs">
                      <div className="bg-white border border-purple-300 rounded-lg px-3 py-1.5 dark:bg-gray-900 dark:border-purple-900">
                        <span className="text-gray-600 dark:text-gray-300">
                          ElevenLabs{" "}
                        </span>
                        {elevenLabsInfo.tier && (
                          <span className="text-purple-600 font-medium">
                            ({elevenLabsInfo.tier}):{" "}
                          </span>
                        )}
                        <span className="font-semibold text-purple-700">
                          {elevenLabsInfo.characters_remaining?.toLocaleString() ||
                            (
                              elevenLabsInfo.character_limit -
                              elevenLabsInfo.character_count
                            ).toLocaleString()}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {" "}
                          / {elevenLabsInfo.character_limit.toLocaleString()}
                        </span>
                      </div>
                      <button
                        onClick={loadElevenLabsInfo}
                        disabled={loadingElevenLabsInfo}
                        className="text-purple-600 hover:text-purple-700 disabled:opacity-50"
                        title="Refresh credits"
                      >
                        <svg
                          className={`w-4 h-4 ${loadingElevenLabsInfo ? "animate-spin" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
              </div>

              {/* Voice Settings */}
              <div className="mb-4 space-y-3">
                <details className="bg-white border border-purple-200 rounded-lg p-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-purple-700">
                    ⚙️ Voice Settings (Advanced)
                  </summary>
                  <div className="mt-4 space-y-4">
                    {/* Stability */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-gray-700">
                          Stability
                        </label>
                        <span className="text-xs text-gray-500">
                          {voiceSettings.stability.toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={voiceSettings.stability}
                        onChange={(e) =>
                          setVoiceSettings({
                            ...voiceSettings,
                            stability: parseFloat(e.target.value),
                          })
                        }
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Higher = more consistent, Lower = more expressive
                      </p>
                    </div>

                    {/* Similarity Boost */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-gray-700">
                          Similarity Boost
                        </label>
                        <span className="text-xs text-gray-500">
                          {voiceSettings.similarity_boost.toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={voiceSettings.similarity_boost}
                        onChange={(e) =>
                          setVoiceSettings({
                            ...voiceSettings,
                            similarity_boost: parseFloat(e.target.value),
                          })
                        }
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Higher = closer to original voice
                      </p>
                    </div>

                    {/* Style */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-gray-700">
                          Style
                        </label>
                        <span className="text-xs text-gray-500">
                          {voiceSettings.style.toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={voiceSettings.style}
                        onChange={(e) =>
                          setVoiceSettings({
                            ...voiceSettings,
                            style: parseFloat(e.target.value),
                          })
                        }
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Higher = more exaggerated style/emotion
                      </p>
                    </div>

                    {/* Speaker Boost */}
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={voiceSettings.use_speaker_boost}
                          onChange={(e) =>
                            setVoiceSettings({
                              ...voiceSettings,
                              use_speaker_boost: e.target.checked,
                            })
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-xs font-medium text-gray-700">
                          Use Speaker Boost
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1 ml-6">
                        Enhances voice clarity and quality
                      </p>
                    </div>
                  </div>
                </details>
              </div>

              {!voiceoverUrl ? (
                <>
                  <button
                    onClick={handleGenerateVoiceover}
                    disabled={generatingVoiceover}
                    className="w-full bg-purple-600 text-white py-2 sm:py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
                  >
                    {generatingVoiceover
                      ? "Generating Voiceover..."
                      : "🎤 Generate Voiceover from Script"}
                  </button>

                  {/* Voiceover Generation Loading Bar */}
                  {generatingVoiceover && (
                    <div className="mt-4 bg-white border border-purple-300 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                        <span className="text-sm font-medium text-purple-900">
                          Generating voiceover with {selectedCharacter?.name}
                          &apos;s voice...
                        </span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full animate-pulse"
                          style={{ width: "100%" }}
                        ></div>
                      </div>
                      <p className="text-xs text-purple-700 mt-2">
                        Processing with ElevenLabs API... (~15-20 seconds)
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  {!generatingVoiceover ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-green-700">
                          ✓ Voiceover Generated
                        </span>
                        {voiceoverDuration && (
                          <span className="text-sm text-gray-600">
                            Duration: {Math.floor(voiceoverDuration / 60)}:
                            {String(
                              Math.floor(voiceoverDuration % 60),
                            ).padStart(2, "0")}
                          </span>
                        )}
                      </div>
                      <audio
                        key={voiceoverUrl}
                        controls
                        className="w-full mb-3"
                        onLoadedMetadata={(e) =>
                          setVoiceoverDuration(e.target.duration)
                        }
                      >
                        <source src={voiceoverUrl} type="audio/mpeg" />
                      </audio>
                      <button
                        onClick={handleGenerateVoiceover}
                        disabled={generatingVoiceover}
                        className="text-sm text-purple-600 hover:underline disabled:opacity-50"
                      >
                        Regenerate Voiceover
                      </button>
                    </>
                  ) : (
                    /* Regenerating Voiceover Loading Bar */
                    <div className="bg-white border border-purple-300 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                        <span className="text-sm font-medium text-purple-900">
                          Regenerating voiceover with {selectedCharacter?.name}
                          &apos;s voice...
                        </span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full animate-pulse"
                          style={{ width: "100%" }}
                        ></div>
                      </div>
                      <p className="text-xs text-purple-700 mt-2">
                        Processing with ElevenLabs API... (~15-20 seconds)
                      </p>
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-3">
                The voiceover will use {selectedCharacter?.name}&apos;s voice.
                Make sure your script is finalized before generating.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-200 text-gray-700 py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-300"
            >
              ← Back
            </button>
            <button
              onClick={async () => {
                const { ok, error } = await updateProjectCurrentStep(3);
                if (!ok) {
                  await alert(
                    "Could not save progress (current_step). " + error,
                    "error",
                  );
                  return;
                }
                setStep(3);
              }}
              disabled={!voiceoverUrl}
              className="flex-1 bg-blue-600 text-white py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Continue to Scenes →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Scene Generation */}
      {step === 3 && (
        <div className="admin-card-solid p-6 sm:p-8">
          {!scriptData || !scriptData.scenes ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Loading project data...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      Step 3: Scene Images
                    </h2>

                    <div className="flex flex-wrap gap-2">
                      {topic && (
                        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200">
                          <span className="text-base">🏷️</span>
                          <span className="text-gray-600 dark:text-gray-300">
                            Topic
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100 break-all">
                            {topic}
                          </span>
                        </div>
                      )}
                      <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200">
                        <span className="text-base">🎨</span>
                        <span>{scriptData?.scenes?.length || 0} scenes</span>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200">
                        <span className="text-base">🤖</span>
                        <span className="text-gray-600 dark:text-gray-300">
                          Model
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          Grok Image Edit
                        </span>

                        {fluxProEndpointId && (
                          <span
                            title={fluxProEndpointId}
                            className="ml-1 inline-block max-w-[280px] rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[10px] text-gray-700 break-all dark:bg-gray-900 dark:text-gray-200"
                          >
                            {fluxProEndpointId}
                          </span>
                        )}

                        <span className="ml-1 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                          ${fluxProCost !== null ? fluxProCost.toFixed(3) : "—"}
                          /image
                        </span>
                      </div>

                      <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200">
                        <span className="text-base">🧭</span>
                        <span className="text-gray-600 dark:text-gray-300">
                          Angle edit
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          Multiple angles
                        </span>

                        <span
                          title={
                            multipleAnglesEndpointId ||
                            "fal-ai/flux-2-lora-gallery/multiple-angles"
                          }
                          className="ml-1 inline-block max-w-[280px] rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[10px] text-gray-700 break-all dark:bg-gray-900 dark:text-gray-200"
                        >
                          {multipleAnglesEndpointId ||
                            "fal-ai/flux-2-lora-gallery/multiple-angles"}
                        </span>

                        <span className="ml-1 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                          $
                          {multipleAnglesUnitCost !== null
                            ? multipleAnglesUnitCost.toFixed(3)
                            : "—"}
                          /image
                        </span>
                      </div>
                      {projectCosts?.step3?.claude > 0 && (
                        <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-800 shadow-sm dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-200">
                          <span className="text-base">🤖</span>
                          <span>Claude</span>
                          <span className="font-semibold">
                            ${projectCosts.step3.claude.toFixed(4)}
                          </span>
                        </div>
                      )}
                      {projectCosts?.step3?.total > 0 && (
                        <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-900 shadow-sm dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-200">
                          <span className="text-base">🧾</span>
                          <span>Step 3</span>
                          <span className="font-semibold">
                            ${projectCosts.step3.total.toFixed(3)}
                          </span>
                        </div>
                      )}
                      <a
                        href="https://fal.ai/dashboard/billing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900"
                      >
                        💳 FAL balance
                        <span className="text-gray-400 dark:text-gray-500">
                          →
                        </span>
                      </a>
                      <button
                        onClick={() => setShowFluxSettings(!showFluxSettings)}
                        className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-800 shadow-sm hover:bg-indigo-100 transition dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-200 dark:hover:bg-indigo-950/40"
                      >
                        ⚙️ {showFluxSettings ? "Hide" : "Show"} settings
                      </button>
                    </div>
                  </div>

                  {voiceoverUrl && (
                    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                          <span className="text-lg">🎤</span>
                          Voiceover
                        </div>
                        <audio
                          controls
                          src={voiceoverUrl}
                          className="w-full sm:w-auto sm:flex-1 h-9"
                          style={{ maxWidth: "520px" }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Grok Image Edit Settings Panel */}
              {showFluxSettings && (
                <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 dark:text-gray-100">
                    <span className="text-lg">⚙️</span>
                    Model settings
                  </h3>
                  <p className="text-sm text-gray-600 mb-5 dark:text-gray-300">
                    Grok uses image editing to maintain character consistency
                    automatically. Character appearance and style are preserved
                    from your reference image.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Output Format */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">
                        Output Format
                      </label>
                      <select
                        value={fluxSettings.output_format}
                        onChange={(e) =>
                          setFluxSettings({
                            ...fluxSettings,
                            output_format: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 dark:border-gray-700"
                      >
                        <option value="png">
                          PNG (Lossless, Higher Quality)
                        </option>
                        <option value="jpeg">JPEG (Compressed, Faster)</option>
                      </select>
                      <p className="text-xs text-gray-600 mt-1 dark:text-gray-300">
                        PNG is recommended for best quality with character
                        details.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Always show list view with editable scene details */}
              <div>
                <div className="mb-6">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Scene list
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Generate images from each scene prompt, then pick one image
                    per scene for Step 4.
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  {scriptData.scenes.map((scene, index) => {
                    const { leaderId, isChild } = getSceneGroupInfo(
                      sceneGroups,
                      scene.id,
                      sceneIdsInOrder,
                    );

                    return (
                      <Fragment key={scene.id}>
                        <div
                          className={
                            "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950 " +
                            (isChild
                              ? "opacity-60 pointer-events-none select-none"
                              : "")
                          }
                          aria-disabled={isChild}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                Scene {scene.id}
                              </span>
                              {typeof scene.image_urls?.length === "number" && (
                                <span className="text-xs rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                                  {scene.image_urls.length} images
                                </span>
                              )}
                            </div>
                            {isChild && (
                              <span className="text-xs px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
                                Linked → Scene {leaderId}
                              </span>
                            )}
                          </div>

                          {isChild && (
                            <div className="mb-4 text-xs px-3 py-2 rounded-xl border bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-900">
                              Scene {scene.id} is linked. Edit in Scene{" "}
                              {leaderId}.
                            </div>
                          )}

                          {/* Location Info */}
                          {(() => {
                            const locationId = locationMapping[scene.id];
                            const location = selectedLocations.find(
                              (loc) => loc.id === locationId,
                            );

                            return location ? (
                              <div className="mb-4 p-4 border border-gray-200 rounded-2xl bg-gray-50 dark:bg-gray-900/40 dark:border-gray-800">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <span className="text-xl">📍</span>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-gray-900 text-sm mb-1 dark:text-gray-100">
                                        {location.name}
                                      </div>
                                      <div className="text-xs text-gray-700 mb-2 leading-relaxed dark:text-gray-300">
                                        {location.description}
                                      </div>
                                      <div className="flex flex-wrap gap-2 text-xs">
                                        {location.category && (
                                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium dark:bg-purple-900/40 dark:text-purple-200">
                                            {location.category === "indoor"
                                              ? "🏢 Indoor"
                                              : "🌃 Outdoor"}
                                          </span>
                                        )}
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium dark:bg-blue-900/40 dark:text-blue-200">
                                          {location.type.replace(/_/g, " ")}
                                        </span>
                                        {location.visual_characteristics
                                          .lighting &&
                                          (Array.isArray(
                                            location.visual_characteristics
                                              .lighting,
                                          )
                                            ? location.visual_characteristics
                                                .lighting
                                            : location.visual_characteristics.lighting
                                                .split(",")
                                                .map((s) => s.trim())
                                          ).map((light, idx) => (
                                            <span
                                              key={`light-${idx}`}
                                              className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full dark:bg-yellow-900/40 dark:text-yellow-200"
                                            >
                                              {light}
                                            </span>
                                          ))}
                                        {location.visual_characteristics
                                          .atmosphere &&
                                          (Array.isArray(
                                            location.visual_characteristics
                                              .atmosphere,
                                          )
                                            ? location.visual_characteristics
                                                .atmosphere
                                            : location.visual_characteristics.atmosphere
                                                .split(",")
                                                .map((s) => s.trim())
                                          ).map((atm, idx) => (
                                            <span
                                              key={`atm-${idx}`}
                                              className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full dark:bg-indigo-900/40 dark:text-indigo-200"
                                            >
                                              {atm}
                                            </span>
                                          ))}
                                        {location.visual_characteristics
                                          .key_elements &&
                                          location.visual_characteristics.key_elements.map(
                                            (element, idx) => (
                                              <span
                                                key={`elem-${idx}`}
                                                className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full dark:bg-green-900/40 dark:text-green-200"
                                              >
                                                {element}
                                              </span>
                                            ),
                                          )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <button
                                      onClick={() =>
                                        handleOpenLocationPicker(scene.id)
                                      }
                                      disabled={generatingSceneId === scene.id}
                                      className="flex-shrink-0 text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 font-medium transition disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900"
                                      title="Choose different location from library"
                                    >
                                      Select
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleClearLocationForScene(scene.id)
                                      }
                                      disabled={generatingSceneId === scene.id}
                                      className="flex-shrink-0 text-xs px-3 py-1.5 rounded-xl border border-red-200 bg-white text-red-700 hover:bg-red-50 font-medium transition disabled:opacity-50 dark:border-red-900/60 dark:bg-gray-950 dark:text-red-300 dark:hover:bg-red-950/20"
                                      title="Clear location for this scene"
                                    >
                                      Clear
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleOpenLocationTypeModal(scene.id)
                                      }
                                      disabled={generatingSceneId === scene.id}
                                      className="flex-shrink-0 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-xl hover:bg-blue-700 font-medium transition disabled:opacity-50"
                                      title="Generate a brand new location with AI"
                                    >
                                      {generatingSceneId === scene.id
                                        ? "✨..."
                                        : "✨ Generate"}
                                    </button>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <a
                                    href="/admin/locations"
                                    target="_blank"
                                    className="text-xs text-blue-600 hover:text-blue-800 underline dark:text-blue-300 dark:hover:text-blue-200"
                                  >
                                    Manage Locations
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="mb-4 p-4 border border-dashed border-yellow-300 rounded-2xl bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-900">
                                <div className="flex items-center justify-between gap-3 mb-2">
                                  <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                                    <span>⚠️</span>
                                    <span>No location assigned</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        handleOpenLocationPicker(scene.id)
                                      }
                                      disabled={generatingSceneId === scene.id}
                                      className="flex-shrink-0 text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 font-medium transition disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900"
                                      title="Choose from location library"
                                    >
                                      Select
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleOpenLocationTypeModal(scene.id)
                                      }
                                      disabled={generatingSceneId === scene.id}
                                      className="flex-shrink-0 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-xl hover:bg-blue-700 font-medium transition disabled:opacity-50"
                                      title="Generate a brand new location with AI"
                                    >
                                      {generatingSceneId === scene.id
                                        ? "✨..."
                                        : "✨ Generate"}
                                    </button>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <a
                                    href="/admin/locations"
                                    target="_blank"
                                    className="text-xs text-blue-600 hover:text-blue-800 underline dark:text-blue-300 dark:hover:text-blue-200"
                                  >
                                    Manage Locations
                                  </a>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Action Selection */}
                          {(() => {
                            const actionId = actionMapping[scene.id];
                            const selectedAction = availableActions.find(
                              (a) => a.id === actionId,
                            );

                            return selectedAction ? (
                              <div className="mb-4 p-4 border border-gray-200 rounded-2xl bg-gray-50 dark:bg-gray-900/40 dark:border-gray-800">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-lg">🎭</span>
                                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        {selectedAction.name}
                                      </h4>
                                    </div>
                                    <p className="text-xs text-gray-700 mb-2 dark:text-gray-300">
                                      {selectedAction.description}
                                    </p>
                                    {selectedAction.pose_variations && (
                                      <div className="space-y-1">
                                        <div className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                          Pose Options:
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {selectedAction.pose_variations
                                            .slice(0, 2)
                                            .map((pose, idx) => (
                                              <span
                                                key={idx}
                                                className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/40 dark:text-blue-200"
                                              >
                                                {pose.length > 40
                                                  ? pose.substring(0, 40) +
                                                    "..."
                                                  : pose}
                                              </span>
                                            ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <button
                                      onClick={() =>
                                        handleOpenActionPicker(scene.id)
                                      }
                                      disabled={generatingSceneId === scene.id}
                                      className="flex-shrink-0 text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 font-medium transition disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900"
                                      title="Choose different action from library"
                                    >
                                      Select
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleClearActionForScene(scene.id)
                                      }
                                      disabled={generatingSceneId === scene.id}
                                      className="flex-shrink-0 text-xs px-3 py-1.5 rounded-xl border border-red-200 bg-white text-red-700 hover:bg-red-50 font-medium transition disabled:opacity-50 dark:border-red-900/60 dark:bg-gray-950 dark:text-red-300 dark:hover:bg-red-950/20"
                                      title="Clear action/pose for this scene"
                                    >
                                      Clear
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleOpenActionGenerateModal(scene.id)
                                      }
                                      disabled={generatingSceneId === scene.id}
                                      className="flex-shrink-0 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-xl hover:bg-blue-700 font-medium transition disabled:opacity-50"
                                      title="Generate a brand new action with AI"
                                    >
                                      {generatingSceneId === scene.id
                                        ? "✨..."
                                        : "✨ Generate"}
                                    </button>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <a
                                    href="/admin/actions"
                                    target="_blank"
                                    className="text-xs text-blue-600 hover:text-blue-800 underline dark:text-blue-300 dark:hover:text-blue-200"
                                  >
                                    Manage Actions
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="mb-4 p-4 border border-dashed border-yellow-300 rounded-2xl bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-900">
                                <div className="flex items-center justify-between gap-3 mb-2">
                                  <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                                    <span>⚠️</span>
                                    <span>No action/pose assigned</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        handleOpenActionPicker(scene.id)
                                      }
                                      disabled={generatingSceneId === scene.id}
                                      className="flex-shrink-0 text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 font-medium transition disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900"
                                      title="Choose action from library"
                                    >
                                      Select
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleOpenActionGenerateModal(scene.id)
                                      }
                                      disabled={generatingSceneId === scene.id}
                                      className="flex-shrink-0 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-xl hover:bg-blue-700 font-medium transition disabled:opacity-50"
                                      title="Generate a brand new action with AI"
                                    >
                                      {generatingSceneId === scene.id
                                        ? "✨..."
                                        : "✨ Generate"}
                                    </button>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <a
                                    href="/admin/actions"
                                    target="_blank"
                                    className="text-xs text-blue-600 hover:text-blue-800 underline dark:text-blue-300 dark:hover:text-blue-200"
                                  >
                                    Manage Actions
                                  </a>
                                </div>
                              </div>
                            );
                          })()}

                          <div className="space-y-3">
                            {/* Voiceover Text - Read Only */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
                                Voiceover Segment:
                              </label>
                              <p className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-200">
                                {scene.voiceover}
                              </p>
                            </div>

                            {/* Reference Image Selector */}
                            {selectedCharacter?.image_urls &&
                              selectedCharacter.image_urls.length > 0 && (
                                <div className="mb-4 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-900">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                      <label className="block text-sm font-medium text-blue-900 dark:text-blue-200">
                                        📸 Character Reference for This Scene:
                                      </label>
                                      <a
                                        href={`/admin/characters?id=${selectedCharacter.character_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:text-blue-800 underline font-medium dark:text-blue-300 dark:hover:text-blue-200"
                                      >
                                        Manage Character
                                      </a>
                                    </div>
                                    <button
                                      onClick={() =>
                                        handleOpenCharacterReferenceModal(
                                          scene.id,
                                        )
                                      }
                                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 font-medium transition"
                                    >
                                      📚 Browse All
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                    {selectedCharacter.image_urls.map(
                                      (imageUrl, idx) => (
                                        <button
                                          key={`ref-${scene.id}-${idx}`}
                                          onClick={() => {
                                            setSelectedReferenceImages(
                                              (prev) => ({
                                                ...prev,
                                                [scene.id]: imageUrl,
                                              }),
                                            );
                                          }}
                                          className={`relative aspect-[9/16] rounded-lg overflow-hidden border-3 transition-all ${
                                            (selectedReferenceImages[
                                              scene.id
                                            ] ||
                                              selectedCharacter
                                                .image_urls[0]) === imageUrl
                                              ? "border-blue-500 ring-2 ring-blue-300 shadow-lg"
                                              : "border-gray-300 hover:border-blue-400 opacity-60 hover:opacity-100 dark:border-gray-700"
                                          }`}
                                          title={`Reference ${idx + 1}`}
                                        >
                                          <img
                                            src={imageUrl}
                                            alt={`Reference ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                          />
                                          {(selectedReferenceImages[scene.id] ||
                                            selectedCharacter.image_urls[0]) ===
                                            imageUrl && (
                                            <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                              ✓
                                            </div>
                                          )}
                                        </button>
                                      ),
                                    )}
                                  </div>
                                  <p className="text-xs text-blue-700 mt-2 dark:text-blue-200">
                                    Select which reference image to use for this
                                    scene. Click &quot;Browse All&quot; to see
                                    references from all projects.
                                  </p>
                                </div>
                              )}

                            {/* Image Prompt */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                  Image Prompt:
                                </label>
                                <button
                                  onClick={() =>
                                    handleRegenerateImagePrompt(scene.id)
                                  }
                                  disabled={
                                    loading ||
                                    regeneratingPromptSceneId === scene.id
                                  }
                                  className="text-xs inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900"
                                  title="Regenerate this image prompt with AI"
                                >
                                  {regeneratingPromptSceneId === scene.id
                                    ? "🔄 Regenerating..."
                                    : "🔄 Regenerate Prompt"}
                                </button>
                              </div>

                              {/* Loading Progress Bar */}
                              {regeneratingPromptSceneId === scene.id && (
                                <div className="mb-2">
                                  <div className="w-full bg-purple-200 rounded-full h-2 overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-pulse"
                                      style={{ width: "100%" }}
                                    ></div>
                                  </div>
                                  <p className="text-xs text-purple-700 text-center mt-1 font-medium">
                                    ✨ Generating cozy, dreamy image prompt with
                                    AI...
                                  </p>
                                </div>
                              )}

                              <textarea
                                value={scene.image_prompt}
                                onChange={(e) =>
                                  handleImagePromptChange(
                                    scene.id,
                                    e.target.value,
                                  )
                                }
                                rows={8}
                                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y text-sm bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 dark:border-gray-700"
                                placeholder="Describe the scene environment, lighting, and character pose..."
                              />
                            </div>

                            {/* Generate Image Button */}
                            <div className="mt-4">
                              <button
                                onClick={() =>
                                  handleGenerateSingleImage(scene.id)
                                }
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                              >
                                {scene.image_urls && scene.image_urls.length > 0
                                  ? `Generate Another (${scene.image_urls.length} generated)`
                                  : generatingSceneId === scene.id
                                    ? "Generating..."
                                    : "Generate Image"}
                              </button>

                              {/* Loading Progress Bar */}
                              {generatingSceneId === scene.id && (
                                <div className="mt-2">
                                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden dark:bg-gray-800">
                                    <div
                                      className="h-full bg-blue-600 rounded-full animate-pulse"
                                      style={{ width: "100%" }}
                                    ></div>
                                  </div>
                                  <p className="text-xs text-gray-500 text-center mt-1 dark:text-gray-400">
                                    Generating image with character reference...
                                  </p>
                                </div>
                              )}

                              {/* Angle Edit Loading Bar */}
                              {editingImageAngleKey &&
                                String(editingImageAngleKey).startsWith(
                                  `${scene.id}::`,
                                ) && (
                                  <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3 dark:bg-emerald-950/20 dark:border-emerald-900/60">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="animate-spin h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full"></div>
                                      <span className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                                        Editing angle... generating new image
                                        variants
                                      </span>
                                    </div>
                                    <div className="w-full bg-emerald-200 rounded-full h-2 overflow-hidden dark:bg-emerald-900/40">
                                      <div
                                        className="h-full bg-emerald-600 rounded-full animate-pulse"
                                        style={{ width: "100%" }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                            </div>

                            {/* Generated Images Preview */}
                            {scene.image_urls &&
                              scene.image_urls.length > 0 && (
                                <div className="mt-4">
                                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">
                                    Generated Images ({scene.image_urls.length})
                                    - Click to select for video:
                                  </label>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {scene.image_urls.map((url, idx) => {
                                      const isSelected =
                                        (selectedSceneImages[scene.id] ?? 0) ===
                                        idx;
                                      return (
                                        <div
                                          key={`scene-${scene.id}-img-${idx}`}
                                          onClick={() =>
                                            handleSelectSceneImage(
                                              scene.id,
                                              idx,
                                            )
                                          }
                                          className={`relative aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden cursor-pointer transition-all group dark:bg-gray-900 ${
                                            isSelected
                                              ? "border-2 border-blue-500 ring-2 ring-blue-200 shadow-lg"
                                              : "border border-gray-200 hover:border-blue-300 hover:shadow-md dark:border-gray-800"
                                          }`}
                                          title={
                                            isSelected
                                              ? "Selected for video"
                                              : "Click to select for video"
                                          }
                                        >
                                          <img
                                            src={url}
                                            alt={`Scene ${scene.id} - Version ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                          />
                                          {isSelected && (
                                            <div className="absolute top-2 left-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                                              ✓ Selected
                                            </div>
                                          )}
                                          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs dark:bg-black/60">
                                            Version {idx + 1}
                                          </div>
                                          <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const localPrompt =
                                                  Array.isArray(
                                                    scene?.image_prompts,
                                                  ) && scene.image_prompts[idx]
                                                    ? scene.image_prompts[idx]
                                                    : null;
                                                handleOpenImageDetailsModal(
                                                  scene.id,
                                                  url,
                                                  {
                                                    imageIndex: idx,
                                                    localPrompt,
                                                  },
                                                );
                                              }}
                                              className="bg-black/80 text-white px-2 py-1 rounded-lg text-xs font-medium hover:bg-black"
                                              title="Show generation details for this image"
                                            >
                                              Info
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedImage({
                                                  sceneId: scene.id,
                                                  imageIndex: idx,
                                                  url,
                                                });
                                              }}
                                              className="bg-gray-900 text-white px-2 py-1 rounded-lg text-xs font-medium hover:bg-black"
                                              title="View full size"
                                            >
                                              🔍 Expand
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenAngleEditModal(
                                                  scene.id,
                                                  idx,
                                                  url,
                                                );
                                              }}
                                              disabled={
                                                loading ||
                                                editingImageAngleKey ===
                                                  `${scene.id}::${url}`
                                              }
                                              className="bg-emerald-600 text-white px-2 py-1 rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
                                              title="Change camera angle (multiple-angles)"
                                            >
                                              {editingImageAngleKey ===
                                              `${scene.id}::${url}`
                                                ? "Editing..."
                                                : "Edit angle"}
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveImage(
                                                  scene.id,
                                                  idx,
                                                );
                                              }}
                                              disabled={loading}
                                              className="bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                                              title="Remove this image"
                                            >
                                              Remove
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleRegenerateImage(
                                                  scene.id,
                                                  idx,
                                                );
                                              }}
                                              disabled={
                                                loading ||
                                                generatingSceneId === scene.id
                                              }
                                              className="bg-blue-600 text-white px-2 py-1 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                                              title="Regenerate this specific image"
                                            >
                                              {generatingSceneId === scene.id
                                                ? "Regenerating..."
                                                : "Regenerate"}
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownloadImage(
                                                  url,
                                                  scene.id,
                                                  idx,
                                                );
                                              }}
                                              className="bg-purple-600 text-white px-2 py-1 rounded-lg text-xs font-medium hover:bg-purple-700"
                                              title="Download this image"
                                            >
                                              Download
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>

                        {/* Link connector between this scene and next */}
                        {index < scriptData.scenes.length - 1 && (
                          <div className="flex items-center justify-center -my-2">
                            {(() => {
                              const nextId = scriptData.scenes[index + 1].id;
                              const isSavingThisLink =
                                savingSceneLinkKey ===
                                `${sceneKey(scene.id)}-${sceneKey(nextId)}`;
                              const isLinked = areScenesLinked(
                                sceneGroups,
                                scene.id,
                                nextId,
                              );

                              return (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleSceneLink(scene.id, nextId)
                                  }
                                  disabled={
                                    isSavingThisLink ||
                                    generatingSceneId === scene.id
                                  }
                                  className={
                                    "inline-flex items-center justify-center h-9 w-9 rounded-full border transition disabled:opacity-50 " +
                                    (isLinked
                                      ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-900")
                                  }
                                  aria-busy={isSavingThisLink}
                                  aria-label={
                                    isSavingThisLink
                                      ? "Saving scene link"
                                      : isLinked
                                        ? `Unlink Scene ${scene.id} and Scene ${nextId}`
                                        : `Link Scene ${scene.id} and Scene ${nextId}`
                                  }
                                  title={
                                    isSavingThisLink
                                      ? "Saving…"
                                      : isLinked
                                        ? `Unlink Scene ${scene.id} and Scene ${nextId}`
                                        : `Link Scene ${scene.id} and Scene ${nextId}`
                                  }
                                >
                                  {isSavingThisLink ? (
                                    <span className="inline-flex items-center justify-center">
                                      <span
                                        className={
                                          "h-5 w-5 rounded-full border-2 border-t-transparent animate-spin " +
                                          (isLinked
                                            ? "border-white/80"
                                            : "border-gray-400 dark:border-gray-500")
                                        }
                                      />
                                    </span>
                                  ) : (
                                    <svg
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="h-5 w-5"
                                    >
                                      <path d="M10 13a5 5 0 0 1 0-7l1.5-1.5a5 5 0 0 1 7 7L17 13" />
                                      <path d="M14 11a5 5 0 0 1 0 7L12.5 19.5a5 5 0 0 1-7-7L7 11" />
                                    </svg>
                                  )}
                                </button>
                              );
                            })()}
                          </div>
                        )}
                      </Fragment>
                    );
                  })}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 bg-gray-100 text-gray-800 py-2.5 sm:py-3 rounded-xl font-medium hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleContinueToVideos}
                    disabled={
                      loading || continuingToVideos || !canContinueToVideos
                    }
                    className="flex-1 bg-blue-600 text-white py-2.5 sm:py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
                    title={
                      canContinueToVideos
                        ? "Continue to video generation"
                        : "Select an image for each scene (linked scenes share the leader's selection)"
                    }
                  >
                    {loading || continuingToVideos
                      ? "Generating Scene Images..."
                      : "Continue videos →"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 4: Review Videos */}
      {step === 4 && (
        <div className="admin-card p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-3">Step 4: Generate Videos</h2>
            <div className="flex flex-wrap gap-2">
              <div className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap">
                🎬 {videos.length} videos
              </div>
              <div className="bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap dark:bg-teal-950/30 dark:border-teal-900">
                <span className="text-teal-700 dark:text-teal-200">⏱️ Total:</span>
                <span className="font-semibold text-teal-900 dark:text-teal-100">
                  {(() => {
                    const t = (scriptData?.scenes || []).reduce(
                      (sum, s) => sum + getSceneDurationSeconds(s),
                      0,
                    );
                    return `${Math.floor(t / 60)}m ${Math.round(t % 60)}s`;
                  })()}
                </span>
              </div>
              <div className="bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-purple-700">⚡ I2V Unit:</span>
                <span className="font-semibold text-purple-900">
                  {loadingFalVideoPricing
                    ? "Loading..."
                    : falVideoUnitCost !== null
                      ? `$${falVideoUnitCost.toFixed(3)}/${falVideoPricingUnit || "unit"}`
                      : "Unavailable"}
                </span>
              </div>
              {projectCosts?.step4?.fal_videos > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-indigo-700">🎥 FAL Videos:</span>
                  <span className="font-semibold text-indigo-900">
                    ${projectCosts.step4.fal_videos.toFixed(3)}
                  </span>
                </div>
              )}
              {projectCosts?.step4?.total > 0 && (
                <div className="bg-gray-50 border border-gray-300 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-gray-700">💰 Step 4 Total:</span>
                  <span className="font-semibold text-gray-900">
                    ${projectCosts.step4.total.toFixed(3)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-700 mb-6 dark:text-gray-300">
            Generate a short video per scene using your selected image and a
            motion prompt.
          </div>

          {voiceoverUrl && (
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  <span className="text-lg">🎤</span>
                  Voiceover
                </div>
                <audio
                  controls
                  src={voiceoverUrl}
                  className="w-full sm:w-auto sm:flex-1 h-9"
                  style={{ maxWidth: "520px" }}
                />
              </div>
            </div>
          )}

          {/* Scene Cards */}
          <div className="flex flex-col gap-6 mb-8">
            {(scriptData?.scenes || []).map((scene) => {
              const selectedImageUrl = getSelectedImageUrlForScene(scene);
              const selectedVideoUrl = getSelectedVideoUrlForScene(scene);
              const allVideoUrls = getAllVideoUrlsForScene(
                scene,
                selectedVideoUrl,
              );
              const canGenerate = Boolean(selectedImageUrl) && !loading;
              const durationSeconds = getSceneDurationSeconds(scene);
              const estimatedSceneCost =
                getEstimatedI2VCostForScene(durationSeconds);

              const cameraMovementId = cameraMovementMapping[scene.id];
              const selectedCameraMovement = cameraMovementId
                ? availableCameraMovements.find(
                    (m) => m.id === cameraMovementId,
                  )
                : null;

              const characterMotionId = characterMotionMapping[scene.id];
              const selectedCharacterMotion = characterMotionId
                ? availableCharacterMotions.find(
                    (m) => m.id === characterMotionId,
                  )
                : null;

              return (
                <div
                  key={scene.id}
                  className="border border-gray-200 rounded-xl p-5 bg-white dark:bg-gray-950 dark:border-gray-800"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        Scene {scene.id}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Model: Image-to-video (configured)
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-xs font-medium text-gray-700 mb-1 dark:text-gray-200">
                      Voiceover Segment:
                    </div>
                    <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-200">
                      {scene.voiceover}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-200">
                          Image → Video
                        </div>
                      </div>

                      {/* Large preview on desktop (same row) */}
                      <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)] items-stretch gap-6">
                        <div className="mx-auto h-[60vh] max-h-[760px] min-h-[520px] aspect-[9/16] rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
                          {selectedImageUrl ? (
                            <img
                              src={selectedImageUrl}
                              alt={`Scene ${scene.id} selected image`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                              No image
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-center text-gray-400 dark:text-gray-500 select-none text-3xl">
                          →
                        </div>

                        <div className="mx-auto h-[60vh] max-h-[760px] min-h-[520px] aspect-[9/16] rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-black relative group">
                          {selectedVideoUrl ? (
                            <>
                              <video
                                key={selectedVideoUrl}
                                controls
                                className="w-full h-full object-cover"
                                preload="metadata"
                                playsInline
                              >
                                <source
                                  src={selectedVideoUrl}
                                  type="video/mp4"
                                />
                              </video>

                              <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenVideoDetailsModal(
                                      scene.id,
                                      selectedVideoUrl,
                                    )
                                  }
                                  className="w-9 h-9 rounded-full bg-black/70 text-white text-sm font-semibold flex items-center justify-center shadow-sm hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                                  title="Video generation info"
                                  aria-label="Video generation info"
                                >
                                  i
                                </button>
                                <a
                                  href={selectedVideoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center shadow-sm hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                                  title="Open selected video in a new tab"
                                  aria-label="Open selected video in a new tab"
                                >
                                  <svg
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="w-4 h-4"
                                    aria-hidden="true"
                                  >
                                    <path d="M11 3a1 1 0 000 2h2.586L8.293 10.293a1 1 0 001.414 1.414L15 6.414V9a1 1 0 102 0V3h-6z" />
                                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 100-2H5z" />
                                  </svg>
                                </a>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm text-gray-300">
                              No video
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Compact preview for smaller screens */}
                      <div className="lg:hidden flex items-start gap-4">
                        <div className="flex-shrink-0 w-44 h-64 sm:w-48 sm:h-72 md:w-52 md:h-80 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
                          {selectedImageUrl ? (
                            <img
                              src={selectedImageUrl}
                              alt={`Scene ${scene.id} selected image`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                              No image
                            </div>
                          )}
                        </div>

                        <div className="pt-[7.25rem] sm:pt-[8.25rem] md:pt-[9.25rem] text-gray-400 dark:text-gray-500 select-none text-lg">
                          →
                        </div>

                        <div className="flex-shrink-0 w-44 h-64 sm:w-48 sm:h-72 md:w-52 md:h-80 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-black relative group">
                          {selectedVideoUrl ? (
                            <>
                              <video
                                key={selectedVideoUrl}
                                controls
                                className="w-full h-full object-cover"
                                preload="metadata"
                                playsInline
                              >
                                <source
                                  src={selectedVideoUrl}
                                  type="video/mp4"
                                />
                              </video>

                              <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenVideoDetailsModal(
                                      scene.id,
                                      selectedVideoUrl,
                                    )
                                  }
                                  className="w-8 h-8 rounded-full bg-black/70 text-white text-[13px] font-semibold flex items-center justify-center shadow-sm hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                                  title="Video generation info"
                                  aria-label="Video generation info"
                                >
                                  i
                                </button>
                                <a
                                  href={selectedVideoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center shadow-sm hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                                  title="Open selected video in a new tab"
                                  aria-label="Open selected video in a new tab"
                                >
                                  <svg
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="w-4 h-4"
                                    aria-hidden="true"
                                  >
                                    <path d="M11 3a1 1 0 000 2h2.586L8.293 10.293a1 1 0 001.414 1.414L15 6.414V9a1 1 0 102 0V3h-6z" />
                                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 100-2H5z" />
                                  </svg>
                                </a>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">
                              No video
                            </div>
                          )}
                        </div>
                      </div>

                      {allVideoUrls.length > 1 && (
                        <div className="mt-3">
                          <div className="text-[11px] text-gray-600 dark:text-gray-300 font-medium mb-1 text-center">
                            Versions ({allVideoUrls.length}) — click to select
                          </div>
                          <div className="w-full overflow-x-auto pb-1">
                            <div className="flex justify-center gap-1.5 min-w-max">
                              {allVideoUrls.map((videoUrl, idx) => {
                                const isSelected =
                                  videoUrl === selectedVideoUrl;
                                const isDeleting =
                                  deletingVideoVersionKey ===
                                  `${toSceneKey(scene.id)}::${videoUrl}`;
                                return (
                                  <div
                                    key={videoUrl}
                                    className={
                                      "group relative flex-shrink-0 w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-32 rounded-xl overflow-hidden border bg-black " +
                                      (isSelected
                                        ? "border-blue-500 ring-2 ring-blue-500/40"
                                        : "border-gray-300 dark:border-gray-800")
                                    }
                                    title={
                                      isSelected
                                        ? `Selected (v${idx + 1})`
                                        : `Select v${idx + 1}`
                                    }
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSelectVideoForScene(
                                          scene.id,
                                          videoUrl,
                                        )
                                      }
                                      className="w-full h-full"
                                      disabled={isDeleting}
                                    >
                                      <video
                                        className="w-full h-full object-cover"
                                        preload="metadata"
                                        playsInline
                                        muted
                                        onMouseEnter={(e) => {
                                          const el = e.currentTarget;
                                          try {
                                            el.play?.().catch(() => {});
                                          } catch {}
                                        }}
                                        onMouseLeave={(e) => {
                                          const el = e.currentTarget;
                                          try {
                                            el.pause?.();
                                            el.currentTime = 0;
                                          } catch {}
                                        }}
                                      >
                                        <source
                                          src={videoUrl}
                                          type="video/mp4"
                                        />
                                      </video>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenVideoDetailsModal(
                                          scene.id,
                                          videoUrl,
                                        );
                                      }}
                                      disabled={isDeleting}
                                      className="absolute top-1 left-1 w-7 h-7 rounded-full bg-black/70 text-white text-[12px] font-semibold flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 transition-opacity hover:bg-black/80 disabled:opacity-50"
                                      title="Video generation details"
                                    >
                                      i
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveVideoVersion(
                                          scene.id,
                                          videoUrl,
                                        );
                                      }}
                                      disabled={isDeleting}
                                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white text-xs font-semibold flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:opacity-50"
                                      title="Delete this video version"
                                    >
                                      {isDeleting ? "…" : "✕"}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="mb-3">
                        <div className="text-xs font-medium text-gray-700 mb-2 dark:text-gray-200">
                          Motion libraries
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenCameraMovementPicker(scene.id)
                              }
                              className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-900 text-center"
                              title="Select a camera movement for this scene"
                            >
                              <span className="block truncate">
                                📷 Camera:{" "}
                                {selectedCameraMovement?.name ||
                                  "Still (lock-off)"}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenCameraMovementGenerateModal(scene.id)
                              }
                              disabled={generatingSceneId === scene.id}
                              className="w-full text-xs px-3 py-1.5 rounded-lg border border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100 disabled:opacity-50 dark:bg-violet-950/30 dark:text-violet-200 dark:border-violet-900/50 dark:hover:bg-violet-950/40 text-center"
                              title="Generate a new camera movement with AI"
                            >
                              {generatingSceneId === scene.id
                                ? "✨..."
                                : "✨ Generate camera"}
                            </button>
                          </div>

                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenCharacterMotionPicker(scene.id)
                              }
                              className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-900 text-center"
                              title="Select a character motion for this scene"
                            >
                              <span className="block truncate">
                                🧍 Motion:{" "}
                                {selectedCharacterMotion?.name || "Default"}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenCharacterMotionGenerateModal(scene.id)
                              }
                              disabled={generatingSceneId === scene.id}
                              className="w-full text-xs px-3 py-1.5 rounded-lg border border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100 disabled:opacity-50 dark:bg-violet-950/30 dark:text-violet-200 dark:border-violet-900/50 dark:hover:bg-violet-950/40 text-center"
                              title="Generate a new character motion with AI"
                            >
                              {generatingSceneId === scene.id
                                ? "✨..."
                                : "✨ Generate motion"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Prompts (moved below preview/controls to avoid overlap) */}
                  <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/40 shadow-sm">
                      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-gray-200/70 dark:border-gray-800/70">
                        <div className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                          🖼️ Image prompt
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          Reference
                        </div>
                      </div>
                      <div className="px-3 py-3">
                        <div className="text-xs font-mono leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words min-h-72 max-h-72 overflow-auto rounded-xl bg-gray-50/80 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-800/80 p-3">
                          {scene.image_prompt || "No image prompt yet."}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/40 shadow-sm">
                      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-gray-200/70 dark:border-gray-800/70">
                        <div className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                          🎬 Video prompt
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <label
                              htmlFor={`video-prompt-temp-${scene.id}`}
                              className="text-[11px] text-gray-500 dark:text-gray-400"
                            >
                              Temp
                            </label>
                            <input
                              id={`video-prompt-temp-${scene.id}`}
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={
                                videoPromptTemperatureByScene[scene.id] ?? 0.8
                              }
                              onChange={(e) =>
                                setVideoPromptTemperatureByScene((prev) => ({
                                  ...prev,
                                  [scene.id]: parseFloat(e.target.value),
                                }))
                              }
                              className="h-1.5 w-16 rounded-lg appearance-none bg-gray-200 dark:bg-gray-700 accent-blue-600"
                            />
                            <span className="text-[11px] text-gray-600 dark:text-gray-400 tabular-nums w-6">
                              {(videoPromptTemperatureByScene[scene.id] ?? 0.8)
                                .toFixed(1)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleGenerateVideoPromptForScene(scene.id)
                            }
                            disabled={generatingVideoPromptSceneId === scene.id}
                            className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-900"
                          >
                            {generatingVideoPromptSceneId === scene.id
                              ? "Generating..."
                              : "Generate"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleMotionPromptChange(scene.id, "")
                            }
                            disabled={
                              generatingVideoPromptSceneId === scene.id ||
                              !(scene.motion_prompt || "").trim()
                            }
                            className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-900"
                            title="Clear this scene's video prompt"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <div className="px-3 py-3">
                        <textarea
                          value={scene.motion_prompt || ""}
                          onChange={(e) =>
                            handleMotionPromptChange(scene.id, e.target.value)
                          }
                          rows={6}
                          placeholder="Describe motion/camera movement, e.g. still/lock-off, gentle drift, slow pan..."
                          className="w-full px-3 py-2.5 border rounded-xl text-sm font-mono leading-relaxed bg-gray-50/80 text-gray-900 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y dark:bg-gray-900/40 dark:text-gray-100 dark:border-gray-800"
                        />

                        <div className="mt-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">
                              Negative prompt (avoid)
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleVideoNegativePromptChange(
                                    scene.id,
                                    DEFAULT_VIDEO_NEGATIVE_PROMPT,
                                  )
                                }
                                disabled={
                                  generatingVideoPromptSceneId === scene.id
                                }
                                className="text-[11px] px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-900"
                                title="Reset to default"
                              >
                                Default
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleVideoNegativePromptChange(scene.id, "")
                                }
                                disabled={
                                  generatingVideoPromptSceneId === scene.id ||
                                  !(scene.video_negative_prompt || "").trim()
                                }
                                className="text-[11px] px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-900"
                                title="Clear negative prompt"
                              >
                                Clear
                              </button>
                            </div>
                          </div>

                          <textarea
                            value={
                              scene.video_negative_prompt ??
                              DEFAULT_VIDEO_NEGATIVE_PROMPT
                            }
                            onChange={(e) =>
                              handleVideoNegativePromptChange(
                                scene.id,
                                e.target.value,
                              )
                            }
                            rows={3}
                            placeholder="e.g. speaking/lip-sync, background music/soundtrack, text overlays, warping, camera shake"
                            className="mt-2 w-full px-3 py-2 border rounded-xl text-sm font-mono leading-relaxed bg-gray-50/80 text-gray-900 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y dark:bg-gray-900/40 dark:text-gray-100 dark:border-gray-800"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                    <label className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2">
                      Duration
                      <select
                        value={durationSeconds}
                        onChange={(e) =>
                          handleVideoDurationChange(scene.id, e.target.value)
                        }
                        className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800"
                        title="Video duration (1–15 seconds). If pricing is per-second, this affects cost."
                      >
                        {Array.from({ length: 15 }, (_, i) => i + 1).map(
                          (n) => (
                            <option key={n} value={n}>
                              {n}s
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    <div
                      className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap"
                      title={
                        falVideoUnitCost == null
                          ? "Pricing unavailable"
                          : isPerSecondUnit(falVideoPricingUnit)
                            ? "Estimated cost = unit price × duration"
                            : "Estimated cost = unit price"
                      }
                    >
                      Est:{" "}
                      {estimatedSceneCost == null
                        ? "—"
                        : `$${estimatedSceneCost.toFixed(3)}`}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleGenerateVideoForScene(scene.id)}
                      disabled={
                        !canGenerate || generatingVideoSceneId === scene.id
                      }
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={
                        selectedImageUrl
                          ? "Generate video for this scene"
                          : "Select an image first"
                      }
                    >
                      {generatingVideoSceneId === scene.id
                        ? "Generating..."
                        : selectedVideoUrl
                          ? "Regenerate Video"
                          : "Generate Video"}
                    </button>
                  </div>

                  {generatingVideoSceneId === scene.id && (
                    <div className="mt-3" aria-live="polite">
                      <div className="w-full bg-blue-100 dark:bg-blue-950/30 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 via-violet-600 to-pink-600 rounded-full animate-pulse"
                          style={{ width: "100%" }}
                        ></div>
                      </div>
                      <div className="mt-2 text-xs text-blue-700 dark:text-blue-200">
                        Generating video… this can take a bit.
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-gray-200 text-gray-700 py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-300"
            >
              ← Back
            </button>
            <button
              onClick={async () => {
                if (
                  !(scriptData?.scenes || []).every((s) =>
                    videos.some(
                      (v) => toSceneKey(v?.scene_id) === toSceneKey(s?.id),
                    ),
                  )
                ) {
                  await alert(
                    "Generate videos for all scenes before continuing.",
                    "warning",
                  );
                  return;
                }
                try {
                  if (currentProjectId) {
                    await fetch(`/api/projects/${currentProjectId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ current_step: 5 }),
                    });
                  }
                } catch {}
                setStep(5);
                setMaxStepReached((prev) => Math.max(prev, 5));
              }}
              disabled={
                !(scriptData?.scenes || []).every((s) =>
                  videos.some(
                    (v) => toSceneKey(v?.scene_id) === toSceneKey(s?.id),
                  ),
                )
              }
              className="flex-1 bg-blue-600 text-white py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              title="Continue to generate background music"
            >
              Continue to Background Music →
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Generate Background Music */}
      {step === 5 && (
        <div className="admin-card p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-3">
              Step 5: Generate Background Music
            </h2>
            <div className="flex flex-wrap gap-2">
              <div className="bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap dark:bg-teal-950/30 dark:border-teal-900">
                <span className="text-teal-700 dark:text-teal-200">⏱️ Total video:</span>
                <span className="font-semibold text-teal-900 dark:text-teal-100">
                  {(() => {
                    const t = (scriptData?.scenes || []).reduce(
                      (sum, s) => sum + getSceneDurationSeconds(s),
                      0,
                    );
                    return `${Math.floor(t / 60)}m ${Math.round(t % 60)}s`;
                  })()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-violet-700 text-xs sm:text-sm font-medium">🎵 Model:</span>
                <select
                  value={selectedMusicModelId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedMusicModelId(id);
                    if (id !== "elevenlabs") setUseCompositionPlan(false);
                    loadMusicPricing(id);
                  }}
                  className="text-xs sm:text-sm font-medium bg-white dark:bg-gray-900 border border-violet-200 dark:border-violet-800 rounded-lg px-2 py-1.5 text-violet-900 dark:text-violet-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                >
                  {MUSIC_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-purple-700">⚡ Unit:</span>
                <span className="font-semibold text-purple-900">
                  {loadingMusicPricing
                    ? "Loading..."
                    : musicUnitCost !== null
                      ? `$${musicUnitCost.toFixed(2)}/${musicPricingUnit || "min"}`
                      : "Unavailable"}
                </span>
              </div>
              {projectCosts?.step5?.elevenlabs_music > 0 && (
                <div className="bg-pink-50 border border-pink-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-pink-700">🎵 Music:</span>
                  <span className="font-semibold text-pink-900">
                    ${projectCosts.step5.elevenlabs_music.toFixed(3)}
                  </span>
                </div>
              )}
              {projectCosts?.step5?.total > 0 && (
                <div className="bg-gray-50 border border-gray-300 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-gray-700">💰 Step 5 Total:</span>
                  <span className="font-semibold text-gray-900">
                    ${projectCosts.step5.total.toFixed(3)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-700 mb-6 dark:text-gray-300">
            Generate instrumental background music using the selected model (via
            Fal). The music will be mixed under your voiceover when assembling
            the final video. Music length is set to match the total video length
            ({(() => {
              const t = (scriptData?.scenes || []).reduce(
                (sum, s) => sum + getSceneDurationSeconds(s),
                0,
              );
              return `${Math.floor(t / 60)}m ${Math.round(t % 60)}s`;
            })()}
            ).
          </p>

          {scriptData?.script && (
            <div className="mb-6">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Full Voiceover Script
              </div>
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {scriptData.script}
              </div>
            </div>
          )}

          {voiceoverUrl && (
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  <span className="text-lg">🎤</span>
                  Voiceover
                </div>
                <audio
                  controls
                  src={voiceoverUrl}
                  className="w-full sm:w-auto sm:flex-1 h-9"
                  style={{ maxWidth: "520px" }}
                />
              </div>
            </div>
          )}

          {/* Theme – selected or default */}
          <div className="mb-6">
            <div className="flex items-center justify-between gap-3 mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Music theme
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    loadAvailableMusicThemes();
                    setShowMusicThemePicker(true);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-900"
                  title="Select a music theme from the library"
                >
                  {selectedMusicThemeId
                    ? availableMusicThemes.find(
                        (t) => t.id === selectedMusicThemeId,
                      )?.name || "Theme"
                    : defaultMusicThemeId
                      ? (availableMusicThemes.find(
                          (t) => t.id === defaultMusicThemeId,
                        )?.name || "Theme") + " (default)"
                      : "🎵 Select theme"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    loadAvailableMusicFromCollection();
                    setShowMusicCollectionPicker(true);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-900"
                  title="Select previously generated music from the collection"
                >
                  📀 Select from collection
                </button>
                {selectedMusicThemeId && (
                  <button
                    type="button"
                    onClick={() => setSelectedMusicThemeId(null)}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Clear theme selection"
                  >
                    Clear
                  </button>
                )}
                <a
                  href="/admin/music-themes"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs px-2 py-1 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800"
                  title="Manage music theme library"
                >
                  Manage
                </a>
              </div>
            </div>

            {/* Instrument palette – brand rules for prompt generation */}
            <div className="mb-6">
              <div className="flex items-center justify-between gap-3 mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Instrument palette
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useInstrumentPalette}
                      onChange={(e) =>
                        setUseInstrumentPalette(e.target.checked)
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      Apply instrument rules to prompts
                    </span>
                  </label>
                  <a
                    href="/admin/instruments"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-2 py-1 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800"
                    title="Manage instrument palette"
                  >
                    Manage
                  </a>
                </div>
              </div>
              {useInstrumentPalette && availableInstruments.length > 0 && (
                <details className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                  <summary className="text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer list-none">
                    {availableInstruments.map((i) => i.name).join(", ")}
                    {availableInstruments.length > 8 && "…"}
                  </summary>
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                    {availableInstruments.map((i) => i.name).join(", ")}
                  </div>
                </details>
              )}
            </div>

            {(selectedMusicThemeId || defaultMusicThemeId) && (
              <div className="mb-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Theme description (read-only)
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {(
                    availableMusicThemes.find(
                      (t) =>
                        t.id === (selectedMusicThemeId || defaultMusicThemeId),
                    )?.description || ""
                  ).trim() || "—"}
                </div>
              </div>
            )}
          </div>

          {/* Music prompt – generated from theme + topic + script, or custom */}
          <div className="mb-6">
            <div className="flex items-center justify-between gap-3 mb-2">
              <label
                htmlFor="music-prompt"
                className="text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Music prompt
              </label>
              <button
                type="button"
                onClick={async () => {
                  const theme =
                    selectedMusicThemeId
                      ? availableMusicThemes.find(
                          (t) => t.id === selectedMusicThemeId,
                        )
                      : defaultMusicThemeId
                        ? availableMusicThemes.find(
                            (t) => t.id === defaultMusicThemeId,
                          )
                        : null;
                  const themeDesc = theme?.description?.trim();
                  if (!themeDesc) {
                    await alert(
                      "Select a theme or set a default theme first",
                      "warning",
                    );
                    return;
                  }
                  setGeneratingMusicPrompt(true);
                  try {
                    const res = await fetch(
                      "/api/video-generator/generate-music-prompt",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          theme_description: themeDesc,
                          topic: topic?.trim() || "",
                          script: scriptData?.script?.trim() || "",
                          scene_locations: (scriptData?.scenes || []).map(
                            (s) => {
                              const locId =
                                locationMapping[s.id] ?? s.location_id;
                              const loc = selectedLocations.find(
                                (l) => l.id === locId || l.id === String(locId),
                              );
                              return {
                                scene_id: s.id,
                                location_name: loc?.name ?? null,
                              };
                            },
                          ),
                          use_instrument_palette: useInstrumentPalette,
                          instrument_ids: useInstrumentPalette
                            ? selectedInstrumentIds.length
                              ? selectedInstrumentIds
                              : undefined
                            : undefined,
                        }),
                      },
                    );
                    const result = await res.json();
                    if (result.success && result.prompt?.trim()) {
                      setMusicPrompt(result.prompt.trim());
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
                disabled={
                  generatingMusicPrompt ||
                  !(selectedMusicThemeId || defaultMusicThemeId)
                }
                className="text-xs px-3 py-1.5 rounded-lg bg-violet-100 text-violet-800 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-200 dark:hover:bg-violet-900/60 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Generate music prompt from theme + topic + voiceover script"
              >
                {generatingMusicPrompt ? "Generating…" : "Generate from theme"}
              </button>
            </div>
            <textarea
              id="music-prompt"
              value={musicPrompt}
              onChange={(e) => setMusicPrompt(e.target.value)}
              rows={4}
              placeholder="Generated from theme + topic + script, or enter custom prompt…"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900 dark:text-gray-100 dark:border-gray-800"
            />
          </div>

          {/* Negative prompt – what to avoid in generated music */}
          <div className="mb-6">
            <label
              htmlFor="music-negative-prompt"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
            >
              Negative prompt (avoid)
            </label>
            <textarea
              id="music-negative-prompt"
              value={musicNegativePrompt}
              onChange={(e) => setMusicNegativePrompt(e.target.value)}
              rows={2}
              placeholder="e.g. meditation, spa, relaxation, calming, soothing, therapeutic, ambient chill, lo-fi"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900 dark:text-gray-100 dark:border-gray-800"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Terms to avoid in the generated music. Comma-separated. Beatoven
              uses this as a dedicated API field; other models append it to the
              prompt.
            </p>
          </div>

          {selectedMusicModelId === "elevenlabs" && (
          <div className="mb-6 flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useCompositionPlan}
                onChange={(e) => setUseCompositionPlan(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-200">
                Use composition plan (advanced)
              </span>
            </label>
            {useCompositionPlan && (
              <button
                type="button"
                onClick={async () => {
                  const scriptText = scriptData?.script?.trim() || "";
                  const topicText = topic?.trim() || "";
                  if (!scriptText && !topicText) {
                    await alert("Project needs a topic and script first (from Steps 1–2)", "warning");
                    return;
                  }
                  setGeneratingMusicPlan(true);
                  try {
                    const sceneDurations = Object.fromEntries(
                      (scriptData?.scenes || []).map((s) => [
                        s.id,
                        getSceneDurationSeconds(s),
                      ]),
                    );
                    const totalMs =
                      Object.values(sceneDurations).reduce((a, b) => a + b, 0) *
                      1000;
                    const res = await fetch(
                      "/api/video-generator/generate-music-composition-plan",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          script: scriptText,
                          topic: topicText,
                          music_length_ms: Math.max(
                            3000,
                            Math.min(600000, totalMs || 60000),
                          ),
                        }),
                      },
                    );
                    const result = await res.json();
                    if (result.success && result.composition_plan) {
                      setMusicCompositionPlan(result.composition_plan);
                    } else {
                      await alert(
                        "Failed to generate plan: " + (result.error || "Unknown"),
                        "error",
                      );
                    }
                  } catch (err) {
                    await alert("Error: " + err.message, "error");
                  } finally {
                    setGeneratingMusicPlan(false);
                  }
                }}
                disabled={
                  generatingMusicPlan ||
                  (!(scriptData?.script?.trim()) && !(topic?.trim()))
                }
                className="text-xs px-3 py-1.5 rounded-lg bg-violet-100 text-violet-800 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-200 dark:hover:bg-violet-900/60"
              >
                {generatingMusicPlan ? "Generating…" : "Generate plan from script & topic"}
              </button>
            )}
          </div>
          )}

          {useCompositionPlan && selectedMusicModelId === "elevenlabs" && (
            <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 p-4 space-y-4">
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Positive global styles
                </div>
                <div className="flex flex-wrap gap-2">
                  {(musicCompositionPlan.positive_global_styles || []).map(
                    (s, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs dark:bg-green-900/40 dark:text-green-200"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() =>
                            setMusicCompositionPlan((prev) => ({
                              ...prev,
                              positive_global_styles: (
                                prev.positive_global_styles || []
                              ).filter((_, j) => j !== i),
                            }))
                          }
                          className="ml-1 text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    ),
                  )}
                  <input
                    type="text"
                    placeholder="+ Add style"
                    className="text-xs px-2 py-1 border rounded w-24"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const v = e.target.value.trim();
                        if (v) {
                          setMusicCompositionPlan((prev) => ({
                            ...prev,
                            positive_global_styles: [
                              ...(prev.positive_global_styles || []),
                              v,
                            ],
                          }));
                          e.target.value = "";
                        }
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Negative global styles
                </div>
                <div className="flex flex-wrap gap-2">
                  {(musicCompositionPlan.negative_global_styles || []).map(
                    (s, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-800 text-xs dark:bg-red-900/40 dark:text-red-200"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() =>
                            setMusicCompositionPlan((prev) => ({
                              ...prev,
                              negative_global_styles: (
                                prev.negative_global_styles || []
                              ).filter((_, j) => j !== i),
                            }))
                          }
                          className="ml-1 text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </span>
                    ),
                  )}
                  <input
                    type="text"
                    placeholder="+ Add avoid"
                    className="text-xs px-2 py-1 border rounded w-24"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const v = e.target.value.trim();
                        if (v) {
                          setMusicCompositionPlan((prev) => ({
                            ...prev,
                            negative_global_styles: [
                              ...(prev.negative_global_styles || []),
                              v,
                            ],
                          }));
                          e.target.value = "";
                        }
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Sections
                </div>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {(musicCompositionPlan.sections || []).map((sec, si) => (
                    <div
                      key={si}
                      className="flex items-center gap-2 p-2 rounded bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800"
                    >
                      <input
                        value={sec.section_name || ""}
                        onChange={(e) =>
                          setMusicCompositionPlan((prev) => {
                            const s = [...(prev.sections || [])];
                            s[si] = { ...s[si], section_name: e.target.value };
                            return { ...prev, sections: s };
                          })
                        }
                        placeholder="Section name"
                        className="text-xs px-2 py-1 border rounded flex-1 min-w-0"
                      />
                      <input
                        type="number"
                        value={sec.duration_ms || 0}
                        onChange={(e) =>
                          setMusicCompositionPlan((prev) => {
                            const s = [...(prev.sections || [])];
                            s[si] = {
                              ...s[si],
                              duration_ms: Math.max(
                                3000,
                                Math.min(120000, Number(e.target.value) || 0),
                              ),
                            };
                            return { ...prev, sections: s };
                          })
                        }
                        min={3000}
                        max={120000}
                        step={1000}
                        placeholder="ms"
                        className="text-xs px-2 py-1 border rounded w-20"
                      />
                      <span className="text-[10px] text-gray-500">ms</span>
                      <button
                        type="button"
                        onClick={() =>
                          setMusicCompositionPlan((prev) => ({
                            ...prev,
                            sections: (prev.sections || []).filter(
                              (_, j) => j !== si,
                            ),
                          }))
                        }
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setMusicCompositionPlan((prev) => ({
                        ...prev,
                        sections: [
                          ...(prev.sections || []),
                          {
                            section_name: "New section",
                            positive_local_styles: [],
                            negative_local_styles: [],
                            duration_ms: 10000,
                            lines: [],
                          },
                        ],
                      }))
                    }
                    className="text-xs px-2 py-1 rounded border border-dashed border-gray-400 text-gray-600 hover:border-gray-600"
                  >
                    + Add section
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Generate music – action section */}
          <div className="mb-6 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/30 dark:bg-violet-950/20 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-violet-900 dark:text-violet-100 mb-1">
                  Generate new music
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Uses ElevenLabs Music (via Fal). Select a theme or enter a
                  description above.
                </p>
              </div>
              <button
                onClick={async () => {
                  const hasPlan =
                    useCompositionPlan &&
                    Array.isArray(musicCompositionPlan?.sections) &&
                    musicCompositionPlan.sections.length > 0;
                  const selectedTheme = selectedMusicThemeId
                    ? availableMusicThemes.find(
                        (t) => t.id === selectedMusicThemeId,
                      )
                    : defaultMusicThemeId
                      ? availableMusicThemes.find(
                          (t) => t.id === defaultMusicThemeId,
                        )
                      : null;
                  const hasPrompt =
                    musicPrompt.trim() || Boolean(selectedTheme?.description);

                  if (!hasPlan && !hasPrompt) {
                    await alert("Select a music theme or enter a description (or configure a composition plan)", "warning");
                    return;
                  }
                  if (hasPlan && musicCompositionPlan.sections.some((s) => !s.section_name || !s.duration_ms)) {
                    await alert("All sections need a name and duration", "warning");
                    return;
                  }

                  setGeneratingBackgroundMusic(true);
                  try {
                    const sceneDurations = Object.fromEntries(
                      (scriptData?.scenes || []).map((s) => [
                        s.id,
                        getSceneDurationSeconds(s),
                      ]),
                    );
                    const totalSeconds = Object.values(sceneDurations).reduce(
                      (a, b) => a + b,
                      0,
                    );
                    const musicLengthMs = Math.max(
                      3000,
                      Math.min(600000, totalSeconds * 1000),
                    );

                    const themeOrDescription =
                      (hasPlan ? null : musicPrompt.trim() || selectedTheme?.description) || null;

                    let promptText = themeOrDescription;

                    if (!hasPlan && themeOrDescription) {
                      try {
                        const promptRes = await fetch(
                          "/api/video-generator/generate-music-prompt",
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              theme_description: themeOrDescription,
                              topic: topic?.trim() || "",
                              script: scriptData?.script?.trim() || "",
                              scene_locations: (scriptData?.scenes || []).map(
                                (s) => {
                                  const locId =
                                    locationMapping[s.id] ?? s.location_id;
                                  const loc = selectedLocations.find(
                                    (l) =>
                                      l.id === locId || l.id === String(locId),
                                  );
                                  return {
                                    scene_id: s.id,
                                    location_name: loc?.name ?? null,
                                  };
                                },
                              ),
                              use_instrument_palette: useInstrumentPalette,
                              instrument_ids: useInstrumentPalette
                                ? selectedInstrumentIds.length
                                  ? selectedInstrumentIds
                                  : undefined
                                : undefined,
                            }),
                          },
                        );
                        const promptResult = await promptRes.json();
                        if (promptResult.success && promptResult.prompt?.trim()) {
                          promptText = promptResult.prompt.trim();
                        }
                      } catch (promptErr) {
                        console.warn("Music prompt generation failed, using theme directly:", promptErr);
                      }
                    }

                    const body = {
                      project_id: currentProjectId,
                      session_id: sessionId,
                      music_length_ms: musicLengthMs,
                      force_instrumental: !hasPlan,
                      respect_sections_durations: false,
                    };

                    if (hasPlan) {
                      const baseNegative =
                        musicCompositionPlan.negative_global_styles || [];
                      const userNegative = musicNegativePrompt
                        .split(/[,;]/)
                        .map((t) => t.trim())
                        .filter(Boolean);
                      const negative_global_styles = [
                        ...new Set([...baseNegative, ...userNegative]),
                      ];
                      const plan = {
                        positive_global_styles: musicCompositionPlan.positive_global_styles || [],
                        negative_global_styles,
                        sections: musicCompositionPlan.sections.map((s) => ({
                          section_name: s.section_name || "Section",
                          positive_local_styles: s.positive_local_styles || [],
                          negative_local_styles: s.negative_local_styles || [],
                          duration_ms: Math.max(3000, Math.min(120000, Number(s.duration_ms) || 10000)),
                          lines: s.lines || [],
                        })),
                      };
                      body.composition_plan = plan;
                    } else if (promptText) {
                      const negativeAppend = musicNegativePrompt.trim()
                        ? "\n\nAvoid: " + musicNegativePrompt.trim()
                        : "";
                      // Prepend anti-meditation frame — model strongly associates slow pads with meditation
                      // Avoid trademarked names (Vangelis, Blade Runner) — Fal content checker flags them
                      const antiMeditationPrefix =
                        "1980s retro-futuristic synth film score. NOT meditation, NOT spa, NOT relaxation. ";
                      const prefixedPrompt =
                        promptText.toLowerCase().includes("retro-futuristic") ||
                        promptText.toLowerCase().startsWith("film score")
                          ? promptText
                          : antiMeditationPrefix + promptText;
                      body.prompt = prefixedPrompt + negativeAppend;
                    }

                    const res = await fetch(
                      "/api/video-generator/generate-background-music",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          ...body,
                          model_id: selectedMusicModelId,
                          negative_prompt: musicNegativePrompt.trim()
                            ? musicNegativePrompt.trim()
                            : null,
                        }),
                      },
                    );
                    const result = await res.json();
                    if (result.success) {
                      setBackgroundMusicUrl(result.music_url);
                      setBackgroundMusicPrompt(
                        hasPlan
                          ? JSON.stringify(musicCompositionPlan)
                          : promptText || musicPrompt.trim(),
                      );
                      loadAvailableMusicFromCollection();
                      const projectRes = await fetch(
                        `/api/projects/${currentProjectId}`,
                      );
                      const projectResult = await projectRes.json();
                      if (projectResult.success) {
                        setProjectCosts(projectResult.project.costs || null);
                      }
                    } else {
                      await alert(
                        "Failed to generate music: " + (result.error || "Unknown"),
                        "error",
                      );
                    }
                  } catch (err) {
                    await alert("Error: " + err.message, "error");
                  } finally {
                    setGeneratingBackgroundMusic(false);
                  }
                }}
                disabled={
                  generatingBackgroundMusic ||
                  (useCompositionPlan
                    ? !(
                        Array.isArray(musicCompositionPlan?.sections) &&
                        musicCompositionPlan.sections.length > 0 &&
                        musicCompositionPlan.sections.every(
                          (s) => s.section_name && s.duration_ms,
                        )
                      )
                    : !musicPrompt.trim())
                }
                className="shrink-0 px-6 py-2.5 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingBackgroundMusic ? "Generating…" : "Generate music"}
              </button>
            </div>
            {generatingBackgroundMusic && (
              <div className="mt-4 pt-4 border-t border-violet-200 dark:border-violet-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="animate-spin h-4 w-4 border-2 border-violet-600 border-t-transparent rounded-full"></div>
                  <span className="text-sm font-medium text-violet-900 dark:text-violet-100">
                    Generating background music with ElevenLabs Music…
                  </span>
                </div>
                <div className="w-full bg-violet-200 dark:bg-violet-900/40 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-violet-600 rounded-full animate-pulse"
                    style={{ width: "100%" }}
                  ></div>
                </div>
                <p className="text-xs text-violet-700 dark:text-violet-300 mt-2">
                  This may take 30–60 seconds depending on track length
                </p>
              </div>
            )}
          </div>

          {/* Generated music – list of all tracks for this project */}
          <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              Generated music
            </div>
            {loadingMusicCollection ? (
              <div className="flex items-center gap-2 py-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="animate-spin h-4 w-4 border-2 border-violet-600 border-t-transparent rounded-full"></div>
                Loading…
              </div>
            ) : availableMusicFromCollection.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
                No music generated yet for this project. Generate or select from
                the full collection below.
              </p>
            ) : (
              <div className="space-y-3">
                {availableMusicFromCollection.map((m) => {
                  const isSelected = backgroundMusicUrl === m.music_url;
                  const durationStr = m.duration_ms
                    ? `${Math.floor(m.duration_ms / 60000)}m ${Math.round((m.duration_ms % 60000) / 1000)}s`
                    : null;
                  const promptPreview =
                    m.prompt ||
                    (m.composition_plan?.positive_global_styles?.length
                      ? `Composition plan: ${m.composition_plan.positive_global_styles.slice(0, 2).join(", ")}`
                      : "—");

                  return (
                    <div
                      key={m.id}
                      className={
                        "rounded-lg border p-3 space-y-3 " +
                        (isSelected
                          ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-600"
                          : "border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30")
                      }
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <audio
                          controls
                          className="h-8 flex-1 min-w-[140px]"
                          src={m.music_url}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-1">
                            {promptPreview}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {durationStr && <span>⏱️ {durationStr}</span>}
                            {m.timestamp && (
                              <span>
                                {new Date(m.timestamp).toLocaleDateString()}
                              </span>
                            )}
                            {typeof m.cost === "number" && (
                              <span>• ${m.cost.toFixed(3)}</span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                          if (currentProjectId && sessionId) {
                            try {
                              const res = await fetch(
                                "/api/video-generator/select-music",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    project_id: currentProjectId,
                                    session_id: sessionId,
                                    music_id: m.id,
                                  }),
                                },
                              );
                              const result = await res.json();
                              if (result.success) {
                                setBackgroundMusicUrl(result.music_url);
                                setBackgroundMusicPrompt(
                                  result.background_music_prompt || "",
                                );
                              }
                            } catch {
                              setBackgroundMusicUrl(m.music_url);
                              setBackgroundMusicPrompt(
                                m.prompt ||
                                  (m.composition_plan
                                    ? JSON.stringify(m.composition_plan)
                                    : ""),
                              );
                            }
                          } else {
                            setBackgroundMusicUrl(m.music_url);
                            setBackgroundMusicPrompt(
                              m.prompt ||
                                (m.composition_plan
                                  ? JSON.stringify(m.composition_plan)
                                  : ""),
                            );
                          }
                        }}
                          className={
                            "text-xs px-3 py-1.5 rounded-lg font-medium shrink-0 " +
                            (isSelected
                              ? "bg-violet-600 text-white cursor-default"
                              : "bg-violet-600 text-white hover:bg-violet-700")
                          }
                        >
                          {isSelected ? "✓ Selected" : "Select"}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await confirm(
                              "Delete this music track? The file will be removed from storage. This cannot be undone.",
                            );
                            if (!ok) return;
                            try {
                              const res = await fetch(
                                "/api/video-generator/delete-music",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ music_id: m.id }),
                                },
                              );
                              const result = await res.json();
                              if (result.success) {
                                await alert("Music deleted", "success");
                                if (backgroundMusicUrl === m.music_url) {
                                  setBackgroundMusicUrl(null);
                                  setBackgroundMusicPrompt("");
                                }
                                loadAvailableMusicFromCollection();
                              } else {
                                await alert(
                                  "Failed to delete: " + (result.error || "Unknown"),
                                  "error",
                                );
                              }
                            } catch (err) {
                              await alert(
                                "Error deleting: " + err.message,
                                "error",
                              );
                            }
                          }}
                          className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 hover:text-red-600 hover:border-red-300 dark:text-gray-400 dark:hover:text-red-400 dark:hover:border-red-700 shrink-0"
                          title="Delete music track"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setMusicDetailsModal(m)}
                          className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 hover:text-blue-600 hover:border-blue-300 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:border-blue-700 shrink-0 flex items-center gap-1"
                          title="Show generation details"
                        >
                          <Info size={14} />
                          Info
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected music – track used for assembly */}
          <div className="mb-6 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 p-4">
            <div className="text-sm font-semibold text-violet-900 dark:text-violet-100 mb-3">
              Selected music (for assembly)
            </div>
            {backgroundMusicUrl ? (
              <>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <audio
                    controls
                    src={backgroundMusicUrl}
                    className="flex-1 min-w-[200px]"
                  />
                  {voiceoverUrl && (
                    <button
                      type="button"
                      onClick={handlePlayWithVoiceover}
                      className={
                        "text-xs px-3 py-2 rounded-lg font-medium shrink-0 flex items-center gap-1.5 " +
                        (isPlayingWithVoiceover
                          ? "bg-violet-700 text-white"
                          : "bg-violet-600 text-white hover:bg-violet-700")
                      }
                      title="Preview music mixed with voiceover (music at 25% volume)"
                    >
                      {isPlayingWithVoiceover ? (
                        <>⏹ Stop</>
                      ) : (
                        <>▶ Play with voiceover</>
                      )}
                    </button>
                  )}
                </div>
                {backgroundMusicPrompt && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    {backgroundMusicPrompt.startsWith("{")
                      ? "Composition plan (advanced)"
                      : `Prompt: ${backgroundMusicPrompt}`}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setBackgroundMusicUrl(null);
                    setBackgroundMusicPrompt("");
                  }}
                  className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  title="Remove selected music"
                >
                  Remove selection
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select a track from the list above or from the full collection to
                use for assembly.
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(4)}
              className="flex-1 bg-gray-200 text-gray-700 py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-300"
            >
              ← Back
            </button>
            <button
              onClick={() => {
                setStep(6);
                setMaxStepReached((prev) => Math.max(prev, 6));
              }}
              disabled={
                !voiceoverUrl ||
                !(scriptData?.scenes || []).every((s) =>
                  videos.some(
                    (v) => toSceneKey(v?.scene_id) === toSceneKey(s?.id),
                  ),
                )
              }
              className="flex-1 bg-blue-600 text-white py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              title="Continue to timeline editor and assemble"
            >
              Continue to Assemble →
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Timeline Editor (FCP/Premiere-style) & Final Video */}
      {step === 6 && (
        <div className="admin-card p-8">
          {loadingProject && !scriptData ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Loading project data…
              </p>
            </div>
          ) : (
          <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-3">
              Step 6: Assemble & Final Video
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Edit your timeline (Final Cut Pro / Premiere-style) then render
              via ShotStack. Videos, voiceover, and optional music are combined.
            </p>
            <div className="flex flex-wrap gap-2">
              {finalVideoUrl ? (
                <div className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap">
                  ✓ Video Complete
                </div>
              ) : isAssembling ? (
                <div className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap">
                  Rendering...
                </div>
              ) : (
                <div className="bg-teal-100 text-teal-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap">
                  Edit timeline, then click Render
                </div>
              )}
              {projectCosts?.step6?.shotstack > 0 && (
                <div className="bg-pink-50 border border-pink-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-pink-700">🎞️ Shotstack:</span>
                  <span className="font-semibold text-pink-900">
                    ${projectCosts.step6.shotstack.toFixed(4)}
                  </span>
                </div>
              )}
              {projectCosts?.step6?.total > 0 && (
                <div className="bg-gray-50 border border-gray-300 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-gray-700">💰 Step 6 Total:</span>
                  <span className="font-semibold text-gray-900">
                    ${projectCosts.step6.total.toFixed(4)}
                  </span>
                </div>
              )}
              {projectCosts?.total > 0 && (
                <div className="bg-blue-50 border border-blue-300 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-blue-700">💎 Total Project Cost:</span>
                  <span className="font-semibold text-blue-900">
                    ${projectCosts.total.toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {isAssembling ? (
            <div className="mb-8 py-12 text-center text-gray-600 dark:text-gray-400">
              <p>Video is being rendered. This usually takes 1–2 minutes.</p>
              <p className="mt-2 text-sm">The page will update automatically.</p>
            </div>
          ) : (
            <>
              {/* Timeline Editor – always shown when not assembling */}
              <div className="mb-4">
                <TimelineEditor
                  ref={timelineEditorRef}
                  projectId={currentProjectId}
                  initialTimelineSettings={timelineSettings}
                  videos={
                    videos.length
                      ? videos
                      : deriveSelectedVideosFromScenes(scriptData?.scenes || [])
                  }
                  voiceoverUrl={voiceoverUrl}
                  backgroundMusicUrl={backgroundMusicUrl || null}
                  sceneDurations={Object.fromEntries(
                    (scriptData?.scenes || []).map((s) => [
                      s.id,
                      getSceneDurationSeconds(s),
                    ]),
                  )}
                  getSceneDurationSeconds={getSceneDurationSeconds}
                  scriptData={scriptData}
                />
              </div>

              {/* Render button – directly below timeline */}
              <div className="mb-6">
                <button
                  onClick={handleRenderFromEditor}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                  title="Render via ShotStack"
                >
                  {loading ? "Starting render…" : finalVideoUrl ? "Render Again" : "Render Final Video →"}
                </button>
              </div>

              {/* Generated video – show when video exists */}
              {finalVideoUrl && (
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Generated Video
                  </h3>
                  <div className="aspect-[9/16] max-w-md mx-auto bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <video controls className="w-full h-full">
                      <source src={finalVideoUrl} type="video/mp4" />
                    </video>
                  </div>
                </div>
              )}

              {/* Back + Continue to Post */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setStep(5)}
                  className="flex-1 min-w-[120px] bg-gray-200 text-gray-700 py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-300"
                >
                  ← Back
                </button>
                {finalVideoUrl && (
                  <button
                    onClick={() => {
                      setStep(7);
                      setMaxStepReached((prev) => Math.max(prev, 7));
                    }}
                    className="flex-1 min-w-[120px] bg-blue-600 text-white py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700"
                  >
                    Continue to Post →
                  </button>
                )}
              </div>
            </>
          )}
          </>
          )}
        </div>
      )}

      {/* Step 7: Post (Download, Social Media, Create Another) */}
      {step === 7 && (
        <div className="admin-card p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-3">Step 7: Post</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Download your video or post to social media.
            </p>
          </div>

          {finalVideoUrl && (
            <>
              <div className="mb-8">
                <div className="aspect-[9/16] max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden">
                  <video controls className="w-full h-full">
                    <source src={finalVideoUrl} type="video/mp4" />
                  </video>
                </div>
              </div>

              {/* Download */}
              <div className="mb-8">
                <a
                  href={finalVideoUrl}
                  download
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
                >
                  <span>📥</span>
                  Download Video
                </a>
              </div>

              {/* Social Media Posting */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Post to Social Media</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => handlePostToSocial("instagram")}
                    disabled={loading}
                    className="flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    <span className="text-2xl">📷</span>
                    Post to Instagram
                  </button>

                  <button
                    onClick={() => handlePostToSocial("youtube")}
                    disabled={loading}
                    className="flex items-center justify-center gap-3 bg-red-600 text-white py-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    <span className="text-2xl">▶️</span>
                    Post to YouTube
                  </button>

                  <button
                    onClick={() => handlePostToSocial("tiktok")}
                    disabled={loading}
                    className="flex items-center justify-center gap-3 bg-black text-white py-4 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
                  >
                    <span className="text-2xl">🎵</span>
                    Post to TikTok
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setStep(6)}
              className="flex-1 bg-gray-200 text-gray-700 py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-300"
            >
              ← Back to Assemble
            </button>
            <button
              onClick={() => {
                setStep(0);
                setTopic("");
                setSelectedCharacter(null);
                setScriptData(null);
                setImages([]);
                setVideos([]);
                setVoiceoverUrl(null);
                setFinalVideoUrl(null);
                setTimelineSettings(null);
                setBackgroundMusicUrl(null);
                setBackgroundMusicPrompt("");
                setSessionId(null);
                setCurrentProjectId(null);
                setCurrentProjectName("");
                loadProjects();
              }}
              className="flex-1 bg-blue-600 text-white py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              Create Another Video
            </button>
          </div>
        </div>
      )}

      {/* Music Theme Picker Modal */}
      {showMusicThemePicker && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    🎵 Select Music Theme
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    Pick a music theme for background music generation.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="/admin/music-themes"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-900"
                    title="Manage music theme library"
                  >
                    Manage
                  </a>
                  <button
                    onClick={() => setShowMusicThemePicker(false)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            <div
              className="p-6 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 180px)" }}
            >
              <div className="grid grid-cols-1 gap-4">
                {availableMusicThemes.map((theme) => {
                  const isCurrent = selectedMusicThemeId === theme.id;

                  return (
                    <button
                      key={theme.id}
                      onClick={() => {
                        setSelectedMusicThemeId(theme.id);
                        setMusicPrompt(theme.description || "");
                        setShowMusicThemePicker(false);
                      }}
                      className={
                        "text-left p-4 rounded-xl border-2 transition " +
                        (isCurrent
                          ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20"
                          : "border-gray-200 hover:border-violet-400 hover:bg-violet-50 dark:border-gray-800 dark:hover:bg-violet-950/20")
                      }
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xl">🎵</span>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                            {theme.name}
                            {isCurrent && (
                              <span className="ml-2 text-xs text-green-600 dark:text-green-300 font-normal">
                                (Current)
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">
                            {theme.description}
                          </p>
                          {theme.tags && theme.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {theme.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full dark:bg-violet-950/20 dark:text-violet-200"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {availableMusicThemes.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="mb-2">No music themes available yet.</p>
                    <p className="text-sm">
                      Click &quot;Seed defaults&quot; in the{" "}
                      <a
                        href="/admin/music-themes"
                        target="_blank"
                        rel="noreferrer"
                        className="text-violet-600 hover:underline"
                      >
                        Music Themes
                      </a>{" "}
                      page.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/40">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedMusicThemeId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMusicThemeId(null);
                      setMusicPrompt("");
                      setShowMusicThemePicker(false);
                    }}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700"
                    title="Clear theme selection"
                  >
                    ✕ Clear selection
                  </button>
                )}
                <button
                  onClick={() => setShowMusicThemePicker(false)}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Music Collection Picker Modal */}
      {showMusicCollectionPicker && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    📀 Select from Music Collection
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    Choose previously generated music to use as background track
                  </p>
                </div>
                <button
                  onClick={() => setShowMusicCollectionPicker(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <div
              className="p-6 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 180px)" }}
            >
              {loadingMusicCollection ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full" />
                </div>
              ) : availableMusicFromCollection.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p className="mb-2">No music in collection yet.</p>
                  <p className="text-sm">
                    Generate background music first to add tracks here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {availableMusicFromCollection.map((m) => {
                    const isCurrent = backgroundMusicUrl === m.music_url;
                    const durationStr = m.duration_ms
                      ? `${Math.floor(m.duration_ms / 60000)}m ${Math.round((m.duration_ms % 60000) / 1000)}s`
                      : null;
                    const promptPreview =
                      m.prompt ||
                      (m.composition_plan?.positive_global_styles?.length
                        ? `Composition plan: ${m.composition_plan.positive_global_styles.slice(0, 2).join(", ")}`
                        : "—");

                    return (
                      <button
                        key={m.id}
                        onClick={async () => {
                          if (!currentProjectId || !sessionId) {
                            setBackgroundMusicUrl(m.music_url);
                            setBackgroundMusicPrompt(
                              m.prompt ||
                                (m.composition_plan
                                  ? JSON.stringify(m.composition_plan)
                                  : ""),
                            );
                            setShowMusicCollectionPicker(false);
                            return;
                          }
                          try {
                            const res = await fetch(
                              "/api/video-generator/select-music",
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  project_id: currentProjectId,
                                  session_id: sessionId,
                                  music_id: m.id,
                                }),
                              },
                            );
                            const result = await res.json();
                            if (result.success) {
                              setBackgroundMusicUrl(result.music_url);
                              setBackgroundMusicPrompt(
                                result.background_music_prompt || "",
                              );
                              setShowMusicCollectionPicker(false);
                            } else {
                              await alert(
                                "Failed to select music: " +
                                  (result.error || "Unknown"),
                                "error",
                              );
                            }
                          } catch (err) {
                            await alert("Error: " + err.message, "error");
                          }
                        }}
                        className={
                          "text-left p-4 rounded-xl border-2 transition " +
                          (isCurrent
                            ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20"
                            : "border-gray-200 hover:border-violet-400 hover:bg-violet-50 dark:border-gray-800 dark:hover:bg-violet-950/20")
                        }
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">🎵</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                              {promptPreview}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                              {durationStr && (
                                <span>⏱️ {durationStr}</span>
                              )}
                              {m.timestamp && (
                                <span>
                                  {new Date(m.timestamp).toLocaleDateString()}
                                </span>
                              )}
                              {isCurrent && (
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                  (Current)
                                </span>
                              )}
                            </div>
                          </div>
                          {m.music_url && (
                            <audio
                              controls
                              className="h-8 max-w-[140px]"
                              onClick={(e) => e.stopPropagation()}
                              src={m.music_url}
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/40">
              <button
                onClick={() => setShowMusicCollectionPicker(false)}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    📍 Select Location for Scene {locationPickerSceneId}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    Choose a location from your library
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="/admin/locations"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-900"
                    title="Manage location library"
                  >
                    Manage
                  </a>
                  <button
                    onClick={() => setShowLocationPicker(false)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            <div
              className="p-6 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 180px)" }}
            >
              <div className="space-y-4 mb-4">
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1 dark:text-gray-200">
                    Indoor/Outdoor:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        setLocationFilters((prev) => ({
                          ...prev,
                          category: null,
                        }))
                      }
                      className={`px-3 py-1 text-xs rounded-full border transition ${
                        !locationFilters.category
                          ? "bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-100"
                          : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-800"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() =>
                        setLocationFilters((prev) => ({
                          ...prev,
                          category: "indoor",
                        }))
                      }
                      className={`px-3 py-1 text-xs rounded-full border transition ${
                        locationFilters.category === "indoor"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-200 dark:border-blue-900/50 dark:hover:bg-blue-950/30"
                      }`}
                    >
                      🏢 Indoor
                    </button>
                    <button
                      onClick={() =>
                        setLocationFilters((prev) => ({
                          ...prev,
                          category: "outdoor",
                        }))
                      }
                      className={`px-3 py-1 text-xs rounded-full border transition ${
                        locationFilters.category === "outdoor"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-200 dark:border-blue-900/50 dark:hover:bg-blue-950/30"
                      }`}
                    >
                      🌃 Outdoor
                    </button>
                    {(locationFilters.category ||
                      locationFilters.lighting.length > 0 ||
                      locationFilters.atmosphere.length > 0 ||
                      locationFilters.key_elements.length > 0) && (
                      <button
                        onClick={() =>
                          setLocationFilters({
                            category: null,
                            lighting: [],
                            atmosphere: [],
                            key_elements: [],
                          })
                        }
                        className="px-3 py-1 text-xs text-red-600 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1 dark:text-gray-200">
                    Filters:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setShowFilterModal("lighting")}
                      className="px-3 py-1.5 text-xs rounded-xl bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-200 font-medium transition dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:border-gray-800"
                    >
                      💡 Lighting{" "}
                      {locationFilters.lighting.length > 0 &&
                        `(${locationFilters.lighting.length})`}
                    </button>
                    <button
                      onClick={() => setShowFilterModal("atmosphere")}
                      className="px-3 py-1.5 text-xs rounded-xl bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-200 font-medium transition dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:border-gray-800"
                    >
                      Atmosphere{" "}
                      {locationFilters.atmosphere.length > 0 &&
                        `(${locationFilters.atmosphere.length})`}
                    </button>
                    <button
                      onClick={() => setShowFilterModal("key_elements")}
                      className="px-3 py-1.5 text-xs rounded-xl bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-200 font-medium transition dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:border-gray-800"
                    >
                      Key Elements{" "}
                      {locationFilters.key_elements.length > 0 &&
                        `(${locationFilters.key_elements.length})`}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {availableLocations
                  .filter((location) => {
                    if (
                      locationFilters.category &&
                      location.category !== locationFilters.category
                    ) {
                      return false;
                    }
                    if (locationFilters.lighting.length > 0) {
                      const locationLighting = Array.isArray(
                        location.visual_characteristics?.lighting,
                      )
                        ? location.visual_characteristics.lighting
                        : [];
                      if (
                        !locationFilters.lighting.some((f) =>
                          locationLighting.includes(f),
                        )
                      ) {
                        return false;
                      }
                    }
                    if (locationFilters.atmosphere.length > 0) {
                      const locationAtmosphere = Array.isArray(
                        location.visual_characteristics?.atmosphere,
                      )
                        ? location.visual_characteristics.atmosphere
                        : [];
                      if (
                        !locationFilters.atmosphere.some((f) =>
                          locationAtmosphere.includes(f),
                        )
                      ) {
                        return false;
                      }
                    }
                    if (locationFilters.key_elements.length > 0) {
                      const locationElements =
                        location.visual_characteristics?.key_elements || [];
                      if (
                        !locationFilters.key_elements.some((f) =>
                          locationElements.includes(f),
                        )
                      ) {
                        return false;
                      }
                    }
                    return true;
                  })
                  .map((location) => {
                    const isCurrentLocation =
                      locationMapping[locationPickerSceneId] === location.id;

                    return (
                      <button
                        key={location.id}
                        onClick={() => handleSelectLocationFromPicker(location)}
                        disabled={isCurrentLocation}
                        className={
                          "text-left p-4 rounded-xl border-2 transition " +
                          (isCurrentLocation
                            ? "border-blue-500 bg-blue-50 cursor-not-allowed dark:bg-blue-950/20"
                            : "border-gray-200 hover:border-blue-400 hover:bg-blue-50 dark:border-gray-800 dark:hover:bg-blue-950/20")
                        }
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xl">📍</span>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                              {location.name}
                              {isCurrentLocation && (
                                <span className="ml-2 text-xs text-green-600 dark:text-green-300 font-normal">
                                  (Current)
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">
                              {location.description}
                            </p>

                            {location.sample_images &&
                              location.sample_images.length > 0 && (
                                <div className="mt-3 flex gap-2 overflow-x-auto">
                                  {location.sample_images
                                    .slice(0, 3)
                                    .map((imageUrl, idx) => (
                                      <div
                                        key={idx}
                                        className="relative flex-shrink-0 w-16 h-24 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-800"
                                      >
                                        <img
                                          src={imageUrl}
                                          alt={`Sample ${idx + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ))}
                                  {location.sample_images.length > 3 && (
                                    <div className="flex-shrink-0 w-16 h-24 rounded-lg bg-gray-100 border border-gray-300 flex items-center justify-center dark:bg-gray-900 dark:border-gray-800">
                                      <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                                        +{location.sample_images.length - 3}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                            <div className="flex flex-wrap gap-1 mt-3">
                              {location.category && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full dark:bg-blue-950/20 dark:text-blue-200">
                                  {location.category === "indoor"
                                    ? "🏢 Indoor"
                                    : "🌃 Outdoor"}
                                </span>
                              )}
                              {location.type && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full dark:bg-blue-950/20 dark:text-blue-200">
                                  {location.type.replace(/_/g, " ")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                {availableLocations.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="mb-2">No locations available yet.</p>
                    <p className="text-sm">
                      Locations will be seeded/generated in your library.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/40">
              <button
                onClick={() => setShowLocationPicker(false)}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Picker Modal */}
      {showActionPicker && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    🎭 Select Action/Pose for Scene {actionPickerSceneId}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    Choose an action or pose from the library
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="/admin/actions"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-900"
                    title="Manage action library"
                  >
                    Manage
                  </a>
                  <button
                    onClick={() => setShowActionPicker(false)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            <div
              className="p-6 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 180px)" }}
            >
              <div className="grid grid-cols-1 gap-4">
                {availableActions.map((action) => {
                  const isCurrentAction =
                    actionMapping[actionPickerSceneId] === action.id;

                  return (
                    <button
                      key={action.id}
                      onClick={() => handleSelectActionFromPicker(action)}
                      disabled={isCurrentAction}
                      className={
                        "text-left p-4 rounded-xl border-2 transition " +
                        (isCurrentAction
                          ? "border-blue-500 bg-blue-50 cursor-not-allowed dark:bg-blue-950/20"
                          : "border-gray-200 hover:border-blue-400 hover:bg-blue-50 dark:border-gray-800 dark:hover:bg-blue-950/20")
                      }
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-2xl">🎭</span>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-1">
                            {action.name}
                            {isCurrentAction && (
                              <span className="ml-2 text-xs text-green-600 dark:text-green-300 font-normal">
                                (Current)
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-200 mb-3">
                            {action.description}
                          </p>
                        </div>
                      </div>

                      {/* Pose Variations */}
                      {action.pose_variations &&
                        action.pose_variations.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-2">
                              Pose Variations:
                            </div>
                            <div className="space-y-1">
                              {action.pose_variations.map((pose, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs text-gray-600 dark:text-gray-300 pl-4 border-l-2 border-blue-200 dark:border-blue-900/60"
                                >
                                  • {pose}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Expression */}
                      {action.expression && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                            Expression:{" "}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            {action.expression}
                          </span>
                        </div>
                      )}

                      {/* Tags */}
                      {action.tags && action.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {action.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full dark:bg-blue-950/20 dark:text-blue-200"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}

                {availableActions.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="mb-2">No actions available yet.</p>
                    <p className="text-sm">
                      Actions will be seeded automatically when you select one.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/40">
              <button
                onClick={() => setShowActionPicker(false)}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Movement Picker Modal */}
      {showCameraMovementPicker && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    📷 Select Camera Movement for Scene{" "}
                    {cameraMovementPickerSceneId}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    Pick a camera movement to guide motion prompt generation.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="/admin/camera-movements"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-900"
                    title="Manage camera movement library"
                  >
                    Manage
                  </a>
                  <button
                    onClick={() => setShowCameraMovementPicker(false)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            <div
              className="p-6 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 180px)" }}
            >
              <div className="grid grid-cols-1 gap-4">
                {availableCameraMovements.map((movement) => {
                  const isCurrent =
                    cameraMovementMapping[cameraMovementPickerSceneId] ===
                    movement.id;

                  return (
                    <button
                      key={movement.id}
                      onClick={() =>
                        handleSelectCameraMovementFromPicker(movement)
                      }
                      disabled={isCurrent}
                      className={
                        "text-left p-4 rounded-xl border-2 transition " +
                        (isCurrent
                          ? "border-blue-500 bg-blue-50 cursor-not-allowed dark:bg-blue-950/20"
                          : "border-gray-200 hover:border-blue-400 hover:bg-blue-50 dark:border-gray-800 dark:hover:bg-blue-950/20")
                      }
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xl">📷</span>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                            {movement.name}
                            {isCurrent && (
                              <span className="ml-2 text-xs text-green-600 dark:text-green-300 font-normal">
                                (Current)
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">
                            {movement.description}
                          </p>
                          {movement.tags && movement.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {movement.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full dark:bg-blue-950/20 dark:text-blue-200"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {availableCameraMovements.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="mb-2">No camera movements available yet.</p>
                    <p className="text-sm">
                      Camera movements will be seeded automatically.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/40">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cameraMovementPickerSceneId &&
                  cameraMovementMapping[cameraMovementPickerSceneId] && (
                    <button
                      type="button"
                      onClick={async () => {
                        await handleClearCameraMovementForScene(
                          cameraMovementPickerSceneId,
                        );
                        setShowCameraMovementPicker(false);
                      }}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700"
                      title="Clear camera movement selection"
                    >
                      ✕ Clear selection
                    </button>
                  )}
                <button
                  onClick={() => setShowCameraMovementPicker(false)}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Character Motion Picker Modal */}
      {showCharacterMotionPicker && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    🧍 Select Character Motion for Scene{" "}
                    {characterMotionPickerSceneId}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    Pick a character motion to guide motion prompt generation.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="/admin/character-motions"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-900"
                    title="Manage character motion library"
                  >
                    Manage
                  </a>
                  <button
                    onClick={() => setShowCharacterMotionPicker(false)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            <div
              className="p-6 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 180px)" }}
            >
              <div className="grid grid-cols-1 gap-4">
                {availableCharacterMotions.map((motion) => {
                  const isCurrent =
                    characterMotionMapping[characterMotionPickerSceneId] ===
                    motion.id;

                  return (
                    <button
                      key={motion.id}
                      onClick={() =>
                        handleSelectCharacterMotionFromPicker(motion)
                      }
                      disabled={isCurrent}
                      className={
                        "text-left p-4 rounded-xl border-2 transition " +
                        (isCurrent
                          ? "border-blue-500 bg-blue-50 cursor-not-allowed dark:bg-blue-950/20"
                          : "border-gray-200 hover:border-blue-400 hover:bg-blue-50 dark:border-gray-800 dark:hover:bg-blue-950/20")
                      }
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xl">🧍</span>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                            {motion.name}
                            {isCurrent && (
                              <span className="ml-2 text-xs text-green-600 dark:text-green-300 font-normal">
                                (Current)
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">
                            {motion.description}
                          </p>
                          {motion.tags && motion.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {motion.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full dark:bg-blue-950/20 dark:text-blue-200"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {availableCharacterMotions.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="mb-2">No character motions available yet.</p>
                    <p className="text-sm">
                      Character motions will be seeded automatically.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/40">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {characterMotionPickerSceneId &&
                  characterMotionMapping[characterMotionPickerSceneId] && (
                    <button
                      type="button"
                      onClick={async () => {
                        await handleClearCharacterMotionForScene(
                          characterMotionPickerSceneId,
                        );
                        setShowCharacterMotionPicker(false);
                      }}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700"
                      title="Clear character motion selection"
                    >
                      ✕ Clear selection
                    </button>
                  )}
                <button
                  onClick={() => setShowCharacterMotionPicker(false)}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Type Selection Modal */}
      {showLocationTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Generate Location with AI
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Select location type and optionally add keywords to guide the
                generation
              </p>

              {/* Keywords Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords (optional)
                </label>
                <input
                  type="text"
                  value={locationGenerationKeywords}
                  onChange={(e) =>
                    setLocationGenerationKeywords(e.target.value)
                  }
                  placeholder="e.g., neon signs, rain, reflections, busy street"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple keywords with commas
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() =>
                    handleGenerateNewLocation(
                      locationTypeSceneId,
                      "indoor",
                      locationGenerationKeywords,
                    )
                  }
                  className="w-full p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition text-left"
                >
                  <div className="font-semibold text-gray-900 mb-1">
                    🏢 Indoor
                  </div>
                  <div className="text-xs text-gray-600">
                    Bar interiors, maintenance corridors, enclosed spaces
                  </div>
                </button>
                <button
                  onClick={() =>
                    handleGenerateNewLocation(
                      locationTypeSceneId,
                      "outdoor",
                      locationGenerationKeywords,
                    )
                  }
                  className="w-full p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition text-left"
                >
                  <div className="font-semibold text-gray-900 mb-1">
                    🌃 Outdoor
                  </div>
                  <div className="text-xs text-gray-600">
                    Rooftops, streets, alleys, walkways
                  </div>
                </button>
                <button
                  onClick={() =>
                    handleGenerateNewLocation(
                      locationTypeSceneId,
                      null,
                      locationGenerationKeywords,
                    )
                  }
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition text-left"
                >
                  <div className="font-semibold text-gray-900 mb-1">✨ Any</div>
                  <div className="text-xs text-gray-600">
                    Surprise me with any type of location
                  </div>
                </button>
              </div>
              <button
                onClick={() => {
                  setShowLocationTypeModal(false);
                  setLocationGenerationKeywords("");
                }}
                className="w-full mt-4 bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Generation Modal */}
      {showActionGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Generate Action/Pose with AI
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter keywords to generate a custom action/pose for this scene
              </p>

              {/* Keywords Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords *
                </label>
                <input
                  type="text"
                  value={actionGenerationKeywords}
                  onChange={(e) => setActionGenerationKeywords(e.target.value)}
                  placeholder="e.g., reading, drinking coffee, looking out window"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Describe the action or mood you want (comma-separated)
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() =>
                    handleGenerateNewAction(
                      actionGenerateSceneId,
                      actionGenerationKeywords,
                    )
                  }
                  disabled={!actionGenerationKeywords.trim()}
                  className="w-full p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✨ Generate Action with AI
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Cost: ~$0.01-0.03 per action
                </p>
              </div>

              <button
                onClick={() => {
                  setShowActionGenerateModal(false);
                  setActionGenerationKeywords("");
                }}
                className="w-full mt-4 bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Movement Generation Modal */}
      {showCameraMovementGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Generate Camera Movement with AI
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter keywords describing the camera motion style.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords *
                </label>
                <input
                  type="text"
                  value={cameraMovementGenerationKeywords}
                  onChange={(e) =>
                    setCameraMovementGenerationKeywords(e.target.value)
                  }
                  placeholder="e.g., still/lock-off, gentle drift, slow pan, subtle handheld"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Comma-separated keywords work best
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() =>
                    handleGenerateNewCameraMovement(
                      cameraMovementGenerateSceneId,
                      cameraMovementGenerationKeywords,
                    )
                  }
                  disabled={!cameraMovementGenerationKeywords.trim()}
                  className="w-full p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✨ Generate Camera Movement
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Cost: ~$0.01-0.03 per movement
                </p>
              </div>

              <button
                onClick={() => {
                  setShowCameraMovementGenerateModal(false);
                  setCameraMovementGenerationKeywords("");
                }}
                className="w-full mt-4 bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Character Motion Generation Modal */}
      {showCharacterMotionGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Generate Character Motion with AI
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter keywords describing the character’s subtle movement.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords *
                </label>
                <input
                  type="text"
                  value={characterMotionGenerationKeywords}
                  onChange={(e) =>
                    setCharacterMotionGenerationKeywords(e.target.value)
                  }
                  placeholder="e.g., slow head turn, shifting weight, slight glance"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Comma-separated keywords work best
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() =>
                    handleGenerateNewCharacterMotion(
                      characterMotionGenerateSceneId,
                      characterMotionGenerationKeywords,
                    )
                  }
                  disabled={!characterMotionGenerationKeywords.trim()}
                  className="w-full p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✨ Generate Character Motion
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Cost: ~$0.01-0.03 per motion
                </p>
              </div>

              <button
                onClick={() => {
                  setShowCharacterMotionGenerateModal(false);
                  setCharacterMotionGenerationKeywords("");
                }}
                className="w-full mt-4 bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Details Modal (Step 3) */}
      {imageDetailsModal && (
        <div
          className="fixed inset-0 z-[94] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseImageDetailsModal();
            }
          }}
        >
          <div className="w-full max-w-4xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  Image details — Scene {imageDetailsModal.sceneId}
                  {typeof imageDetailsModal.imageIndex === "number"
                    ? ` • v${imageDetailsModal.imageIndex + 1}`
                    : ""}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate">
                  URL: {imageDetailsModal.imageUrl}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {imageDetailsModal.imageUrl ? (
                  <a
                    href={imageDetailsModal.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-900"
                  >
                    Open
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() =>
                    loadImageDetailsForScene(
                      imageDetailsModal.sceneId,
                      imageDetailsModal.imageUrl,
                      {
                        imageIndex: imageDetailsModal.imageIndex,
                        localPrompt: imageDetailsModal.localPrompt,
                      },
                    )
                  }
                  disabled={loadingImageDetails}
                  className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-900"
                >
                  {loadingImageDetails ? "Refreshing..." : "Refresh"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseImageDetailsModal}
                  className="text-xs px-3 py-1.5 rounded-xl bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </div>

            <div
              className="px-5 py-4 overflow-y-auto"
              style={{ maxHeight: "calc(85vh - 72px)" }}
            >
              {loadingImageDetails ? (
                <div className="py-10 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  <div className="text-sm text-gray-700 dark:text-gray-200 mt-3">
                    Loading details...
                  </div>
                </div>
              ) : imageDetailsError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 p-4 text-sm dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
                  {imageDetailsError}
                </div>
              ) : (
                (() => {
                  const scene = imageDetailsModal.scene || null;
                  const md = imageDetailsModal.metadata || null;

                  const prompt =
                    md?.image_prompt || imageDetailsModal.localPrompt || null;
                  const endpoint =
                    md?.model_endpoint || md?.fal?.endpoint_id || null;
                  const source =
                    md?.source || (md?.regenerated ? "regen" : null);

                  return (
                    <div className="space-y-4">
                      {!md ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-4 text-sm dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                          No generation metadata found for this exact image URL.
                          <div className="text-xs mt-1 opacity-80">
                            (This can happen for older images, or images created
                            via tools that didn’t persist metadata.)
                          </div>
                        </div>
                      ) : null}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/40 p-4">
                          <div className="text-xs font-semibold text-gray-800 dark:text-gray-100 mb-2">
                            Settings
                          </div>
                          <div className="text-xs text-gray-700 dark:text-gray-200 space-y-1">
                            <div>
                              <span className="font-medium">Generated:</span>{" "}
                              {md?.timestamp || "(unknown)"}
                            </div>
                            <div>
                              <span className="font-medium">Source:</span>{" "}
                              {md?.source ||
                                (md?.regenerated ? "regenerate" : "generate")}
                            </div>
                            <div>
                              <span className="font-medium">
                                Model endpoint:
                              </span>{" "}
                              {endpoint || "(unknown)"}
                            </div>
                            <div>
                              <span className="font-medium">Scene:</span>{" "}
                              {md?.scene_id ?? imageDetailsModal.sceneId}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/40 p-4">
                          <div className="text-xs font-semibold text-gray-800 dark:text-gray-100 mb-2">
                            Inputs
                          </div>
                          <div className="text-xs text-gray-700 dark:text-gray-200 space-y-1">
                            <div>
                              <span className="font-medium">Character:</span>{" "}
                              {md?.character_id || "(unknown)"}
                            </div>
                            <div>
                              <span className="font-medium">
                                Reference URL:
                              </span>{" "}
                              {md?.character_reference_url || "(none)"}
                            </div>
                            <div>
                              <span className="font-medium">Location:</span>{" "}
                              {md?.location?.name || "(none)"}
                              {md?.location?.id
                                ? ` (id: ${md.location.id})`
                                : ""}
                            </div>
                            <div>
                              <span className="font-medium">Action:</span>{" "}
                              {md?.action?.name || "(none)"}
                              {md?.action?.id ? ` (id: ${md.action.id})` : ""}
                            </div>
                          </div>
                        </div>
                      </div>

                      <details
                        className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/40 p-4"
                        open
                      >
                        <summary className="cursor-pointer text-xs font-semibold text-gray-800 dark:text-gray-100">
                          Prompt used
                        </summary>
                        <div className="mt-3 text-xs font-mono leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words rounded-xl bg-gray-50/80 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-800/80 p-3">
                          {prompt || "(empty)"}
                        </div>
                      </details>

                      <details className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/40 p-4">
                        <summary className="cursor-pointer text-xs font-semibold text-gray-800 dark:text-gray-100">
                          Settings / angles
                        </summary>
                        <pre className="mt-3 text-[11px] font-mono leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words rounded-xl bg-gray-50/80 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-800/80 p-3">
                          {stringifyJson({
                            grok_settings: md?.grok_settings || null,
                            multiple_angles: md?.multiple_angles || null,
                            source,
                          })}
                        </pre>
                      </details>

                      <details className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/40 p-4">
                        <summary className="cursor-pointer text-xs font-semibold text-gray-800 dark:text-gray-100">
                          Request payload / response
                        </summary>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className="text-[11px] font-medium text-gray-600 dark:text-gray-300 mb-1">
                              request
                            </div>
                            <pre className="text-[11px] font-mono leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words rounded-xl bg-gray-50/80 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-800/80 p-3">
                              {stringifyJson(
                                md?.fal_request_payload ||
                                  md?.multiple_angles?.request_payload ||
                                  null,
                              )}
                            </pre>
                          </div>
                          <div>
                            <div className="text-[11px] font-medium text-gray-600 dark:text-gray-300 mb-1">
                              response
                            </div>
                            <pre className="text-[11px] font-mono leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words rounded-xl bg-gray-50/80 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-800/80 p-3">
                              {stringifyJson(
                                md?.fal_response || md?.grok_response || null,
                              )}
                            </pre>
                          </div>
                        </div>
                      </details>

                      {scene ? (
                        <details className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/40 p-4">
                          <summary className="cursor-pointer text-xs font-semibold text-gray-800 dark:text-gray-100">
                            Scene snapshot
                          </summary>
                          <pre className="mt-3 text-[11px] font-mono leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words rounded-xl bg-gray-50/80 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-800/80 p-3">
                            {stringifyJson({
                              scene_id: scene?.id,
                              image_urls: scene?.image_urls || null,
                              image_prompts: scene?.image_prompts || null,
                              last_generation_metadata:
                                scene?.last_generation_metadata || null,
                            })}
                          </pre>
                        </details>
                      ) : null}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Details Modal (Step 4) */}
      {videoDetailsModal && (
        <div
          className="fixed inset-0 z-[95] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseVideoDetailsModal();
            }
          }}
        >
          <div className="w-full max-w-4xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  Video details — Scene {videoDetailsModal.sceneId}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate">
                  Version URL: {videoDetailsModal.videoUrl}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {videoDetailsModal.videoUrl ? (
                  <a
                    href={videoDetailsModal.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-900"
                  >
                    Open
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() =>
                    loadVideoDetailsForScene(
                      videoDetailsModal.sceneId,
                      videoDetailsModal.videoUrl,
                    )
                  }
                  disabled={loadingVideoDetails}
                  className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-900"
                >
                  {loadingVideoDetails ? "Refreshing..." : "Refresh"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseVideoDetailsModal}
                  className="text-xs px-3 py-1.5 rounded-xl bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </div>

            <div
              className="px-5 py-4 overflow-y-auto"
              style={{ maxHeight: "calc(85vh - 72px)" }}
            >
              {loadingVideoDetails ? (
                <div className="py-10 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  <div className="text-sm text-gray-700 dark:text-gray-200 mt-3">
                    Loading details...
                  </div>
                </div>
              ) : videoDetailsError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 p-4 text-sm dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
                  {videoDetailsError}
                </div>
              ) : (
                (() => {
                  const scene = videoDetailsModal.scene || null;
                  const md = videoDetailsModal.metadata || null;

                  const actionId = md?.action_id ?? scene?.action_id ?? null;
                  const cameraId =
                    md?.camera_movement_id ?? scene?.camera_movement_id ?? null;
                  const characterId =
                    md?.character_motion_id ??
                    scene?.character_motion_id ??
                    null;

                  const actionName = getLibraryItemNameById(
                    availableActions,
                    actionId,
                  );
                  const cameraName = getLibraryItemNameById(
                    availableCameraMovements,
                    cameraId,
                  );
                  const characterName = getLibraryItemNameById(
                    availableCharacterMotions,
                    characterId,
                  );

                  return (
                    <div className="space-y-4">
                      {!md ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-4 text-sm dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                          No generation metadata found for this exact video URL.
                          <div className="text-xs mt-1 opacity-80">
                            (This can happen for older videos created before we
                            started saving history, or if the URL changed.)
                          </div>
                        </div>
                      ) : null}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/40 p-4">
                          <div className="text-xs font-semibold text-gray-800 dark:text-gray-100 mb-2">
                            Settings
                          </div>
                          <div className="text-xs text-gray-700 dark:text-gray-200 space-y-1">
                            <div>
                              <span className="font-medium">Generated:</span>{" "}
                              {md?.timestamp || "(unknown)"}
                            </div>
                            <div>
                              <span className="font-medium">Duration:</span>{" "}
                              {md?.settings_used?.duration ??
                                md?.model_request_payload?.duration ??
                                "(unknown)"}
                              s
                            </div>
                            <div>
                              <span className="font-medium">
                                Model endpoint:
                              </span>{" "}
                              {md?.settings_used?.model_endpoint ||
                                md?.fal?.model_endpoint ||
                                "(unknown)"}
                            </div>
                            <div>
                              <span className="font-medium">Request ID:</span>{" "}
                              {md?.fal?.request_id || "(unknown)"}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/40 p-4">
                          <div className="text-xs font-semibold text-gray-800 dark:text-gray-100 mb-2">
                            Motion selections
                          </div>
                          <div className="text-xs text-gray-700 dark:text-gray-200 space-y-1">
                            <div>
                              <span className="font-medium">Action:</span>{" "}
                              {actionName || "(none)"}
                              {actionId ? ` (id: ${actionId})` : ""}
                            </div>
                            <div>
                              <span className="font-medium">Camera:</span>{" "}
                              {cameraName || "Still (lock-off)"}
                              {cameraId ? ` (id: ${cameraId})` : ""}
                            </div>
                            <div>
                              <span className="font-medium">Character:</span>{" "}
                              {characterName || "Default"}
                              {characterId ? ` (id: ${characterId})` : ""}
                            </div>
                          </div>
                        </div>
                      </div>

                      <details className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/40 p-4">
                        <summary className="cursor-pointer text-xs font-semibold text-gray-800 dark:text-gray-100">
                          Prompt used
                        </summary>
                        <div className="mt-3 text-xs font-mono leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words rounded-xl bg-gray-50/80 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-800/80 p-3">
                          {md?.prompt_used || "(empty)"}
                        </div>
                      </details>

                      <details className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/40 p-4">
                        <summary className="cursor-pointer text-xs font-semibold text-gray-800 dark:text-gray-100">
                          Negative prompt used
                        </summary>
                        <div className="mt-3 text-xs font-mono leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words rounded-xl bg-gray-50/80 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-800/80 p-3">
                          {md?.negative_prompt_used || "(empty)"}
                        </div>
                      </details>

                      <details className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/40 p-4">
                        <summary className="cursor-pointer text-xs font-semibold text-gray-800 dark:text-gray-100">
                          Prompt sent to model
                        </summary>
                        <div className="mt-3 text-xs font-mono leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words rounded-xl bg-gray-50/80 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-800/80 p-3">
                          {md?.prompt_sent_to_model || "(empty)"}
                        </div>
                      </details>

                      <details className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/40 p-4">
                        <summary className="cursor-pointer text-xs font-semibold text-gray-800 dark:text-gray-100">
                          Request payload + storage
                        </summary>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className="text-[11px] font-medium text-gray-600 dark:text-gray-300 mb-1">
                              model_request_payload
                            </div>
                            <pre className="text-[11px] font-mono leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words rounded-xl bg-gray-50/80 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-800/80 p-3">
                              {stringifyJson(md?.model_request_payload)}
                            </pre>
                          </div>
                          <div>
                            <div className="text-[11px] font-medium text-gray-600 dark:text-gray-300 mb-1">
                              storage / fal
                            </div>
                            <pre className="text-[11px] font-mono leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words rounded-xl bg-gray-50/80 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-800/80 p-3">
                              {stringifyJson({
                                storage: md?.storage || null,
                                fal: md?.fal || null,
                                settings_used: md?.settings_used || null,
                              })}
                            </pre>
                          </div>
                        </div>
                      </details>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* Music Details Modal (Step 5) */}
      {musicDetailsModal && (
        <div
          className="fixed inset-0 z-[96] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setMusicDetailsModal(null);
            }
          }}
        >
          <div className="w-full max-w-4xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  Music details
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate">
                  URL: {musicDetailsModal.music_url}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {musicDetailsModal.music_url ? (
                  <a
                    href={musicDetailsModal.music_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-900"
                  >
                    Open
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => setMusicDetailsModal(null)}
                  className="text-xs px-3 py-1.5 rounded-xl bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </div>

            <div
              className="px-5 py-4 overflow-y-auto"
              style={{ maxHeight: "calc(85vh - 72px)" }}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/40 p-4">
                    <div className="text-xs font-semibold text-gray-800 dark:text-gray-100 mb-2">
                      Settings
                    </div>
                    <div className="text-xs text-gray-700 dark:text-gray-200 space-y-1">
                      <div>
                        <span className="font-medium">Generated:</span>{" "}
                        {musicDetailsModal.timestamp
                          ? new Date(
                              musicDetailsModal.timestamp,
                            ).toLocaleString()
                          : "(unknown)"}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span>{" "}
                        {musicDetailsModal.duration_ms
                          ? `${Math.floor(musicDetailsModal.duration_ms / 60000)}m ${Math.round((musicDetailsModal.duration_ms % 60000) / 1000)}s`
                          : "(unknown)"}
                      </div>
                      <div>
                        <span className="font-medium">Model:</span>{" "}
                        {musicDetailsModal.model_endpoint || "(unknown)"}
                      </div>
                      {typeof musicDetailsModal.cost === "number" && (
                        <div>
                          <span className="font-medium">Cost:</span> $
                          {musicDetailsModal.cost.toFixed(3)}
                        </div>
                      )}
                      {musicDetailsModal.output_format && (
                        <div>
                          <span className="font-medium">Format:</span>{" "}
                          {musicDetailsModal.output_format}
                        </div>
                      )}
                    </div>
                  </div>

                  {musicDetailsModal.negative_prompt && (
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/40 p-4">
                      <div className="text-xs font-semibold text-gray-800 dark:text-gray-100 mb-2">
                        Negative prompt (avoid)
                      </div>
                      <div className="text-xs text-amber-600 dark:text-amber-400">
                        {musicDetailsModal.negative_prompt}
                      </div>
                    </div>
                  )}
                </div>

                <details
                  className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/40 p-4"
                  open
                >
                  <summary className="cursor-pointer text-xs font-semibold text-gray-800 dark:text-gray-100">
                    Prompt / composition plan
                  </summary>
                  <div className="mt-3 text-xs font-mono leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words rounded-xl bg-gray-50/80 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-800/80 p-3 max-h-64 overflow-y-auto">
                    {musicDetailsModal.prompt ||
                      (musicDetailsModal.composition_plan
                        ? JSON.stringify(
                            musicDetailsModal.composition_plan,
                            null,
                            2,
                          )
                        : "(empty)")}
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Review Modal (Step 3 + Step 4) */}
      {promptReviewModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[90] p-4 isolate transform-gpu">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden dark:bg-gray-950 dark:border dark:border-gray-800 transform-gpu">
            <div className="p-6 border-b border-gray-200 flex items-start justify-between gap-4 dark:border-gray-800">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {promptReviewModal.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1 dark:text-gray-300">
                  Scene {promptReviewModal.sceneId} •{" "}
                  {promptReviewModal.kind === "motion_prompt"
                    ? "Step 4"
                    : "Step 3"}
                  {typeof promptReviewModal.cost === "number"
                    ? ` • Cost: $${(promptReviewModal.cost || 0).toFixed(4)}`
                    : ""}
                </p>
                <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                  Note: generation cost is incurred when you click Generate.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDiscardPromptReview}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none dark:hover:text-gray-200"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div
              className="p-6 overflow-y-auto"
              style={{ maxHeight: "calc(85vh - 170px)" }}
            >
              <details className="mb-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-800 dark:text-gray-200">
                  Current prompt
                </summary>
                <div className="mt-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-wrap break-words dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800">
                  {(promptReviewModal.originalPrompt || "(empty)").trim() ||
                    "(empty)"}
                </div>
              </details>

              <label className="block text-sm font-medium text-gray-800 mb-2 dark:text-gray-200">
                New prompt (edit before saving)
              </label>
              <textarea
                value={promptReviewDraft}
                onChange={(e) => setPromptReviewDraft(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-950 dark:text-gray-100 dark:border-gray-800"
              />
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end dark:border-gray-800 dark:bg-gray-950/40">
              <button
                type="button"
                onClick={handleDiscardPromptReview}
                disabled={applyingPromptReview}
                className="bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleAcceptPromptReview}
                disabled={applyingPromptReview}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {applyingPromptReview ? "Saving..." : "Accept & Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Selection Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Filter by{" "}
                  {showFilterModal === "lighting"
                    ? "💡 Lighting"
                    : showFilterModal === "atmosphere"
                      ? "Atmosphere"
                      : "Key Elements"}
                </h3>
                <button
                  onClick={() => setShowFilterModal(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Select one or more to filter locations
              </p>
            </div>
            <div
              className="p-6 overflow-y-auto"
              style={{ maxHeight: "calc(80vh - 160px)" }}
            >
              <div className="flex flex-wrap gap-2">
                {Array.from(
                  new Set(
                    availableLocations.flatMap((loc) => {
                      if (showFilterModal === "lighting") {
                        return Array.isArray(
                          loc.visual_characteristics?.lighting,
                        )
                          ? loc.visual_characteristics.lighting
                          : [];
                      } else if (showFilterModal === "atmosphere") {
                        return Array.isArray(
                          loc.visual_characteristics?.atmosphere,
                        )
                          ? loc.visual_characteristics.atmosphere
                          : [];
                      } else if (showFilterModal === "key_elements") {
                        return loc.visual_characteristics?.key_elements || [];
                      }
                      return [];
                    }),
                  ),
                )
                  .sort()
                  .map((item) => {
                    const isSelected =
                      locationFilters[showFilterModal].includes(item);
                    const colorClass =
                      showFilterModal === "lighting"
                        ? "yellow"
                        : showFilterModal === "atmosphere"
                          ? "indigo"
                          : "green";

                    return (
                      <button
                        key={item}
                        onClick={() => {
                          setLocationFilters((prev) => ({
                            ...prev,
                            [showFilterModal]: prev[showFilterModal].includes(
                              item,
                            )
                              ? prev[showFilterModal].filter((i) => i !== item)
                              : [...prev[showFilterModal], item],
                          }));
                        }}
                        className={`px-3 py-2 text-sm rounded-lg border-2 transition ${
                          isSelected
                            ? `bg-${colorClass}-600 text-white border-${colorClass}-600`
                            : `bg-${colorClass}-50 text-${colorClass}-700 border-${colorClass}-200 hover:border-${colorClass}-400`
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setLocationFilters((prev) => ({
                    ...prev,
                    [showFilterModal]: [],
                  }));
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300"
              >
                Clear
              </button>
              <button
                onClick={() => setShowFilterModal(null)}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700"
              >
                Apply ({locationFilters[showFilterModal].length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Character Reference Modal - All References */}
      {showCharacterReferenceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  📚 All Character References - {selectedCharacter?.name}
                </h3>
                <button
                  onClick={() => setShowCharacterReferenceModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Select a reference image from your main uploads or any
                previously generated images from other projects
              </p>
            </div>

            <div
              className="p-6 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 180px)" }}
            >
              {loadingCharacterReferences ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600 mt-4">Loading references...</p>
                </div>
              ) : allCharacterReferences.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No references found</p>
                </div>
              ) : (
                <>
                  {/* Main References Section */}
                  {allCharacterReferences.filter((ref) => ref.source === "main")
                    .length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Main Reference Images (
                        {
                          allCharacterReferences.filter(
                            (ref) => ref.source === "main",
                          ).length
                        }
                        )
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {allCharacterReferences
                          .filter((ref) => ref.source === "main")
                          .map((ref) => (
                            <button
                              key={ref.id}
                              onClick={() => {
                                setSelectedReferenceImages((prev) => ({
                                  ...prev,
                                  [characterReferenceModalSceneId]: ref.url,
                                }));
                                setShowCharacterReferenceModal(false);
                              }}
                              className={`relative aspect-[9/16] rounded-lg overflow-hidden border-3 transition-all group ${
                                selectedReferenceImages[
                                  characterReferenceModalSceneId
                                ] === ref.url
                                  ? "border-blue-500 ring-2 ring-blue-300 shadow-lg"
                                  : "border-gray-300 hover:border-blue-400 hover:shadow-md"
                              }`}
                            >
                              <img
                                src={ref.url}
                                alt={ref.label}
                                className="w-full h-full object-cover"
                              />
                              {selectedReferenceImages[
                                characterReferenceModalSceneId
                              ] === ref.url && (
                                <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                                  ✓
                                </div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white text-xs font-medium">
                                  {ref.label}
                                </p>
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Project References Section */}
                  {allCharacterReferences.filter(
                    (ref) => ref.source === "project",
                  ).length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        From Previous Projects (
                        {
                          allCharacterReferences.filter(
                            (ref) => ref.source === "project",
                          ).length
                        }
                        )
                      </h4>

                      {/* Group by project */}
                      {(() => {
                        const projectGroups = {};
                        allCharacterReferences
                          .filter((ref) => ref.source === "project")
                          .forEach((ref) => {
                            if (!projectGroups[ref.project_id]) {
                              projectGroups[ref.project_id] = {
                                name: ref.project_name,
                                refs: [],
                              };
                            }
                            projectGroups[ref.project_id].refs.push(ref);
                          });

                        return Object.entries(projectGroups).map(
                          ([projectId, group]) => (
                            <div key={projectId} className="mb-6">
                              <h5 className="text-xs font-medium text-gray-700 mb-2 pl-2 border-l-2 border-green-300">
                                {group.name}
                              </h5>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {group.refs.map((ref) => (
                                  <button
                                    key={ref.id}
                                    onClick={() => {
                                      setSelectedReferenceImages((prev) => ({
                                        ...prev,
                                        [characterReferenceModalSceneId]:
                                          ref.url,
                                      }));
                                      setShowCharacterReferenceModal(false);
                                    }}
                                    className={`relative aspect-[9/16] rounded-lg overflow-hidden border-3 transition-all group ${
                                      selectedReferenceImages[
                                        characterReferenceModalSceneId
                                      ] === ref.url
                                        ? "border-green-500 ring-2 ring-green-300 shadow-lg"
                                        : "border-gray-300 hover:border-green-400 hover:shadow-md"
                                    }`}
                                  >
                                    <img
                                      src={ref.url}
                                      alt={ref.label}
                                      className="w-full h-full object-cover"
                                    />
                                    {selectedReferenceImages[
                                      characterReferenceModalSceneId
                                    ] === ref.url && (
                                      <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                                        ✓
                                      </div>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <p className="text-white text-xs font-medium">
                                        {ref.label}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ),
                        );
                      })()}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowCharacterReferenceModal(false)}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Size Image Modal */}
      {expandedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-8"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-2xl w-full flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-white text-lg font-semibold">
                Scene {expandedImage.sceneId} - Version{" "}
                {expandedImage.imageIndex + 1}
              </h3>
              <button
                onClick={() => setExpandedImage(null)}
                className="text-white hover:text-gray-300 text-3xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            {/* Image Container */}
            <div
              className="flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={expandedImage.url}
                alt={`Scene ${expandedImage.sceneId} - Full Size`}
                className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectSceneImage(
                    expandedImage.sceneId,
                    expandedImage.imageIndex,
                  );
                  setExpandedImage(null);
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
              >
                ✓ Select for Video
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadImage(
                    expandedImage.url,
                    expandedImage.sceneId,
                    expandedImage.imageIndex,
                  );
                }}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 flex items-center gap-2"
              >
                📥 Download
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedImage(null);
                }}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Angle Edit Modal (Step 3) */}
      {angleEditModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-xl max-w-xl w-full overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="p-5 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Edit angle (Scene {angleEditModal.sceneId})
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    Uses FAL:{" "}
                    {multipleAnglesEndpointId ||
                      "fal-ai/flux-2-lora-gallery/multiple-angles"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAngleEditModal(null)}
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white text-2xl leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Horizontal angle (0–360)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={360}
                      step={1}
                      value={angleEditSettings.horizontal_angle}
                      onChange={(e) =>
                        setAngleEditSettings((prev) => ({
                          ...prev,
                          horizontal_angle: Math.max(
                            0,
                            Math.min(360, Number(e.target.value)),
                          ),
                        }))
                      }
                      className="w-full"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={360}
                      step={1}
                      value={angleEditSettings.horizontal_angle}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        setAngleEditSettings((prev) => ({
                          ...prev,
                          horizontal_angle: Math.max(
                            0,
                            Math.min(360, Number.isFinite(next) ? next : 0),
                          ),
                        }));
                      }}
                      className="w-24 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 dark:border-gray-800"
                    />
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {angleEditSettings.horizontal_angle}°
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Vertical angle (0–60)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={60}
                      step={1}
                      value={angleEditSettings.vertical_angle}
                      onChange={(e) =>
                        setAngleEditSettings((prev) => ({
                          ...prev,
                          vertical_angle: Math.max(
                            0,
                            Math.min(60, Number(e.target.value)),
                          ),
                        }))
                      }
                      className="w-full"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={60}
                      step={1}
                      value={angleEditSettings.vertical_angle}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        setAngleEditSettings((prev) => ({
                          ...prev,
                          vertical_angle: Math.max(
                            0,
                            Math.min(60, Number.isFinite(next) ? next : 0),
                          ),
                        }));
                      }}
                      className="w-24 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 dark:border-gray-800"
                    />
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {angleEditSettings.vertical_angle}°
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Zoom (0–10)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={0.5}
                      value={angleEditSettings.zoom}
                      onChange={(e) =>
                        setAngleEditSettings((prev) => ({
                          ...prev,
                          zoom: Math.max(
                            0,
                            Math.min(10, Number(e.target.value)),
                          ),
                        }))
                      }
                      className="w-full"
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={10}
                      step={0.5}
                      value={angleEditSettings.zoom}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        setAngleEditSettings((prev) => ({
                          ...prev,
                          zoom: Math.max(
                            0,
                            Math.min(10, Number.isFinite(next) ? next : 0),
                          ),
                        }));
                      }}
                      className="w-24 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 dark:border-gray-800"
                    />
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {angleEditSettings.zoom}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Outputs
                  </label>
                  <div className="flex items-center gap-3">
                    <select
                      value={angleEditSettings.num_images}
                      onChange={(e) =>
                        setAngleEditSettings((prev) => ({
                          ...prev,
                          num_images: Math.max(
                            1,
                            Math.min(6, Number(e.target.value)),
                          ),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 dark:border-gray-800"
                    >
                      {[1, 2, 3, 4].map((n) => (
                        <option key={n} value={n}>
                          {n} image{n === 1 ? "" : "s"}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={6}
                      step={1}
                      value={angleEditSettings.num_images}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        setAngleEditSettings((prev) => ({
                          ...prev,
                          num_images: Math.max(
                            1,
                            Math.min(6, Number.isFinite(next) ? next : 1),
                          ),
                        }));
                      }}
                      className="w-24 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 dark:border-gray-800"
                      title="Type a value (max 6)"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 p-3">
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                  Source image
                </div>
                <div className="w-full flex justify-center">
                  <img
                    src={angleEditModal.url}
                    alt="Source"
                    className="max-h-64 rounded-lg object-contain border border-gray-200 dark:border-gray-800"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setAngleEditModal(null)}
                className="text-xs px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-900"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateAngleEdit}
                className="text-xs px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Generating..." : "Generate angle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
