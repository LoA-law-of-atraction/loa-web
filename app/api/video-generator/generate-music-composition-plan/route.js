import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getPrompt } from "@/utils/promptService";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const { script, topic, music_length_ms = 60000 } =
      await request.json();

    if (!script?.trim() && !topic?.trim()) {
      return NextResponse.json(
        { error: "script or topic is required" },
        { status: 400 },
      );
    }

    const durationMs = Math.max(3000, Math.min(600000, Number(music_length_ms) || 60000));

    const prompt = getPrompt("music-composition-from-description", {
      script: String(script || "").trim(),
      topic: String(topic || "").trim(),
      music_length_ms: String(durationMs),
    });

    const message = await anthropic.messages.create({
      model: process.env.NEXT_PUBLIC_CLAUDE_MODEL,
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (message.content?.[0]?.text || "").trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from Claude response");
    }

    const compositionPlan = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!Array.isArray(compositionPlan.positive_global_styles)) {
      compositionPlan.positive_global_styles = [];
    }
    if (!Array.isArray(compositionPlan.negative_global_styles)) {
      compositionPlan.negative_global_styles = [];
    }
    if (!Array.isArray(compositionPlan.sections)) {
      compositionPlan.sections = [];
    }

    return NextResponse.json({
      success: true,
      composition_plan: compositionPlan,
    });
  } catch (error) {
    console.error("Generate music composition plan error:", error);
    return NextResponse.json(
      { error: "Failed to generate composition plan", message: error.message },
      { status: 500 },
    );
  }
}
