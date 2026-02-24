import { NextResponse } from "next/server";
import { getPrompt } from "@/utils/promptService";

/**
 * GET /api/quote-videos/default-motion-prompt
 * Returns the default video (motion) prompt from the prompts folder for display in the UI.
 */
export async function GET() {
  try {
    const prompt = (getPrompt("quote/video-motion-prompt", {}) || "").trim();
    return NextResponse.json({ success: true, prompt });
  } catch (error) {
    console.error("Quote default-motion-prompt error:", error);
    return NextResponse.json({ success: true, prompt: "" });
  }
}
