import { NextResponse } from "next/server";
import { getAdminStorage, getAdminDb } from "@/utils/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";

const DEFAULT_MULTIPLE_ANGLES_MODEL =
  "fal-ai/flux-2-lora-gallery/multiple-angles";

function getMultipleAnglesEndpointId() {
  const endpointId = process.env.FAL_MULTIPLE_ANGLES_MODEL;
  const trimmed = typeof endpointId === "string" ? endpointId.trim() : "";
  return trimmed || DEFAULT_MULTIPLE_ANGLES_MODEL;
}

function clampNumber(value, { min, max, fallback }) {
  const n = Number(value);
  const numeric = Number.isFinite(n) ? n : fallback;
  return Math.max(min, Math.min(max, numeric));
}

function clampInt(value, { min, max, fallback }) {
  const n = Number(value);
  const numeric = Number.isFinite(n) ? Math.round(n) : fallback;
  return Math.max(min, Math.min(max, numeric));
}

export async function POST(request) {
  try {
    const endpointId = getMultipleAnglesEndpointId();
    const body = await request.json();
    const {
      project_id,
      scene_id,
      character_id,
      source_image_url,
      horizontal_angle,
      vertical_angle,
      zoom,
      num_images,
      output_format,
    } = body || {};

    if (!project_id || scene_id == null || !character_id || !source_image_url) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required parameters: project_id, scene_id, character_id, source_image_url",
        },
        { status: 400 },
      );
    }

    const safeHorizontal = clampNumber(horizontal_angle, {
      min: 0,
      max: 360,
      fallback: 0,
    });
    const safeVertical = clampNumber(vertical_angle, {
      min: 0,
      max: 60,
      fallback: 0,
    });
    const safeZoom = clampNumber(zoom, { min: 0, max: 10, fallback: 5 });
    const safeNumImages = clampInt(num_images, { min: 1, max: 6, fallback: 1 });
    const safeFormat =
      output_format === "jpeg" || output_format === "webp"
        ? output_format
        : "png";

    const requestBody = {
      image_urls: [source_image_url],
      horizontal_angle: safeHorizontal,
      vertical_angle: safeVertical,
      zoom: safeZoom,
      num_images: safeNumImages,
      output_format: safeFormat,
      sync_mode: true,
    };

    const falResponse = await fetch(`https://fal.run/${endpointId}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${process.env.FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!falResponse.ok) {
      const errorText = await falResponse.text();
      return NextResponse.json(
        {
          success: false,
          error: `FAL multiple-angles error (${falResponse.status})`,
          message: errorText,
        },
        { status: 502 },
      );
    }

    const falResult = await falResponse.json();
    const falImages = Array.isArray(falResult?.images) ? falResult.images : [];
    if (falImages.length === 0 || !falImages[0]?.url) {
      return NextResponse.json(
        {
          success: false,
          error: "FAL returned no images",
          debug: falResult,
        },
        { status: 502 },
      );
    }

    const bucket = getAdminStorage().bucket();
    const timestamp = Date.now();

    const uploadedUrls = [];
    const generationEntries = [];
    for (let i = 0; i < falImages.length; i++) {
      const url = falImages[i]?.url;
      if (!url) continue;

      const imageDataResponse = await fetch(url);
      if (!imageDataResponse.ok) {
        const t = await imageDataResponse.text().catch(() => "");
        throw new Error(
          `Failed to download FAL image (${imageDataResponse.status}): ${t}`,
        );
      }

      const imageBuffer = await imageDataResponse.arrayBuffer();

      const ext = safeFormat === "jpeg" ? "jpg" : safeFormat;
      const imageFileName = `characters/${character_id}/projects/${project_id}/scene_${scene_id}_angle_${timestamp}_${i}.${ext}`;
      const imageFile = bucket.file(imageFileName);

      const downloadToken = uuidv4();
      await imageFile.save(Buffer.from(imageBuffer), {
        metadata: {
          contentType:
            safeFormat === "jpeg" ? "image/jpeg" : `image/${safeFormat}`,
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
            project_id,
            character_id,
            scene_id: String(scene_id),
            source: "multiple-angles",
          },
        },
      });

      const encodedPath = encodeURIComponent(imageFileName);
      const publicImageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;
      uploadedUrls.push(publicImageUrl);

      generationEntries.push({
        timestamp: new Date().toISOString(),
        source: "multiple-angles",
        scene_id,
        image_url: publicImageUrl,
        source_image_url,
        character_id,
        model_endpoint: endpointId,
        multiple_angles: {
          horizontal_angle: safeHorizontal,
          vertical_angle: safeVertical,
          zoom: safeZoom,
          num_images: safeNumImages,
          output_format: safeFormat,
          request_payload: requestBody,
        },
        fal: {
          endpoint_id: endpointId,
          seed: falResult?.seed ?? null,
          prompt: falResult?.prompt ?? null,
        },
        storage: {
          bucket: bucket.name,
          path: imageFileName,
          content_type:
            safeFormat === "jpeg" ? "image/jpeg" : `image/${safeFormat}`,
        },
      });
    }

    // Track costs (best-effort)
    let imageCostTotal = 0;
    try {
      const pricingResponse = await fetch(
        `https://api.fal.ai/v1/models/pricing?endpoint_id=${endpointId}`,
        {
          headers: {
            Authorization: `Key ${process.env.FAL_API_KEY}`,
          },
        },
      );

      if (pricingResponse.ok) {
        const pricingData = await pricingResponse.json();
        const modelPrice = pricingData.prices?.find(
          (p) => p.endpoint_id === endpointId,
        );
        const unit = Number(modelPrice?.unit_price);
        if (Number.isFinite(unit) && unit > 0) {
          imageCostTotal = unit * uploadedUrls.length;

          const db = getAdminDb();
          const projectRef = db.collection("projects").doc(String(project_id));
          const projectDoc = await projectRef.get();
          if (projectDoc.exists) {
            const existingCosts = projectDoc.data()?.costs || {};
            const nextFalImagesCost =
              (existingCosts.fal_images || 0) + imageCostTotal;
            const nextStep3FalImagesCost =
              (existingCosts.step3?.fal_images || 0) + imageCostTotal;
            const nextStep3Total =
              (existingCosts.step3?.total || 0) + imageCostTotal;
            const nextTotal = (existingCosts.total || 0) + imageCostTotal;

            await projectRef.update({
              costs: {
                ...existingCosts,
                fal_images: nextFalImagesCost,
                step3: {
                  ...existingCosts.step3,
                  fal_images: nextStep3FalImagesCost,
                  total: nextStep3Total,
                },
                total: nextTotal,
              },
              updated_at: new Date().toISOString(),
            });
          }
        }
      }
    } catch {
      // ignore cost errors
    }

    // Persist generation metadata for these new variants (best-effort)
    try {
      if (generationEntries.length > 0) {
        const db = getAdminDb();
        const sceneRef = db
          .collection("projects")
          .doc(String(project_id))
          .collection("scenes")
          .doc(String(scene_id));
        const sceneDoc = await sceneRef.get();
        if (sceneDoc.exists) {
          const existing = Array.isArray(sceneDoc.data()?.generation_history)
            ? sceneDoc.data().generation_history
            : [];
          const merged = [...existing, ...generationEntries];
          await sceneRef.update({
            generation_history: merged,
            last_generation_metadata:
              generationEntries[generationEntries.length - 1],
            updated_at: new Date().toISOString(),
          });
        }
      }
    } catch (metadataError) {
      console.error(
        "Error saving multiple-angles generation metadata:",
        metadataError,
      );
    }

    return NextResponse.json({
      success: true,
      image_urls: uploadedUrls,
      cost: imageCostTotal,
      fal: {
        endpoint_id: endpointId,
        seed: falResult?.seed ?? null,
        prompt: falResult?.prompt ?? "",
        input: requestBody,
      },
    });
  } catch (error) {
    console.error("Edit image angles error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to edit image angles",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
