import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAdminDb } from "@/utils/firebaseAdmin";
import { getPrompt } from "@/utils/promptService";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function stripBreathingMentions(text) {
  if (!text) return text;
  const withoutBreathing = String(text)
    .replace(/\b(breathing|breathes|breathe|breath)\b/gi, "")
    .replace(/\b(inhale|inhales|inhaling|inhaled)\b/gi, "")
    .replace(/\b(exhale|exhales|exhaling|exhaled)\b/gi, "");
  return withoutBreathing.replace(/\s{2,}/g, " ").replace(/\s+([,.;:])/g, "$1").trim();
}

const CLAUDE_PRICING = {
  input: 3.0 / 1_000_000,
  output: 15.0 / 1_000_000,
};

/**
 * POST /api/quote-videos/generate-video-prompt
 * Body: { project_id, scene_id, image_prompt? }
 * Generates a motion prompt from the scene's image prompt (and optional quote context).
 * Same idea as video-generator/generate-video-prompt but for quote-videos (no locations/actions/camera/character).
 */
export async function POST(request) {
  try {
    const { project_id, scene_id, image_prompt: bodyImagePrompt } = await request.json();

    if (!project_id || !scene_id) {
      return NextResponse.json(
        { error: "Missing project_id or scene_id" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const projectRef = db.collection("quote_projects").doc(project_id);
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectData = projectDoc.data();
    const quoteText = (projectData.quote_text || "").trim();

    let imagePrompt = (bodyImagePrompt && String(bodyImagePrompt).trim()) || "";
    if (!imagePrompt) {
      const sceneRef = projectRef.collection("scenes").doc(String(scene_id));
      const sceneDoc = await sceneRef.get();
      if (sceneDoc.exists) {
        const d = sceneDoc.data();
        const prompts = Array.isArray(d.image_prompts) ? d.image_prompts : [];
        const meta = Array.isArray(d.image_metadata) ? d.image_metadata : [];
        const selIdx = typeof d.selected_image_index === "number" ? d.selected_image_index : 0;
        imagePrompt = (prompts[selIdx] && String(prompts[selIdx]).trim()) || meta[selIdx]?.prompt_sent_to_model || d.image_prompt || "";
      }
    }

    const voiceover = quoteText ? quoteText.slice(0, 500) : "";
    const locationDescription = "Keep the environment consistent with the selected image.";

    const prompt = getPrompt("video-prompt-generation", {
      voiceover,
      image_prompt: imagePrompt,
      location_description: locationDescription,
      action_guidance: "",
      camera_movement_guidance: "",
      character_motion_guidance: "",
    });

    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || process.env.NEXT_PUBLIC_CLAUDE_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 250,
      temperature: 0.8,
      messages: [{ role: "user", content: prompt }],
    });

    const motionPromptRaw = (message.content?.[0]?.text || "").trim();
    const motionPrompt = stripBreathingMentions(motionPromptRaw);

    const inputTokens = message.usage?.input_tokens || 0;
    const outputTokens = message.usage?.output_tokens || 0;
    const cost = inputTokens * CLAUDE_PRICING.input + outputTokens * CLAUDE_PRICING.output;

    const existing = projectData.costs || {};
    const step3 = existing.step3 || {};
    await projectRef.update({
      costs: {
        ...existing,
        step3: {
          ...step3,
          claude: (step3.claude || 0) + cost,
          total: (step3.total || 0) + cost,
        },
        total: (existing.total || 0) + cost,
      },
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      motion_prompt: motionPrompt,
      cost,
    });
  } catch (error) {
    console.error("Quote generate-video-prompt error:", error);
    return NextResponse.json(
      { error: "Failed to generate video prompt", message: error?.message || String(error) },
      { status: 500 }
    );
  }
}
