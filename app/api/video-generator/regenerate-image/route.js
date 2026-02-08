import { NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/utils/firebaseAdmin";
import { FAL_NEGATIVE_PROMPT } from "@/config/fal-settings";
import { v4 as uuidv4 } from "uuid";

function extractStorageObjectPathFromUrl(url, bucketName) {
  if (!url) return null;

  // https://storage.googleapis.com/{bucket}/{path}
  const gcsMatch = String(url).match(
    new RegExp(`^https://storage\\.googleapis\\.com/${bucketName}/(.+)$`),
  );
  if (gcsMatch?.[1]) return decodeURIComponent(gcsMatch[1]);

  // https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?...
  const fbMatch = String(url).match(
    new RegExp(
      `^https://firebasestorage\\.googleapis\\.com/v0/b/${bucketName}/o/(.+?)(\\?|$)`,
    ),
  );
  if (fbMatch?.[1]) return decodeURIComponent(fbMatch[1]);

  return null;
}

function getImageToImageEndpointId() {
  const endpointId = process.env.FAL_IMAGE_TO_IMAGE_MODEL;

  if (!endpointId) {
    throw new Error(
      "Missing image-to-image model endpoint. Set FAL_IMAGE_TO_IMAGE_MODEL.",
    );
  }

  return endpointId;
}

export async function POST(request) {
  try {
    const {
      session_id,
      project_id,
      scene_id,
      image_prompt,
      character_image_url,
      character_id,
      flux_settings,
      location,
      action,
    } = await request.json();

    if (
      !session_id ||
      !scene_id ||
      !image_prompt ||
      !character_id ||
      !project_id
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get database instance
    const db = getAdminDb();

    // Get old image URL from scenes subcollection to delete it later
    let oldImageUrl = null;
    if (project_id) {
      const sceneRef = db
        .collection("projects")
        .doc(project_id)
        .collection("scenes")
        .doc(String(scene_id));

      const sceneDoc = await sceneRef.get();
      if (sceneDoc.exists) {
        const imageUrls = sceneDoc.data()?.image_urls || [];
        // Get the last image URL (the one being replaced)
        if (imageUrls.length > 0) {
          oldImageUrl = imageUrls[imageUrls.length - 1];
        }
      }
    }

    // Use provided grok settings or defaults
    const settings = flux_settings || {
      output_format: "png",
      num_images: 1,
    };

    // Call Grok Image Edit for character consistency
    const endpointId = getImageToImageEndpointId();

    console.log("=== IMAGE-TO-IMAGE REGENERATION REQUEST ===");
    console.log("Scene ID:", scene_id);
    console.log("Character ID:", character_id);
    console.log("Character reference image URL:", character_image_url);
    console.log("Reference image URL (full):", character_image_url);
    console.log("Model endpoint:", endpointId);
    console.log("Settings:", JSON.stringify(settings, null, 2));
    console.log("Image prompt:", image_prompt);
    console.log("=======================================");

    // Build request body for image-to-image edit
    const requestBody = {
      prompt: image_prompt,
      image_url: character_image_url, // Character reference for editing
      num_images: settings.num_images,
      output_format: settings.output_format,
      sync_mode: true,
    };

    // Generate new image with image-to-image model
    const imageResponse = await fetch(`https://fal.run/${endpointId}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${process.env.FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error("Image-to-image API error response:", errorText);
      throw new Error(
        `Image-to-image API error (${imageResponse.status}): ${errorText}`,
      );
    }

    const imageResult = await imageResponse.json();
    console.log("=== IMAGE-TO-IMAGE API RESPONSE ===");
    console.log("Status:", imageResponse.status);
    console.log("Image URL:", imageResult.images?.[0]?.url);
    console.log("Revised prompt:", imageResult.revised_prompt);
    console.log("Full response:", JSON.stringify(imageResult, null, 2));
    console.log("=========================");

    const imageUrl = imageResult.images[0].url;

    // Download and upload to Cloud Storage
    const imageDataResponse = await fetch(imageUrl);
    const imageBuffer = await imageDataResponse.arrayBuffer();

    const bucket = getAdminStorage().bucket();
    const imageFileName = `characters/${character_id}/projects/${project_id}/scene_${scene_id}_${Date.now()}.png`;
    const imageFile = bucket.file(imageFileName);

    const downloadToken = uuidv4();
    await imageFile.save(Buffer.from(imageBuffer), {
      metadata: {
        contentType: "image/png",
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
          project_id,
          character_id,
          session_id,
          scene_id: String(scene_id),
        },
      },
    });

    const encodedPath = encodeURIComponent(imageFileName);
    const publicImageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;

    // Delete old image from storage if it exists
    if (oldImageUrl) {
      try {
        const oldFilePath = extractStorageObjectPathFromUrl(
          oldImageUrl,
          bucket.name,
        );
        if (oldFilePath) {
          const oldFile = bucket.file(oldFilePath);
          const [exists] = await oldFile.exists();

          if (exists) {
            await oldFile.delete();
            console.log(`Deleted old image from storage: ${oldFilePath}`);
          }
        }
      } catch (deleteError) {
        console.error("Error deleting old image from storage:", deleteError);
        // Don't fail the whole request if deletion fails
      }
    }

    // Track costs - Fetch from FAL Pricing API
    const pricingResponse = await fetch(
      `https://api.fal.ai/v1/models/pricing?endpoint_id=${endpointId}`,
      {
        headers: {
          Authorization: `Key ${process.env.FAL_API_KEY}`,
        },
      },
    );

    if (!pricingResponse.ok) {
      const errorText = await pricingResponse.text();
      throw new Error(
        `FAL Pricing API failed (${pricingResponse.status}): ${errorText}`,
      );
    }

    const pricingData = await pricingResponse.json();

    const modelPrice = pricingData.prices?.find(
      (p) => p.endpoint_id === endpointId,
    );

    if (!modelPrice) {
      throw new Error("Image-to-image pricing not found in FAL API response");
    }

    const imageCost = modelPrice.unit_price;

    if (!imageCost || imageCost <= 0) {
      throw new Error(`Invalid Grok price: ${imageCost}`);
    }

    console.log(`Image-to-image cost: $${imageCost} per image (from FAL API)`);

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

    // Update video_sessions collection
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

    // Update scenes subcollection
    if (project_id) {
      const sceneRef = db
        .collection("projects")
        .doc(project_id)
        .collection("scenes")
        .doc(String(scene_id));

      const sceneDoc = await sceneRef.get();
      if (sceneDoc.exists) {
        const existingImageUrls = sceneDoc.data()?.image_urls || [];
        // Replace the last image with the new one
        const updatedUrls =
          existingImageUrls.length > 0
            ? [...existingImageUrls.slice(0, -1), publicImageUrl]
            : [publicImageUrl];

        await sceneRef.update({
          image_urls: updatedUrls,
          updated_at: new Date().toISOString(),
        });

        // Update character's project document with regenerated image
        if (character_id) {
          const characterRef = db.collection("characters").doc(character_id);
          const characterProjectRef = characterRef
            .collection("projects")
            .doc(project_id);

          // Get current character project data
          const characterProjectDoc = await characterProjectRef.get();
          const existingImages = characterProjectDoc.data()?.images || [];

          // Update the image for this scene
          const updatedImages = existingImages.map((img) =>
            img.scene_id === scene_id
              ? {
                  scene_id,
                  image_url: publicImageUrl,
                  storage_path: `characters/${character_id}/projects/${project_id}/scene_${scene_id}_${Date.now()}.png`,
                }
              : img,
          );

          // If scene wasn't in images array, add it
          if (!existingImages.some((img) => img.scene_id === scene_id)) {
            updatedImages.push({
              scene_id,
              image_url: publicImageUrl,
              storage_path: `characters/${character_id}/projects/${project_id}/scene_${scene_id}_${Date.now()}.png`,
            });
          }

          await characterProjectRef.set(
            {
              images: updatedImages,
              image_count: updatedImages.length,
              status: "images_updated",
              updated_at: new Date().toISOString(),
            },
            { merge: true },
          );
        }
      }
    }

    // Tag the location with this sample image (and remove old image)
    if (project_id) {
      try {
        const projectRef = db.collection("projects").doc(project_id);
        const projectDoc = await projectRef.get();

        if (projectDoc.exists) {
          let locationId = null;

          // Prefer per-scene selection
          try {
            const sceneDocSnap = await projectRef
              .collection("scenes")
              .doc(String(scene_id))
              .get();
            if (sceneDocSnap.exists) {
              locationId = sceneDocSnap.data()?.location_id || null;
            }
          } catch {}

          // Legacy fallback
          if (!locationId) {
            const locationMapping = projectDoc.data()?.location_mapping || {};
            locationId =
              locationMapping?.[scene_id] ??
              locationMapping?.[String(scene_id)] ??
              null;
          }

          if (locationId) {
            const locationRef = db.collection("locations").doc(locationId);
            const locationDoc = await locationRef.get();

            if (locationDoc.exists) {
              const existingSamples = locationDoc.data()?.sample_images || [];

              // Remove old image URL if it exists
              const samplesWithoutOld = oldImageUrl
                ? existingSamples.filter((url) => url !== oldImageUrl)
                : existingSamples;

              // Add new image to samples (limit to 10 most recent)
              const updatedSamples = [
                publicImageUrl,
                ...samplesWithoutOld,
              ].slice(0, 10);

              await locationRef.update({
                sample_images: updatedSamples,
                updated_at: new Date().toISOString(),
              });

              console.log(
                `Updated location ${locationId} samples: removed old image, added new image`,
              );
            }
          }
        }
      } catch (tagError) {
        console.error("Error updating location samples:", tagError);
        // Don't fail the request if tagging fails
      }
    }

    // Save generation metadata to scene document
    if (project_id && scene_id) {
      try {
        const generationMetadata = {
          timestamp: new Date().toISOString(),
          source: "image-to-image",
          image_url: publicImageUrl,
          image_prompt: image_prompt,
          character_reference_url: character_image_url,
          character_id: character_id,
          model_endpoint: endpointId,
          fal_request_payload: requestBody,
          grok_settings: settings,
          location: location
            ? {
                id: location.id,
                name: location.name,
                description: location.description,
                type: location.type,
                category: location.category,
              }
            : null,
          action: action
            ? {
                id: action.id,
                name: action.name,
                description: action.description,
                pose_variations: action.pose_variations,
                expression: action.expression,
              }
            : null,
          grok_response: {
            revised_prompt: imageResult.revised_prompt || null,
          },
          fal_response: {
            revised_prompt: imageResult.revised_prompt || null,
            seed: imageResult?.seed ?? null,
            output_image_url: imageUrl || null,
          },
          regenerated: true,
        };

        const sceneRef = db
          .collection("projects")
          .doc(project_id)
          .collection("scenes")
          .doc(scene_id.toString());
        const sceneDoc = await sceneRef.get();

        if (sceneDoc.exists) {
          const existingGenerations = sceneDoc.data()?.generation_history || [];
          await sceneRef.update({
            generation_history: [...existingGenerations, generationMetadata],
            last_generation_metadata: generationMetadata,
            updated_at: new Date().toISOString(),
          });
          console.log(`Saved regeneration metadata for scene ${scene_id}`);
        }
      } catch (metadataError) {
        console.error("Error saving generation metadata:", metadataError);
        // Don't fail the request if metadata saving fails
      }
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
