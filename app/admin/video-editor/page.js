"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function StatusBadge({ status }) {
  const statusConfig = {
    pending_approval: {
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      text: "text-yellow-800 dark:text-yellow-200",
      label: "Pending Approval",
    },
    generating_videos: {
      bg: "bg-blue-100 dark:bg-blue-900/30",
      text: "text-blue-800 dark:text-blue-200",
      label: "Generating Videos...",
    },
    rendering: {
      bg: "bg-purple-100 dark:bg-purple-900/30",
      text: "text-purple-800 dark:text-purple-200",
      label: "Rendering Final Video...",
    },
    completed: {
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-800 dark:text-green-200",
      label: "✓ Completed",
    },
    failed: {
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-800 dark:text-red-200",
      label: "Failed",
    },
  };

  const config = statusConfig[status] || statusConfig.pending_approval;

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}

function VideoEditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session");

  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState(null);
  const [regenerating, setRegenerating] = useState({});

  useEffect(() => {
    if (sessionId) {
      loadSession();
    } else {
      setError("No session ID provided");
      setLoading(false);
    }
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/video-editor?session=${sessionId}`);
      const result = await response.json();

      if (result.success) {
        setSessionData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to load session: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sceneId) => {
    try {
      const response = await fetch("/api/video-editor", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          scene_id: sceneId,
          approved: true,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSessionData(result.data);
      }
    } catch (err) {
      console.error("Failed to approve scene:", err);
    }
  };

  const handleRegenerate = async (sceneId) => {
    setRegenerating({ ...regenerating, [sceneId]: true });

    try {
      const response = await fetch("/api/video-editor/regenerate-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          scene_id: sceneId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSessionData(result.data);
      } else {
        alert("Failed to regenerate: " + result.error);
      }
    } catch (err) {
      console.error("Failed to regenerate scene:", err);
      alert("Failed to regenerate scene: " + err.message);
    } finally {
      setRegenerating({ ...regenerating, [sceneId]: false });
    }
  };

  const handleFinalApproval = async () => {
    const allApproved = sessionData.scenes.every((s) => s.approved);

    if (!allApproved) {
      alert("Please approve all scenes before generating the final video.");
      return;
    }

    const confirmed = confirm(
      "This will generate 4 videos and assemble the final video. This may take 5-10 minutes. Continue?",
    );

    if (!confirmed) return;

    try {
      const response = await fetch("/api/video-editor/generate-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(
          "Video generation started! Refresh the page in a few minutes to check the status.",
        );
        loadSession(); // Reload to show updated status
      } else {
        alert("Failed to start video generation: " + result.error);
      }
    } catch (err) {
      console.error("Failed to start video generation:", err);
      alert("Failed to start video generation: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="admin-muted">Loading video editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/admin")}
            className="admin-btn-secondary"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return null;
  }

  const allApproved = sessionData.scenes.every((s) => s.approved);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Video Editor
          </h1>
          <StatusBadge status={sessionData.status} />
        </div>
        <p className="admin-muted">
          Topic: <span className="font-medium">{sessionData.topic}</span>
        </p>
        <p className="text-sm admin-muted mt-1">
          Session ID: {sessionData.session_id}
        </p>
        {sessionData.final_video_url && (
          <a
            href={sessionData.final_video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn-primary mt-3 bg-green-600 hover:bg-green-700"
          >
            <span>📹</span>
            Download Final Video
          </a>
        )}
      </div>

      {/* Voiceover Player */}
      {sessionData.voiceover_url && (
        <div className="admin-card-solid p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Voiceover Audio
          </h2>
          <audio controls className="w-full mb-4">
            <source src={sessionData.voiceover_url} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
          <div className="text-sm text-gray-700 dark:text-gray-200 bg-gray-50/80 dark:bg-gray-950/60 p-4 rounded-xl">
            <p className="font-medium mb-2">Full Script:</p>
            <p>{sessionData.script}</p>
          </div>
        </div>
      )}

      {/* Scenes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {sessionData.scenes.map((scene) => (
          <div
            key={scene.id}
            className={`admin-card-solid border-2 p-6 ${scene.approved ? "border-green-500/80" : "border-gray-200 dark:border-gray-800"}`}
          >
            {/* Scene Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Scene {scene.id}
              </h3>
              <span className="text-sm admin-muted">{scene.duration}</span>
            </div>

            {/* Image Preview */}
            <div className="aspect-[9/16] bg-gray-100 dark:bg-gray-800 rounded-xl mb-4 overflow-hidden">
              {scene.image_url ? (
                <img
                  src={scene.image_url}
                  alt={`Scene ${scene.id}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  {regenerating[scene.id] ? (
                    <div>
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                      <p className="text-sm">Generating...</p>
                    </div>
                  ) : (
                    <p className="text-sm">No image yet</p>
                  )}
                </div>
              )}
            </div>

            {/* Voiceover Text */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Voiceover:
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-200 bg-gray-50/80 dark:bg-gray-950/60 p-3 rounded-xl">
                {scene.voiceover}
              </p>
            </div>

            {/* Duration */}
            <div className="flex gap-4 mb-4 text-sm admin-muted">
              <span>⏱ {scene.duration}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {scene.approved ? (
                <div className="flex-1 bg-green-50 text-green-700 px-4 py-2 rounded-xl text-center font-medium dark:bg-green-900/30 dark:text-green-200">
                  ✓ Approved
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleApprove(scene.id)}
                    disabled={!scene.image_url || regenerating[scene.id]}
                    className="admin-btn-primary flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRegenerate(scene.id)}
                    disabled={regenerating[scene.id]}
                    className="admin-btn-secondary flex-1"
                  >
                    {regenerating[scene.id] ? "Regenerating..." : "Regenerate"}
                  </button>
                </>
              )}
            </div>

            {/* Prompts (Collapsible) */}
            <details className="mt-4">
              <summary className="text-sm admin-muted cursor-pointer hover:text-gray-900 dark:hover:text-white">
                View Prompts
              </summary>
              <div className="mt-2 space-y-2 text-xs text-gray-700 dark:text-gray-200">
                <div>
                  <p className="font-medium">Image Prompt:</p>
                  <p className="bg-gray-50/80 dark:bg-gray-950/60 p-2 rounded-xl">
                    {scene.image_prompt}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Motion Prompt:</p>
                  <p className="bg-gray-50/80 dark:bg-gray-950/60 p-2 rounded-xl">
                    {scene.motion_prompt}
                  </p>
                </div>
              </div>
            </details>
          </div>
        ))}
      </div>

      {/* Final Approval Button */}
      <div className="admin-card-solid p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Ready to Generate Final Video?
            </h3>
            <p className="text-sm admin-muted">
              {allApproved
                ? "All scenes approved! Click to generate the final video."
                : `${sessionData.scenes.filter((s) => s.approved).length} of ${sessionData.scenes.length} scenes approved.`}
            </p>
          </div>
          <button
            onClick={handleFinalApproval}
            disabled={!allApproved}
            className="admin-btn-primary px-6 py-3"
          >
            Generate Final Video
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VideoEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="admin-muted">Loading video editor...</p>
          </div>
        </div>
      }
    >
      <VideoEditorContent />
    </Suspense>
  );
}
