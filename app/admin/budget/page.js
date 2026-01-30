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
      { claude: 0, elevenlabs: 0, fal_images: 0, fal_videos: 0, shotstack: 0 }
    );
  };

  const apiTotals = calculateTotalsByAPI();
  const grandTotal = calculateGrandTotal();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Budget & Cost Tracking</h1>
        <p className="text-gray-600">
          Monitor your API usage and costs across all projects
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Spent */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-900">Total Spent</h3>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-green-700">${grandTotal.toFixed(4)}</p>
          <p className="text-xs text-green-600 mt-1">Across {projects.length} projects</p>
        </div>

        {/* ElevenLabs Credits */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-900">ElevenLabs Credits</h3>
            <span className="text-2xl">🎤</span>
          </div>
          {elevenLabsInfo ? (
            <>
              <p className="text-3xl font-bold text-purple-700">
                {elevenLabsInfo.characters_remaining?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                of {elevenLabsInfo.character_limit?.toLocaleString()} chars remaining ({elevenLabsInfo.tier})
              </p>
            </>
          ) : (
            <p className="text-sm text-purple-600">Loading...</p>
          )}
        </div>

        {/* Average per Project */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-900">Avg per Project</h3>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-3xl font-bold text-blue-700">
            ${projects.length > 0 ? (grandTotal / projects.length).toFixed(4) : "0.0000"}
          </p>
          <p className="text-xs text-blue-600 mt-1">Average cost per video</p>
        </div>
      </div>

      {/* API Breakdown */}
      <div className="bg-white border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Cost Breakdown by API</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🤖</span>
              <span className="text-sm font-medium text-gray-700">Claude AI</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">${apiTotals.claude.toFixed(4)}</p>
            <p className="text-xs text-gray-500 mt-1">Script generation</p>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🎤</span>
              <span className="text-sm font-medium text-gray-700">ElevenLabs</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">${apiTotals.elevenlabs.toFixed(4)}</p>
            <p className="text-xs text-gray-500 mt-1">Voiceovers</p>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🖼️</span>
              <span className="text-sm font-medium text-gray-700">FAL Images</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">${apiTotals.fal_images.toFixed(4)}</p>
            <p className="text-xs text-gray-500 mt-1">Image generation</p>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🎬</span>
              <span className="text-sm font-medium text-gray-700">FAL Videos</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">${apiTotals.fal_videos.toFixed(4)}</p>
            <p className="text-xs text-gray-500 mt-1">Video generation</p>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📹</span>
              <span className="text-sm font-medium text-gray-700">Shotstack</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">${apiTotals.shotstack.toFixed(4)}</p>
            <p className="text-xs text-gray-500 mt-1">Final assembly</p>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-xl font-bold">Projects Cost Details</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No projects yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Claude
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ElevenLabs
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    FAL Images
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    FAL Videos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shotstack
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project) => {
                  const total = calculateProjectTotal(project.costs);
                  return (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {project.project_name || "Untitled"}
                          </span>
                          <span className="text-xs text-gray-500">{project.topic}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(project.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700">
                        ${(project.costs?.claude || 0).toFixed(4)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700">
                        ${(project.costs?.elevenlabs || 0).toFixed(4)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700">
                        ${(project.costs?.fal_images || 0).toFixed(4)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700">
                        ${(project.costs?.fal_videos || 0).toFixed(4)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700">
                        ${(project.costs?.shotstack || 0).toFixed(4)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        ${total.toFixed(4)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2">
                <tr>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">TOTAL</td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                    ${apiTotals.claude.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                    ${apiTotals.elevenlabs.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                    ${apiTotals.fal_images.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                    ${apiTotals.fal_videos.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                    ${apiTotals.shotstack.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                    ${grandTotal.toFixed(4)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Note:</strong> Costs are estimates based on current API pricing. Actual costs may vary based on your subscription plan and usage.
        </p>
      </div>
    </div>
  );
}
