import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getPrompt } from "@/utils/promptService";
import { calculateClaudeCost } from "@/utils/costCalculator";
import { getAdminDb } from "@/utils/firebaseAdmin";

const COLLECTION = "quote_projects";

/**
 * POST /api/quote-videos/image-to-prompt
 * Body: { reference_image_url: string, project_id?: string }
 * Returns: { success, base_prompt, scene_prompt, base_negative_prompt, scene_metadata, cost? }
 * Uses Claude (vision) to extract a scene description from the reference image (analysis only; image is never used for img2img).
 * If project_id is provided, records Claude cost to project costs.step2.claude and step2.total.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const referenceImageUrl = typeof body.reference_image_url === "string" ? body.reference_image_url.trim() : "";
    const project_id = body.project_id || null;

    if (!referenceImageUrl) {
      return NextResponse.json(
        { success: false, error: "Missing reference_image_url" },
        { status: 400 }
      );
    }

    if (!/^https:\/\//i.test(referenceImageUrl)) {
      return NextResponse.json(
        { success: false, error: "reference_image_url must be an HTTPS URL" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "ANTHROPIC_API_KEY not set" },
        { status: 500 }
      );
    }

    const promptText = getPrompt("reference-image-to-scene-spec", {});

    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "url",
                url: referenceImageUrl,
              },
            },
            {
              type: "text",
              text: promptText,
            },
          ],
        },
      ],
    });

    const textBlock = message.content?.find((b) => b.type === "text");
    const raw = (textBlock?.text || "").trim();

    // Strip markdown code fence if present
    let jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Image-to-prompt JSON parse error:", e.message, "raw:", raw.slice(0, 300));
      return NextResponse.json(
        { success: false, error: "Failed to parse scene description from model output" },
        { status: 500 }
      );
    }

    const scene_prompt = typeof parsed.scene_prompt === "string" ? parsed.scene_prompt.trim() : (typeof parsed.base_prompt === "string" ? parsed.base_prompt.trim() : "");
    const base_prompt = scene_prompt || (typeof parsed.base_prompt === "string" ? parsed.base_prompt.trim() : "");
    const base_negative_prompt = typeof parsed.base_negative_prompt === "string" ? parsed.base_negative_prompt.trim() : "";
    const scene_metadata = parsed.scene_metadata && typeof parsed.scene_metadata === "object" ? parsed.scene_metadata : {};

    if (!scene_prompt && !base_prompt) {
      return NextResponse.json(
        { success: false, error: "Model did not return a valid scene_prompt or base_prompt" },
        { status: 500 }
      );
    }

    let cost = 0;
    const inputTokens = message.usage?.input_tokens ?? 0;
    const outputTokens = message.usage?.output_tokens ?? 0;
    cost = calculateClaudeCost(inputTokens, outputTokens);

    if (project_id && cost > 0) {
      const db = getAdminDb();
      const ref = db.collection(COLLECTION).doc(project_id);
      const doc = await ref.get();
      if (doc.exists) {
        const existing = doc.data()?.costs || {};
        const step2 = existing.step2 || {};
        const newStep2Claude = (step2.claude || 0) + cost;
        const newStep2Total = (step2.total || 0) + cost;
        const newTotal = (existing.total || 0) + cost;
        await ref.update({
          updated_at: new Date().toISOString(),
          costs: {
            ...existing,
            step2: { ...step2, claude: newStep2Claude, total: newStep2Total },
            total: newTotal,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      scene_prompt: scene_prompt || base_prompt,
      base_prompt: base_prompt || scene_prompt,
      base_negative_prompt,
      scene_metadata,
      cost,
    });
  } catch (error) {
    console.error("Quote image-to-prompt error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to extract prompt from image" },
      { status: 500 }
    );
  }
}
