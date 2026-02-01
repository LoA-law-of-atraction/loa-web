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
    const characterImageUrl = selected_character?.image_urls?.[0] || null;

    const imagePromises = script_data.scenes.map(async (scene) => {
      const requestBody = {
        prompt: scene.image_prompt,
        image_size: "portrait_9_16",
        num_images: 1,
        enable_safety_checker: false,
      };

      // Add character reference image for consistency
      if (characterImageUrl) {
        requestBody.image_urls = [characterImageUrl]; // FAL expects array
        requestBody.strength = 0.90; // High strength to preserve character appearance
      }

      const imageResponse = await fetch(`https://fal.run/${process.env.FAL_FLUX_PRO_MODEL}`, {
        method: "POST",
        headers: {
          Authorization: `Key ${process.env.FAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
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

      // Upload to Cloud Storage with character-based path
      const imageFileName = `characters/${selected_character.character_id}/projects/${project_id}/scene_${scene.id}.png`;
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

    // Get database instance
    const db = getAdminDb();

    // Save image_urls to each scene document in subcollection
    const sceneUpdatePromises = images.map(async (img) => {
      const sceneRef = db
        .collection("projects")
        .doc(project_id)
        .collection("scenes")
        .doc(String(img.scene_id));

      const sceneDoc = await sceneRef.get();
      const existingImageUrls = sceneDoc.data()?.image_urls || [];

      return sceneRef.set(
        {
          image_urls: [...existingImageUrls, img.image_url],
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      );
    });

    await Promise.all(sceneUpdatePromises);

    // Track images in character's projects subcollection
    const characterRef = db.collection("characters").doc(selected_character.character_id);
    const characterProjectRef = characterRef.collection("projects").doc(project_id);

    await characterProjectRef.set({
      status: "images_generated",
      image_count: images.length,
      images: images.map(img => ({
        scene_id: img.scene_id,
        image_url: img.image_url,
        storage_path: `characters/${selected_character.character_id}/projects/${project_id}/scene_${img.scene_id}.png`,
      })),
      updated_at: new Date().toISOString(),
    }, { merge: true });

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
