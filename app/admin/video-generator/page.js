"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toast";

export default function VideoGeneratorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { alert, confirm } = useToast();
  const [step, setStep] = useState(0);
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
  const [fluxProCost, setFluxProCost] = useState(null); // Dynamic cost from API (NO FALLBACK)
  const [showFluxSettings, setShowFluxSettings] = useState(false);
  const [fluxSettings, setFluxSettings] = useState({
    strength: 0.65,
    guidance_scale: 3.5,
    num_inference_steps: 28,
    output_format: "png",
  });

  // Step 4: Video Generation
  const [videos, setVideos] = useState([]);
  const [voiceoverUrl, setVoiceoverUrl] = useState(null);

  // Step 5: Final Video
  const [finalVideoUrl, setFinalVideoUrl] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    loadCharacters();
    loadTopics();
    loadCategories();
    loadProjects();
    loadFluxPricing();
  }, []);

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
        console.log(`Loaded Flux Pro pricing: $${result.cost}/image`);
      } else {
        throw new Error(result.error || "Failed to load FAL pricing");
      }
    } catch (error) {
      console.error("CRITICAL: Failed to load FAL pricing:", error);
      alert(`Failed to load FAL AI pricing: ${error.message}. Cannot proceed with image generation.`);
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

  // Helper function to get status display info
  const getProjectStatus = (project) => {
    const step = project.current_step || 0;
    const status = project.status || "draft";

    const statusMap = {
      0: { label: "Draft", color: "bg-gray-100 text-gray-700" },
      1: { label: "Step 1: Setup", color: "bg-yellow-100 text-yellow-700" },
      2: { label: "Step 2: Script Ready", color: "bg-blue-100 text-blue-700" },
      3: {
        label: "Step 3: Voiceover Done",
        color: "bg-purple-100 text-purple-700",
      },
      4: {
        label: "Step 4: Images Ready",
        color: "bg-indigo-100 text-indigo-700",
      },
      5:
        status === "completed"
          ? { label: "✓ Completed", color: "bg-green-100 text-green-700" }
          : status === "rendering"
            ? { label: "Rendering...", color: "bg-orange-100 text-orange-700" }
            : status === "failed"
              ? { label: "Failed", color: "bg-red-100 text-red-700" }
              : {
                  label: "Step 5: Videos Ready",
                  color: "bg-teal-100 text-teal-700",
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
        }),
      });

      const result = await response.json();
      if (result.success) {
        setScriptData(result.data);
        // Clear voiceover since script changed
        setVoiceoverUrl(null);
        setVoiceoverDuration(null);
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
        setStep(3);
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
      const scene = scriptData.scenes.find((s) => s.id === sceneId);

      // Get character reference image
      const characterImageUrl = selectedCharacter?.image_urls?.[0] || null;

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
            flux_settings: fluxSettings,
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
  const handleRegenerateImage = async (sceneId) => {
    setLoading(true);
    setGeneratingSceneId(sceneId); // Show loading indicator
    try {
      const scene = scriptData.scenes.find((s) => s.id === sceneId);
      const characterImageUrl = selectedCharacter?.image_urls?.[0] || null;

      const response = await fetch("/api/video-generator/regenerate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          project_id: currentProjectId,
          scene_id: sceneId,
          image_prompt: scene.image_prompt,
          character_image_url: characterImageUrl,
          flux_settings: fluxSettings,
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Replace the latest image instead of adding a new one
        const updatedScenes = scriptData.scenes.map((scene) => {
          if (scene.id === sceneId) {
            const existingUrls = scene.image_urls || [];
            // Replace the last image with the new one
            const updatedUrls =
              existingUrls.length > 0
                ? [...existingUrls.slice(0, -1), result.image_url] // Replace last
                : [result.image_url]; // Or add first
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

  // Step 3: Remove Generated Image
  const handleRemoveImage = async (sceneId, imageIndex) => {
    const confirmed = await confirm(
      `Remove this generated image? This cannot be undone.`,
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const scene = scriptData.scenes.find((s) => s.id === sceneId);
      const updatedUrls = scene.image_urls.filter(
        (_, idx) => idx !== imageIndex,
      );

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
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
      {/* Header with Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {/* Left Side - Project Name or Title */}
          <div>
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
                    className="px-3 py-1 border rounded-lg text-2xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div
                    onClick={() => setEditingProjectName(true)}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition"
                  >
                    <span className="text-2xl font-bold text-gray-900">
                      {currentProjectName}
                    </span>
                    <svg
                      className="w-5 h-5 text-gray-500"
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
                <span className="text-sm text-gray-500">Video Generator</span>
              </div>
            ) : (
              <h1 className="text-3xl font-bold">Video Generator</h1>
            )}
          </div>

          {/* Right Side - Total Spending & Navigation */}
          <div className="flex items-center gap-3">
            {/* Total Spending */}
            {projectCosts && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-green-700 font-medium">
                    💰 Total Spent:
                  </span>
                  <span className="font-semibold text-green-900">
                    $
                    {(
                      (projectCosts.claude || 0) +
                      (projectCosts.elevenlabs || 0) +
                      (projectCosts.fal_images || 0) +
                      (projectCosts.fal_videos || 0) +
                      (projectCosts.shotstack || 0)
                    ).toFixed(4)}
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="flex gap-2">
              <a
                href="/admin/projects"
                target="_blank"
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                📋 Projects
              </a>
              <a
                href="/admin/budget"
                target="_blank"
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
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
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
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
                      step > s.num ? "bg-blue-600" : "bg-gray-200"
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
        <div className="bg-white border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Get Started</h2>

          {/* Create New Project */}
          <div
            onClick={handleCreateNewProject}
            className="border-2 border-gray-200 rounded-lg p-8 cursor-pointer hover:border-blue-500 hover:shadow-lg transition group mb-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-500 transition flex-shrink-0">
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
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  Create New Project
                </h3>
                <p className="text-sm text-gray-600">
                  Start fresh with a new topic and character to generate a
                  complete video
                </p>
              </div>
            </div>
          </div>

          {/* Existing Projects List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Continue Existing Project
                {projects.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
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
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
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
                <p className="text-gray-500 text-sm">No existing projects</p>
                <p className="text-gray-400 text-xs mt-1">
                  Create your first project to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {projects.slice(0, 10).map((project) => (
                  <div
                    key={project.id}
                    onClick={() => handleSelectProject(project.id)}
                    className="border rounded-lg p-4 cursor-pointer transition hover:shadow-md hover:border-blue-400 bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Project Name & Status */}
                        <div className="mb-2 flex items-center gap-2 flex-wrap">
                          {project.project_name && (
                            <span className="inline-block text-xs font-semibold text-gray-700 bg-gray-200 px-2 py-1 rounded">
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
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          {project.topic || "Untitled"}
                        </h4>

                        {/* Character & Dates */}
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
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
            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowTopicLibrary(false)}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-8 text-center">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
            <p className="text-gray-600 mb-6">{successMessage}</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Topic & Character Selection */}
      {step === 1 && (
        <div className="bg-white border rounded-lg p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-3">
              Step 1: Choose Topic & Character
            </h2>
            {projectCosts && projectCosts.total > 0 && (
              <div className="flex flex-wrap gap-2">
                <div className="bg-gray-50 border border-gray-300 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-gray-700">
                    💰 Current Project Cost:
                  </span>
                  <span className="font-semibold text-gray-900">
                    ${projectCosts.total?.toFixed(4) || "0.0000"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Topic Selection - Three Options */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Video Topic
            </label>

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
                        className="w-full px-4 py-3 border rounded-lg text-lg"
                      />

                      {/* Topic Suggestions Dropdown */}
                      {topicInputFocused && topics.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
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
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm text-gray-900 flex-1">
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
                                        className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
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
                            <div className="px-4 py-3 text-sm text-gray-500">
                              No matching topics found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setShowTopicLibrary(true)}
                      className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
                    >
                      📋 Library
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categories (Tags)
                  </label>

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
                      className="w-full px-4 py-2 border rounded-lg"
                    />

                    {/* Suggestions Dropdown */}
                    {categoryInputFocused && categories.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
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
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
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
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm border-t text-blue-600"
                            >
                              + Add "{categoryInput}" as new category
                            </button>
                          )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Topics to Generate
                  </label>
                  <select
                    value={aiGenerateCount}
                    onChange={(e) => setAiGenerateCount(Number(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Categories (Optional)
                  </label>

                  {/* Selected Categories Display */}
                  {aiGenerateCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {aiGenerateCategories.map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm"
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
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
                  <p className="text-gray-700 mb-4">
                    Generate viral topic ideas using AI
                  </p>
                  <button
                    onClick={handleGenerateTopics}
                    disabled={generatingTopics}
                    className="bg-purple-600 text-white px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
                  >
                    {generatingTopics
                      ? `Generating ${aiGenerateCount} topic${aiGenerateCount !== 1 ? "s" : ""}...`
                      : `🤖 Generate ${aiGenerateCount} Topic ${aiGenerateCount !== 1 ? "Ideas" : "Idea"}`}
                  </button>
                  <p className="text-xs text-gray-500 mt-3">
                    {aiGenerateCategories.length > 0
                      ? `AI will create topics in: ${aiGenerateCategories.join(", ")}`
                      : "AI will create topics optimized for manifestation/LOA niche"}
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
              seconds
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(0)}
              className="flex-1 bg-gray-200 text-gray-700 py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-300"
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
        <div className="bg-white border rounded-lg p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-3">
              Step 2: Script & Voiceover
            </h2>
            <div className="flex flex-wrap gap-2">
              <div className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap">
                📝 {scriptData.scenes?.length || sceneCount} scenes
              </div>
              <div className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap">
                ⏱️ {(scriptData.scenes?.length || sceneCount) * 8}s
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
                <div className="bg-gray-50 border border-gray-300 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-gray-700">💰 Step 2 Total:</span>
                  <span className="font-semibold text-gray-900">
                    ${projectCosts.step2.total.toFixed(4)}
                  </span>
                </div>
              )}
              {elevenLabsInfo && elevenLabsInfo.character_limit && (
                <div className="bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-purple-700">🎤</span>
                  <span className="font-semibold text-purple-900">
                    {elevenLabsInfo.characters_remaining?.toLocaleString() || 0}
                  </span>
                  <span className="text-purple-600">
                    / {elevenLabsInfo.character_limit?.toLocaleString()}
                  </span>
                </div>
              )}
              {elevenLabsInfo && elevenLabsInfo.tier && elevenLabsInfo.cost_per_char !== undefined && (
                <div className="bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-green-700">📊 {elevenLabsInfo.tier}:</span>
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
                {scriptSaving && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
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
                className="text-sm bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              placeholder="Your script here..."
            />
            <div className="text-xs text-gray-500 mt-2 space-y-1">
              <p>
                Edit your script before generating the voiceover. This will be
                the narration for your entire video.
              </p>
              <p className="text-purple-600">
                💡 <strong>Tip:</strong> Add pauses using:{" "}
                <code className="bg-gray-100 px-1 py-0.5 rounded">
                  [pause:2s]
                </code>{" "}
                or{" "}
                <code className="bg-gray-100 px-1 py-0.5 rounded">
                  [pause:500ms]
                </code>{" "}
                or{" "}
                <code className="bg-gray-100 px-1 py-0.5 rounded">[pause]</code>{" "}
                (1s default)
              </p>
            </div>
          </div>

          {/* Voiceover Generation */}
          <div className="mb-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Generate Voiceover</h3>
                {/* ElevenLabs Credits Display */}
                {elevenLabsInfo &&
                  elevenLabsInfo.character_limit &&
                  elevenLabsInfo.character_count !== undefined && (
                    <div className="flex items-center gap-2 text-xs">
                      <div className="bg-white border border-purple-300 rounded-lg px-3 py-1.5">
                        <span className="text-gray-600">ElevenLabs </span>
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
                        <span className="text-gray-500">
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
        <div className="bg-white border rounded-lg p-8">
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
            <div className="flex flex-wrap gap-2">
              <div className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap">
                🎨 {scriptData.scenes?.length || 0} scenes
              </div>
              <div className="bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-purple-700">🤖 Model:</span>
                <span className="font-semibold text-purple-900">Flux Pro</span>
              </div>
              <div className="bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-green-700">💰 Cost:</span>
                <span className="font-semibold text-green-900">
                  ${fluxProCost.toFixed(3)}/image
                </span>
              </div>
              {projectCosts?.step3?.total > 0 && (
                <div className="bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-orange-700">💰 Step 3 Total:</span>
                  <span className="font-semibold text-orange-900">
                    ${projectCosts.step3.total.toFixed(3)}
                  </span>
                  <span className="text-orange-600 text-xs">
                    ({Math.round(projectCosts.step3.total / fluxProCost)}{" "}
                    images)
                  </span>
                </div>
              )}
              <a
                href="https://fal.ai/dashboard/billing"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-200 transition whitespace-nowrap"
              >
                💳 Check FAL Balance →
              </a>
              <button
                onClick={() => setShowFluxSettings(!showFluxSettings)}
                className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-indigo-100 transition whitespace-nowrap"
              >
                ⚙️ {showFluxSettings ? "Hide" : "Show"} Flux Settings
              </button>
            </div>
          </div>

          {/* Flux Pro Settings Panel */}
          {showFluxSettings && (
            <div className="mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-6">
              <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                <span className="text-xl">⚙️</span>
                Flux Pro Generation Settings
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Adjust these settings to control image quality and character
                consistency. Changes apply to all new images.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strength */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Character Preservation (Strength)
                    <span className="ml-2 text-indigo-600 font-semibold">
                      {fluxSettings.strength}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={fluxSettings.strength}
                    onChange={(e) =>
                      setFluxSettings({
                        ...fluxSettings,
                        strength: parseFloat(e.target.value),
                      })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>More Creative (0.0)</span>
                    <span>More Consistent (1.0)</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Higher = Better character consistency. Lower = More scene
                    variety.
                  </p>
                </div>

                {/* Guidance Scale */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prompt Adherence (Guidance Scale)
                    <span className="ml-2 text-indigo-600 font-semibold">
                      {fluxSettings.guidance_scale}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={fluxSettings.guidance_scale}
                    onChange={(e) =>
                      setFluxSettings({
                        ...fluxSettings,
                        guidance_scale: parseFloat(e.target.value),
                      })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Creative (1.0)</span>
                    <span>Strict (10.0)</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Higher = Follows prompt more strictly. Lower = More creative
                    interpretation.
                  </p>
                </div>

                {/* Inference Steps */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality (Inference Steps)
                    <span className="ml-2 text-indigo-600 font-semibold">
                      {fluxSettings.num_inference_steps}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="2"
                    value={fluxSettings.num_inference_steps}
                    onChange={(e) =>
                      setFluxSettings({
                        ...fluxSettings,
                        num_inference_steps: parseInt(e.target.value),
                      })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Fast (10)</span>
                    <span>Best Quality (50)</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Higher = Better quality but slower. 28 is recommended for
                    balanced results.
                  </p>
                </div>

                {/* Output Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="png">PNG (Lossless, Higher Quality)</option>
                    <option value="jpeg">JPEG (Compressed, Faster)</option>
                  </select>
                  <p className="text-xs text-gray-600 mt-1">
                    PNG is recommended for best quality with character details.
                  </p>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="mt-4 pt-4 border-t border-indigo-200">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Quick Presets:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      setFluxSettings({
                        strength: 0.85,
                        guidance_scale: 4.0,
                        num_inference_steps: 35,
                        output_format: "png",
                      })
                    }
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition"
                  >
                    🎯 Maximum Consistency
                  </button>
                  <button
                    onClick={() =>
                      setFluxSettings({
                        strength: 0.65,
                        guidance_scale: 3.5,
                        num_inference_steps: 28,
                        output_format: "png",
                      })
                    }
                    className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition"
                  >
                    ⚖️ Balanced (Default)
                  </button>
                  <button
                    onClick={() =>
                      setFluxSettings({
                        strength: 0.45,
                        guidance_scale: 2.5,
                        num_inference_steps: 20,
                        output_format: "png",
                      })
                    }
                    className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition"
                  >
                    🎨 More Creative
                  </button>
                  <button
                    onClick={() =>
                      setFluxSettings({
                        strength: 0.65,
                        guidance_scale: 3.5,
                        num_inference_steps: 15,
                        output_format: "jpeg",
                      })
                    }
                    className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-200 transition"
                  >
                    ⚡ Fast Generation
                  </button>
                </div>
              </div>
            </div>
          )}

          {scriptData.scenes.some(
            (scene) => !scene.image_urls || scene.image_urls.length === 0,
          ) ? (
            /* Before All Images Generated - Show Editable Scene Details */
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
                  <div
                    key={scene.id}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-lg">
                        Scene {scene.id}
                      </span>
                      <span className="text-xs text-gray-500">
                        {scene.location} • {scene.mood}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Voiceover Text - Read Only */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Voiceover Segment:
                        </label>
                        <p className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700">
                          {scene.voiceover}
                        </p>
                      </div>

                      {/* Character Reference */}
                      {selectedCharacter?.image_urls?.[0] && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <label className="block text-xs font-medium text-blue-900 mb-2">
                            Character Reference:
                          </label>
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 border-blue-300">
                              <img
                                src={selectedCharacter.image_urls[0]}
                                alt={selectedCharacter.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-blue-900">
                                {selectedCharacter.name}
                              </p>
                              <p className="text-xs text-blue-600">
                                Will maintain this character in the scene
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Location and Mood */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location:
                          </label>
                          <input
                            type="text"
                            value={scene.location}
                            onChange={(e) => {
                              const updatedScenes = [...scriptData.scenes];
                              updatedScenes[index] = {
                                ...scene,
                                location: e.target.value,
                              };
                              setScriptData({
                                ...scriptData,
                                scenes: updatedScenes,
                              });
                            }}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mood:
                          </label>
                          <input
                            type="text"
                            value={scene.mood}
                            onChange={(e) => {
                              const updatedScenes = [...scriptData.scenes];
                              updatedScenes[index] = {
                                ...scene,
                                mood: e.target.value,
                              };
                              setScriptData({
                                ...scriptData,
                                scenes: updatedScenes,
                              });
                            }}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Image Prompt */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Image Prompt:
                        </label>
                        <textarea
                          value={scene.image_prompt}
                          onChange={(e) => {
                            const updatedScenes = [...scriptData.scenes];
                            updatedScenes[index] = {
                              ...scene,
                              image_prompt: e.target.value,
                            };
                            setScriptData({
                              ...scriptData,
                              scenes: updatedScenes,
                            });
                          }}
                          rows={8}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y text-sm"
                        />
                      </div>

                      {/* Generate Image Button */}
                      <div className="mt-4">
                        <button
                          onClick={() => handleGenerateSingleImage(scene.id)}
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
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full animate-pulse"
                                style={{ width: "100%" }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 text-center mt-1">
                              Generating image with character reference...
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Generated Images Preview */}
                      {scene.image_urls && scene.image_urls.length > 0 && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Generated Images ({scene.image_urls.length}):
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {scene.image_urls.map((url, idx) => (
                              <div
                                key={idx}
                                className="relative aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300 group"
                              >
                                <img
                                  src={url}
                                  alt={`Scene ${scene.id} - Version ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() =>
                                      handleRemoveImage(scene.id, idx)
                                    }
                                    disabled={loading}
                                    className="bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                                    title="Remove this image"
                                  >
                                    Remove
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleRegenerateImage(scene.id)
                                    }
                                    disabled={
                                      loading || generatingSceneId === scene.id
                                    }
                                    className="bg-blue-600 text-white px-2 py-1 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                                    title="Regenerate this scene"
                                  >
                                    {generatingSceneId === scene.id
                                      ? "Regenerating..."
                                      : "Regenerate"}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
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
          ) : (
            /* After Image Generation - Show Images with Scene Info */
            <div>
              <h3 className="font-semibold mb-4">Review Generated Scenes</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {scriptData.scenes
                  .filter(
                    (scene) => scene.image_urls && scene.image_urls.length > 0,
                  )
                  .map((scene) => {
                    const latestImageIndex = scene.image_urls.length - 1;
                    const latestImage = scene.image_urls[latestImageIndex];
                    return (
                      <div key={scene.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium">Scene {scene.id}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleRemoveImage(scene.id, latestImageIndex)
                              }
                              disabled={loading}
                              className="text-sm text-red-600 hover:underline disabled:opacity-50"
                            >
                              Remove
                            </button>
                            <button
                              onClick={() => handleRegenerateImage(scene.id)}
                              disabled={
                                loading || generatingSceneId === scene.id
                              }
                              className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                            >
                              {generatingSceneId === scene.id
                                ? "Regenerating..."
                                : "Regenerate"}
                            </button>
                          </div>
                        </div>

                        <div className="aspect-[9/16] bg-gray-100 rounded-lg mb-3 overflow-hidden">
                          <img
                            src={latestImage}
                            alt={`Scene ${scene.id}`}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="text-sm">
                          <p className="text-gray-600 mb-2">
                            {scene.voiceover}
                          </p>
                          <div className="flex gap-2 text-xs text-gray-500">
                            <span>{scene.location}</span>
                            <span>•</span>
                            <span>{scene.mood}</span>
                            {scene.image_urls.length > 1 && (
                              <>
                                <span>•</span>
                                <span className="text-blue-600">
                                  {scene.image_urls.length} versions
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-300"
                >
                  ← Back
                </button>
                <button
                  onClick={handleGenerateVideos}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Generating Videos..." : "Generate Videos →"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Review Videos */}
      {step === 4 && videos.length > 0 && (
        <div className="bg-white border rounded-lg p-8">
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
        <div className="bg-white border rounded-lg p-8">
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
    </div>
  );
}
