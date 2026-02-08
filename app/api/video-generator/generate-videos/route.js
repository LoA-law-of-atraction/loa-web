import { NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/utils/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";
import { FieldValue } from "firebase-admin/firestore";
import { getPrompt } from "@/utils/promptService";

function getImageToVideoModelEndpoint() {
  return process.env.FAL_IMAGE_TO_VIDEO_MODEL || process.env.FAL_VEO_MODEL;
}

function extractUnit(price) {
  return (
    price?.unit ||
    price?.unit_name ||
    price?.usage_unit ||
    price?.billing_unit ||
    price?.per ||
    null
  );
}

function isPerSecondUnit(unit) {
  if (!unit) return false;
  const normalized = String(unit).toLowerCase();
  return (
    normalized === "s" ||
    normalized === "sec" ||
    normalized === "second" ||
    normalized === "seconds" ||
    normalized.includes("second")
  );
}

function clampDurationSeconds(value, fallback = 8) {
  const n = Number(value);
  const numeric = Number.isFinite(n) ? n : fallback;
  return Math.max(1, Math.min(15, Math.round(numeric)));
}

const DEFAULT_VIDEO_NEGATIVE_PROMPT =
  "lip-sync/speaking, breathing/chest rise-fall, background music/soundtrack/singing, text overlays, logos/watermarks, flicker/jitter, warping/morphing, camera shake";

export async function POST(request) {
  try {
    const { project_id, session_id, images, script_data } =
      await request.json();

    if (!project_id || !session_id || !images || !script_data) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    console.log("Generating videos from images...");

    const db = getAdminDb();

    // Resolve character_id for storage pathing
    const projectRef = db.collection("projects").doc(project_id);
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const characterId =
      projectDoc.data()?.character?.character_id ||
      script_data?.character?.character_id ||
      script_data?.selected_character?.character_id ||
      null;
    if (!characterId) {
      return NextResponse.json(
        {
          error: "Missing character_id",
          message:
            "Project has no character assigned; cannot determine storage path.",
        },
        { status: 400 },
      );
    }

    const bucket = getAdminStorage().bucket();
    const storageBasePath = `videos/${characterId}/${project_id}/scenes`;

    const modelEndpoint = getImageToVideoModelEndpoint();
    if (!modelEndpoint) {
      return NextResponse.json(
        {
          error: "Missing image-to-video model endpoint",
          message:
            "Set FAL_IMAGE_TO_VIDEO_MODEL (preferred) or FAL_VEO_MODEL (legacy) in your environment.",
        },
        { status: 500 },
      );
    }

    const durationsBySceneId = new Map();

    // Generate videos in parallel with Fal AI image-to-video
    const videoPromises = images.map(async (image) => {
      const scene = script_data.scenes.find((s) => s.id === image.scene_id);

      const promptUsed = scene?.motion_prompt || "";
      const rawNegative = scene?.video_negative_prompt;
      const negativePromptUsed =
        rawNegative === undefined || rawNegative === null
          ? DEFAULT_VIDEO_NEGATIVE_PROMPT
          : String(rawNegative || "").trim();
      const durationSeconds = clampDurationSeconds(image?.duration, 8);
      durationsBySceneId.set(image.scene_id, durationSeconds);

      const audioInstruction = getPrompt("video-audio-instructions").trim();

      const promptSentToModel = negativePromptUsed
        ? `${promptUsed}\n\n${audioInstruction}\nAvoid: ${negativePromptUsed}`
        : `${promptUsed}\n\n${audioInstruction}`;

      const settingsUsed = {
        model_endpoint: modelEndpoint,
        duration: durationSeconds,
      };

      const videoResponse = await fetch(`https://fal.run/${modelEndpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Key ${process.env.FAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: image.image_url,
          prompt: promptSentToModel,
          duration: durationSeconds,
        }),
      });

      if (!videoResponse.ok) {
        throw new Error(
          `Fal AI video generation error for scene ${image.scene_id}: ${videoResponse.statusText}`,
        );
      }

      const videoResult = await videoResponse.json();
      const videoUrl = videoResult.video.url;

      // Download video
      const videoDataResponse = await fetch(videoUrl);
      if (!videoDataResponse.ok) {
        throw new Error(
          `Failed to download generated video for scene ${image.scene_id}: ${videoDataResponse.status} ${videoDataResponse.statusText}`,
        );
      }
      const videoBuffer = await videoDataResponse.arrayBuffer();

      // Upload to Firebase Storage under required path
      const downloadToken = uuidv4();
      const shortToken = downloadToken.slice(0, 8);
      const filename = `scene_${image.scene_id}_${shortToken}.mp4`;
      const videoFileName = `${storageBasePath}/${filename}`;
      const videoFile = bucket.file(videoFileName);
      const contentType =
        videoDataResponse.headers.get("content-type") || "video/mp4";

      await videoFile.save(Buffer.from(videoBuffer), {
        metadata: {
          contentType,
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
            project_id,
            character_id: characterId,
            session_id,
            scene_id: String(image.scene_id),
          },
        },
      });

      const encodedPath = encodeURIComponent(videoFileName);
      const publicVideoUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;

      const generationMetadata = {
        timestamp: new Date().toISOString(),
        scene_id: image.scene_id,
        input_image_url: image.image_url,
        video_url: publicVideoUrl,
        prompt_used: promptUsed,
        negative_prompt_used: negativePromptUsed || null,
        prompt_sent_to_model: promptSentToModel,
        model_request_payload: {
          image_url: image.image_url,
          prompt: promptSentToModel,
          duration: durationSeconds,
        },
        settings_used: settingsUsed,
        action_id: scene?.action_id || null,
        camera_movement_id: scene?.camera_movement_id || null,
        character_motion_id: scene?.character_motion_id || null,
        fal: {
          model_endpoint: modelEndpoint,
          output_url: videoUrl,
          request_id: videoResult?.request_id || videoResult?.requestId || null,
        },
        storage: {
          bucket: bucket.name,
          path: videoFileName,
          content_type: contentType,
        },
      };

      return {
        scene_id: image.scene_id,
        video_url: publicVideoUrl,
        storage_path: videoFileName,
        generation_metadata: generationMetadata,
      };
    });

    const videos = await Promise.all(videoPromises);

    // Persist generated URLs onto project scenes and library sample refs (best-effort)
    try {
      const scenesCollection = projectRef.collection("scenes");
      const sceneById = new Map(
        (Array.isArray(script_data?.scenes) ? script_data.scenes : []).map(
          (s) => [String(s.id), s],
        ),
      );
      const batch = db.batch();
      const nowIso = new Date().toISOString();

      for (const v of videos) {
        if (!v?.scene_id || !v?.video_url) continue;
        const sceneRef = scenesCollection.doc(String(v.scene_id));
        batch.set(
          sceneRef,
          {
            video_urls: FieldValue.arrayUnion(v.video_url),
            selected_video_url: v.video_url,
            ...(v.generation_metadata
              ? {
                  video_generation_history: FieldValue.arrayUnion(
                    v.generation_metadata,
                  ),
                  last_video_generation_metadata: v.generation_metadata,
                }
              : null),
            updated_at: nowIso,
          },
          { merge: true },
        );

        const scene = sceneById.get(String(v.scene_id));
        const actionId = scene?.action_id || null;
        const cameraMovementId = scene?.camera_movement_id || null;
        const characterMotionId = scene?.character_motion_id || null;

        if (actionId) {
          const actionRef = db.collection("actions").doc(String(actionId));
          batch.set(
            actionRef,
            {
              sample_videos: FieldValue.arrayUnion(v.video_url),
              updated_at: nowIso,
            },
            { merge: true },
          );
        }

        if (cameraMovementId) {
          const movementRef = db
            .collection("camera_movements")
            .doc(String(cameraMovementId));
          batch.set(
            movementRef,
            {
              sample_videos: FieldValue.arrayUnion(v.video_url),
              updated_at: nowIso,
            },
            { merge: true },
          );
        }

        if (characterMotionId) {
          const motionRef = db
            .collection("character_motions")
            .doc(String(characterMotionId));
          batch.set(
            motionRef,
            {
              sample_videos: FieldValue.arrayUnion(v.video_url),
              updated_at: nowIso,
            },
            { merge: true },
          );
        }
      }

      await batch.commit();
    } catch (error) {
      console.error(
        "Error updating scene video_urls / library sample_videos:",
        error,
      );
    }

    // Merge into existing session videos (so per-scene generation doesn't overwrite)
    const sessionRef = db.collection("video_sessions").doc(session_id);
    const sessionDoc = await sessionRef.get();
    const existingSessionVideos = sessionDoc.exists
      ? sessionDoc.data()?.videos || []
      : [];

    const mergedVideosByScene = new Map(
      existingSessionVideos.map((v) => [v.scene_id, v]),
    );
    for (const v of videos) {
      mergedVideosByScene.set(v.scene_id, v);
    }
    const mergedVideos = Array.from(mergedVideosByScene.values()).sort(
      (a, b) => Number(a.scene_id) - Number(b.scene_id),
    );

    // Fetch pricing from FAL API
    const pricingResponse = await fetch(
      `https://api.fal.ai/v1/models/pricing?endpoint_id=${modelEndpoint}`,
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
    const i2vPrice = pricingData.prices?.find(
      (p) => p.endpoint_id === modelEndpoint,
    );

    if (!i2vPrice) {
      throw new Error("Image-to-video pricing not found in FAL API response");
    }

    const i2vUnit = extractUnit(i2vPrice);
    const totalDurationSeconds = videos.reduce((sum, v) => {
      const d = durationsBySceneId.get(v.scene_id);
      return sum + clampDurationSeconds(d, 8);
    }, 0);
    const unitCount = isPerSecondUnit(i2vUnit)
      ? totalDurationSeconds
      : videos.length;
    const falVideoCost = unitCount * i2vPrice.unit_price;

    // Update Firestore session
    const allSceneIds = Array.isArray(script_data?.scenes)
      ? script_data.scenes.map((s) => s.id)
      : [];
    const mergedSceneIds = new Set(mergedVideos.map((v) => v.scene_id));
    const isComplete =
      allSceneIds.length > 0 &&
      allSceneIds.every((id) => mergedSceneIds.has(id));

    if (sessionDoc.exists) {
      await sessionRef.update({
        videos: mergedVideos,
        status: isComplete ? "videos_generated" : "videos_in_progress",
        updated_at: new Date().toISOString(),
      });
    } else {
      await sessionRef.set({
        videos: mergedVideos,
        status: isComplete ? "videos_generated" : "videos_in_progress",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    const existingCosts = projectDoc.data()?.costs || {};

    // Calculate new costs
    const newFalVideosCost = (existingCosts.fal_videos || 0) + falVideoCost;
    const newStep4FalVideosCost =
      (existingCosts.step4?.fal_videos || 0) + falVideoCost;
    const newStep4Total = (existingCosts.step4?.total || 0) + falVideoCost;
    const newTotal = (existingCosts.total || 0) + falVideoCost;

    // Update project progress
    await projectRef.update({
      current_step: isComplete ? 5 : 4,
      status: isComplete ? "videos_generated" : "videos_in_progress",
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
      videos: mergedVideos,
    });
  } catch (error) {
    console.error("Generate videos error:", error);
    return NextResponse.json(
      { error: "Failed to generate videos", message: error.message },
      { status: 500 },
    );
  }
}
