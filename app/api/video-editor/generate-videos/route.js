import { NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/utils/firebaseAdmin";

export async function POST(request) {
  try {
    const { session_id } = await request.json();

    if (!session_id) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 }
      );
    }

    // Get session data
    const db = getAdminDb();
    const docRef = db.collection("video_sessions").doc(session_id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const sessionData = doc.data();

    // Check all scenes are approved
    const allApproved = sessionData.scenes.every((s) => s.approved);
    if (!allApproved) {
      return NextResponse.json(
        { error: "Not all scenes are approved" },
        { status: 400 }
      );
    }

    // Update status
    await docRef.update({
      status: "generating_videos",
      updated_at: new Date().toISOString(),
    });

    // Step 1: Generate 4 videos with Fal AI image-to-video
    console.log("Generating videos from images...");
    const videoPromises = sessionData.scenes.map(async (scene) => {
      const videoResponse = await fetch("https://fal.run/fal-ai/veo3.1/fast/image-to-video", {
        method: "POST",
        headers: {
          "Authorization": `Key ${process.env.FAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: scene.image_url,
          prompt: scene.motion_prompt,
          duration: 8,
        }),
      });

      if (!videoResponse.ok) {
        throw new Error(`Fal AI video generation error for scene ${scene.id}: ${videoResponse.statusText}`);
      }

      const videoResult = await videoResponse.json();
      const videoUrl = videoResult.video.url;

      // Download video
      const videoDataResponse = await fetch(videoUrl);
      const videoBuffer = await videoDataResponse.arrayBuffer();

      // Upload to Cloud Storage
      const bucket = getAdminStorage().bucket();
      const videoFileName = `video-scenes/${session_id}/scene_${scene.id}.mp4`;
      const videoFile = bucket.file(videoFileName);

      await videoFile.save(Buffer.from(videoBuffer), {
        metadata: { contentType: "video/mp4" },
      });

      await videoFile.makePublic();
      const publicVideoUrl = `https://storage.googleapis.com/${bucket.name}/${videoFileName}`;

      return {
        scene_id: scene.id,
        video_url: publicVideoUrl,
      };
    });

    const generatedVideos = await Promise.all(videoPromises);

    // Update Firestore with video URLs
    const updatedScenes = sessionData.scenes.map((scene) => {
      const generatedVideo = generatedVideos.find((v) => v.scene_id === scene.id);
      return {
        ...scene,
        video_url: generatedVideo?.video_url || null,
      };
    });

    await docRef.update({
      scenes: updatedScenes,
      updated_at: new Date().toISOString(),
    });

    // Step 2: Assemble final video with Shotstack
    console.log("Assembling final video with Shotstack...");
    const shotstackPayload = {
      timeline: {
        tracks: [
          {
            clips: updatedScenes.map((scene, index) => ({
              asset: {
                type: "video",
                src: scene.video_url,
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
                  src: sessionData.voiceover_url,
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

    const shotstackResponse = await fetch("https://api.shotstack.io/edit/v1/render", {
      method: "POST",
      headers: {
        "x-api-key": process.env.SHOTSTACK_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(shotstackPayload),
    });

    if (!shotstackResponse.ok) {
      const errorText = await shotstackResponse.text();
      throw new Error(`Shotstack API error: ${errorText}`);
    }

    const shotstackResult = await shotstackResponse.json();
    const renderId = shotstackResult.response.id;

    // Update Firestore with render ID
    await docRef.update({
      status: "rendering",
      shotstack_render_id: renderId,
      updated_at: new Date().toISOString(),
    });

    // Start polling for Shotstack completion (in background)
    pollShotstackStatus(session_id, renderId);

    return NextResponse.json({
      success: true,
      message: "Video generation started",
      render_id: renderId,
      videos: generatedVideos,
    });
  } catch (error) {
    console.error("Generate videos error:", error);

    // Update status to failed
    try {
      const db = getAdminDb();
      await db.collection("video_sessions").doc(request.body?.session_id).update({
        status: "failed",
        error: error.message,
        updated_at: new Date().toISOString(),
      });
    } catch (updateError) {
      console.error("Failed to update error status:", updateError);
    }

    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

// Background polling function for Shotstack render status
async function pollShotstackStatus(sessionId, renderId) {
  const maxAttempts = 60; // 5 minutes (5 seconds * 60)
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
        const db = getAdminDb();
        await db.collection("video_sessions").doc(sessionId).update({
          status: "completed",
          final_video_url: finalVideoUrl,
          updated_at: new Date().toISOString(),
        });

        console.log(`Video completed for session ${sessionId}: ${finalVideoUrl}`);
        return;
      } else if (status === "failed") {
        throw new Error("Shotstack rendering failed");
      }

      // Continue polling if not done and under max attempts
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(poll, 5000); // Poll every 5 seconds
      } else {
        throw new Error("Shotstack polling timeout");
      }
    } catch (error) {
      console.error("Shotstack polling error:", error);

      // Update Firestore with error
      const db = getAdminDb();
      await db.collection("video_sessions").doc(sessionId).update({
        status: "failed",
        error: error.message,
        updated_at: new Date().toISOString(),
      });
    }
  };

  // Start polling
  setTimeout(poll, 5000); // First check after 5 seconds
}
