"use client";

import { useEffect, useState, useRef, Fragment } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toast";

export default function VideoGeneratorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { alert, confirm } = useToast();

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
  const [loadingProject, setLoadingProject] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [currentProjectName, setCurrentProjectName] = useState("");
  const [editingProjectName, setEditingProjectName] = useState(false);
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
  const [locationFilters, setLocationFilters] = useState({
    category: null, // 'indoor' or 'outdoor' or null
    lighting: [],
    atmosphere: [],
    key_elements: [],
  });
  const [showFilterModal, setShowFilterModal] = useState(null); // 'lighting', 'atmosphere', 'key_elements', or null

  // Actions
  const [actionMapping, setActionMapping] = useState({}); // { scene_id: action_id }
  const [showActionPicker, setShowActionPicker] = useState(false);
  const [actionPickerSceneId, setActionPickerSceneId] = useState(null);
  const [availableActions, setAvailableActions] = useState([]);

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
  const [fluxProCost, setFluxProCost] = useState(null); // Dynamic cost from API (NO FALLBACK)
  const [showFluxSettings, setShowFluxSettings] = useState(false);
  const [fluxSettings, setFluxSettings] = useState({
    output_format: "png",
    num_images: 1,
  });
  const imagePromptSaveTimers = useRef({});
  const [selectedReferenceImages, setSelectedReferenceImages] = useState({}); // Track selected reference per scene: { sceneId: imageUrl }
  const [selectedSceneImages, setSelectedSceneImages] = useState({}); // Track selected generated image index per scene: { sceneId: imageIndex }
  const [expandedImage, setExpandedImage] = useState(null); // Track expanded full-size image { sceneId, imageIndex, url }
  const [showCharacterReferenceModal, setShowCharacterReferenceModal] =
    useState(false);
  const [characterReferenceModalSceneId, setCharacterReferenceModalSceneId] =
    useState(null);
  const [allCharacterReferences, setAllCharacterReferences] = useState([]);
  const [loadingCharacterReferences, setLoadingCharacterReferences] =
    useState(false);

  // Step 4: Video Generation
  const [videos, setVideos] = useState([]);
  const [voiceoverUrl, setVoiceoverUrl] = useState(null);

  // Step 5: Final Video
  const [finalVideoUrl, setFinalVideoUrl] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // Scene linking/grouping (persisted on project doc as `scene_group`)
  const [sceneGroups, setSceneGroups] = useState([]);
  const [savingSceneGroups, setSavingSceneGroups] = useState(false);

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

    const incomingGroups = Array.isArray(rawGroups) ? rawGroups : [];
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
      return normalizeSceneGroups(next, sceneIds);
    }

    // Split if currently linked (only if they are adjacent in the group's order)
    const group = [...normalized[ai]];
    group.sort(
      (x, y) =>
        (orderIndex.get(sceneKey(x)) ?? 0) - (orderIndex.get(sceneKey(y)) ?? 0),
    );

    const aPos = group.findIndex((x) => sceneKey(x) === aKey);
    const bPos = group.findIndex((x) => sceneKey(x) === bKey);
    if (aPos === -1 || bPos === -1) return normalized;
    if (Math.abs(aPos - bPos) !== 1) return normalized;

    const splitAt = Math.max(aPos, bPos);
    const left = group.slice(0, splitAt);
    const right = group.slice(splitAt);
    if (left.length === 0 || right.length === 0) return normalized;

    const next = normalized.filter((_, idx) => idx !== ai);
    next.push(left, right);
    return normalizeSceneGroups(next, sceneIds);
  }

  const handleToggleSceneLink = async (sceneId, nextSceneId) => {
    if (!currentProjectId) return;
    if (!scriptData?.scenes) return;
    if (savingSceneGroups) return;

    const sceneIds = scriptData.scenes.map((s) => normalizeSceneId(s.id));
    const previous = sceneGroups;
    const nextGroups = toggleAdjacentSceneLink(
      sceneGroups,
      sceneId,
      nextSceneId,
      sceneIds,
    );

    setSceneGroups(nextGroups);
    setSavingSceneGroups(true);
    try {
      const response = await fetch(`/api/projects/${currentProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scene_group: nextGroups }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to save scene links");
      }
    } catch (error) {
      setSceneGroups(previous);
      await alert("Failed to save scene links: " + error.message, "error");
    } finally {
      setSavingSceneGroups(false);
    }
  };

  useEffect(() => {
    loadCharacters();
    loadTopics();
    loadCategories();
    loadProjects();
    loadAvailableActions();
    loadFluxPricing();
  }, []);

  // Ensure `sceneGroups` always matches the current scene list
  useEffect(() => {
    if (!scriptData?.scenes) return;
    const sceneIds = scriptData.scenes.map((s) => normalizeSceneId(s.id));
    setSceneGroups((prev) => normalizeSceneGroups(prev, sceneIds));
  }, [currentProjectId, scriptData?.scenes?.length]);

  // Check for project_id in URL and load project automatically
  useEffect(() => {
    const projectId = searchParams.get("project_id");
    // Only load if we have a project_id in URL and it's not already loaded
    if (projectId && currentProjectId !== projectId) {
      // Wait for projects to load first
      const checkAndLoadProject = setInterval(() => {
        if (projects.length > 0) {
          clearInterval(checkAndLoadProject);
          const project = projects.find((p) => p.id === projectId);
          if (project) {
            handleSelectProject(project.id);
          }
        }
      }, 100);

      // Cleanup after 5 seconds if projects don't load
      setTimeout(() => clearInterval(checkAndLoadProject), 5000);
    }
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

  // Load ElevenLabs info when on Step 2
  useEffect(() => {
    if (step === 2) {
      loadElevenLabsInfo();
    }
  }, [step]);

  // Update URL when step changes (for persistence)
  useEffect(() => {
    if (currentProjectId && step > 0) {
      router.replace(
        `/admin/video-generator?project_id=${currentProjectId}&step=${step}`,
      );
    }
  }, [step, currentProjectId]);

  // Update maxStepReached when user progresses forward
  useEffect(() => {
    if (step > maxStepReached) {
      setMaxStepReached(step);
    }
  }, [step, maxStepReached]);

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
      const response = await fetch("/api/video-generator/fal-pricing");
      const result = await response.json();
      if (result.success && result.cost) {
        setFluxProCost(result.cost);
        console.log(`Loaded Grok pricing: $${result.cost}/image`);
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
        label: "Step 2: Script Ready",
        color:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200",
      },
      3: {
        label: "Step 3: Voiceover Done",
        color:
          "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200",
      },
      4: {
        label: "Step 4: Images Ready",
        color:
          "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200",
      },
      5:
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
                  label: "Step 5: Videos Ready",
                  color:
                    "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-200",
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
      const response = await fetch(`/api/projects/${projectId}`);
      const result = await response.json();

      if (result.success) {
        setCurrentProjectId(projectId);
        setCurrentProjectName(
          result.project.project_name || "Untitled Project",
        );
        setScriptData(result.scriptData);
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
        console.log(
          "Loaded project costs on project select:",
          result.project.costs,
        );
        setProjectCosts(result.project.costs || null);

        // Load selected locations if available
        if (result.project.location_mapping) {
          setLocationMapping(result.project.location_mapping);
          const locationIds = [
            ...new Set(Object.values(result.project.location_mapping)),
          ];
          if (locationIds.length > 0) {
            try {
              // Fetch all location details
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
          }
        } else {
          setSelectedLocations([]);
          setLocationMapping({});
        }

        // Load action mapping if available
        if (result.project.action_mapping) {
          setActionMapping(result.project.action_mapping);
        } else {
          setActionMapping({});
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
      // Update location mapping in Firestore
      const updateResponse = await fetch(`/api/projects/${currentProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location_mapping: {
            ...locationMapping,
            [locationPickerSceneId]: location.id,
          },
        }),
      });

      const updateResult = await updateResponse.json();
      if (updateResult.success) {
        // Update local state
        setLocationMapping({
          ...locationMapping,
          [locationPickerSceneId]: location.id,
        });

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
      // Update action mapping in Firestore
      const updateResponse = await fetch(`/api/projects/${currentProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action_mapping: {
            ...actionMapping,
            [actionPickerSceneId]: action.id,
          },
        }),
      });

      const updateResult = await updateResponse.json();
      if (updateResult.success) {
        // Update local state
        setActionMapping({
          ...actionMapping,
          [actionPickerSceneId]: action.id,
        });

        setShowActionPicker(false);
        await alert(`Action selected: ${action.name}`, "success");
      } else {
        await alert("Failed to update action", "error");
      }
    } catch (error) {
      await alert("Error selecting action: " + error.message, "error");
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

      // Update location mapping in Firestore
      const updateResponse = await fetch(`/api/projects/${currentProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location_mapping: {
            ...locationMapping,
            [sceneId]: newLocation.id,
          },
        }),
      });

      const updateResult = await updateResponse.json();
      if (updateResult.success) {
        // Update local state
        setLocationMapping({
          ...locationMapping,
          [sceneId]: newLocation.id,
        });

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

      // Update action mapping in Firestore
      const updateResponse = await fetch(`/api/projects/${currentProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action_mapping: {
            ...actionMapping,
            [sceneId]: newAction.id,
          },
        }),
      });

      const updateResult = await updateResponse.json();
      if (updateResult.success) {
        // Update local state
        setActionMapping({
          ...actionMapping,
          [sceneId]: newAction.id,
        });

        // Add to available actions
        setAvailableActions([...availableActions, newAction]);

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

      // Update location mapping in Firestore
      const updateResponse = await fetch(`/api/projects/${currentProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location_mapping: {
            ...locationMapping,
            [sceneId]: newLocation.id,
          },
        }),
      });

      const updateResult = await updateResponse.json();
      if (updateResult.success) {
        // Update local state
        setLocationMapping({
          ...locationMapping,
          [sceneId]: newLocation.id,
        });

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

  // Step 3: Generate Images
  const handleGenerateImages = async () => {
    if (!voiceoverUrl) {
      await alert("Please generate voiceover first", "warning");
      return;
    }

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

    if (!scriptData || !scriptData.scenes || scriptData.scenes.length === 0) {
      await alert(
        "Script data is missing. Please generate the script first.",
        "warning",
      );
      return;
    }

    if (!selectedCharacter) {
      await alert(
        "Character is not selected. Please select a character first.",
        "warning",
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/video-generator/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: currentProjectId,
          script_data: scriptData,
          selected_character: selectedCharacter,
          session_id: sessionId,
          voiceover_url: voiceoverUrl,
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Reload project to get updated scriptData with image_urls
        await handleSelectProject(currentProjectId);
        // Don't auto-advance to next step - let user review images first
        // setStep(3);
      } else {
        const errorMsg = result.message
          ? `${result.error}: ${result.message}`
          : result.error;
        await alert("Failed to generate images: " + errorMsg, "error");
      }
    } catch (error) {
      await alert("Error: " + error.message, "error");
    } finally {
      setLoading(false);
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
        const updatedScenes = scriptData.scenes.map((scene) => {
          if (scene.id === sceneId) {
            const existingUrls = scene.image_urls || [];
            return {
              ...scene,
              image_urls: [...existingUrls, result.image_url],
            };
          }
          return scene;
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
        // Replace the specific image by index, or the last one if no index provided
        const updatedScenes = scriptData.scenes.map((scene) => {
          if (scene.id === sceneId) {
            const existingUrls = scene.image_urls || [];
            let updatedUrls;

            if (imageIndex !== null && imageIndex < existingUrls.length) {
              // Replace the specific image at the given index
              updatedUrls = existingUrls.map((url, idx) =>
                idx === imageIndex ? result.image_url : url,
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
              console.log(`Replaced last image for scene ${sceneId}`);
            }

            return { ...scene, image_urls: updatedUrls };
          }
          return scene;
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
    setLoading(true);
    setRegeneratingPromptSceneId(sceneId);
    try {
      const scene = scriptData.scenes.find((s) => s.id === sceneId);

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
        // Update local state with new image_prompt
        const updatedScenes = scriptData.scenes.map((s) => {
          if (s.id === sceneId) {
            return { ...s, image_prompt: result.image_prompt };
          }
          return s;
        });
        setScriptData({ ...scriptData, scenes: updatedScenes });

        // Save to Firestore
        await fetch(`/api/projects/${currentProjectId}/scenes/${sceneId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_prompt: result.image_prompt,
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

        await alert("Image prompt regenerated successfully!", "success");
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
          return { ...s, image_urls: updatedUrls };
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
        }),
      });
    } catch (error) {
      await alert("Error removing image: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Generate Videos
  const handleGenerateVideos = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/video-generator/generate-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: currentProjectId,
          session_id: sessionId,
          images,
          script_data: scriptData,
          voiceover_url: voiceoverUrl,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setVideos(result.videos);
        // Reload project costs
        const projectResponse = await fetch(
          `/api/projects/${currentProjectId}`,
        );
        const projectResult = await projectResponse.json();
        if (projectResult.success) {
          setProjectCosts(projectResult.project.costs || null);
        }
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

  // Step 4: Assemble Final Video
  const handleAssembleVideo = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/video-generator/assemble-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: currentProjectId,
          session_id: sessionId,
          videos,
          voiceover_url: voiceoverUrl,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setFinalVideoUrl(result.video_url);
        // Reload project costs
        const projectResponse = await fetch(
          `/api/projects/${currentProjectId}`,
        );
        const projectResult = await projectResponse.json();
        if (projectResult.success) {
          setProjectCosts(projectResult.project.costs || null);
        }
        setStep(5);
      } else {
        await alert("Failed to assemble video: " + result.error, "error");
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

  return (
    <div className="space-y-6 text-gray-900 dark:text-gray-100">
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
              { num: 5, label: "Post" },
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
                {idx < 4 && (
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
                    onClick={() => handleSelectProject(project.id)}
                    className="border rounded-lg p-4 cursor-pointer transition hover:shadow-md hover:border-blue-400 bg-gray-50 dark:bg-gray-900/40 dark:border-gray-800"
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
                      <div className="text-blue-600">
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
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
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
        <div className="admin-card p-8">
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
                <div className="bg-gray-50 border border-gray-300 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap dark:bg-gray-950/40 dark:border-gray-800">
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
                              + Add "{categoryInput}" as new category
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
                    <div className="mt-4 bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-purple-200">
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
                      <p className="text-xs text-purple-700 font-medium">
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
                  After generating the script, you'll assign locations to each
                  scene individually in Step 3. You can either select from the
                  library or generate new ones with AI.
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
                          Generating voiceover with {selectedCharacter?.name}'s
                          voice...
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
                          's voice...
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
                The voiceover will use {selectedCharacter?.name}'s voice. Make
                sure your script is finalized before generating.
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
              onClick={() => setStep(3)}
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
        <div className="admin-card-solid p-8">
          {!scriptData || !scriptData.scenes ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading project data...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-3">
                  Step 3: Scene Generation
                </h2>
                {topic && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-600">
                      Topic:{" "}
                    </span>
                    <span className="text-sm text-gray-900">{topic}</span>
                  </div>
                )}
                {voiceoverUrl && (
                  <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-purple-700">
                        🎤 Voiceover:
                      </span>
                      <audio
                        controls
                        src={voiceoverUrl}
                        className="flex-1 h-8"
                        style={{ maxWidth: "400px" }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <div className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap">
                    🎨 {scriptData?.scenes?.length || 0} scenes
                  </div>
                  <div className="bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                    <span className="text-purple-700">🤖 Model:</span>
                    <span className="font-semibold text-purple-900">
                      Grok Image Edit
                    </span>
                  </div>
                  <div className="bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                    <span className="text-green-700">💰 Cost:</span>
                    <span className="font-semibold text-green-900">
                      ${fluxProCost !== null ? fluxProCost.toFixed(3) : "0.000"}
                      /image
                    </span>
                  </div>
                  {projectCosts?.step3?.claude > 0 && (
                    <div className="bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                      <span className="text-purple-700">🤖 Claude:</span>
                      <span className="font-semibold text-purple-900">
                        ${projectCosts.step3.claude.toFixed(4)}
                      </span>
                    </div>
                  )}
                  {projectCosts?.step3?.total > 0 && (
                    <div className="bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                      <span className="text-orange-700">💰 Step 3 Total:</span>
                      <span className="font-semibold text-orange-900">
                        ${projectCosts.step3.total.toFixed(3)}
                      </span>
                    </div>
                  )}
                  <a
                    href="https://fal.ai/dashboard/billing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-200 transition whitespace-nowrap dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                  >
                    💳 Check FAL Balance →
                  </a>
                  <button
                    onClick={() => setShowFluxSettings(!showFluxSettings)}
                    className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-indigo-100 transition whitespace-nowrap"
                  >
                    ⚙️ {showFluxSettings ? "Hide" : "Show"} Model Settings
                  </button>
                </div>
              </div>

              {/* Grok Image Edit Settings Panel */}
              {showFluxSettings && (
                <div className="mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-6 dark:from-indigo-950/30 dark:to-purple-950/30 dark:border-indigo-900">
                  <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2 dark:text-indigo-200">
                    <span className="text-xl">⚙️</span>
                    Grok Image Edit Settings
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 dark:text-gray-300">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 dark:border-gray-700"
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
                  <h3 className="font-semibold mb-3">Review Scene Concepts</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Review and edit the scene details before generating images.
                    Each scene will be created based on these prompts.
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  {scriptData.scenes.map((scene, index) => (
                    <Fragment key={scene.id}>
                      <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-950/40 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-lg">
                            Scene {scene.id}
                          </span>
                        </div>

                        {/* Location Info */}
                        {(() => {
                          const locationId = locationMapping[scene.id];
                          const location = selectedLocations.find(
                            (loc) => loc.id === locationId,
                          );

                          return location ? (
                            <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-900">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                  <span className="text-xl">📍</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-blue-900 text-sm mb-1 dark:text-blue-200">
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
                                    className="flex-shrink-0 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50"
                                    title="Choose different location from library"
                                  >
                                    📍 Select
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleOpenLocationTypeModal(scene.id)
                                    }
                                    disabled={generatingSceneId === scene.id}
                                    className="flex-shrink-0 text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 font-medium transition disabled:opacity-50"
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
                                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                                >
                                  Manage Locations
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-950/30 dark:border-yellow-900">
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
                                    className="flex-shrink-0 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50"
                                    title="Choose from location library"
                                  >
                                    📍 Select
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleOpenLocationTypeModal(scene.id)
                                    }
                                    disabled={generatingSceneId === scene.id}
                                    className="flex-shrink-0 text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 font-medium transition disabled:opacity-50"
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
                            <div className="mb-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-900">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">🎭</span>
                                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                                      {selectedAction.name}
                                    </h4>
                                  </div>
                                  <p className="text-xs text-blue-700 mb-2 dark:text-blue-200">
                                    {selectedAction.description}
                                  </p>
                                  {selectedAction.pose_variations && (
                                    <div className="space-y-1">
                                      <div className="text-xs font-medium text-blue-800 dark:text-blue-200">
                                        Pose Options:
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {selectedAction.pose_variations
                                          .slice(0, 2)
                                          .map((pose, idx) => (
                                            <span
                                              key={idx}
                                              className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900/40 dark:text-blue-200"
                                            >
                                              {pose.length > 40
                                                ? pose.substring(0, 40) + "..."
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
                                    className="flex-shrink-0 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50"
                                    title="Choose different action from library"
                                  >
                                    🎭 Select
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleOpenActionGenerateModal(scene.id)
                                    }
                                    disabled={generatingSceneId === scene.id}
                                    className="flex-shrink-0 text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 font-medium transition disabled:opacity-50"
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
                            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-950/30 dark:border-yellow-900">
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
                                    className="flex-shrink-0 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50"
                                    title="Choose action from library"
                                  >
                                    🎭 Select
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleOpenActionGenerateModal(scene.id)
                                    }
                                    disabled={generatingSceneId === scene.id}
                                    className="flex-shrink-0 text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 font-medium transition disabled:opacity-50"
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
                                          (selectedReferenceImages[scene.id] ||
                                            selectedCharacter.image_urls[0]) ===
                                          imageUrl
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
                                  scene. Click "Browse All" to see references
                                  from all projects.
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
                                className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
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
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y text-sm bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 dark:border-gray-700"
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
                              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
                          </div>

                          {/* Generated Images Preview */}
                          {scene.image_urls && scene.image_urls.length > 0 && (
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">
                                Generated Images ({scene.image_urls.length}) -
                                Click to select for video:
                              </label>
                              <div className="grid grid-cols-4 gap-3">
                                {scene.image_urls.map((url, idx) => {
                                  const isSelected =
                                    (selectedSceneImages[scene.id] ?? 0) ===
                                    idx;
                                  return (
                                    <div
                                      key={`scene-${scene.id}-img-${idx}`}
                                      onClick={() =>
                                        handleSelectSceneImage(scene.id, idx)
                                      }
                                      className={`relative aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden cursor-pointer transition-all group dark:bg-gray-900 ${
                                        isSelected
                                          ? "border-4 border-blue-500 ring-4 ring-blue-200 shadow-lg"
                                          : "border-2 border-gray-300 hover:border-blue-400 hover:shadow-md dark:border-gray-700"
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
                                            setExpandedImage({
                                              sceneId: scene.id,
                                              imageIndex: idx,
                                              url,
                                            });
                                          }}
                                          className="bg-gray-800 text-white px-2 py-1 rounded-lg text-xs font-medium hover:bg-gray-900"
                                          title="View full size"
                                        >
                                          🔍 Expand
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveImage(scene.id, idx);
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
                        <div className="flex items-center justify-center gap-3 -my-2 px-2">
                          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleSceneLink(
                                scene.id,
                                scriptData.scenes[index + 1].id,
                              )
                            }
                            disabled={
                              savingSceneGroups ||
                              generatingSceneId === scene.id
                            }
                            className={
                              "inline-flex items-center justify-center h-9 w-9 rounded-full border transition disabled:opacity-50 " +
                              (areScenesLinked(
                                sceneGroups,
                                scene.id,
                                scriptData.scenes[index + 1].id,
                              )
                                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-gray-900")
                            }
                            aria-label={
                              areScenesLinked(
                                sceneGroups,
                                scene.id,
                                scriptData.scenes[index + 1].id,
                              )
                                ? `Unlink Scene ${scene.id} and Scene ${scriptData.scenes[index + 1].id}`
                                : `Link Scene ${scene.id} and Scene ${scriptData.scenes[index + 1].id}`
                            }
                            title={
                              areScenesLinked(
                                sceneGroups,
                                scene.id,
                                scriptData.scenes[index + 1].id,
                              )
                                ? `Unlink Scene ${scene.id} and Scene ${scriptData.scenes[index + 1].id}`
                                : `Link Scene ${scene.id} and Scene ${scriptData.scenes[index + 1].id}`
                            }
                          >
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
                          </button>
                          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                        </div>
                      )}
                    </Fragment>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-300"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleGenerateImages}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading
                      ? "Generating Scene Images..."
                      : "Generate Scene Images →"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 4: Review Videos */}
      {step === 4 && videos.length > 0 && (
        <div className="admin-card p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-3">Step 4: Review Videos</h2>
            <div className="flex flex-wrap gap-2">
              <div className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap">
                🎬 {videos.length} videos
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

          {/* Videos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {videos.map((vid) => {
              const scene = scriptData.scenes.find(
                (s) => s.id === vid.scene_id,
              );
              return (
                <div key={vid.scene_id} className="border rounded-lg p-4">
                  <div className="mb-2">
                    <span className="font-medium">Scene {vid.scene_id}</span>
                  </div>

                  <div className="aspect-[9/16] bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    <video controls className="w-full h-full object-cover">
                      <source src={vid.video_url} type="video/mp4" />
                    </video>
                  </div>

                  <p className="text-sm text-gray-600">{scene.voiceover}</p>
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
              onClick={handleAssembleVideo}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Assembling Video..." : "Assemble Final Video →"}
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Final Video & Social Posting */}
      {step === 5 && finalVideoUrl && (
        <div className="admin-card p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-3">
              Step 5: Final Video & Post
            </h2>
            <div className="flex flex-wrap gap-2">
              <div className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap">
                ✓ Video Complete
              </div>
              {projectCosts?.step5?.shotstack > 0 && (
                <div className="bg-pink-50 border border-pink-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-pink-700">🎞️ Shotstack:</span>
                  <span className="font-semibold text-pink-900">
                    ${projectCosts.step5.shotstack.toFixed(4)}
                  </span>
                </div>
              )}
              {projectCosts?.step5?.total > 0 && (
                <div className="bg-gray-50 border border-gray-300 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-gray-700">💰 Step 5 Total:</span>
                  <span className="font-semibold text-gray-900">
                    ${projectCosts.step5.total.toFixed(4)}
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

          {/* Final Video Player */}
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
          <div className="border-t pt-8">
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

          {/* Start New Video */}
          <div className="mt-8 pt-8 border-t">
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
                setSessionId(null);
                setCurrentProjectId(null);
                setCurrentProjectName("");
                loadProjects();
              }}
              className="w-full bg-blue-600 text-white py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              Create Another Video
            </button>
          </div>
        </div>
      )}

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  📍 Select Location for Scene {locationPickerSceneId}
                </h3>
                <button
                  onClick={() => setShowLocationPicker(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Choose a location from the library
              </p>

              {/* Filters */}
              <div className="mt-4 space-y-3">
                {/* Category Filter */}
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">
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
                      className={`px-3 py-1 text-xs rounded-full ${!locationFilters.category ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
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
                      className={`px-3 py-1 text-xs rounded-full ${locationFilters.category === "indoor" ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-700 hover:bg-purple-200"}`}
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
                      className={`px-3 py-1 text-xs rounded-full ${locationFilters.category === "outdoor" ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-700 hover:bg-purple-200"}`}
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
                        className="px-3 py-1 text-xs text-red-600 hover:text-red-800"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Buttons */}
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">
                    Filters:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setShowFilterModal("lighting")}
                      className="px-3 py-1.5 text-xs rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-300 font-medium"
                    >
                      💡 Lighting{" "}
                      {locationFilters.lighting.length > 0 &&
                        `(${locationFilters.lighting.length})`}
                    </button>
                    <button
                      onClick={() => setShowFilterModal("atmosphere")}
                      className="px-3 py-1.5 text-xs rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-300 font-medium"
                    >
                      Atmosphere{" "}
                      {locationFilters.atmosphere.length > 0 &&
                        `(${locationFilters.atmosphere.length})`}
                    </button>
                    <button
                      onClick={() => setShowFilterModal("key_elements")}
                      className="px-3 py-1.5 text-xs rounded-lg bg-green-100 text-green-700 hover:bg-green-200 border border-green-300 font-medium"
                    >
                      Key Elements{" "}
                      {locationFilters.key_elements.length > 0 &&
                        `(${locationFilters.key_elements.length})`}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="p-6 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 180px)" }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableLocations
                  .filter((location) => {
                    // Filter by category
                    if (
                      locationFilters.category &&
                      location.category !== locationFilters.category
                    ) {
                      return false;
                    }
                    // Filter by lighting
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
                    // Filter by atmosphere
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
                    // Filter by key elements
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
                        className={`text-left p-4 rounded-lg border-2 transition ${
                          isCurrentLocation
                            ? "border-green-500 bg-green-50 cursor-not-allowed"
                            : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-xl">📍</span>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-sm mb-1">
                              {location.name}
                              {isCurrentLocation && (
                                <span className="ml-2 text-xs text-green-600 font-normal">
                                  (Current)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="relative group mb-2">
                          <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed cursor-help">
                            {location.description}
                          </p>
                          {/* Tooltip on hover */}
                          <div className="invisible group-hover:visible absolute left-0 top-full mt-1 w-full bg-gray-900 text-white text-xs p-3 rounded-lg shadow-lg z-50 leading-relaxed">
                            {location.description}
                          </div>
                        </div>

                        {/* Sample Images */}
                        {location.sample_images &&
                          location.sample_images.length > 0 && (
                            <div className="mb-2 flex gap-1 overflow-x-auto">
                              {location.sample_images
                                .slice(0, 3)
                                .map((imageUrl, idx) => (
                                  <div
                                    key={idx}
                                    className="relative flex-shrink-0 w-16 h-24 rounded overflow-hidden border border-gray-300 group"
                                  >
                                    <img
                                      src={imageUrl}
                                      alt={`Sample ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        console.log(
                                          "=== REMOVE SAMPLE IMAGE ===",
                                        );
                                        console.log(
                                          "Location ID:",
                                          location.id,
                                        );
                                        console.log(
                                          "Image URL to remove:",
                                          imageUrl,
                                        );
                                        console.log(
                                          "Current sample_images:",
                                          location.sample_images,
                                        );

                                        const updatedImages =
                                          location.sample_images.filter(
                                            (url) => url !== imageUrl,
                                          );
                                        console.log(
                                          "Updated sample_images:",
                                          updatedImages,
                                        );

                                        try {
                                          const response = await fetch(
                                            `/api/locations/${location.id}`,
                                            {
                                              method: "PATCH",
                                              headers: {
                                                "Content-Type":
                                                  "application/json",
                                              },
                                              body: JSON.stringify({
                                                sample_images: updatedImages,
                                              }),
                                            },
                                          );

                                          console.log(
                                            "Response status:",
                                            response.status,
                                          );
                                          console.log(
                                            "Response ok:",
                                            response.ok,
                                          );

                                          const result = await response.json();
                                          console.log("Response data:", result);

                                          if (response.ok) {
                                            // Update local state
                                            setAvailableLocations((prev) =>
                                              prev.map((loc) =>
                                                loc.id === location.id
                                                  ? {
                                                      ...loc,
                                                      sample_images:
                                                        updatedImages,
                                                    }
                                                  : loc,
                                              ),
                                            );
                                            console.log(
                                              "Local state updated successfully",
                                            );
                                            await alert(
                                              "Sample image removed",
                                              "success",
                                            );
                                          } else {
                                            console.error(
                                              "Failed to remove image:",
                                              result,
                                            );
                                            await alert(
                                              "Failed to remove image: " +
                                                (result.error ||
                                                  "Unknown error"),
                                              "error",
                                            );
                                          }
                                        } catch (error) {
                                          console.error(
                                            "Error removing image:",
                                            error,
                                          );
                                          await alert(
                                            "Error removing image: " +
                                              error.message,
                                            "error",
                                          );
                                        }
                                        console.log(
                                          "=========================",
                                        );
                                      }}
                                      className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                      title="Remove this sample image"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              {location.sample_images.length > 3 && (
                                <div className="flex-shrink-0 w-16 h-24 rounded bg-gray-100 border border-gray-300 flex items-center justify-center">
                                  <span className="text-xs text-gray-600 font-medium">
                                    +{location.sample_images.length - 3}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                        <div className="flex flex-wrap gap-2">
                          {location.category && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                              {location.category === "indoor"
                                ? "🏢 Indoor"
                                : "🌃 Outdoor"}
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            {location.type.replace(/_/g, " ")}
                          </span>
                          {location.visual_characteristics?.lighting &&
                            (Array.isArray(
                              location.visual_characteristics.lighting,
                            )
                              ? location.visual_characteristics.lighting
                              : location.visual_characteristics.lighting
                                  .split(",")
                                  .map((s) => s.trim())
                            ).map((light, idx) => (
                              <span
                                key={`light-${idx}`}
                                className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full"
                              >
                                {light}
                              </span>
                            ))}
                          {location.visual_characteristics?.atmosphere &&
                            (Array.isArray(
                              location.visual_characteristics.atmosphere,
                            )
                              ? location.visual_characteristics.atmosphere
                              : location.visual_characteristics.atmosphere
                                  .split(",")
                                  .map((s) => s.trim())
                            ).map((atm, idx) => (
                              <span
                                key={`atm-${idx}`}
                                className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                              >
                                {atm}
                              </span>
                            ))}
                          {location.visual_characteristics?.key_elements &&
                            location.visual_characteristics.key_elements.map(
                              (element, idx) => (
                                <span
                                  key={`elem-${idx}`}
                                  className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full"
                                >
                                  {element}
                                </span>
                              ),
                            )}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  🎭 Select Action/Pose for Scene {actionPickerSceneId}
                </h3>
                <button
                  onClick={() => setShowActionPicker(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Choose an action or pose from the library
              </p>
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
                      className={`text-left p-4 rounded-lg border-2 transition ${
                        isCurrentAction
                          ? "border-blue-500 bg-blue-50 cursor-not-allowed"
                          : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-2xl">🎭</span>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 text-base mb-1">
                            {action.name}
                            {isCurrentAction && (
                              <span className="ml-2 text-xs text-green-600 font-normal">
                                (Current)
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mb-3">
                            {action.description}
                          </p>
                        </div>
                      </div>

                      {/* Pose Variations */}
                      {action.pose_variations &&
                        action.pose_variations.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs font-medium text-gray-700 mb-2">
                              Pose Variations:
                            </div>
                            <div className="space-y-1">
                              {action.pose_variations.map((pose, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs text-gray-600 pl-4 border-l-2 border-blue-200"
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
                          <span className="text-xs font-medium text-gray-700">
                            Expression:{" "}
                          </span>
                          <span className="text-xs text-gray-600">
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
                              className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
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
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-2">No actions available yet.</p>
                    <p className="text-sm">
                      Actions will be seeded automatically when you select one.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
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
    </div>
  );
}
