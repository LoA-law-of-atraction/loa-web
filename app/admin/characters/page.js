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
  const [formData, setFormData] = useState({
    name: "",
    gender: "female",
    age: "",
    voice_id: "",
    image_urls: [],
    prompt: "",
  });

  useEffect(() => {
    loadCharacters();
  }, []);

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
      prompt: character.prompt || "",
    });
    setShowAddForm(false);
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
      prompt: "",
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
          prompt: "",
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

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this character?")) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/characters/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        await loadCharacters();
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
      prompt: "",
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
    const newImageUrls = formData.image_urls.filter((_, i) => i !== index);
    setFormData({ ...formData, image_urls: newImageUrls });
    // Adjust current index if needed
    if (currentImageIndex >= newImageUrls.length && newImageUrls.length > 0) {
      setCurrentImageIndex(newImageUrls.length - 1);
    } else if (newImageUrls.length === 0) {
      setCurrentImageIndex(0);
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Character Management</h1>
        <button
          onClick={handleAdd}
          disabled={loading || showAddForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Add Character
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 font-medium">Error:</p>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? "Edit Character" : "Add New Character"}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Sarah"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age *
                </label>
                <input
                  type="text"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 25-35"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Voice ID (ElevenLabs) *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.voice_id}
                  onChange={(e) =>
                    setFormData({ ...formData, voice_id: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="e.g., EXAVITQu4vr4xnSDxMaL"
                />
                {formData.voice_id && (
                  <button
                    type="button"
                    onClick={() =>
                      playVoicePreview(
                        formData.voice_id,
                        formData.name || "the character"
                      )
                    }
                    disabled={playingVoiceId === formData.voice_id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    title="Preview voice"
                  >
                    {playingVoiceId === formData.voice_id ? (
                      <>
                        <span className="animate-pulse">🔊</span> Playing...
                      </>
                    ) : (
                      <>
                        🔊 Preview
                      </>
                    )}
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Character Images
              </label>

              {/* Single Image Preview with Navigation */}
              {formData.image_urls.length > 0 && (
                <div className="mb-3">
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: "300px" }}>
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
                          disabled={currentImageIndex === formData.image_urls.length - 1}
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
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700"
                      title="Remove this image"
                    >
                      ×
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
                  className={`flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-center cursor-pointer hover:bg-blue-700 ${
                    uploadingImage ? "opacity-50 cursor-not-allowed" : ""
                  }`}
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
              <p className="text-xs text-gray-500 mt-1">
                Images will be uploaded to: /characters/{formData.gender}/
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prompt
              </label>
              <textarea
                value={formData.prompt}
                onChange={(e) =>
                  setFormData({ ...formData, prompt: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Character prompt for AI generation..."
                rows={4}
              />
            </div>

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
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Characters List - Hidden while editing/adding */}
      {!showAddForm && !editingId && (
        <>
          {loading && characters.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : characters.length === 0 ? (
            <div className="bg-white border rounded-lg p-12 text-center">
              <p className="text-gray-500 mb-4">No characters found</p>
              <button
                onClick={handleAdd}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Add Your First Character
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {characters.map((character) => (
            <div
              key={character.character_id}
              className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Character Images */}
                {character.image_urls &&
                  Array.isArray(character.image_urls) &&
                  character.image_urls.length > 0 && (
                    <div className="flex-shrink-0 flex gap-2">
                      {character.image_urls.slice(0, 3).map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`${character.name} ${idx + 1}`}
                          className="w-20 h-20 rounded-lg object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ))}
                      {character.image_urls.length > 3 && (
                        <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-600">
                          +{character.image_urls.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                {/* Character Info */}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">
                    {character.name || "Unnamed Character"}
                  </h3>
                  {character.prompt && (
                    <p className="text-gray-600 mb-3 text-sm line-clamp-2">
                      {character.prompt}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="bg-gray-100 px-3 py-1 rounded-full">
                      {character.gender}
                    </span>
                    <span className="bg-gray-100 px-3 py-1 rounded-full">
                      {character.age}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playVoicePreview(character.voice_id, character.name);
                      }}
                      disabled={playingVoiceId === character.voice_id}
                      className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-mono text-xs hover:bg-blue-100 disabled:opacity-50 flex items-center gap-1"
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
                    <p className="text-xs text-gray-400 mt-3">
                      Created:{" "}
                      {new Date(character.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(character)}
                    disabled={loading || editingId || showAddForm}
                    className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(character.character_id)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50 disabled:opacity-50"
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
            <div className="mt-6 text-center text-sm text-gray-500">
              Total: {characters.length} character{characters.length !== 1 ? "s" : ""}
            </div>
          )}
        </>
      )}
    </div>
  );
}
