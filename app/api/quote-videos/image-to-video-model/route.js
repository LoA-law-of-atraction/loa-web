import { NextResponse } from "next/server";

/**
 * GET /api/quote-videos/image-to-video-model
 * Returns the image-to-video model endpoint used for quote-videos (same as Character Shorts).
 * Uses FAL_IMAGE_TO_VIDEO_MODEL or FAL_VEO_MODEL.
 */
function getImageToVideoModelEndpoint() {
  return (
    process.env.FAL_IMAGE_TO_VIDEO_MODEL ||
    process.env.FAL_VEO_MODEL ||
    "fal-ai/veo3.1/fast/image-to-video"
  );
}

export async function GET() {
  try {
    const model = getImageToVideoModelEndpoint();
    return NextResponse.json({ success: true, model: model || null });
  } catch (error) {
    console.error("Quote image-to-video-model error:", error);
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 }
    );
  }
}
