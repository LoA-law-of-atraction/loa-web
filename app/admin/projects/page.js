"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/admin/Toast";
import { Film, Pencil, Trash2, Wallet } from "lucide-react";

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
    if (!(await confirm("Are you sure you want to delete this project?"))) {
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
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Video Projects</h1>
          <div className="flex gap-2">
            <a href="/admin/video-generator" className="admin-btn-secondary">
              <Film size={16} />
              Generator
            </a>
            <a href="/admin/budget" className="admin-btn-secondary">
              <Wallet size={16} />
              Budget
            </a>
          </div>
        </div>
        <p className="admin-muted">
          View and manage your video projects with scripts and scenes
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 admin-muted">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="admin-card-solid p-12 text-center">
          <p className="admin-muted mb-4">No projects created yet</p>
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
              className="admin-card-solid hover:shadow-md transition-shadow"
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
                              onChange={(e) =>
                                setEditingProjectName(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveProjectName(project.id);
                                } else if (e.key === "Escape") {
                                  handleCancelEditingName();
                                }
                              }}
                              className="admin-input py-1 text-sm font-semibold"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveProjectName(project.id)}
                              className="admin-btn-primary px-3 py-1 text-xs"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEditingName}
                              className="admin-btn-secondary px-3 py-1 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              handleStartEditingName(
                                project.id,
                                project.project_name,
                              )
                            }
                            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800 bg-gray-100 px-3 py-1 rounded-xl hover:bg-gray-200 transition dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                          >
                            {project.project_name}
                            <Pencil size={14} className="opacity-70" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Topic */}
                    <h2 className="text-lg font-semibold text-gray-900 mb-2 dark:text-gray-100">
                      {project.topic || "Untitled"}
                    </h2>

                    {/* Character & Dates */}
                    <div className="flex items-center gap-4 text-sm admin-muted mb-3">
                      <span>
                        👤 {project.character?.name || "No character"}
                      </span>
                      <span>
                        📅 Created:{" "}
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                      {project.updated_at && (
                        <span>
                          🔄 Updated:{" "}
                          {new Date(project.updated_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {project.categories && project.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {project.categories.map((cat, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-xl dark:bg-blue-900/30 dark:text-blue-200"
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
                      className="admin-btn-primary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="admin-btn-danger"
                    >
                      <Trash2 size={16} />
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
