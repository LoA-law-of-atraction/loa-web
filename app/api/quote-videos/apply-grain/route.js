import { NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/utils/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";

const COLLECTION = "quote_projects";
const GRAIN_MODEL = "fal-ai/post-processing/grain";
const GRAIN_STYLES = ["modern", "analog", "kodak", "fuji", "cinematic", "newspaper"];

/**
 * POST /api/quote-videos/apply-grain
 * Body: { project_id, image_url, scene_id?: string, grain_style?: string, grain_intensity?: number, grain_scale?: number }
 * Applies fal-ai/post-processing/grain to the given image, uploads the result to Firebase, and adds it as a new image
 * (to generated_images and, if scene_id, to that scene's image_urls) without replacing the original.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      project_id,
      image_url: inputImageUrl,
      scene_id: sceneId,
      grain_style: grainStyle,
      grain_intensity: grainIntensity,
      grain_scale: grainScale,
    } = body || {};

    if (!project_id || !inputImageUrl || typeof inputImageUrl !== "string") {
      return NextResponse.json(
        { error: "Missing project_id or image_url" },
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

    const style = GRAIN_STYLES.includes(grainStyle) ? grainStyle : "modern";
    const intensity = Number.isFinite(Number(grainIntensity))
      ? Math.max(0, Math.min(1, Number(grainIntensity)))
      : 0.4;
    const scale = Number.isFinite(Number(grainScale))
      ? Math.max(1, Math.min(100, Number(grainScale)))
      : 10;

    const grainRes = await fetch(`https://fal.run/${GRAIN_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: inputImageUrl.trim(),
        grain_style: style,
        grain_intensity: intensity,
        grain_scale: scale,
      }),
    });

    if (!grainRes.ok) {
      const errText = await grainRes.text();
      throw new Error(`Grain post-processing failed: ${grainRes.status} ${errText}`);
    }

    const grainResult = await grainRes.json();
    const grainImageUrl = grainResult?.images?.[0]?.url;
    if (!grainImageUrl) {
      throw new Error("No image URL in grain response");
    }

    const imageDataRes = await fetch(grainImageUrl);
    if (!imageDataRes.ok) {
      throw new Error(`Failed to download grained image: ${imageDataRes.status}`);
    }
    const imageBuffer = await imageDataRes.arrayBuffer();
    const bucket = getAdminStorage().bucket();
    const token = uuidv4();
    const shortToken = token.slice(0, 8);
    const storagePath = `quote-videos/${project_id}/grain_${shortToken}.jpg`;
    const file = bucket.file(storagePath);

    await file.save(Buffer.from(imageBuffer), {
      metadata: {
        contentType: "image/jpeg",
        metadata: {
          firebaseStorageDownloadTokens: token,
          project_id,
        },
      },
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
    const now = new Date().toISOString();

    const db = getAdminDb();
    const projectRef = db.collection(COLLECTION).doc(project_id);
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const existing = projectDoc.data() || {};

    let promptForGenerated = (existing.image_prompt_used || "").trim();
    if (sceneId && typeof sceneId === "string") {
      const sceneRef = projectRef.collection("scenes").doc(sceneId);
      const sceneDoc = await sceneRef.get();
      if (sceneDoc.exists) {
        const scene = sceneDoc.data() || {};
        const prevUrls = Array.isArray(scene.image_urls) ? scene.image_urls : [];
        const prevPrompts = Array.isArray(scene.image_prompts) ? scene.image_prompts : [];
        const prevMeta = Array.isArray(scene.image_metadata) ? scene.image_metadata : [];
        const selectedIdx = typeof scene.selected_image_index === "number" ? Math.max(0, Math.min(scene.selected_image_index, prevPrompts.length - 1)) : Math.max(0, prevUrls.length - 1);
        const originalPrompt = (prevPrompts[selectedIdx] || prevMeta[selectedIdx]?.prompt_sent_to_model || "").trim();
        promptForGenerated = originalPrompt || promptForGenerated;
        const newUrls = [...prevUrls, publicUrl].slice(-30);
        const newPrompts = [...prevPrompts, originalPrompt || ""].slice(-30);
        const newMeta = [...prevMeta, { grain_style: style, grain_intensity: intensity, grain_scale: scale, created_at: now }].slice(-30);
        await sceneRef.update({
          image_urls: newUrls,
          image_prompts: newPrompts,
          selected_image_index: newUrls.length - 1,
          image_metadata: newMeta,
          updated_at: now,
        });
      }
    } else {
      const prevHistory = Array.isArray(existing.background_image_history) ? existing.background_image_history : [];
      const newEntry = {
        url: publicUrl,
        created_at: now,
        prompt_sent_to_model: promptForGenerated || null,
        model_endpoint: GRAIN_MODEL,
      };
      const newHistory = [...prevHistory, newEntry].slice(-30);
      await projectRef.update({
        background_image_history: newHistory,
        updated_at: now,
      });
    }

    await projectRef.collection("generated_images").add({
      url: publicUrl,
      storage_path: storagePath,
      created_at: now,
      scene_id: sceneId || null,
      prompt_sent_to_model: promptForGenerated || null,
      model_endpoint: GRAIN_MODEL,
      grain_style: style,
      grain_intensity: intensity,
      grain_scale: scale,
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (error) {
    console.error("Quote apply-grain error:", error);
    return NextResponse.json(
      { error: "Failed to apply grain", message: error.message },
      { status: 500 }
    );
  }
}
