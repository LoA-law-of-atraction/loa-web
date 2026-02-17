import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";
import { calculateShotstackCost } from "@/utils/costCalculator";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      project_id,
      session_id,
      edit: editFromStudio,
      videos,
      voiceover_url,
      scene_durations,
      background_music_url = null,
    } = body;

    if (!project_id || !session_id) {
      return NextResponse.json(
        { error: "Missing project_id or session_id" },
        { status: 400 },
      );
    }

    let shotstackPayload;

    if (editFromStudio?.timeline && editFromStudio?.output) {
      // Use edit from ShotStack Studio (timeline editor)
      // Convert proxy URLs back to original – ShotStack cloud fetches directly, needs real URLs
      const resolveProxyUrl = (src) => {
        if (!src || typeof src !== "string") return src;
        if (src.includes("/api/video-generator/proxy-media") && src.includes("url=")) {
          try {
            return decodeURIComponent(
              src.split("url=")[1]?.split("&")[0] || src,
            );
          } catch {}
        }
        return src;
      };

      const timeline = JSON.parse(JSON.stringify(editFromStudio.timeline));
      (timeline.tracks || []).forEach((track) => {
        (track.clips || []).forEach((clip) => {
          if (clip?.asset?.src) {
            clip.asset.src = resolveProxyUrl(clip.asset.src);
          }
        });
      });

      shotstackPayload = {
        timeline,
        output: {
          ...editFromStudio.output,
          resolution: editFromStudio.output.resolution || "hd",
        },
      };
      console.log("Assembling final video with Shotstack (from Studio edit)...");
    } else if (videos && voiceover_url) {
      // Build from videos + voiceover (legacy)
      if (!videos.length || !voiceover_url) {
        return NextResponse.json(
          { error: "Missing required fields: videos, voiceover_url" },
          { status: 400 },
        );
      }
      console.log("Assembling final video with Shotstack...");

      const clampDurationSeconds = (value, fallback = 8) => {
        const n = Number(value);
        const numeric = Number.isFinite(n) ? n : fallback;
        return Math.max(1, Math.min(15, Math.round(numeric)));
      };

      let currentStart = 0;
      const sortedVideos = videos.sort((a, b) => a.scene_id - b.scene_id);

      shotstackPayload = {
        timeline: {
          tracks: [
            {
              clips: videos
                .sort((a, b) => a.scene_id - b.scene_id)
                .map((video) => {
                  const durationSeconds = clampDurationSeconds(
                    scene_durations?.[video.scene_id],
                    8,
                  );
                  const clip = {
                    asset: {
                      type: "video",
                      src: video.video_url,
                      volume: 0,
                    },
                    start: currentStart,
                    length: durationSeconds,
                  };
                  currentStart += durationSeconds;
                  return clip;
                }),
            },
            {
              clips: [
                {
                  asset: {
                    type: "audio",
                    src: voiceover_url,
                    volume: 1,
                  },
                  start: 0,
                  length: "auto",
                },
              ],
            },
            ...(background_music_url
              ? [
                  {
                    clips: [
                      {
                        asset: {
                          type: "audio",
                          src: background_music_url,
                          volume: 0.25,
                        },
                        start: 0,
                        length: "auto",
                      },
                    ],
                  },
                ]
              : []),
          ],
        },
        output: {
          format: "mp4",
          resolution: "hd",
          size: {
            width: 1080,
            height: 1920,
          },
        },
      };
    } else {
      return NextResponse.json(
        { error: "Provide either edit (from Studio) or videos+voiceover_url" },
        { status: 400 },
      );
    }

    // Call Shotstack API
    const shotstackResponse = await fetch(
      "https://api.shotstack.io/edit/v1/render",
      {
        method: "POST",
        headers: {
          "x-api-key": process.env.SHOTSTACK_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shotstackPayload),
      },
    );

    if (!shotstackResponse.ok) {
      const errorText = await shotstackResponse.text();
      throw new Error(`Shotstack API error: ${errorText}`);
    }

    const shotstackResult = await shotstackResponse.json();
    const renderId = shotstackResult.response.id;

    // Calculate Shotstack cost based on actual clip duration
    let totalDuration;
    if (editFromStudio?.timeline && editFromStudio?.output) {
      // Derive duration from edit timeline (first track = video clips)
      const tracks = editFromStudio.timeline?.tracks || [];
      totalDuration = tracks.reduce((sum, track) => {
        const clips = track.clips || [];
        return sum + clips.reduce((s, c) => s + (Number(c.length) || 0), 0);
      }, 0);
      if (totalDuration <= 0) totalDuration = 60; // fallback 1 min
    } else {
      const clampDurationSeconds = (value, fallback = 8) => {
        const n = Number(value);
        const numeric = Number.isFinite(n) ? n : fallback;
        return Math.max(1, Math.min(15, Math.round(numeric)));
      };
      const sortedVideos = videos.sort((a, b) => a.scene_id - b.scene_id);
      totalDuration = sortedVideos.reduce((sum, video) => {
        return sum + clampDurationSeconds(scene_durations?.[video.scene_id], 8);
      }, 0);
    }
    const shotstackCost = calculateShotstackCost(totalDuration);

    // Update Firestore
    const db = getAdminDb();
    await db.collection("video_sessions").doc(session_id).update({
      shotstack_render_id: renderId,
      status: "rendering",
      updated_at: new Date().toISOString(),
    });

    // Get existing costs
    const projectRef = db.collection("projects").doc(project_id);
    const projectDoc = await projectRef.get();
    const existingCosts = projectDoc.data()?.costs || {};

    // Calculate new costs (step6 = assemble / Shotstack)
    const newShotstackCost = (existingCosts.shotstack || 0) + shotstackCost;
    const newStep6ShotstackCost =
      (existingCosts.step6?.shotstack || 0) + shotstackCost;
    const newStep6Total = (existingCosts.step6?.total || 0) + shotstackCost;
    const newTotal = (existingCosts.total || 0) + shotstackCost;

    // Update project progress
    await projectRef.update({
      current_step: 6,
      status: "rendering",
      costs: {
        ...existingCosts,
        // Legacy API-level
        shotstack: newShotstackCost,
        // Step-level (step6 = assemble)
        step6: {
          ...existingCosts.step6,
          shotstack: newStep6ShotstackCost,
          total: newStep6Total,
        },
        total: newTotal,
      },
      updated_at: new Date().toISOString(),
    });

    // Start polling for completion
    pollShotstackStatus(project_id, session_id, renderId);

    return NextResponse.json({
      success: true,
      render_id: renderId,
      message: "Video rendering started",
    });
  } catch (error) {
    console.error("Assemble video error:", error);
    return NextResponse.json(
      { error: "Failed to assemble video", message: error.message },
      { status: 500 },
    );
  }
}

// Background polling function
async function pollShotstackStatus(projectId, sessionId, renderId) {
  const maxAttempts = 60; // 5 minutes
  let attempts = 0;

  const poll = async () => {
    try {
      const statusResponse = await fetch(
        `https://api.shotstack.io/edit/v1/render/${renderId}`,
        {
          headers: {
            "x-api-key": process.env.SHOTSTACK_API_KEY,
          },
        },
      );

      if (!statusResponse.ok) {
        throw new Error("Failed to check Shotstack status");
      }

      const statusResult = await statusResponse.json();
      const status = statusResult.response.status;

      if (status === "done") {
        const finalVideoUrl = statusResult.response.url;

        // Update Firestore
        const { getAdminDb } = await import("@/utils/firebaseAdmin");
        const db = getAdminDb();
        await db.collection("video_sessions").doc(sessionId).update({
          status: "completed",
          final_video_url: finalVideoUrl,
          updated_at: new Date().toISOString(),
        });

        // Update project
        await db.collection("projects").doc(projectId).update({
          current_step: 6,
          status: "completed",
          final_video_url: finalVideoUrl,
          updated_at: new Date().toISOString(),
        });

        console.log(`Video completed for session ${sessionId}`);
        return;
      } else if (status === "failed") {
        throw new Error("Shotstack rendering failed");
      }

      // Continue polling
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(poll, 5000);
      } else {
        throw new Error("Shotstack polling timeout");
      }
    } catch (error) {
      console.error("Shotstack polling error:", error);

      const { getAdminDb } = await import("@/utils/firebaseAdmin");
      const db = getAdminDb();
      await db.collection("video_sessions").doc(sessionId).update({
        status: "failed",
        error: error.message,
        updated_at: new Date().toISOString(),
      });

      // Update project
      await db.collection("projects").doc(projectId).update({
        current_step: 6,
        status: "failed",
        updated_at: new Date().toISOString(),
      });
    }
  };

  setTimeout(poll, 5000);
}

// Endpoint to check render status manually
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get("session_id");

    if (!session_id) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const doc = await db.collection("video_sessions").doc(session_id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const data = doc.data();

    return NextResponse.json({
      success: true,
      status: data.status,
      final_video_url: data.final_video_url || null,
    });
  } catch (error) {
    console.error("Get status error:", error);
    return NextResponse.json(
      { error: "Failed to get status", message: error.message },
      { status: 500 },
    );
  }
}

// Clear rendered video (delete from UI and storage)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get("session_id");
    const project_id = searchParams.get("project_id");

    if (!session_id) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 },
      );
    }

    const db = getAdminDb();

    await db.collection("video_sessions").doc(session_id).update({
      final_video_url: null,
      updated_at: new Date().toISOString(),
    });

    if (project_id) {
      await db.collection("projects").doc(project_id).update({
        final_video_url: null,
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clear render error:", error);
    return NextResponse.json(
      { error: "Failed to clear render", message: error.message },
      { status: 500 },
    );
  }
}
