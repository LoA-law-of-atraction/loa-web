"use client";

import { useState, useEffect } from "react";

export default function SetupPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch("/api/setup/characters");
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const createCharacters = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/setup/characters", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        alert(`Success! Created ${data.characters.length} characters.`);
        checkStatus();
      } else {
        setError(data.message || "Failed to create characters");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteCharacters = async () => {
    if (!confirm("Are you sure you want to delete all characters?")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/setup/characters", {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        checkStatus();
      } else {
        setError(data.message || "Failed to delete characters");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Setup & Configuration</h1>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 font-medium">Error:</p>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Characters Setup */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Characters Setup</h2>

        {status && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Current Status:</p>
                <p className="text-lg font-medium">
                  {status.count === 0 ? (
                    <span className="text-yellow-600">No characters found</span>
                  ) : (
                    <span className="text-green-600">
                      {status.count} characters configured
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={checkStatus}
                className="text-sm text-blue-600 hover:underline"
              >
                Refresh
              </button>
            </div>

            {status.count > 0 && (
              <div className="bg-gray-50 rounded p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Characters:
                </p>
                <div className="space-y-2">
                  {status.characters.map((char) => (
                    <div
                      key={char.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div>
                        <span className="font-medium">{char.name || "Unnamed"}</span>
                        <span className="text-gray-500 ml-2">
                          {char.gender} • {char.age_range}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        ID: {char.id.slice(0, 8)}...
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={createCharacters}
            disabled={loading || (status && status.count > 0)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Sample Characters"}
          </button>

          {status && status.count > 0 && (
            <button
              onClick={deleteCharacters}
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Deleting..." : "Delete All Characters"}
            </button>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p className="font-medium mb-2">Sample characters include:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-500">
            <li>Professional Woman (30s)</li>
            <li>Professional Man (30s)</li>
            <li>Young Woman (20s)</li>
            <li>Mature Man (40s)</li>
          </ul>
          <p className="mt-3 text-xs">
            Note: Characters use default ElevenLabs voices. You can customize
            voice IDs in Firestore after creation.
          </p>
        </div>
      </div>

      {/* Firebase Status */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Firebase Status</h2>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Service Account:</span>
            <span
              className={`font-medium ${
                process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
                ? "Configured"
                : "Not configured"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600">Storage Bucket:</span>
            <span className="font-mono text-xs text-gray-800">
              {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "Not set"}
            </span>
          </div>
        </div>

        {!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ Firebase is not configured. Add FIREBASE_SERVICE_ACCOUNT_KEY
              to your .env file.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
