"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/admin/Toast";
import { Pencil, Trash2 } from "lucide-react";

export default function ManageActionsPage() {
  const { alert } = useToast();
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateKeywords, setGenerateKeywords] = useState("");
  const [generateCount, setGenerateCount] = useState(1);
  const [editingAction, setEditingAction] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    pose_variations: [""],
    expression: "",
    tags: "",
  });

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/actions/list");
      const result = await response.json();

      if (result.success) {
        setActions(result.actions || []);
      }
    } catch (error) {
      console.error("Error loading actions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedActions = async () => {
    setSeeding(true);
    try {
      const response = await fetch("/api/actions/seed", {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        await alert(
          result.new_actions && result.new_actions.length > 0
            ? `✅ Seeded ${result.new_actions.length} new action(s): ${result.new_actions.join(", ")}`
            : `✅ ${result.message}`,
          "success",
        );
        loadActions();
      } else {
        await alert("Failed to seed actions: " + result.error, "error");
      }
    } catch (error) {
      await alert("Error seeding actions: " + error.message, "error");
    } finally {
      setSeeding(false);
    }
  };

  const handleDeleteAction = async (actionId) => {
    const confirmed = confirm("Delete this action? This cannot be undone.");
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/actions/${actionId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        await alert("Action deleted", "success");
        loadActions();
      } else {
        await alert("Failed to delete action", "error");
      }
    } catch (error) {
      await alert("Error deleting action: " + error.message, "error");
    }
  };

  const handleOpenCreateModal = () => {
    setFormData({
      name: "",
      description: "",
      pose_variations: [""],
      expression: "",
      tags: "",
    });
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (action) => {
    setEditingAction(action);
    setFormData({
      name: action.name,
      description: action.description,
      pose_variations: action.pose_variations || [""],
      expression: action.expression || "",
      tags: Array.isArray(action.tags) ? action.tags.join(", ") : "",
    });
    setShowEditModal(true);
  };

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingAction(null);
  };

  const handlePoseVariationChange = (index, value) => {
    const newPoses = [...formData.pose_variations];
    newPoses[index] = value;
    setFormData({ ...formData, pose_variations: newPoses });
  };

  const handleAddPoseVariation = () => {
    setFormData({
      ...formData,
      pose_variations: [...formData.pose_variations, ""],
    });
  };

  const handleRemovePoseVariation = (index) => {
    const newPoses = formData.pose_variations.filter((_, i) => i !== index);
    setFormData({ ...formData, pose_variations: newPoses });
  };

  const handleCreateAction = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      await alert("Name and description are required", "error");
      return;
    }

    try {
      const response = await fetch("/api/actions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          pose_variations: formData.pose_variations.filter((p) => p.trim()),
          expression: formData.expression.trim(),
          tags: formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t),
        }),
      });

      const result = await response.json();

      if (result.success) {
        await alert("Action created successfully!", "success");
        handleCloseModals();
        loadActions();
      } else {
        await alert("Failed to create action: " + result.error, "error");
      }
    } catch (error) {
      await alert("Error creating action: " + error.message, "error");
    }
  };

  const handleUpdateAction = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      await alert("Name and description are required", "error");
      return;
    }

    try {
      const response = await fetch(`/api/actions/${editingAction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          pose_variations: formData.pose_variations.filter((p) => p.trim()),
          expression: formData.expression.trim(),
          tags: formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t),
        }),
      });

      const result = await response.json();

      if (result.success) {
        await alert("Action updated successfully!", "success");
        handleCloseModals();
        loadActions();
      } else {
        await alert("Failed to update action: " + result.error, "error");
      }
    } catch (error) {
      await alert("Error updating action: " + error.message, "error");
    }
  };

  const handleGenerateActions = async () => {
    if (!generateKeywords.trim()) {
      await alert("Please enter at least one keyword", "error");
      return;
    }

    setGenerating(true);
    setShowGenerateModal(false);
    try {
      const response = await fetch("/api/actions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: generateCount,
          keywords: generateKeywords.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        await alert(
          `✨ Generated ${result.count} new action(s)!\nCost: $${result.cost.toFixed(4)}`,
          "success",
        );
        setGenerateKeywords("");
        loadActions();
      } else {
        await alert("Failed to generate actions: " + result.error, "error");
      }
    } catch (error) {
      await alert("Error generating actions: " + error.message, "error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-gray-100">
            🎭 Manage Actions
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            View, create, and manage character actions/poses for your videos
          </p>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 dark:bg-gray-900 dark:border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Seed Actions */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/30 dark:border-blue-900/40">
              <h3 className="font-semibold text-blue-900 mb-2 dark:text-blue-200">
                🌱 Seed Starter Actions
              </h3>
              <p className="text-sm text-gray-700 mb-3 dark:text-gray-300">
                Load default curated actions (Contemplating, Listening, Gazing,
                Waiting, etc.)
              </p>
              <button
                onClick={handleSeedActions}
                disabled={seeding || loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {seeding ? "Seeding..." : "Seed Actions"}
              </button>
            </div>

            {/* Generate with AI */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/30 dark:border-blue-900/40">
              <h3 className="font-semibold text-blue-900 mb-2 dark:text-blue-200">
                ✨ Generate with AI
              </h3>
              <p className="text-sm text-gray-700 mb-3 dark:text-gray-300">
                Use Claude AI to generate actions based on keywords
              </p>
              <button
                onClick={() => setShowGenerateModal(true)}
                disabled={loading || generating}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? "Generating..." : "Generate Actions"}
              </button>
            </div>

            {/* Create New Action */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/30 dark:border-blue-900/40">
              <h3 className="font-semibold text-blue-900 mb-2 dark:text-blue-200">
                ➕ Create Manually
              </h3>
              <p className="text-sm text-gray-700 mb-3 dark:text-gray-300">
                Design a custom action/pose with variations and expressions
              </p>
              <button
                onClick={handleOpenCreateModal}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Action
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Total Actions: {actions.length}
              </h3>
              <p className="text-sm text-gray-600 mt-1 dark:text-gray-300">
                Available for use in video generation
              </p>
            </div>
            <button
              onClick={loadActions}
              disabled={loading}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm dark:text-blue-300 dark:hover:text-blue-200"
            >
              {loading ? "Loading..." : "🔄 Refresh"}
            </button>
          </div>
        </div>

        {/* Actions Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-300"></div>
            <p className="text-gray-600 mt-4 dark:text-gray-300">
              Loading actions...
            </p>
          </div>
        ) : actions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center dark:bg-gray-900 dark:border-gray-800">
            <p className="text-gray-600 mb-4 dark:text-gray-300">
              No actions found. Seed starter actions or create custom ones!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actions.map((action) => (
              <div
                key={action.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition dark:bg-gray-900 dark:border-gray-800"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-xl">🎭</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">
                        {action.name}
                      </h3>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditModal(action)}
                      className="p-1.5 rounded-md text-gray-500 hover:text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:text-gray-300 dark:hover:text-blue-200 dark:hover:bg-blue-950/30"
                      title="Edit action"
                      aria-label="Edit action"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteAction(action.id)}
                      className="p-1.5 rounded-md text-gray-500 hover:text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/40 dark:text-gray-300 dark:hover:text-red-300 dark:hover:bg-red-950/30"
                      title="Delete action"
                      aria-label="Delete action"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-700 mb-3 line-clamp-2 dark:text-gray-300">
                  {action.description}
                </p>

                {/* Sample Videos */}
                {Array.isArray(action.sample_videos) &&
                  action.sample_videos.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-600 dark:text-gray-300 font-medium mb-1">
                        Sample Videos ({action.sample_videos.length}):
                      </div>
                      <div className="flex gap-2 overflow-x-auto">
                        {action.sample_videos
                          .slice(0, 2)
                          .map((videoUrl, idx) => (
                            <div
                              key={idx}
                              className="flex-shrink-0 w-16 h-24 rounded overflow-hidden border border-gray-300 dark:border-gray-800 bg-black"
                              title="Sample generated video"
                            >
                              <video
                                className="w-full h-full object-cover"
                                controls
                                preload="metadata"
                                playsInline
                              >
                                <source src={videoUrl} type="video/mp4" />
                              </video>
                            </div>
                          ))}
                        {action.sample_videos.length > 2 && (
                          <div className="flex-shrink-0 w-16 h-24 rounded bg-gray-100 border border-gray-300 dark:bg-gray-900 dark:border-gray-800 flex items-center justify-center">
                            <span className="text-xs text-gray-600 dark:text-gray-200 font-medium">
                              +{action.sample_videos.length - 2}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Pose Variations */}
                {action.pose_variations &&
                  action.pose_variations.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1 dark:text-gray-200">
                        Pose Variations:
                      </div>
                      <div className="space-y-1">
                        {action.pose_variations.slice(0, 2).map((pose, idx) => (
                          <div
                            key={idx}
                            className="text-xs text-gray-600 pl-2 border-l-2 border-blue-200 dark:text-gray-300 dark:border-blue-900/50"
                          >
                            •{" "}
                            {pose.length > 60
                              ? pose.substring(0, 60) + "..."
                              : pose}
                          </div>
                        ))}
                        {action.pose_variations.length > 2 && (
                          <div className="text-xs text-gray-500 pl-2 dark:text-gray-400">
                            +{action.pose_variations.length - 2} more...
                          </div>
                        )}
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
                  <div className="flex flex-wrap gap-1">
                    {action.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full dark:bg-blue-950/40 dark:text-blue-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Actions Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full dark:bg-gray-900">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  ✨ Generate Actions with AI
                </h3>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl dark:hover:text-gray-200"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">
                    Keywords *
                  </label>
                  <input
                    type="text"
                    value={generateKeywords}
                    onChange={(e) => setGenerateKeywords(e.target.value)}
                    placeholder="e.g., dancing, playing guitar, exercising"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                    Separate multiple keywords with commas
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">
                    Number of Actions
                  </label>
                  <select
                    value={generateCount}
                    onChange={(e) => setGenerateCount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100"
                  >
                    <option value={1}>1 action</option>
                    <option value={2}>2 actions</option>
                    <option value={3}>3 actions</option>
                    <option value={5}>5 actions</option>
                  </select>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Cost: ~$0.01-0.03 per action
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3 dark:border-gray-800 dark:bg-gray-950">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateActions}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden dark:bg-gray-900">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {showCreateModal ? "Create New Action" : "Edit Action"}
                </h3>
                <button
                  onClick={handleCloseModals}
                  className="text-gray-400 hover:text-gray-600 text-2xl dark:hover:text-gray-200"
                >
                  ×
                </button>
              </div>
            </div>

            <div
              className="p-6 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 180px)" }}
            >
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
                    Action Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Dancing, Eating, Walking"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe the action and context..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500"
                  />
                </div>

                {/* Pose Variations */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
                    Pose Variations
                  </label>
                  <div className="space-y-2">
                    {formData.pose_variations.map((pose, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={pose}
                          onChange={(e) =>
                            handlePoseVariationChange(idx, e.target.value)
                          }
                          placeholder="e.g., sitting with hands on table, gazing thoughtfully"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500"
                        />
                        {formData.pose_variations.length > 1 && (
                          <button
                            onClick={() => handleRemovePoseVariation(idx)}
                            className="px-3 py-2 text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={handleAddPoseVariation}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
                    >
                      + Add Pose Variation
                    </button>
                  </div>
                </div>

                {/* Expression */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
                    Expression
                  </label>
                  <input
                    type="text"
                    value={formData.expression}
                    onChange={(e) =>
                      setFormData({ ...formData, expression: e.target.value })
                    }
                    placeholder="e.g., focused, contemplative, joyful"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    placeholder="e.g., active, outdoor, social"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3 dark:border-gray-800 dark:bg-gray-950">
              <button
                onClick={handleCloseModals}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={
                  showCreateModal ? handleCreateAction : handleUpdateAction
                }
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700"
              >
                {showCreateModal ? "Create" : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
