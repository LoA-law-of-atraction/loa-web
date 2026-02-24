import { NextResponse } from "next/server";
import { getPrompt } from "@/utils/promptService";

const FORMAT_SUFFIX = " Vertical 9:16, no text, no words, no letters.";

/**
 * POST /api/quote-videos/final-image-prompt
 * Body: { prompt: string } — scene prompt from Image to prompt
 * Returns the final text-to-image prompt (scene + dark Ghibli style + format suffix) for display.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const scenePrompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!scenePrompt) {
      return NextResponse.json(
        { success: false, error: "Missing prompt" },
        { status: 400 }
      );
    }

    const darkGhibliBlock = (getPrompt("dark-ghibli-style", {}) || "").trim();
    let withStyle;
    if (darkGhibliBlock && darkGhibliBlock.includes("[INSERT DESCRIPTION HERE]")) {
      withStyle = darkGhibliBlock.replace("[INSERT DESCRIPTION HERE]", scenePrompt);
    } else if (darkGhibliBlock) {
      withStyle = `Style (mandatory): ${darkGhibliBlock}. Scene: ${scenePrompt}`;
    } else {
      withStyle = scenePrompt;
    }
    const finalPrompt =
      withStyle.toLowerCase().includes("no text") && withStyle.toLowerCase().includes("9:16")
        ? withStyle
        : withStyle + "." + FORMAT_SUFFIX;

    return NextResponse.json({
      success: true,
      final_prompt: finalPrompt,
    });
  } catch (error) {
    console.error("Final image prompt error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to build final prompt" },
      { status: 500 }
    );
  }
}
