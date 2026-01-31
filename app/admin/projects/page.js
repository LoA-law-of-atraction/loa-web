"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/admin/Toast";

export default function ProjectsPage() {
  const { alert, confirm } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingProjectName, setEditingProjectName] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      const result = await response.json();
      if (result.success) {
        setProjects(result.projects);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!await confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (result.success) {
        await loadProjects();
      } else {
        await alert("Failed to delete project: " + result.error, "error");
      }
    } catch (error) {
      await alert("Error deleting project: " + error.message, "error");
    }
  };

  const handleEditProject = (projectId) => {
    // Redirect to video generator with the project_id
    window.location.href = `/admin/video-generator?project_id=${projectId}`;
  };

  const handleStartEditingName = (projectId, currentName) => {
    setEditingProjectId(projectId);
    setEditingProjectName(currentName);
  };

  const handleCancelEditingName = () => {
    setEditingProjectId(null);
    setEditingProjectName("");
  };

  const handleSaveProjectName = async (projectId) => {
    if (!editingProjectName.trim()) {
      await alert("Project name cannot be empty", "warning");
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_name: editingProjectName }),
      });

      const result = await response.json();
      if (result.success) {
        await loadProjects();
        setEditingProjectId(null);
        setEditingProjectName("");
      } else {
        await alert("Failed to update project name: " + result.error, "error");
      }
    } catch (error) {
      await alert("Error updating project name: " + error.message, "error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Video Projects</h1>
          <div className="flex gap-2">
            <a
              href="/admin/video-generator"
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              🎬 Generator
            </a>
            <a
              href="/admin/budget"
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              💰 Budget
            </a>
          </div>
        </div>
        <p className="text-gray-600">
          View and manage your video projects with scripts and scenes
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="bg-gray-50 border rounded-lg p-12 text-center">
          <p className="text-gray-500 mb-4">No projects created yet</p>
          <a
            href="/admin/video-generator"
            className="text-blue-600 hover:underline"
          >
            Create your first project →
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="border rounded-lg bg-white hover:shadow-md transition"
            >
              {/* Project Header */}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Project Name */}
                    {project.project_name && (
                      <div className="mb-2">
                        {editingProjectId === project.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingProjectName}
                              onChange={(e) => setEditingProjectName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveProjectName(project.id);
                                } else if (e.key === "Escape") {
                                  handleCancelEditingName();
                                }
                              }}
                              className="text-sm font-semibold px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveProjectName(project.id)}
                              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEditingName}
                              className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEditingName(project.id, project.project_name)}
                            className="inline-block text-sm font-semibold text-gray-700 bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 transition"
                          >
                            {project.project_name} ✏️
                          </button>
                        )}
                      </div>
                    )}

                    {/* Topic */}
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      {project.topic || 'Untitled'}
                    </h2>

                    {/* Character & Dates */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span>👤 {project.character?.name || "No character"}</span>
                      <span>
                        📅 Created: {new Date(project.created_at).toLocaleDateString()}
                      </span>
                      {project.updated_at && (
                        <span>
                          🔄 Updated: {new Date(project.updated_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {project.categories && project.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {project.categories.map((cat, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditProject(project.id)}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
