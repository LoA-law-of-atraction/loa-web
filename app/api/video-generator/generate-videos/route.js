import { NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/utils/firebaseAdmin";

export async function POST(request) {
  try {
    const { project_id, session_id, images, script_data } = await request.json();

    if (!project_id || !session_id || !images || !script_data) {
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
        `https://fal.run/${process.env.FAL_VEO_MODEL}`,
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

    // Fetch Veo pricing from FAL API
    const pricingResponse = await fetch(`https://api.fal.ai/v1/models/pricing?endpoint_id=${process.env.FAL_VEO_MODEL}`, {
      headers: {
        Authorization: `Key ${process.env.FAL_API_KEY}`,
      },
    });

    if (!pricingResponse.ok) {
      const errorText = await pricingResponse.text();
      throw new Error(`FAL Pricing API failed (${pricingResponse.status}): ${errorText}`);
    }

    const pricingData = await pricingResponse.json();
    const veoPrice = pricingData.prices?.find(
      (p) => p.endpoint_id === process.env.FAL_VEO_MODEL
    );

    if (!veoPrice) {
      throw new Error("Veo pricing not found in FAL API response");
    }

    const falVideoCost = videos.length * veoPrice.unit_price;

    // Update Firestore
    const db = getAdminDb();
    await db.collection("video_sessions").doc(session_id).update({
      videos,
      status: "videos_generated",
      updated_at: new Date().toISOString(),
    });

    // Get existing costs
    const projectRef = db.collection("projects").doc(project_id);
    const projectDoc = await projectRef.get();
    const existingCosts = projectDoc.data()?.costs || {};

    // Calculate new costs
    const newFalVideosCost = (existingCosts.fal_videos || 0) + falVideoCost;
    const newStep4FalVideosCost = (existingCosts.step4?.fal_videos || 0) + falVideoCost;
    const newStep4Total = (existingCosts.step4?.total || 0) + falVideoCost;
    const newTotal = (existingCosts.total || 0) + falVideoCost;

    // Update project progress
    await projectRef.update({
      current_step: 5,
      status: "videos_generated",
      costs: {
        ...existingCosts,
        // Legacy API-level
        fal_videos: newFalVideosCost,
        // Step-level
        step4: {
          ...existingCosts.step4,
          fal_videos: newStep4FalVideosCost,
          total: newStep4Total,
        },
        total: newTotal,
      },
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
