import { NextResponse } from "next/server";
import { getAdminStorage } from "@/utils/firebaseAdmin";

export async function POST(request) {
  try {
    const { session_id, scene_id, image_prompt } = await request.json();

    if (!session_id || !scene_id || !image_prompt) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Call FAL AI to generate image
    const imageResponse = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        Authorization: `Key ${process.env.FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: image_prompt,
        image_size: "portrait_9_16",
        num_images: 1,
        enable_safety_checker: false,
      }),
    });

    if (!imageResponse.ok) {
      throw new Error(`FAL AI error: ${imageResponse.statusText}`);
    }

    const imageResult = await imageResponse.json();
    const imageUrl = imageResult.images[0].url;

    // Download image
    const imageDataResponse = await fetch(imageUrl);
    const imageBuffer = await imageDataResponse.arrayBuffer();

    // Upload to Cloud Storage
    const bucket = getAdminStorage().bucket();
    const imageFileName = `video-scenes/${session_id}/scene_${scene_id}.png`;
    const imageFile = bucket.file(imageFileName);

    await imageFile.save(Buffer.from(imageBuffer), {
      metadata: { contentType: "image/png" },
    });

    await imageFile.makePublic();
    const publicImageUrl = `https://storage.googleapis.com/${bucket.name}/${imageFileName}`;

    return NextResponse.json({
      success: true,
      scene_id,
      image_url: publicImageUrl,
    });
  } catch (error) {
    console.error("Generate single image error:", error);
    return NextResponse.json(
      { error: "Failed to generate image", message: error.message },
      { status: 500 }
    );
  }
}
