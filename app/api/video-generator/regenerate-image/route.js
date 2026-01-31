import { NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/utils/firebaseAdmin";

export async function POST(request) {
  try {
    const {
      session_id,
      project_id,
      scene_id,
      image_prompt,
      character_image_url,
      flux_settings,
    } = await request.json();

    if (!session_id || !scene_id || !image_prompt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Use provided flux settings or defaults
    const settings = flux_settings || {
      strength: 0.65,
      guidance_scale: 3.5,
      num_inference_steps: 28,
      output_format: "png",
    };

    // Call FAL AI Flux Pro with image-to-image for character consistency
    console.log("Regenerating image with Flux Pro, prompt:", image_prompt);
    console.log("Character reference image:", character_image_url);

    // Build request body with all Flux Pro settings
    const requestBody = {
      prompt: image_prompt,
      image_size: "portrait_16_9",
      num_images: 1,
      enable_safety_checker: false,

      // Quality & Performance Settings (from flux_settings)
      num_inference_steps: settings.num_inference_steps,
      guidance_scale: settings.guidance_scale,

      // Output Settings
      output_format: settings.output_format,
      sync_mode: true,
    };

    // Add character reference image for consistency (image-to-image)
    if (character_image_url) {
      requestBody.image_url = character_image_url;
      requestBody.strength = settings.strength;
    }

    // Generate new image with Flux Pro
    const imageResponse = await fetch(`https://fal.run/${process.env.FAL_FLUX_PRO_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${process.env.FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error("FAL AI error response:", errorText);
      throw new Error(`FAL AI error (${imageResponse.status}): ${errorText}`);
    }

    const imageResult = await imageResponse.json();
    console.log("FAL API response:", JSON.stringify(imageResult, null, 2));

    const imageUrl = imageResult.images[0].url;

    // Download and upload to Cloud Storage
    const imageDataResponse = await fetch(imageUrl);
    const imageBuffer = await imageDataResponse.arrayBuffer();

    const bucket = getAdminStorage().bucket();
    const imageFileName = `video-scenes/${session_id}/scene_${scene_id}_${Date.now()}.png`;
    const imageFile = bucket.file(imageFileName);

    await imageFile.save(Buffer.from(imageBuffer), {
      metadata: { contentType: "image/png" },
    });

    await imageFile.makePublic();
    const publicImageUrl = `https://storage.googleapis.com/${bucket.name}/${imageFileName}`;

    // Track costs - Fetch from FAL Pricing API (NO FALLBACK)
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

    // Find Flux Pro pricing
    const fluxProPrice = pricingData.prices?.find(
      (p) => p.endpoint_id === process.env.FAL_FLUX_PRO_MODEL
    );

    if (!fluxProPrice) {
      throw new Error("Flux Pro pricing not found in FAL API response");
    }

    const imageCost = fluxProPrice.unit_price;

    if (!imageCost || imageCost <= 0) {
      throw new Error(`Invalid Flux Pro price: ${imageCost}`);
    }

    console.log(`Flux Pro cost: $${imageCost} per image (from FAL API)`);

    // Update Firestore
    const db = getAdminDb();

    // Update project costs if project_id is provided
    if (project_id) {
      try {
        console.log(`Updating costs for project ${project_id}`);
        const projectRef = db.collection("projects").doc(project_id);
        const projectDoc = await projectRef.get();

        if (projectDoc.exists) {
          const projectData = projectDoc.data();
          const existingCosts = projectData?.costs || {};

          // Calculate new costs
          const newFalImagesCost = (existingCosts.fal_images || 0) + imageCost;
          const newStep3FalImagesCost =
            (existingCosts.step3?.fal_images || 0) + imageCost;
          const newStep3Total = (existingCosts.step3?.total || 0) + imageCost;
          const newTotal = (existingCosts.total || 0) + imageCost;

          console.log(`Existing costs:`, existingCosts);
          console.log(`Adding ${imageCost}, new step3 total: ${newStep3Total}`);

          await projectRef.update({
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

          console.log(
            `Successfully updated costs for project ${project_id}: Step 3 total $${newStep3Total}`,
          );
        } else {
          console.error(`Project ${project_id} not found when updating costs`);
        }
      } catch (costError) {
        console.error(
          `Error updating costs for project ${project_id}:`,
          costError,
        );
        // Don't fail the whole request if cost tracking fails
      }
    } else {
      console.warn("No project_id provided, skipping cost tracking");
    }

    const docRef = db.collection("video_sessions").doc(session_id);
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();
      const updatedImages = data.images.map((img) =>
        img.scene_id === scene_id ? { ...img, image_url: publicImageUrl } : img,
      );

      await docRef.update({
        images: updatedImages,
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      image_url: publicImageUrl,
    });
  } catch (error) {
    console.error("Regenerate image error:", error);
    return NextResponse.json(
      { error: "Failed to regenerate image", message: error.message },
      { status: 500 },
    );
  }
}
