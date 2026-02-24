import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getPrompt } from "@/utils/promptService";
import { getAdminDb, getAdminStorage } from "@/utils/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";
import {
  resolveImageModel,
  buildTextToImageBody,
  getImageUrlsFromResult,
} from "../text-to-image-models";

const COLLECTION = "quote_projects";
const FORMAT_SUFFIX = " Vertical 9:16, no text, no words, no letters.";

/**
 * POST /api/quote-videos/generate-branded-from-reference
 * Body: { reference_image_url: string, project_id?: string, num_images?: number, image_model?: string }
 * Uses project text_to_image_model or body image_model for text-to-image.
 * Pipeline: (1) Extract scene_prompt + scene_metadata from reference (analysis only).
 *           (2) Apply brand style block → final_prompt, final_negative_prompt.
 *           (3) Single text-to-image pass with num_images (2-4).
 * Returns: final_prompt, final_negative_prompt, generated_images: [{ url }], metadata, best_index (0).
 * If project_id provided, saves first candidate as background_image_url.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const referenceImageUrl = typeof body.reference_image_url === "string" ? body.reference_image_url.trim() : "";
    const projectId = body.project_id || null;
    const numImages = Math.min(6, Math.max(2, parseInt(body.num_images, 10) || 4));
    let projectModel = null;
    if (projectId) {
      const db = getAdminDb();
      const projectDoc = await db.collection(COLLECTION).doc(projectId).get();
      if (projectDoc.exists) projectModel = projectDoc.data()?.text_to_image_model;
    }
    const imageModel = resolveImageModel(projectModel, body.image_model);

    if (!referenceImageUrl || !/^https:\/\//i.test(referenceImageUrl)) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid reference_image_url" },
        { status: 400 }
      );
    }

    const falKey = process.env.FAL_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!falKey) {
      return NextResponse.json({ success: false, error: "FAL_API_KEY not set" }, { status: 500 });
    }
    if (!anthropicKey) {
      return NextResponse.json({ success: false, error: "ANTHROPIC_API_KEY not set" }, { status: 500 });
    }

    // —— Stage 1: Reference analysis (prompt extraction) ——
    const analysisPromptText = getPrompt("reference-image-to-scene-spec", {});
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "url", url: referenceImageUrl } },
            { type: "text", text: analysisPromptText },
          ],
        },
      ],
    });

    const textBlock = message.content?.find((b) => b.type === "text");
    let raw = (textBlock?.text || "").trim();
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("Branded-from-reference analysis parse error:", e.message);
      return NextResponse.json(
        { success: false, error: "Failed to parse scene description from image" },
        { status: 500 }
      );
    }

    const scene_prompt = (typeof parsed.scene_prompt === "string" ? parsed.scene_prompt : parsed.base_prompt || "").trim();
    const scene_metadata = parsed.scene_metadata && typeof parsed.scene_metadata === "object" ? parsed.scene_metadata : {};
    if (!scene_prompt) {
      return NextResponse.json(
        { success: false, error: "No scene_prompt extracted from reference image" },
        { status: 500 }
      );
    }

    // —— Stage 2: Apply brand layer ——
    const brandStyleBlock = (getPrompt("brand-style-block", {}) || "").trim();
    const brandNegativePrompt = (getPrompt("brand-negative-prompt", {}) || "").trim();
    const final_prompt =
      "hand-painted anime illustration of " + scene_prompt + ", " + brandStyleBlock + "." + FORMAT_SUFFIX;
    const final_negative_prompt = brandNegativePrompt;

    // —— Stage 3: Single-pass text-to-image (always 9:16) ——
    const falBody = buildTextToImageBody(final_prompt, numImages, imageModel);
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
      return NextResponse.json(
        { success: false, error: `Image generation failed: ${imageRes.status} ${errText}` },
        { status: 502 }
      );
    }

    const imageResult = await imageRes.json();
    const images = getImageUrlsFromResult(imageResult).map((url) => ({ url }));
    if (images.length === 0) {
      return NextResponse.json(
        { success: false, error: "No images returned from generator" },
        { status: 502 }
      );
    }

    const bucket = getAdminStorage().bucket();
    const prefix = projectId
      ? `quote-videos/${projectId}/branded_`
      : `reference/branded_`;
    const uploadedUrls = [];

    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i].url;
      if (!imageUrl) continue;
      const imageDataRes = await fetch(imageUrl);
      if (!imageDataRes.ok) continue;
      const imageBuffer = await imageDataRes.arrayBuffer();
      const token = uuidv4();
      const shortToken = token.slice(0, 8);
      const storagePath = `${prefix}${shortToken}_${i}.jpg`;
      const file = bucket.file(storagePath);
      await file.save(Buffer.from(imageBuffer), {
        metadata: {
          contentType: "image/jpeg",
          metadata: { firebaseStorageDownloadTokens: token },
        },
      });
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
      uploadedUrls.push({ url: publicUrl, index: i });
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to upload generated images" },
        { status: 500 }
      );
    }

    const best_index = 0; // Simple: first candidate; can add scoring later
    const bestUrl = uploadedUrls[best_index]?.url;

    if (projectId && bestUrl) {
      const db = getAdminDb();
      const projectRef = db.collection(COLLECTION).doc(projectId);
      const projectDoc = await projectRef.get();
      if (projectDoc.exists) {
        const existing = projectDoc.data()?.costs || {};
        const step2 = existing.step2 || {};
        const falCost = Number(process.env.FAL_QUOTE_IMAGE_COST) || 0;
        const totalCost = falCost * numImages;
        await projectRef.update({
          background_image_url: bestUrl,
          image_prompt_used: final_prompt,
          updated_at: new Date().toISOString(),
          costs: {
            ...existing,
            step2: {
              ...step2,
              fal: (step2.fal || 0) + totalCost,
              total: (step2.total || 0) + totalCost,
            },
            total: (existing.total || 0) + totalCost,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      final_prompt,
      final_negative_prompt,
      generated_images: uploadedUrls.map((o) => ({ url: o.url, index: o.index })),
      metadata: {
        scene_metadata,
        scene_prompt,
        aspect_ratio: "9:16",
        num_images: numImages,
      },
      best_index,
      background_image_url: bestUrl,
    });
  } catch (error) {
    console.error("Generate branded from reference error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Pipeline failed" },
      { status: 500 }
    );
  }
}
