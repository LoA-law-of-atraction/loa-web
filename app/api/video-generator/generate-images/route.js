import { NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/utils/firebaseAdmin";
import { calculateFalImageCost } from "@/utils/costCalculator";

export async function POST(request) {
  try {
    const { project_id, script_data, selected_character, session_id, voiceover_url } = await request.json();

    if (!project_id || !script_data || !selected_character || !session_id || !voiceover_url) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const bucket = getAdminStorage().bucket();

    // Generate images in parallel with Fal AI
    console.log("Generating images...");
    const imagePromises = script_data.scenes.map(async (scene) => {
      const imageResponse = await fetch("https://fal.run/fal-ai/flux/schnell", {
        method: "POST",
        headers: {
          Authorization: `Key ${process.env.FAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: scene.image_prompt,
          image_size: "portrait_9_16",
          num_images: 1,
          enable_safety_checker: false,
        }),
      });

      if (!imageResponse.ok) {
        throw new Error(
          `Fal AI image generation error for scene ${scene.id}: ${imageResponse.statusText}`
        );
      }

      const imageResult = await imageResponse.json();
      const imageUrl = imageResult.images[0].url;

      // Download image
      const imageDataResponse = await fetch(imageUrl);
      const imageBuffer = await imageDataResponse.arrayBuffer();

      // Upload to Cloud Storage
      const imageFileName = `video-scenes/${sessionId}/scene_${scene.id}.png`;
      const imageFile = bucket.file(imageFileName);

      await imageFile.save(Buffer.from(imageBuffer), {
        metadata: { contentType: "image/png" },
      });

      await imageFile.makePublic();
      const publicImageUrl = `https://storage.googleapis.com/${bucket.name}/${imageFileName}`;

      return {
        scene_id: scene.id,
        image_url: publicImageUrl,
      };
    });

    const images = await Promise.all(imagePromises);

    // Calculate FAL AI image cost
    const falImageCost = calculateFalImageCost(images.length);

    // Store/update in Firestore
    const db = getAdminDb();
    await db.collection("video_sessions").doc(session_id).set({
      session_id,
      script_data,
      selected_character,
      voiceover_url,
      images,
      status: "images_generated",
      updated_at: new Date().toISOString(),
    }, { merge: true });

    // Get existing costs
    const projectRef = db.collection("projects").doc(project_id);
    const projectDoc = await projectRef.get();
    const existingCosts = projectDoc.data()?.costs || {};

    // Update project progress
    await projectRef.update({
      current_step: 4,
      status: "images_generated",
      costs: {
        ...existingCosts,
        fal_images: (existingCosts.fal_images || 0) + falImageCost,
      },
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      images,
    });
  } catch (error) {
    console.error("Generate images error:", error);
    return NextResponse.json(
      { error: "Failed to generate images", message: error.message },
      { status: 500 }
    );
  }
}
