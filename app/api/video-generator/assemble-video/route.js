import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";
import { calculateShotstackCost } from "@/utils/costCalculator";

export async function POST(request) {
  try {
    const { project_id, session_id, videos, voiceover_url } = await request.json();

    if (!project_id || !session_id || !videos || !voiceover_url) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("Assembling final video with Shotstack...");

    // Build Shotstack payload
    const shotstackPayload = {
      timeline: {
        tracks: [
          {
            clips: videos
              .sort((a, b) => a.scene_id - b.scene_id)
              .map((video, index) => ({
                asset: {
                  type: "video",
                  src: video.video_url,
                  volume: 0, // Mute video audio
                },
                start: index * 8,
                length: 8,
              })),
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
      }
    );

    if (!shotstackResponse.ok) {
      const errorText = await shotstackResponse.text();
      throw new Error(`Shotstack API error: ${errorText}`);
    }

    const shotstackResult = await shotstackResponse.json();
    const renderId = shotstackResult.response.id;

    // Calculate Shotstack cost (videos are 8 seconds each)
    const totalDuration = videos.length * 8;
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

    // Update project progress
    await projectRef.update({
      current_step: 5,
      status: "rendering",
      costs: {
        ...existingCosts,
        shotstack: (existingCosts.shotstack || 0) + shotstackCost,
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
      { status: 500 }
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
        }
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
          current_step: 5,
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
        current_step: 5,
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
        { status: 400 }
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
      { status: 500 }
    );
  }
}
