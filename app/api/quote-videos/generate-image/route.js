import { NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/utils/firebaseAdmin";
import { getPrompt } from "@/utils/promptService";
import { v4 as uuidv4 } from "uuid";
import {
  resolveImageModel,
  buildTextToImageBody,
  getImageUrlFromResult,
} from "../text-to-image-models";

const COLLECTION = "quote_projects";

const FORMAT_SUFFIX = " Vertical 9:16, no text, no words, no letters.";

/**
 * POST /api/quote-videos/generate-image
 * Body: { project_id, prompt?: string, image_model?: string }
 * If prompt is provided (from Image to prompt / reference), merges it with dark Ghibli style and sends to Fal.
 * Otherwise builds from theme/quote. Uses project text_to_image_model or body image_model (fal-ai/flux/schnell, xai/grok-imagine-image, fal-ai/nano-banana-pro).
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { project_id, prompt: promptOverride, image_model: bodyImageModel, scene_id: sceneId } = body || {};

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
    const imageModel = resolveImageModel(data.text_to_image_model, bodyImageModel);

    if (!theme && !quoteText && !(typeof promptOverride === "string" && promptOverride.trim())) {
      return NextResponse.json(
        { error: "Project has no theme or quote and no prompt provided. Complete the Quote step or use Image to prompt." },
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

    let imagePrompt;
    if (typeof promptOverride === "string" && promptOverride.trim()) {
      const scenePrompt = promptOverride.trim();
      const darkGhibliBlock = (getPrompt("dark-ghibli-style", {}) || "").trim();
      let withStyle;
      if (darkGhibliBlock && darkGhibliBlock.includes("[INSERT DESCRIPTION HERE]")) {
        withStyle = darkGhibliBlock.replace("[INSERT DESCRIPTION HERE]", scenePrompt);
      } else if (darkGhibliBlock) {
        withStyle = `Style (mandatory): ${darkGhibliBlock}. Scene: ${scenePrompt}`;
      } else {
        withStyle = scenePrompt;
      }
      imagePrompt = withStyle.toLowerCase().includes("no text") && withStyle.toLowerCase().includes("9:16")
        ? withStyle
        : withStyle + "." + FORMAT_SUFFIX;
    } else {
      const darkGhibliBlock = (getPrompt("dark-ghibli-style", {}) || "").trim();
      const quotePart = quoteText
        ? `Inspired by quote: "${quoteText.slice(0, 200)}". `
        : "";
      const scenePart = `${quotePart}Abstract motivational background, somber atmosphere, theme: ${theme || "motivation"}.`;
      let withStyle;
      if (darkGhibliBlock && darkGhibliBlock.includes("[INSERT DESCRIPTION HERE]")) {
        withStyle = darkGhibliBlock.replace("[INSERT DESCRIPTION HERE]", scenePart);
      } else if (darkGhibliBlock) {
        withStyle = `Style (mandatory): ${darkGhibliBlock}. Scene: ${scenePart}`;
      } else {
        withStyle = scenePart;
      }
      imagePrompt = withStyle.toLowerCase().includes("9:16") ? withStyle : withStyle + FORMAT_SUFFIX;
    }

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
    const imageUrl = getImageUrlFromResult(imageResult);
    if (!imageUrl) {
      throw new Error("No image URL in Fal response");
    }

    const imageDataRes = await fetch(imageUrl);
    if (!imageDataRes.ok) {
      throw new Error(`Failed to download generated image: ${imageDataRes.status}`);
    }
    const imageBuffer = await imageDataRes.arrayBuffer();
    const bucket = getAdminStorage().bucket();
    const token = uuidv4();
    const shortToken = token.slice(0, 8);
    const storagePath = `quote-videos/${project_id}/background_${shortToken}.jpg`;
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

    const falCost = Number(process.env.FAL_QUOTE_IMAGE_COST) || 0;
    const existing = projectDoc.data() || {};
    const step2 = existing.costs?.step2 || {};
    const newStep2Fal = (step2.fal || 0) + falCost;
    const newStep2Total = (step2.total || 0) + falCost;
    const newTotal = (existing.costs?.total || 0) + falCost;
    const now = new Date().toISOString();
    const newEntry = {
      url: publicUrl,
      created_at: now,
      prompt_sent_to_model: imagePrompt,
      model_endpoint: imageModel,
      fal_request_payload: falBody,
    };

    if (sceneId && typeof sceneId === "string") {
      const sceneRef = projectRef.collection("scenes").doc(sceneId);
      const sceneDoc = await sceneRef.get();
      if (sceneDoc.exists) {
        const scene = sceneDoc.data() || {};
        const prevUrls = Array.isArray(scene.image_urls) ? scene.image_urls : [];
        const prevPrompts = Array.isArray(scene.image_prompts) ? scene.image_prompts : [];
        const prevMeta = Array.isArray(scene.image_metadata) ? scene.image_metadata : [];
        const newUrls = [...prevUrls, publicUrl].slice(-30);
        const newPrompts = [...prevPrompts, imagePrompt].slice(-30);
        const newMeta = [...prevMeta, { prompt_sent_to_model: imagePrompt, model_endpoint: imageModel, fal_request_payload: falBody, created_at: now }].slice(-30);
        await sceneRef.update({
          image_urls: newUrls,
          image_prompts: newPrompts,
          selected_image_index: newUrls.length - 1,
          image_metadata: newMeta,
          updated_at: now,
        });
        await projectRef.update({
          image_prompt_used: imagePrompt,
          updated_at: now,
          costs: {
            ...existing.costs,
            step2: { ...step2, fal: newStep2Fal, total: newStep2Total },
            total: newTotal,
          },
        });
      } else {
        const prevHistory = Array.isArray(existing.background_image_history) ? existing.background_image_history : [];
        const newHistory = [...prevHistory, newEntry].slice(-30);
        await projectRef.update({
          background_image_url: publicUrl,
          background_image_history: newHistory,
          image_prompt_used: imagePrompt,
          updated_at: now,
          costs: {
            ...existing.costs,
            step2: { ...step2, fal: newStep2Fal, total: newStep2Total },
            total: newTotal,
          },
        });
      }
    } else {
      const prevHistory = Array.isArray(existing.background_image_history) ? existing.background_image_history : [];
      const newHistory = [...prevHistory, newEntry].slice(-30);
      await projectRef.update({
        background_image_url: publicUrl,
        background_image_history: newHistory,
        image_prompt_used: imagePrompt,
        updated_at: now,
        costs: {
          ...existing.costs,
          step2: { ...step2, fal: newStep2Fal, total: newStep2Total },
          total: newTotal,
        },
      });
    }

    // Keep generated images in history collection (for gallery selection)
    try {
      await projectRef.collection("generated_images").add({
        url: publicUrl,
        storage_path: `quote-videos/${project_id}/background_${shortToken}.jpg`,
        created_at: now,
        scene_id: sceneId || null,
        prompt_sent_to_model: imagePrompt,
        model_endpoint: imageModel,
      });
    } catch (histErr) {
      console.error("Quote generated_images history write error:", histErr);
    }

    return NextResponse.json({
      success: true,
      background_image_url: publicUrl,
      prompt_used: imagePrompt,
      cost: falCost,
    });
  } catch (error) {
    console.error("Quote generate-image error:", error);
    return NextResponse.json(
      { error: "Failed to generate image", message: error.message },
      { status: 500 }
    );
  }
}
