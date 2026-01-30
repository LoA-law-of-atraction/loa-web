import { NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/utils/firebaseAdmin";

export async function POST(request) {
  try {
    const { script_data, selected_character } = await request.json();

    if (!script_data || !selected_character) {
      return NextResponse.json(
        { error: "Missing script_data or selected_character" },
        { status: 400 }
      );
    }

    const sessionId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Step 1: Generate voiceover with ElevenLabs
    console.log("Generating voiceover...");
    const voiceoverResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selected_character.voice_id}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: script_data.script,
          model_id: "eleven_multilingual_v2",
          output_format: "mp3_44100_128",
          voice_settings: {
            stability: 0.65,
            similarity_boost: 0.75,
            style: 0.1,
            use_speaker_boost: true,
          },
        }),
      }
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
    const imagePromises = script_data.scenes.map(async (scene) => {
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
          `Fal AI image generation error for scene ${scene.id}: ${imageResponse.statusText}`
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

    const images = await Promise.all(imagePromises);

    // Step 3: Store in Firestore
    const db = getAdminDb();
    await db.collection("video_sessions").doc(sessionId).set({
      session_id: sessionId,
      script_data,
      selected_character,
      voiceover_url: voiceoverUrl,
      images,
      status: "images_generated",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      voiceover_url: voiceoverUrl,
      images,
    });
  } catch (error) {
    console.error("Generate images error:", error);
    return NextResponse.json(
      { error: "Failed to generate images", message: error.message },
      { status: 500 }
    );
  }
}
