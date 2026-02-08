"use client";

import { useState, useEffect } from "react";

export default function CharactersPage() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [projectImages, setProjectImages] = useState([]);
  const [loadingProjectImages, setLoadingProjectImages] = useState(false);
  const [copyingImageId, setCopyingImageId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [showCharacterDeleteModal, setShowCharacterDeleteModal] =
    useState(false);
  const [characterToDelete, setCharacterToDelete] = useState(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    gender: "female",
    age: "",
    voice_id: "",
    image_urls: [],
    description: "",
  });

  useEffect(() => {
    loadCharacters();
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (!editingId) return; // Only auto-save when editing

    const timeoutId = setTimeout(async () => {
      try {
        setAutoSaving(true);
        setError(null);

        const response = await fetch(`/api/characters/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (data.success) {
          setLastSaved(new Date());
          await loadCharacters();
        } else {
          setError(data.error || data.message || "Failed to auto-save");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setAutoSaving(false);
      }
    }, 1000); // Auto-save after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [formData, editingId]);

  const loadCharacters = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/characters");
      const data = await response.json();

      if (data.success) {
        setCharacters(data.characters);
      } else {
        setError(data.message || "Failed to load characters");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectImages = async (characterId) => {
    try {
      setLoadingProjectImages(true);
      const response = await fetch(
        `/api/characters/${characterId}/all-references`,
      );
      const data = await response.json();

      if (data.success) {
        // Filter to only show project images (not main references)
        const projectRefs = data.references.filter(
          (ref) => ref.source === "project",
        );
        setProjectImages(projectRefs);
      } else {
        setProjectImages([]);
      }
    } catch (err) {
      console.error("Failed to load project images:", err);
      setProjectImages([]);
    } finally {
      setLoadingProjectImages(false);
    }
  };

  const handleEdit = (character) => {
    setEditingId(character.character_id);
    setCurrentImageIndex(0);
    setFormData({
      name: character.name || "",
      gender: character.gender || "female",
      age: character.age || "",
      voice_id: character.voice_id || "",
      image_urls: Array.isArray(character.image_urls)
        ? character.image_urls
        : [],
      description: character.description || "",
    });
    setShowAddForm(false);
    // Load project images
    loadProjectImages(character.character_id);
  };

  const handleAdd = () => {
    setShowAddForm(true);
    setEditingId(null);
    setCurrentImageIndex(0);
    setFormData({
      name: "",
      gender: "female",
      age: "",
      voice_id: "",
      image_urls: [],
      description: "",
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = editingId
        ? `/api/characters/${editingId}`
        : "/api/characters";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        await loadCharacters();
        setEditingId(null);
        setShowAddForm(false);
        setFormData({
          name: "",
          gender: "female",
          age: "",
          voice_id: "",
          image_urls: [],
          description: "",
        });
      } else {
        setError(data.error || data.message || "Failed to save character");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (character) => {
    setCharacterToDelete(character);
    setDeleteConfirmName("");
    setShowCharacterDeleteModal(true);
  };

  const confirmDeleteCharacter = async () => {
    if (!characterToDelete) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/characters/${characterToDelete.character_id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (data.success) {
        await loadCharacters();
        setShowCharacterDeleteModal(false);
        setCharacterToDelete(null);
        setDeleteConfirmName("");
      } else {
        setError(data.error || "Failed to delete character");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({
      name: "",
      gender: "female",
      age: "",
      voice_id: "",
      image_urls: [],
      description: "",
    });
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      setUploadingImage(true);
      setError(null);

      const uploadPromises = files.map(async (file) => {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("gender", formData.gender);

        const response = await fetch("/api/upload-character-image", {
          method: "POST",
          body: uploadFormData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload image");
        }

        const data = await response.json();
        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      setFormData({
        ...formData,
        image_urls: [...formData.image_urls, ...uploadedUrls],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index) => {
    setImageToDelete(index);
    setShowDeleteModal(true);
  };

  const confirmDeleteImage = async () => {
    if (imageToDelete === null) return;

    try {
      setError(null);
      const imageUrl = formData.image_urls[imageToDelete];

      const response = await fetch(
        `/api/characters/${editingId}/delete-image`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl }),
        },
      );

      const data = await response.json();

      if (data.success) {
        const newImageUrls = formData.image_urls.filter(
          (_, i) => i !== imageToDelete,
        );
        setFormData({ ...formData, image_urls: newImageUrls });

        // Adjust current index if needed
        if (
          currentImageIndex >= newImageUrls.length &&
          newImageUrls.length > 0
        ) {
          setCurrentImageIndex(newImageUrls.length - 1);
        } else if (newImageUrls.length === 0) {
          setCurrentImageIndex(0);
        }

        // Reload characters to get updated data
        await loadCharacters();
      } else {
        setError(data.error || "Failed to delete image");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setShowDeleteModal(false);
      setImageToDelete(null);
    }
  };

  const nextImage = () => {
    if (currentImageIndex < formData.image_urls.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleCopyToMainImages = async (imageUrl, characterId, imageId) => {
    try {
      setCopyingImageId(imageId);
      setError(null);
      const response = await fetch(
        `/api/characters/${characterId}/copy-image`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceUrl: imageUrl }),
        },
      );

      const data = await response.json();

      if (data.success) {
        // Update form data with new image
        setFormData((prev) => ({
          ...prev,
          image_urls: [...prev.image_urls, data.imageUrl],
        }));
        // Reload characters to get updated data
        await loadCharacters();
        // Image is now visible in Character Images section - no alert needed
      } else {
        setError(data.error || "Failed to copy image");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCopyingImageId(null);
    }
  };

  const playVoicePreview = async (voiceId, characterName) => {
    try {
      setPlayingVoiceId(voiceId);
      setError(null);

      const response = await fetch("/api/voice-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voice_id: voiceId,
          text: `Hi, I'm ${characterName}. This is what my voice sounds like.`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to load voice preview");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setPlayingVoiceId(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setPlayingVoiceId(null);
        setError("Failed to play voice preview");
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      setError(err.message);
      setPlayingVoiceId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Character Management</h1>
        <button
          onClick={handleAdd}
          disabled={loading || showAddForm}
          className="admin-btn-primary"
        >
          + Add Character
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="admin-card-solid p-4 mb-6 border border-red-200/70 bg-red-50/70 dark:border-red-900/50 dark:bg-red-950/30">
          <p className="text-red-800 dark:text-red-200 font-medium">Error:</p>
          <p className="text-red-700 dark:text-red-200/80 text-sm">{error}</p>
        </div>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && (
        <div className="admin-card-solid p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">
                {editingId ? "Edit Character" : "Add New Character"}
              </h2>
              {editingId && (
                <div className="text-sm">
                  {autoSaving ? (
                    <span className="text-blue-600 flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </span>
                  ) : lastSaved ? (
                    <span className="admin-muted">
                      Saved {new Date(lastSaved).toLocaleTimeString()}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="admin-btn-secondary"
            >
              ← Back to Characters
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="admin-label mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="admin-input"
                placeholder="e.g., Sarah"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="admin-label mb-1">Gender *</label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  className="admin-select w-full"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="admin-label mb-1">Age *</label>
                <input
                  type="text"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                  className="admin-input"
                  placeholder="e.g., 25-35"
                />
              </div>
            </div>

            <div>
              <label className="admin-label mb-1">
                Voice ID (ElevenLabs) *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.voice_id}
                  onChange={(e) =>
                    setFormData({ ...formData, voice_id: e.target.value })
                  }
                  className="admin-input flex-1 font-mono"
                  placeholder="e.g., EXAVITQu4vr4xnSDxMaL"
                />
                {formData.voice_id && (
                  <button
                    type="button"
                    onClick={() =>
                      playVoicePreview(
                        formData.voice_id,
                        formData.name || "the character",
                      )
                    }
                    disabled={playingVoiceId === formData.voice_id}
                    className="admin-btn-primary"
                    title="Preview voice"
                  >
                    {playingVoiceId === formData.voice_id ? (
                      <>
                        <span className="animate-pulse">🔊</span> Playing...
                      </>
                    ) : (
                      <>🔊 Preview</>
                    )}
                  </button>
                )}
              </div>
              <p className="text-xs admin-muted mt-1">
                Get voice IDs from your{" "}
                <a
                  href="https://elevenlabs.io/app/voice-library"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  ElevenLabs Voice Library
                </a>
              </p>
            </div>

            <div>
              <label className="admin-label mb-2">Character Images</label>

              {/* Single Image Preview with Navigation */}
              {formData.image_urls.length > 0 && (
                <div className="mb-3">
                  <div
                    className="relative bg-black rounded-lg overflow-hidden"
                    style={{ height: "300px" }}
                  >
                    <img
                      src={formData.image_urls[currentImageIndex]}
                      alt={`Preview ${currentImageIndex + 1}`}
                      className="w-full h-full object-contain"
                    />

                    {/* Navigation Arrows */}
                    {formData.image_urls.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={prevImage}
                          disabled={currentImageIndex === 0}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={nextImage}
                          disabled={
                            currentImageIndex === formData.image_urls.length - 1
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          →
                        </button>
                      </>
                    )}

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(currentImageIndex)}
                      className="absolute top-2 right-2 text-red-600 hover:text-red-700 p-1"
                      title="Delete this image"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-6 h-6"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {/* Image Counter */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {formData.image_urls.length}
                    </div>
                  </div>

                  {/* Thumbnail Strip */}
                  {formData.image_urls.length > 1 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                      {formData.image_urls.map((url, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                            index === currentImageIndex
                              ? "border-blue-600"
                              : "border-gray-300"
                          }`}
                        >
                          <img
                            src={url}
                            alt={`Thumb ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Upload Button */}
              <div className="flex gap-2">
                <label
                  className={`admin-btn-primary flex-1 cursor-pointer ${uploadingImage ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {uploadingImage ? (
                    <>📤 Uploading...</>
                  ) : (
                    <>📤 Upload Images</>
                  )}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs admin-muted mt-1">
                Images will be uploaded to: /characters/{formData.gender}/
              </p>
            </div>

            {/* Images from Previous Projects */}
            {editingId && (
              <div>
                <label className="admin-label mb-2">
                  Images from Previous Projects
                </label>
                {loadingProjectImages ? (
                  <div className="text-center py-8 admin-muted">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                    <p className="text-sm">Loading project images...</p>
                  </div>
                ) : projectImages.length === 0 ? (
                  <div className="admin-card p-6 text-center">
                    <p className="admin-muted text-sm">
                      No images from previous projects yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Group images by project */}
                    {(() => {
                      const projectGroups = {};
                      projectImages.forEach((img) => {
                        if (!projectGroups[img.project_id]) {
                          projectGroups[img.project_id] = {
                            name: img.project_name,
                            images: [],
                          };
                        }
                        projectGroups[img.project_id].images.push(img);
                      });

                      return Object.entries(projectGroups).map(
                        ([projectId, group]) => (
                          <div
                            key={projectId}
                            className="rounded-lg p-4 bg-black"
                          >
                            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                              {group.name}
                              <span className="text-xs text-gray-400 font-normal">
                                ({group.images.length} images)
                              </span>
                            </h4>
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                              {group.images.map((img) => {
                                const isCopying = copyingImageId === img.id;
                                return (
                                  <div
                                    key={img.id}
                                    className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden transition-all group"
                                  >
                                    <img
                                      src={img.url}
                                      alt={img.label}
                                      className="w-full h-full object-contain"
                                    />
                                    {isCopying && (
                                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                        <p className="text-white text-xs font-medium">
                                          Copying...
                                        </p>
                                      </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2">
                                      <button
                                        onClick={() =>
                                          handleCopyToMainImages(
                                            img.url,
                                            editingId,
                                            img.id,
                                          )
                                        }
                                        disabled={loading || isCopying}
                                        className="w-full bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                                        title="Add to main character images"
                                      >
                                        {isCopying
                                          ? "Copying..."
                                          : "+ Add to Main"}
                                      </button>
                                      <a
                                        href={img.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-white text-gray-900 px-2 py-1 rounded text-xs font-medium hover:bg-gray-100 text-center"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        🔍 View
                                      </a>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <p className="text-white text-xs truncate">
                                        {img.label}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ),
                      );
                    })()}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  These images were generated in previous video projects using
                  this character.
                </p>
              </div>
            )}

            <div>
              <label className="admin-label mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="admin-input"
                placeholder="Character description..."
                rows={4}
              />
            </div>

            {/* Only show Create button for new characters (auto-save handles edits) */}
            {showAddForm && (
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={
                    loading ||
                    !formData.name ||
                    !formData.gender ||
                    !formData.age ||
                    !formData.voice_id
                  }
                  className="admin-btn-primary"
                >
                  {loading ? "Creating..." : "Create Character"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Characters List - Hidden while editing/adding */}
      {!showAddForm && !editingId && (
        <>
          {loading && characters.length === 0 ? (
            <div className="text-center py-12 admin-muted">Loading...</div>
          ) : characters.length === 0 ? (
            <div className="admin-card-solid p-12 text-center">
              <p className="admin-muted mb-4">No characters found</p>
              <button onClick={handleAdd} className="admin-btn-primary">
                Add Your First Character
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {characters.map((character) => (
                <div
                  key={character.character_id}
                  className="admin-card-solid overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex items-stretch">
                    {/* Character Avatar */}
                    {character.image_urls &&
                      Array.isArray(character.image_urls) &&
                      character.image_urls.length > 0 && (
                        <div className="flex-shrink-0 w-40 h-40 bg-black">
                          <img
                            src={character.image_urls[0]}
                            alt={character.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        </div>
                      )}

                    {/* Character Info */}
                    <div className="flex-1 p-6">
                      <h3 className="text-xl font-semibold mb-2">
                        {character.name || "Unnamed Character"}
                      </h3>
                      {character.description && (
                        <p className="admin-muted mb-3 text-sm line-clamp-2">
                          {character.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="bg-gray-100 px-3 py-1 rounded-full dark:bg-gray-800">
                          {character.gender}
                        </span>
                        <span className="bg-gray-100 px-3 py-1 rounded-full dark:bg-gray-800">
                          {character.age}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playVoicePreview(
                              character.voice_id,
                              character.name,
                            );
                          }}
                          disabled={playingVoiceId === character.voice_id}
                          className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-mono text-xs hover:bg-blue-100 disabled:opacity-50 flex items-center gap-1 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/40"
                          title="Click to preview voice"
                        >
                          {playingVoiceId === character.voice_id ? (
                            <span className="animate-pulse">🔊</span>
                          ) : (
                            "🔊"
                          )}{" "}
                          {character.voice_id}
                        </button>
                      </div>
                      {character.created_at && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                          Created:{" "}
                          {new Date(character.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 p-4">
                      <button
                        onClick={() => handleEdit(character)}
                        disabled={loading || editingId || showAddForm}
                        className="admin-btn-secondary"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(character)}
                        disabled={loading}
                        className="admin-btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Character Count */}
          {characters.length > 0 && (
            <div className="mt-6 text-center text-sm admin-muted">
              Total: {characters.length} character
              {characters.length !== 1 ? "s" : ""}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="admin-card-solid max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl dark:bg-red-900/30">
                  🗑️
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Delete Image
                  </h3>
                  <p className="text-sm admin-muted">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="border border-red-200/70 bg-red-50/70 rounded-xl p-4 mb-6 dark:border-red-900/50 dark:bg-red-950/30">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>Warning:</strong> This will permanently delete the
                  image file from storage. The image will be removed from this
                  character and cannot be recovered.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setImageToDelete(null);
                  }}
                  className="admin-btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteImage}
                  disabled={loading}
                  className="admin-btn-danger flex-1"
                >
                  {loading ? "Deleting..." : "🗑️ Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Character Delete Confirmation Modal */}
      {showCharacterDeleteModal && characterToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="admin-card-solid max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl dark:bg-red-900/30">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Delete Character
                  </h3>
                  <p className="text-sm admin-muted">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="border border-red-200/70 bg-red-50/70 rounded-xl p-4 mb-4 dark:border-red-900/50 dark:bg-red-950/30">
                <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                  <strong>Warning:</strong> You are about to permanently delete{" "}
                  <strong>{characterToDelete.name}</strong>.
                </p>
                <p className="text-sm text-red-700 dark:text-red-200/80">
                  This will delete all character data including images and
                  cannot be recovered.
                </p>
              </div>

              <div className="mb-6">
                <label className="admin-label mb-2">
                  Type <strong>{characterToDelete.name}</strong> to confirm
                  deletion:
                </label>
                <input
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder="Enter character name"
                  className="admin-input focus:border-red-500 focus:ring-red-500/30"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCharacterDeleteModal(false);
                    setCharacterToDelete(null);
                    setDeleteConfirmName("");
                  }}
                  className="admin-btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteCharacter}
                  disabled={
                    loading || deleteConfirmName !== characterToDelete.name
                  }
                  className="admin-btn-danger flex-1"
                >
                  {loading ? "Deleting..." : "Delete Character"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
