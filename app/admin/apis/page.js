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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          API Configuration
        </h1>
        <p className="admin-muted">
          Manage API keys and integrations for your video generation workflow
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 admin-muted">
          Loading API status...
        </div>
      ) : (
        <div className="space-y-4">
          {apis.map((api) => {
            const isConfigured = apiStatus[api.statusKey];
            return (
              <div
                key={api.name}
                className="admin-card-solid p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {api.name}
                      </h2>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          isConfigured
                            ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-200"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {isConfigured ? "✓ Configured" : "Not Configured"}
                      </span>
                    </div>
                    <p className="admin-muted mb-4">{api.description}</p>

                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                          Environment Variable:
                        </span>
                        <code className="ml-2 px-2 py-1 bg-gray-100 rounded-lg text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                          {api.envVar}
                        </code>
                      </div>

                      <div className="flex items-center gap-4 mt-4">
                        <a
                          href={api.keyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-300 dark:hover:text-blue-200"
                        >
                          🔑 Get API Key →
                        </a>
                        <a
                          href={api.docs}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-600 hover:text-gray-800 hover:underline dark:text-gray-300 dark:hover:text-gray-100"
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
      <div className="admin-card p-6 border-blue-200 dark:border-blue-900/40">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 dark:text-gray-100">
          Setup Instructions
        </h3>
        <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
          <li>
            <span className="font-medium">1.</span> Click &quot;Get API
            Key&quot; to obtain keys from each provider
          </li>
          <li>
            <span className="font-medium">2.</span> Add the keys to your{" "}
            <code className="px-2 py-1 bg-white rounded-lg dark:bg-gray-950">
              .env.local
            </code>{" "}
            file
          </li>
          <li>
            <span className="font-medium">3.</span> Restart your development
            server for changes to take effect
          </li>
        </ol>

        <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
          <p className="text-xs text-gray-600 mb-2 font-medium dark:text-gray-300">
            Example .env.local:
          </p>
          <pre className="text-xs text-gray-800 font-mono dark:text-gray-100">
            {`ANTHROPIC_API_KEY=your_claude_api_key_here
SHOTSTACK_API_KEY=your_shotstack_api_key_here
FAL_API_KEY=your_fal_api_key_here`}
          </pre>
        </div>
      </div>
    </div>
  );
}
