"use client";

import { useState, useEffect } from "react";

export default function TopicsPage() {
  const [topics, setTopics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ topic: "", categories: [] });
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryInputFocused, setCategoryInputFocused] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadTopics(), loadCategories()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTopics = async () => {
    try {
      const response = await fetch("/api/topics");
      const data = await response.json();
      if (data.success) {
        setTopics(data.topics);
      }
    } catch (err) {
      console.error("Failed to load topics:", err);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/topic-categories");
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const handleAdd = () => {
    setShowAddForm(true);
    setEditingId(null);
    setFormData({ topic: "", categories: [] });
  };

  const handleEdit = (topic) => {
    setEditingId(topic.id);
    setFormData({
      topic: topic.topic,
      categories: Array.isArray(topic.categories)
        ? topic.categories
        : topic.category
          ? [topic.category]
          : [],
    });
    setShowAddForm(false);
  };

  const handleAddCategory = async (categoryName) => {
    const trimmed = categoryName.trim();
    if (!trimmed || formData.categories.includes(trimmed)) {
      return;
    }

    setFormData({
      ...formData,
      categories: [...formData.categories, trimmed],
    });
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
          await loadCategories();
        }
      } catch (error) {
        console.error("Failed to save new category:", error);
      }
    }
  };

  const handleRemoveCategory = (categoryToRemove) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter((c) => c !== categoryToRemove),
    });
  };

  const handleCategoryKeyDown = (e) => {
    if (e.key === "Enter" && categoryInput.trim()) {
      e.preventDefault();
      handleAddCategory(categoryInput);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!formData.topic.trim()) {
        setError("Topic is required");
        return;
      }

      const url = editingId ? `/api/topics/${editingId}` : "/api/topics";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: formData.topic,
          categories: formData.categories,
          generated: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadTopics();
        setEditingId(null);
        setShowAddForm(false);
        setFormData({ topic: "", categories: [] });
      } else {
        setError(data.error || "Failed to save topic");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, topic) => {
    if (!confirm(`Delete "${topic}"?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/topics/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        await loadTopics();
      } else {
        setError(data.error || "Failed to delete topic");
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
    setFormData({ topic: "", categories: [] });
  };

  // Filter topics by category and status
  let filteredTopics = topics.filter((t) => {
    // Category filter
    const categoryMatch =
      filterCategory === "all" ||
      (Array.isArray(t.categories)
        ? t.categories.includes(filterCategory)
        : t.category === filterCategory);

    // Status filter
    const statusMatch =
      filterStatus === "all" ||
      (filterStatus === "unused" && !t.generated) ||
      (filterStatus === "used" && t.generated);

    return categoryMatch && statusMatch;
  });

  // Sort topics by timestamp
  filteredTopics = [...filteredTopics].sort((a, b) => {
    const dateA = new Date(a.created_at || 0);
    const dateB = new Date(b.created_at || 0);
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  const unusedTopics = filteredTopics.filter((t) => !t.generated);
  const usedTopics = filteredTopics.filter((t) => t.generated);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Topic Management
          </h1>
          <p className="admin-muted mt-1">
            Manage video topics for content generation
          </p>
        </div>
        <button
          onClick={handleAdd}
          disabled={loading || showAddForm}
          className="admin-btn-primary"
        >
          + Add Topic
        </button>
      </div>

      {/* Filter & Sort */}
      <div className="admin-card-solid p-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Category:
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            {filterCategory !== "all" && (
              <button
                onClick={() => setFilterCategory("all")}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Status:
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="admin-select"
            >
              <option value="all">All</option>
              <option value="unused">Unused</option>
              <option value="used">Used</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Sort by:
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="admin-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="admin-card-solid p-4">
          <p className="text-sm text-gray-600 mb-1 dark:text-gray-300">
            {filterCategory === "all" ? "Total Topics" : "Filtered Topics"}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {filteredTopics.length}
          </p>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-900/40 dark:bg-green-950/30">
          <p className="text-sm text-green-700 mb-1 dark:text-green-200">
            Unused
          </p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {unusedTopics.length}
          </p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/30">
          <p className="text-sm text-blue-700 mb-1 dark:text-blue-200">Used</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {usedTopics.length}
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/30">
          <p className="text-red-800 font-medium dark:text-red-200">Error:</p>
          <p className="text-red-700 text-sm dark:text-red-200/90">{error}</p>
        </div>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && (
        <div className="admin-card-solid p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {editingId ? "Edit Topic" : "Add New Topic"}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="admin-label mb-1">Topic *</label>
              <textarea
                value={formData.topic}
                onChange={(e) =>
                  setFormData({ ...formData, topic: e.target.value })
                }
                className="admin-input"
                placeholder="e.g., How I manifested my dream job in 30 days"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories (Tags)
              </label>

              {/* Selected Categories Display */}
              {formData.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.categories.map((cat) => (
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
                          !formData.categories.includes(cat.name) &&
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

              <p className="text-xs text-gray-500 mt-1">
                Press Enter or click suggestions to add categories
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={loading || !formData.topic.trim()}
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

      {/* Topics List */}
      {!showAddForm && !editingId && (
        <>
          {loading && topics.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : filteredTopics.length === 0 ? (
            <div className="bg-white border rounded-lg p-12 text-center">
              <p className="text-gray-500 mb-4">
                {topics.length === 0
                  ? "No topics found"
                  : `No topics found in "${filterCategory}" category`}
              </p>
              {topics.length === 0 ? (
                <button
                  onClick={handleAdd}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
                >
                  Add Your First Topic
                </button>
              ) : (
                <button
                  onClick={() => setFilterCategory("all")}
                  className="text-blue-600 hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">
                      Topic
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">
                      Categories
                    </th>
                    <th className="text-center px-6 py-3 text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-center px-6 py-3 text-sm font-semibold text-gray-700">
                      Created
                    </th>
                    <th className="text-right px-6 py-3 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTopics.map((topic) => (
                    <tr key={topic.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {topic.topic}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(topic.categories)
                            ? topic.categories.map((cat, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                                >
                                  {cat}
                                </span>
                              ))
                            : topic.category && (
                                <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  {topic.category}
                                </span>
                              )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {topic.generated ? (
                          <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            ✓ Used
                          </span>
                        ) : (
                          <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            Unused
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">
                        {topic.created_at
                          ? new Date(topic.created_at).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(topic)}
                            disabled={loading}
                            className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(topic.id, topic.topic)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
