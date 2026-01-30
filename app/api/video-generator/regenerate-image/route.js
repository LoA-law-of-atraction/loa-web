import { NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/utils/firebaseAdmin";

export async function POST(request) {
  try {
    const { session_id, scene_id, image_prompt } = await request.json();

    if (!session_id || !scene_id || !image_prompt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate new image
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
      throw new Error(`Fal AI error: ${imageResponse.statusText}`);
    }

    const imageResult = await imageResponse.json();
    const imageUrl = imageResult.images[0].url;

    // Download and upload to Cloud Storage
    const imageDataResponse = await fetch(imageUrl);
    const imageBuffer = await imageDataResponse.arrayBuffer();

    const bucket = getAdminStorage().bucket();
    const imageFileName = `video-scenes/${session_id}/scene_${scene_id}_${Date.now()}.png`;
    const imageFile = bucket.file(imageFileName);

    await imageFile.save(Buffer.from(imageBuffer), {
      metadata: { contentType: "image/png" },
    });

    await imageFile.makePublic();
    const publicImageUrl = `https://storage.googleapis.com/${bucket.name}/${imageFileName}`;

    // Update Firestore
    const db = getAdminDb();
    const docRef = db.collection("video_sessions").doc(session_id);
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();
      const updatedImages = data.images.map((img) =>
        img.scene_id === scene_id ? { ...img, image_url: publicImageUrl } : img
      );

      await docRef.update({
        images: updatedImages,
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      image_url: publicImageUrl,
    });
  } catch (error) {
    console.error("Regenerate image error:", error);
    return NextResponse.json(
      { error: "Failed to regenerate image", message: error.message },
      { status: 500 }
    );
  }
}
