import { NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/utils/firebaseAdmin";

export async function POST(request) {
  try {
    const { session_id, images, script_data } = await request.json();

    if (!session_id || !images || !script_data) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("Generating videos from images...");

    // Generate 4 videos in parallel with Fal AI image-to-video
    const videoPromises = images.map(async (image) => {
      const scene = script_data.scenes.find((s) => s.id === image.scene_id);

      const videoResponse = await fetch(
        "https://fal.run/fal-ai/veo3.1/fast/image-to-video",
        {
          method: "POST",
          headers: {
            Authorization: `Key ${process.env.FAL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: image.image_url,
            prompt: scene.motion_prompt,
            duration: 8,
          }),
        }
      );

      if (!videoResponse.ok) {
        throw new Error(
          `Fal AI video generation error for scene ${image.scene_id}: ${videoResponse.statusText}`
        );
      }

      const videoResult = await videoResponse.json();
      const videoUrl = videoResult.video.url;

      // Download video
      const videoDataResponse = await fetch(videoUrl);
      const videoBuffer = await videoDataResponse.arrayBuffer();

      // Upload to Cloud Storage
      const bucket = getAdminStorage().bucket();
      const videoFileName = `video-scenes/${session_id}/scene_${image.scene_id}.mp4`;
      const videoFile = bucket.file(videoFileName);

      await videoFile.save(Buffer.from(videoBuffer), {
        metadata: { contentType: "video/mp4" },
      });

      await videoFile.makePublic();
      const publicVideoUrl = `https://storage.googleapis.com/${bucket.name}/${videoFileName}`;

      return {
        scene_id: image.scene_id,
        video_url: publicVideoUrl,
      };
    });

    const videos = await Promise.all(videoPromises);

    // Update Firestore
    const db = getAdminDb();
    await db.collection("video_sessions").doc(session_id).update({
      videos,
      status: "videos_generated",
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      videos,
    });
  } catch (error) {
    console.error("Generate videos error:", error);
    return NextResponse.json(
      { error: "Failed to generate videos", message: error.message },
      { status: 500 }
    );
  }
}
