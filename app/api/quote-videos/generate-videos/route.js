import { NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/utils/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";
import { FieldValue } from "firebase-admin/firestore";
import { getPrompt } from "@/utils/promptService";

const COLLECTION = "quote_projects";
const VIDEO_HISTORY_COLLECTION = "quote_video_history";

function getImageToVideoModelEndpoint() {
  return (
    process.env.FAL_IMAGE_TO_VIDEO_MODEL ||
    process.env.FAL_VEO_MODEL ||
    "fal-ai/veo3.1/fast/image-to-video"
  );
}

function clampDurationSeconds(value, fallback = 8) {
  const n = Number(value);
  const numeric = Number.isFinite(n) ? n : fallback;
  return Math.max(1, Math.min(15, Math.round(numeric)));
}

function getDefaultMotionPrompt() {
  try {
    return (getPrompt("quote/video-motion-prompt", {}) || "").trim();
  } catch (_) {
    return "";
  }
}

function getDefaultNegativePrompt() {
  try {
    return (getPrompt("video-negative-prompt", {}) || "").trim();
  } catch (_) {
    return "";
  }
}

function getAudioInstructions() {
  try {
    return (getPrompt("video-audio-instructions", {}) || "").trim();
  } catch (_) {
    return "";
  }
}

/**
 * POST /api/quote-videos/generate-videos
 * Body: { project_id, images: [{ scene_id, image_url, duration }] }
 * Same flow as video-generator/generate-videos: one image-to-video per item,
 * upload to Storage, update scene doc with selected_video_url and video_urls.
 */
export async function POST(request) {
  try {
    const { project_id, images } = await request.json();

    if (!project_id || !images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "Missing project_id or images array" },
        { status: 400 }
      );
    }

    const falKey = process.env.FAL_API_KEY;
    if (!falKey) {
      return NextResponse.json(
        { error: "FAL_API_KEY not set" },
        { status: 500 }
      );
    }

    const modelEndpoint = getImageToVideoModelEndpoint();
    const db = getAdminDb();
    const projectRef = db.collection(COLLECTION).doc(project_id);
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const bucket = getAdminStorage().bucket();
    const storageBasePath = `quote-videos/${project_id}/scenes`;

    const videoPromises = images.map(async (image) => {
      const sceneId = String(image.scene_id);
      const imageUrl = image.image_url;
      const durationSeconds = clampDurationSeconds(image?.duration, 8);

      if (!imageUrl?.trim()) {
        throw new Error(`Missing image_url for scene ${sceneId}`);
      }

      const sceneRef = projectRef.collection("scenes").doc(sceneId);
      const sceneDoc = await sceneRef.get();
      const sceneData = sceneDoc.exists ? sceneDoc.data() : {};
      const motionPrompt =
        (sceneData.motion_prompt && String(sceneData.motion_prompt).trim()) ||
        getDefaultMotionPrompt();
      const negativePrompt =
        sceneData.video_negative_prompt != null
          ? String(sceneData.video_negative_prompt).trim()
          : getDefaultNegativePrompt();
      const audioInstruction = getAudioInstructions();
      const promptSentToModel = audioInstruction
        ? `${motionPrompt}\n\n${audioInstruction}\n\nAvoid: ${negativePrompt}`
        : negativePrompt
          ? `${motionPrompt}\n\nAvoid: ${negativePrompt}`
          : motionPrompt;

      const videoResponse = await fetch(`https://fal.run/${modelEndpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Key ${falKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: imageUrl.trim(),
          prompt: promptSentToModel,
          duration: durationSeconds,
        }),
      });

      if (!videoResponse.ok) {
        const errText = await videoResponse.text();
        throw new Error(
          `Fal image-to-video failed for scene ${sceneId}: ${videoResponse.status} ${errText}`
        );
      }

      const videoResult = await videoResponse.json();
      const falVideoUrl = videoResult.video?.url;
      if (!falVideoUrl) {
        throw new Error(`No video URL in Fal response for scene ${sceneId}`);
      }

      const videoDataRes = await fetch(falVideoUrl);
      if (!videoDataRes.ok) {
        throw new Error(
          `Failed to download generated video for scene ${sceneId}: ${videoDataRes.status}`
        );
      }
      const videoBuffer = await videoDataRes.arrayBuffer();
      const token = uuidv4();
      const shortToken = token.slice(0, 8);
      const filename = `scene_${sceneId}_${shortToken}.mp4`;
      const videoFileName = `${storageBasePath}/${filename}`;
      const videoFile = bucket.file(videoFileName);
      const contentType =
        videoDataRes.headers.get("content-type") || "video/mp4";

      await videoFile.save(Buffer.from(videoBuffer), {
        metadata: {
          contentType,
          metadata: {
            firebaseStorageDownloadTokens: token,
            project_id,
            scene_id: sceneId,
          },
        },
      });

      const encodedPath = encodeURIComponent(videoFileName);
      const publicVideoUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;

      const generationMetadata = {
        timestamp: new Date().toISOString(),
        scene_id: sceneId,
        input_image_url: imageUrl.trim(),
        video_url: publicVideoUrl,
        prompt_used: motionPrompt,
        negative_prompt_used: negativePrompt,
        prompt_sent_to_model: promptSentToModel,
        model_request_payload: {
          image_url: imageUrl.trim(),
          prompt: promptSentToModel,
          duration: durationSeconds,
        },
        model_endpoint: modelEndpoint,
        fal: {
          model_endpoint: modelEndpoint,
          output_url: falVideoUrl,
          request_id: videoResult?.request_id || videoResult?.requestId || null,
        },
        storage: {
          bucket: bucket.name,
          path: videoFileName,
          content_type: contentType,
        },
      };

      const nowIso = new Date().toISOString();
      await sceneRef.set(
        {
          video_urls: FieldValue.arrayUnion(publicVideoUrl),
          selected_video_url: publicVideoUrl,
          duration: durationSeconds,
          video_generation_history: FieldValue.arrayUnion(generationMetadata),
          last_video_generation_metadata: generationMetadata,
          updated_at: nowIso,
        },
        { merge: true }
      );

      const projectData = projectDoc.data() || {};
      await db.collection(VIDEO_HISTORY_COLLECTION).add({
        project_id,
        scene_id: sceneId,
        url: publicVideoUrl,
        duration_seconds: durationSeconds,
        created_at: nowIso,
        project_name: (projectData.name || "").trim() || null,
        scene_label: (sceneData.label || "").trim() || null,
      });

      return {
        scene_id: sceneId,
        video_url: publicVideoUrl,
        generation_metadata: generationMetadata,
      };
    });

    const videos = await Promise.all(videoPromises);

    const falCostPerVideo = Number(process.env.FAL_QUOTE_VIDEO_COST) || 0;
    const totalCost = falCostPerVideo * videos.length;
    const existing = projectDoc.data()?.costs || {};
    const step3 = existing.step3 || {};
    const newStep3Fal = (step3.fal || 0) + totalCost;
    const newStep3Total = (step3.total || 0) + totalCost;
    const newTotal = (existing.total || 0) + totalCost;

    await projectRef.update({
      updated_at: new Date().toISOString(),
      costs: {
        ...existing,
        step3: { ...step3, fal: newStep3Fal, total: newStep3Total },
        total: newTotal,
      },
    });

    return NextResponse.json({
      success: true,
      videos,
    });
  } catch (error) {
    console.error("Quote generate-videos error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate videos",
        message: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
