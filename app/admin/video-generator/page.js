"use client";

import { useEffect, useState } from "react";

export default function VideoGeneratorPage() {
  const [step, setStep] = useState(1);
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
  const [scripts, setScripts] = useState([]);
  const [loadingScript, setLoadingScript] = useState(false);

  // Step 2: Script Generation
  const [scriptData, setScriptData] = useState(null);

  // Step 3: Image Generation
  const [images, setImages] = useState([]);

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
    loadScripts();
  }, []);

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
        console.error("Failed to load categories:", result.error || result.message);
        setCategories([]);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
      setCategories([]);
    }
  };

  const loadScripts = async () => {
    try {
      const response = await fetch("/api/scripts");
      const result = await response.json();
      if (result.success && result.scripts) {
        setScripts(result.scripts);
      }
    } catch (error) {
      console.error("Failed to load scripts:", error);
    }
  };

  const handleSelectScript = async (scriptId) => {
    setLoadingScript(true);
    try {
      const response = await fetch(`/api/scripts/${scriptId}`);
      const result = await response.json();

      if (result.success) {
        setScriptData(result.scriptData);
        setTopic(result.script.topic);
        setTopicCategories(result.script.categories || []);
        setStep(2);
      } else {
        alert("Failed to load script: " + result.error);
      }
    } catch (error) {
      alert("Error loading script: " + error.message);
    } finally {
      setLoadingScript(false);
    }
  };

  const handleSaveManualTopic = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic");
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
      (cat) => cat.name.toLowerCase() === trimmed.toLowerCase()
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
          categories: aiGenerateCategories.length > 0 ? aiGenerateCategories : null
        }),
      });

      const result = await response.json();
      if (result.success) {
        await loadTopics();
        setGeneratedTopics(result.topics || []);
        setSuccessMessage(`Generated ${result.count} new topic${result.count !== 1 ? 's' : ''}!`);
        setShowSuccessModal(true);
      } else {
        alert("Failed to generate topics: " + result.error);
      }
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setGeneratingTopics(false);
    }
  };

  // Step 1: Generate Script
  const handleGenerateScript = async () => {
    if (!topic.trim() || !selectedCharacter) {
      alert("Please enter a topic and select a character");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/video-generator/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          categories: topicCategories,
          selected_character: selectedCharacter,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setScriptData(result.data);
        setStep(2);
      } else {
        alert("Failed to generate script: " + result.error);
      }
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Generate Images
  const handleGenerateImages = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/video-generator/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script_data: scriptData,
          selected_character: selectedCharacter,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setImages(result.images);
        setVoiceoverUrl(result.voiceover_url);
        setSessionId(result.session_id);
        setStep(3);
      } else {
        alert("Failed to generate images: " + result.error);
      }
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Regenerate Single Image
  const handleRegenerateImage = async (sceneId) => {
    setLoading(true);
    try {
      const scene = scriptData.scenes.find((s) => s.id === sceneId);
      const response = await fetch("/api/video-generator/regenerate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          scene_id: sceneId,
          image_prompt: scene.image_prompt,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setImages(
          images.map((img) =>
            img.scene_id === sceneId
              ? { ...img, image_url: result.image_url }
              : img
          )
        );
      } else {
        alert("Failed to regenerate: " + result.error);
      }
    } catch (error) {
      alert("Error: " + error.message);
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
        alert("Failed to generate videos: " + result.error);
      }
    } catch (error) {
      alert("Error: " + error.message);
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
        alert("Failed to assemble video: " + result.error);
      }
    } catch (error) {
      alert("Error: " + error.message);
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
        alert(`Posted to ${platform} successfully!`);
      } else {
        alert(`Failed to post to ${platform}: ` + result.error);
      }
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header with Steps */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Video Generator</h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[
            { num: 1, label: "Topic & Character" },
            { num: 2, label: "Script" },
            { num: 3, label: "Images" },
            { num: 4, label: "Videos" },
            { num: 5, label: "Post" },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= s.num
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {s.num}
              </div>
              <span className="ml-2 text-sm font-medium">{s.label}</span>
              {idx < 4 && (
                <div
                  className={`w-16 h-1 mx-4 ${
                    step > s.num ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

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
                        }).length}{" "}
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
                              : []
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
          <h2 className="text-2xl font-bold mb-6">
            Step 1: Choose Topic & Character
          </h2>

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
                                  .includes(topic.toLowerCase())
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
                                      : []
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
                              t.topic.toLowerCase().includes(topic.toLowerCase())
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
                      onBlur={() => setTimeout(() => setCategoryInputFocused(false), 200)}
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
                                  .includes(categoryInput.toLowerCase()))
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
                              cat.name.toLowerCase() === categoryInput.toLowerCase()
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
                      Press Enter or click suggestions to add categories. Type custom categories if needed.
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
                                aiGenerateCategories.filter((c) => c !== cat)
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
                              aiGenerateCategories.filter((c) => c !== cat.name)
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
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
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
                    <p className="text-sm text-gray-600 mb-1">Selected Topic:</p>
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
                                : []
                            );
                            setTopicMode("manual");
                          }}
                          className="border border-gray-200 rounded-lg p-3 hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition"
                        >
                          <p className="text-sm text-gray-900 mb-2">
                            {t.topic}
                          </p>
                          {(Array.isArray(t.categories) ? t.categories : t.category ? [t.category] : []).length > 0 && (
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
                          {char.gender === "male" ? "👨" : char.gender === "female" ? "👩" : "🧑"}
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

          <button
            onClick={handleGenerateScript}
            disabled={loading || !topic.trim() || !selectedCharacter}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Generating Script..." : "Generate Script →"}
          </button>

          {/* OR Separator */}
          {scripts.length > 0 && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">
                    OR
                  </span>
                </div>
              </div>

              {/* Scripts List */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Select from Previously Generated Scripts ({scripts.length})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {scripts.slice(0, 10).map((script) => (
                    <div
                      key={script.id}
                      onClick={() => handleSelectScript(script.id)}
                      className="border rounded-lg p-3 cursor-pointer transition hover:shadow-md hover:border-blue-300 bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">
                            {script.topic}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                            <span>👤 {script.character?.name || 'Unknown'}</span>
                            <span>📅 {new Date(script.created_at).toLocaleDateString()}</span>
                          </div>
                          {script.categories && script.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {script.categories.map((cat, idx) => (
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
                      </div>
                    </div>
                  ))}
                </div>
                {scripts.length > 10 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Showing 10 most recent scripts
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 2: Review Script */}
      {step === 2 && scriptData && (
        <div className="bg-white border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Step 2: Review Script</h2>

          {/* Full Script */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Full Voiceover Script:</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800">{scriptData.script}</p>
            </div>
          </div>

          {/* Scene Breakdown */}
          <div className="mb-8">
            <h3 className="font-semibold mb-3">Scene Breakdown:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scriptData.scenes.map((scene) => (
                <div key={scene.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Scene {scene.id}</span>
                    <span className="text-xs text-gray-500">
                      {scene.location} • {scene.mood}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {scene.voiceover}
                  </p>
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer">View prompts</summary>
                    <div className="mt-2 space-y-1">
                      <p>
                        <strong>Image:</strong> {scene.image_prompt}
                      </p>
                      <p>
                        <strong>Motion:</strong> {scene.motion_prompt}
                      </p>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300"
            >
              ← Back
            </button>
            <button
              onClick={handleGenerateImages}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Generating Images..." : "Generate Images →"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Approve Images */}
      {step === 3 && images.length > 0 && (
        <div className="bg-white border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">
            Step 3: Review Scene Images
          </h2>

          {/* Voiceover Player */}
          {voiceoverUrl && (
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Voiceover Audio:</h3>
              <audio controls className="w-full">
                <source src={voiceoverUrl} type="audio/mpeg" />
              </audio>
            </div>
          )}

          {/* Images Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {images.map((img) => {
              const scene = scriptData.scenes.find(
                (s) => s.id === img.scene_id
              );
              return (
                <div key={img.scene_id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Scene {img.scene_id}</span>
                    <button
                      onClick={() => handleRegenerateImage(img.scene_id)}
                      disabled={loading}
                      className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      Regenerate
                    </button>
                  </div>

                  <div className="aspect-[9/16] bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    <img
                      src={img.image_url}
                      alt={`Scene ${img.scene_id}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <p className="text-sm text-gray-600">{scene.voiceover}</p>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300"
            >
              ← Back
            </button>
            <button
              onClick={handleGenerateVideos}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Generating Videos..." : "Generate Videos →"}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review Videos */}
      {step === 4 && videos.length > 0 && (
        <div className="bg-white border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Step 4: Review Videos</h2>

          {/* Videos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {videos.map((vid) => {
              const scene = scriptData.scenes.find(
                (s) => s.id === vid.scene_id
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
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300"
            >
              ← Back
            </button>
            <button
              onClick={handleAssembleVideo}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Assembling Video..." : "Assemble Final Video →"}
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Final Video & Social Posting */}
      {step === 5 && finalVideoUrl && (
        <div className="bg-white border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">
            Step 5: Final Video & Post
          </h2>

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
                setStep(1);
                setTopic("");
                setSelectedCharacter(null);
                setScriptData(null);
                setImages([]);
                setVideos([]);
                setVoiceoverUrl(null);
                setFinalVideoUrl(null);
                setSessionId(null);
              }}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              Create Another Video
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
