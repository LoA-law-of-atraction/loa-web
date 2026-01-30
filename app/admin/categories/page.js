"use client";

import { useState, useEffect } from "react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadCategories(), loadTopics()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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

  const getCategoryUsageCount = (categoryName) => {
    return topics.filter((topic) => {
      if (Array.isArray(topic.categories)) {
        return topic.categories.includes(categoryName);
      }
      return topic.category === categoryName;
    }).length;
  };

  const handleAdd = () => {
    setShowAddForm(true);
    setEditingId(null);
    setFormData({ name: "" });
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setFormData({ name: category.name });
    setShowAddForm(false);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!formData.name.trim()) {
        setError("Category name is required");
        return;
      }

      const url = editingId
        ? `/api/topic-categories/${editingId}`
        : "/api/topic-categories";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        await loadCategories();
        setEditingId(null);
        setShowAddForm(false);
        setFormData({ name: "" });
      } else {
        setError(data.error || "Failed to save category");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    const usageCount = getCategoryUsageCount(name);

    if (usageCount > 0) {
      if (
        !confirm(
          `This category is used by ${usageCount} topic(s). Are you sure you want to delete it? Topics will keep the category name but it won't appear in suggestions.`
        )
      ) {
        return;
      }
    } else if (!confirm(`Delete "${name}" category?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/topic-categories/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        await loadCategories();
      } else {
        setError(data.error || "Failed to delete category");
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
    setFormData({ name: "" });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Category Management</h1>
          <p className="text-gray-600 mt-1">
            Manage topic categories for video generation
          </p>
        </div>
        <button
          onClick={handleAdd}
          disabled={loading || showAddForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Add Category
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
            {editingId ? "Edit Category" : "Add New Category"}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Money Manifestation"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={loading || !formData.name.trim()}
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

      {/* Categories List */}
      {!showAddForm && !editingId && (
        <>
          {loading && categories.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : categories.length === 0 ? (
            <div className="bg-white border rounded-lg p-12 text-center">
              <p className="text-gray-500 mb-4">No categories found</p>
              <button
                onClick={handleAdd}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Add Your First Category
              </button>
            </div>
          ) : (
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">
                      Category Name
                    </th>
                    <th className="text-center px-6 py-3 text-sm font-semibold text-gray-700">
                      Used By Topics
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
                  {categories.map((category) => {
                    const usageCount = getCategoryUsageCount(category.name);
                    return (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {category.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm ${
                              usageCount > 0
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {usageCount} {usageCount === 1 ? "topic" : "topics"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-500">
                          {category.created_at
                            ? new Date(category.created_at).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(category)}
                              disabled={loading}
                              className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 disabled:opacity-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(category.id, category.name)
                              }
                              disabled={loading}
                              className="text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Category Count */}
          {categories.length > 0 && (
            <div className="mt-6 text-center text-sm text-gray-500">
              Total: {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
            </div>
          )}
        </>
      )}
    </div>
  );
}
