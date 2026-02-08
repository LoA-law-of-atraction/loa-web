import { NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/utils/firebaseAdmin";

export async function POST(request) {
  try {
    const { session_id, scene_id } = await request.json();

    if (!session_id || scene_id === undefined) {
      return NextResponse.json(
        { error: "Missing session_id or scene_id" },
        { status: 400 }
      );
    }

    // Get session data
    const db = getAdminDb();
    const docRef = db.collection("video_sessions").doc(session_id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const sessionData = doc.data();
    const scene = sessionData.scenes.find((s) => s.id === scene_id);

    if (!scene) {
      return NextResponse.json(
        { error: "Scene not found" },
        { status: 404 }
      );
    }

    // Generate new image with Fal AI
    console.log(`Regenerating image for scene ${scene_id}...`);
    const imageResponse = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        "Authorization": `Key ${process.env.FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: scene.image_prompt,
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
    const sceneIndex = sessionData.scenes.findIndex((s) => s.id === scene_id);
    sessionData.scenes[sceneIndex].image_url = publicImageUrl;
    sessionData.scenes[sceneIndex].approved = false; // Reset approval
    sessionData.updated_at = new Date().toISOString();

    await docRef.update({
      scenes: sessionData.scenes,
      updated_at: sessionData.updated_at,
    });

    return NextResponse.json({
      success: true,
      image_url: publicImageUrl,
      data: sessionData,
    });
  } catch (error) {
    console.error("Regenerate scene error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
