import { NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/utils/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";
import {
  resolveImageModel,
  buildTextToImageBody,
  getImageUrlFromResult,
} from "../text-to-image-models";
import { getPrompt } from "@/utils/promptService";

const COLLECTION = "quote_projects";
const VIDEO_HISTORY_COLLECTION = "quote_video_history";
const VIDEO_MODEL = process.env.FAL_IMAGE_TO_VIDEO_MODEL || process.env.FAL_VEO_MODEL || "fal-ai/veo3.1/fast/image-to-video";
const VIDEO_DURATION = 8;

/**
 * POST /api/quote-videos/generate-video
 * Body: { project_id, image_model?: string }
 * 1) Generate one image from theme/quote using project text_to_image_model or body image_model.
 * 2) Generate video from image (Fal image-to-video).
 * 3) Upload video to Firebase Storage, update quote_projects.animation_video_url and duration_seconds.
 */
export async function POST(request) {
  try {
    const { project_id, image_model: bodyImageModel } = await request.json();

    if (!project_id) {
      return NextResponse.json(
        { error: "Missing project_id" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const projectRef = db.collection(COLLECTION).doc(project_id);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const data = projectDoc.data();
    const theme = (data.theme || "").trim();
    const quoteText = (data.quote_text || "").trim();
    let imageUrl = (data.background_image_url || "").trim();
    if (!imageUrl) {
      const scenesSnap = await projectRef.collection("scenes").get();
      const scenes = scenesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      scenes.sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
      const s0 = scenes[0];
      if (s0) {
        const urls = Array.isArray(s0.image_urls) ? s0.image_urls : [];
        const idx = typeof s0.selected_image_index === "number" ? s0.selected_image_index : 0;
        imageUrl = (urls[idx] || (s0.background_image_url || "")).trim();
      }
    }
    const imageModel = resolveImageModel(data.text_to_image_model, bodyImageModel);

    if (!imageUrl && !theme && !quoteText) {
      return NextResponse.json(
        { error: "Project has no image, theme or quote. Complete the Image step or Quote step first." },
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

    if (!imageUrl) {
      const imagePrompt =
        `Abstract motivational background, inspiring atmosphere, soft gradients, cinematic, vertical 9:16, no text, no words, no letters. Theme: ${theme || "motivation"}.`;
      const falBody = buildTextToImageBody(imagePrompt, 1, imageModel);
      const imageRes = await fetch(`https://fal.run/${imageModel}`, {
        method: "POST",
        headers: {
          Authorization: `Key ${falKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(falBody),
      });
      if (!imageRes.ok) {
        const errText = await imageRes.text();
        throw new Error(`Image generation failed: ${imageRes.status} ${errText}`);
      }
      const imageResult = await imageRes.json();
      imageUrl = getImageUrlFromResult(imageResult);
      if (!imageUrl) throw new Error("No image URL in Fal response");
    }

    // Generate video from image (image-to-video)
    let videoPrompt = "";
    try {
      videoPrompt = (getPrompt("quote/video-motion-prompt", {}) || "").trim();
    } catch (_) {}
    if (!videoPrompt) {
      throw new Error("Missing prompt file: prompts/quote/video-motion-prompt.txt");
    }
    const videoRes = await fetch(`https://fal.run/${VIDEO_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageUrl,
        prompt: videoPrompt,
        duration: VIDEO_DURATION,
      }),
    });

    if (!videoRes.ok) {
      const errText = await videoRes.text();
      throw new Error(`Video generation failed: ${videoRes.status} ${errText}`);
    }

    const videoResult = await videoRes.json();
    const falVideoUrl = videoResult.video?.url;
    if (!falVideoUrl) {
      throw new Error("No video URL in Fal response");
    }

    // 3) Download and upload to Firebase Storage
    const videoDataRes = await fetch(falVideoUrl);
    if (!videoDataRes.ok) {
      throw new Error(`Failed to download generated video: ${videoDataRes.status}`);
    }
    const videoBuffer = await videoDataRes.arrayBuffer();
    const bucket = getAdminStorage().bucket();
    const token = uuidv4();
    const shortToken = token.slice(0, 8);
    const storagePath = `quote-videos/${project_id}/background_${shortToken}.mp4`;
    const file = bucket.file(storagePath);

    await file.save(Buffer.from(videoBuffer), {
      metadata: {
        contentType: "video/mp4",
        metadata: {
          firebaseStorageDownloadTokens: token,
          project_id,
        },
      },
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;

    const falCost = Number(process.env.FAL_QUOTE_VIDEO_COST) || 0;
    const projectData = projectDoc.data() || {};
    const existing = projectData.costs || {};
    const step3 = existing.step3 || {};
    const newStep3Fal = (step3.fal || 0) + falCost;
    const newStep3Total = (step3.total || 0) + falCost;
    const newTotal = (existing.total || 0) + falCost;

    const now = new Date().toISOString();
    let prevHistory = Array.isArray(projectData.animation_video_history) ? projectData.animation_video_history : [];
    if (prevHistory.length === 0 && (projectData.animation_video_url || "").trim()) {
      prevHistory = [{ url: projectData.animation_video_url.trim(), duration_seconds: projectData.duration_seconds ?? VIDEO_DURATION, created_at: projectData.updated_at || now }];
    }
    const newEntry = { url: publicUrl, duration_seconds: VIDEO_DURATION, created_at: now };
    const animation_video_history = [...prevHistory, newEntry].slice(-50);

    await projectRef.update({
      animation_video_url: publicUrl,
      duration_seconds: VIDEO_DURATION,
      animation_video_history,
      updated_at: now,
      costs: {
        ...projectData.costs,
        step3: { ...step3, fal: newStep3Fal, total: newStep3Total },
        total: newTotal,
      },
    });

    await db.collection(VIDEO_HISTORY_COLLECTION).add({
      project_id: project_id,
      scene_id: null,
      url: publicUrl,
      duration_seconds: VIDEO_DURATION,
      created_at: now,
      project_name: (projectData.name || "").trim() || null,
      scene_label: null,
    });

    return NextResponse.json({
      success: true,
      animation_video_url: publicUrl,
      duration_seconds: VIDEO_DURATION,
      cost: falCost,
    });
  } catch (error) {
    console.error("Quote generate-video error:", error);
    return NextResponse.json(
      { error: "Failed to generate video", message: error.message },
      { status: 500 }
    );
  }
}
