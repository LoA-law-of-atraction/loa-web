"use client";

import { useEffect, useState } from "react";

export default function BudgetPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [elevenLabsInfo, setElevenLabsInfo] = useState(null);

  useEffect(() => {
    loadProjects();
    loadElevenLabsInfo();
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

  const loadElevenLabsInfo = async () => {
    try {
      const response = await fetch("/api/elevenlabs/user-info");
      const result = await response.json();
      if (result.success) {
        setElevenLabsInfo(result);
      }
    } catch (error) {
      console.error("Failed to load ElevenLabs info:", error);
    }
  };

  const calculateProjectTotal = (costs) => {
    if (!costs) return 0;
    return (
      (costs.claude || 0) +
      (costs.elevenlabs || 0) +
      (costs.fal_images || 0) +
      (costs.fal_videos || 0) +
      (costs.shotstack || 0)
    );
  };

  const calculateGrandTotal = () => {
    return projects.reduce((total, project) => {
      return total + calculateProjectTotal(project.costs);
    }, 0);
  };

  const calculateTotalsByAPI = () => {
    return projects.reduce(
      (totals, project) => {
        if (project.costs) {
          totals.claude += project.costs.claude || 0;
          totals.elevenlabs += project.costs.elevenlabs || 0;
          totals.fal_images += project.costs.fal_images || 0;
          totals.fal_videos += project.costs.fal_videos || 0;
          totals.shotstack += project.costs.shotstack || 0;
        }
        return totals;
      },
      { claude: 0, elevenlabs: 0, fal_images: 0, fal_videos: 0, shotstack: 0 },
    );
  };

  const apiTotals = calculateTotalsByAPI();
  const grandTotal = calculateGrandTotal();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Budget & Cost Tracking</h1>
        <p className="admin-muted">
          Monitor your API usage and costs across all projects
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Spent */}
        <div className="admin-card-solid p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Total Spent
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ${grandTotal.toFixed(4)}
              </p>
              <p className="text-xs admin-muted mt-1">
                Across {projects.length} projects
              </p>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center dark:bg-green-900/30 dark:text-green-200">
              💰
            </div>
          </div>
        </div>

        {/* ElevenLabs Credits */}
        <div className="admin-card-solid p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                ElevenLabs Credits
              </h3>
              {elevenLabsInfo ? (
                <>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {elevenLabsInfo.characters_remaining?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs admin-muted mt-1">
                    of {elevenLabsInfo.character_limit?.toLocaleString()} chars
                    remaining ({elevenLabsInfo.tier})
                  </p>
                </>
              ) : (
                <p className="text-sm admin-muted">Loading...</p>
              )}
            </div>
            <div className="h-10 w-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center dark:bg-purple-900/30 dark:text-purple-200">
              🎤
            </div>
          </div>
        </div>

        {/* Average per Project */}
        <div className="admin-card-solid p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Avg per Project
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                $
                {projects.length > 0
                  ? (grandTotal / projects.length).toFixed(4)
                  : "0.0000"}
              </p>
              <p className="text-xs admin-muted mt-1">Average cost per video</p>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center dark:bg-blue-900/30 dark:text-blue-200">
              📊
            </div>
          </div>
        </div>
      </div>

      {/* API Breakdown */}
      <div className="admin-card-solid p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Cost Breakdown by API</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="admin-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🤖</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Claude AI
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${apiTotals.claude.toFixed(4)}
            </p>
            <p className="text-xs admin-muted mt-1">Script generation</p>
          </div>

          <div className="admin-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🎤</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                ElevenLabs
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${apiTotals.elevenlabs.toFixed(4)}
            </p>
            <p className="text-xs admin-muted mt-1">Voiceovers</p>
          </div>

          <div className="admin-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🖼️</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                FAL Images
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${apiTotals.fal_images.toFixed(4)}
            </p>
            <p className="text-xs admin-muted mt-1">Image generation</p>
          </div>

          <div className="admin-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🎬</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                FAL Videos
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${apiTotals.fal_videos.toFixed(4)}
            </p>
            <p className="text-xs admin-muted mt-1">Video generation</p>
          </div>

          <div className="admin-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📹</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Shotstack
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${apiTotals.shotstack.toFixed(4)}
            </p>
            <p className="text-xs admin-muted mt-1">Final assembly</p>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="admin-card-solid overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-950/60">
          <h2 className="text-xl font-bold">Projects Cost Details</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No projects yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead className="admin-thead">
                <tr>
                  <th className="admin-th">Project</th>
                  <th className="admin-th text-right">Claude</th>
                  <th className="admin-th text-right">ElevenLabs</th>
                  <th className="admin-th text-right">FAL Images</th>
                  <th className="admin-th text-right">FAL Videos</th>
                  <th className="admin-th text-right">Shotstack</th>
                  <th className="admin-th text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {projects.map((project) => {
                  const total = calculateProjectTotal(project.costs);
                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/60"
                    >
                      <td className="admin-td">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {project.project_name || "Untitled"}
                          </span>
                          <span className="text-xs admin-muted">
                            {project.topic}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(project.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="admin-td text-right">
                        ${(project.costs?.claude || 0).toFixed(4)}
                      </td>
                      <td className="admin-td text-right">
                        ${(project.costs?.elevenlabs || 0).toFixed(4)}
                      </td>
                      <td className="admin-td text-right">
                        ${(project.costs?.fal_images || 0).toFixed(4)}
                      </td>
                      <td className="admin-td text-right">
                        ${(project.costs?.fal_videos || 0).toFixed(4)}
                      </td>
                      <td className="admin-td text-right">
                        ${(project.costs?.shotstack || 0).toFixed(4)}
                      </td>
                      <td className="admin-td text-right font-semibold text-gray-900 dark:text-white">
                        ${total.toFixed(4)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50/80 border-t-2 border-gray-200 dark:bg-gray-950/60 dark:border-gray-800">
                <tr>
                  <td className="admin-td text-sm font-bold text-gray-900 dark:text-white">
                    TOTAL
                  </td>
                  <td className="admin-td text-right text-sm font-bold text-gray-900 dark:text-white">
                    ${apiTotals.claude.toFixed(4)}
                  </td>
                  <td className="admin-td text-right text-sm font-bold text-gray-900 dark:text-white">
                    ${apiTotals.elevenlabs.toFixed(4)}
                  </td>
                  <td className="admin-td text-right text-sm font-bold text-gray-900 dark:text-white">
                    ${apiTotals.fal_images.toFixed(4)}
                  </td>
                  <td className="admin-td text-right text-sm font-bold text-gray-900 dark:text-white">
                    ${apiTotals.fal_videos.toFixed(4)}
                  </td>
                  <td className="admin-td text-right text-sm font-bold text-gray-900 dark:text-white">
                    ${apiTotals.shotstack.toFixed(4)}
                  </td>
                  <td className="admin-td text-right text-sm font-bold text-green-700 dark:text-green-300">
                    ${grandTotal.toFixed(4)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-6 admin-card p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Note:</strong> Costs are estimates based on current API
          pricing. Actual costs may vary based on your subscription plan and
          usage.
        </p>
      </div>
    </div>
  );
}
