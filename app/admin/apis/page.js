"use client";

import { useEffect, useState } from "react";

export default function APIsPage() {
  const [apiStatus, setApiStatus] = useState({
    anthropic: false,
    shotstack: false,
    fal: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApiStatus();
  }, []);

  const fetchApiStatus = async () => {
    try {
      const response = await fetch("/api/config-status");
      const data = await response.json();
      if (data.success) {
        setApiStatus(data.status);
      }
    } catch (error) {
      console.error("Failed to fetch API status:", error);
    } finally {
      setLoading(false);
    }
  };

  const apis = [
    {
      name: "Claude AI",
      description: "AI language model for topic generation and script writing",
      statusKey: "anthropic",
      keyUrl: "https://platform.claude.com/settings/keys",
      envVar: "ANTHROPIC_API_KEY",
      docs: "https://docs.anthropic.com/",
    },
    {
      name: "Shotstack",
      description: "Video editing and rendering API",
      statusKey: "shotstack",
      keyUrl: "https://dashboard.shotstack.io/keys",
      envVar: "SHOTSTACK_API_KEY",
      docs: "https://shotstack.io/docs/",
    },
    {
      name: "FAL AI",
      description: "AI image and video generation",
      statusKey: "fal",
      keyUrl: "https://fal.ai/dashboard/keys",
      envVar: "FAL_API_KEY",
      docs: "https://fal.ai/docs",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Configuration</h1>
        <p className="text-gray-600">
          Manage API keys and integrations for your video generation workflow
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          Loading API status...
        </div>
      ) : (
        <div className="space-y-4">
          {apis.map((api) => {
            const isConfigured = apiStatus[api.statusKey];
            return (
              <div
                key={api.name}
                className="bg-white border rounded-lg p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {api.name}
                      </h2>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          isConfigured
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {isConfigured ? "✓ Configured" : "Not Configured"}
                      </span>
                    </div>
                <p className="text-gray-600 mb-4">{api.description}</p>

                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">
                      Environment Variable:
                    </span>
                    <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-gray-800">
                      {api.envVar}
                    </code>
                  </div>

                  <div className="flex items-center gap-4 mt-4">
                    <a
                      href={api.keyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      🔑 Get API Key →
                    </a>
                    <a
                      href={api.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-600 hover:text-gray-800 hover:underline"
                    >
                      📚 Documentation →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
            );
          })}
        </div>
      )}

      {/* Setup Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Setup Instructions
        </h3>
        <ol className="space-y-2 text-sm text-gray-700">
          <li>
            <span className="font-medium">1.</span> Click "Get API Key" to obtain keys from each provider
          </li>
          <li>
            <span className="font-medium">2.</span> Add the keys to your{" "}
            <code className="px-2 py-1 bg-white rounded">.env.local</code> file
          </li>
          <li>
            <span className="font-medium">3.</span> Restart your development server for changes to take effect
          </li>
        </ol>

        <div className="mt-4 p-4 bg-white rounded border">
          <p className="text-xs text-gray-600 mb-2 font-medium">
            Example .env.local:
          </p>
          <pre className="text-xs text-gray-800 font-mono">
{`ANTHROPIC_API_KEY=your_claude_api_key_here
SHOTSTACK_API_KEY=your_shotstack_api_key_here
FAL_API_KEY=your_fal_api_key_here`}
          </pre>
        </div>
      </div>
    </div>
  );
}
