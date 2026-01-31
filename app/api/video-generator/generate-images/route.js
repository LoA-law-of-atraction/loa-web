import { NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/utils/firebaseAdmin";

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
      const imageResponse = await fetch(`https://fal.run/${process.env.FAL_FLUX_PRO_MODEL}`, {
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

    // Fetch Flux Pro pricing from FAL API
    const pricingResponse = await fetch(`https://api.fal.ai/v1/models/pricing?endpoint_id=${process.env.FAL_FLUX_PRO_MODEL}`, {
      headers: {
        Authorization: `Key ${process.env.FAL_API_KEY}`,
      },
    });

    if (!pricingResponse.ok) {
      const errorText = await pricingResponse.text();
      throw new Error(`FAL Pricing API failed (${pricingResponse.status}): ${errorText}`);
    }

    const pricingData = await pricingResponse.json();
    const fluxProPrice = pricingData.prices?.find(
      (p) => p.endpoint_id === process.env.FAL_FLUX_PRO_MODEL
    );

    if (!fluxProPrice) {
      throw new Error("Flux Pro pricing not found in FAL API response");
    }

    const falImageCost = images.length * fluxProPrice.unit_price;

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

    // Calculate new costs
    const newFalImagesCost = (existingCosts.fal_images || 0) + falImageCost;
    const newStep3FalImagesCost = (existingCosts.step3?.fal_images || 0) + falImageCost;
    const newStep3Total = (existingCosts.step3?.total || 0) + falImageCost;
    const newTotal = (existingCosts.total || 0) + falImageCost;

    // Update project progress
    await projectRef.update({
      current_step: 4,
      status: "images_generated",
      costs: {
        ...existingCosts,
        // Legacy API-level
        fal_images: newFalImagesCost,
        // Step-level
        step3: {
          ...existingCosts.step3,
          fal_images: newStep3FalImagesCost,
          total: newStep3Total,
        },
        total: newTotal,
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
