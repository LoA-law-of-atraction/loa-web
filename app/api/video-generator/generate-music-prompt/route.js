import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getPrompt } from "@/utils/promptService";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const {
      topic,
      script,
      scene_locations,
    } = await request.json();

    const scene_locations_text =
      scene_locations && typeof scene_locations === "string"
        ? scene_locations.trim()
        : Array.isArray(scene_locations) && scene_locations.length > 0
          ? scene_locations
              .map((s) =>
                s.location_name
                  ? `Scene ${s.scene_id}: ${s.location_name}`
                  : `Scene ${s.scene_id}: (no location)`,
              )
              .join("\n")
          : "None specified";

    const prompt = getPrompt("music-prompt-from-theme", {
      topic: String(topic || "").trim(),
      script: String(script || "").trim(),
      scene_locations: scene_locations_text,
    });

    const message = await anthropic.messages.create({
      model: process.env.NEXT_PUBLIC_CLAUDE_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (message.content?.[0]?.text || "").trim();

    return NextResponse.json({
      success: true,
      prompt: text,
    });
  } catch (error) {
    console.error("Generate music prompt error:", error);
    return NextResponse.json(
      { error: "Failed to generate music prompt", message: error.message },
      { status: 500 },
    );
  }
}
