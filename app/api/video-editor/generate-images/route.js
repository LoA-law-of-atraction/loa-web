import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";
import { getAdminStorage } from "@/utils/firebaseAdmin";

export async function POST(request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (
      !data.topic ||
      !data.script ||
      !data.scenes ||
      !data.selected_character
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const sessionId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Step 1: Generate voiceover with ElevenLabs
    console.log("Generating voiceover...");
    const voiceoverResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${data.selected_character.voice_id}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: data.script,
          model_id: "eleven_multilingual_v2",
          output_format: "mp3_44100_128",
          voice_settings: {
            stability: 0.65,
            similarity_boost: 0.75,
            style: 0.1,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!voiceoverResponse.ok) {
      throw new Error(`ElevenLabs API error: ${voiceoverResponse.statusText}`);
    }

    // Upload voiceover to Cloud Storage
    const voiceoverBuffer = await voiceoverResponse.arrayBuffer();
    const voiceoverFileName = `voiceovers/${sessionId}.mp3`;
    const bucket = getAdminStorage().bucket();
    const voiceoverFile = bucket.file(voiceoverFileName);

    await voiceoverFile.save(Buffer.from(voiceoverBuffer), {
      metadata: { contentType: "audio/mpeg" },
    });

    await voiceoverFile.makePublic();
    const voiceoverUrl = `https://storage.googleapis.com/${bucket.name}/${voiceoverFileName}`;

    // Step 2: Generate 4 images in parallel with Fal AI
    console.log("Generating images...");
    const imagePromises = data.scenes.map(async (scene, index) => {
      const imageResponse = await fetch("https://fal.run/fal-ai/flux/schnell", {
        method: "POST",
        headers: {
          Authorization: `Key ${process.env.FAL_API_KEY}`,
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
        throw new Error(
          `Fal AI image generation error for scene ${scene.id}: ${imageResponse.statusText}`,
        );
      }

      const imageResult = await imageResponse.json();
      const imageUrl = imageResult.images[0].url;

      // Download image
      const imageDataResponse = await fetch(imageUrl);
      const imageBuffer = await imageDataResponse.arrayBuffer();

      // Upload to Cloud Storage
      const imageFileName = `video-scenes/${sessionId}/scene_${scene.id}.png`;
      const imageFile = bucket.file(imageFileName);

      await imageFile.save(Buffer.from(imageBuffer), {
        metadata: { contentType: "image/png" },
      });

      await imageFile.makePublic();
      const publicImageUrl = `https://storage.googleapis.com/${bucket.name}/${imageFileName}`;

      return {
        scene_id: scene.id,
        image_url: publicImageUrl,
      };
    });

    const generatedImages = await Promise.all(imagePromises);

    // Step 3: Store in Firestore
    const db = getAdminDb();
    const sessionData = {
      session_id: sessionId,
      topic: data.topic,
      script: data.script,
      selected_character: data.selected_character,
      voiceover_url: voiceoverUrl,
      status: "pending_approval",
      scenes: data.scenes.map((scene) => {
        const generatedImage = generatedImages.find(
          (img) => img.scene_id === scene.id,
        );
        return {
          id: scene.id,
          duration: scene.duration,
          voiceover: scene.voiceover,
          image_prompt: scene.image_prompt,
          motion_prompt: scene.motion_prompt,
          image_url: generatedImage?.image_url || null,
          video_url: null,
          approved: false,
        };
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.collection("video_sessions").doc(sessionId).set(sessionData);

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      editor_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/admin/video-editor?session=${sessionId}`,
      voiceover_url: voiceoverUrl,
      images: generatedImages,
    });
  } catch (error) {
    console.error("Generate images error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    );
  }
}
