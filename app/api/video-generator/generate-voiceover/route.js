import { NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/utils/firebaseAdmin";
import { calculateElevenLabsCost } from "@/utils/costCalculator";

export async function POST(request) {
  try {
    const { project_id, script, character, voice_settings } = await request.json();

    if (!project_id || !script || !character) {
      return NextResponse.json(
        { error: "Missing project_id, script, or character" },
        { status: 400 }
      );
    }

    // Use provided voice settings or defaults
    const settings = voice_settings || {
      stability: 0.65,
      similarity_boost: 0.75,
      style: 0.1,
      use_speaker_boost: true,
    };

    const sessionId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Convert pause markers to SSML break tags
    // Supports: [pause:1s], [pause:500ms], [pause]
    let processedScript = script;

    // Replace [pause:Xs] or [pause:Xms] with SSML break tags
    processedScript = processedScript.replace(/\[pause:(\d+(?:\.\d+)?)(s|ms)\]/gi, '<break time="$1$2"/>');

    // Replace simple [pause] with 1 second break
    processedScript = processedScript.replace(/\[pause\]/gi, '<break time="1s"/>');

    // Generate voiceover with ElevenLabs
    console.log("Generating voiceover...");
    const voiceoverResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${character.voice_id}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: processedScript,
          model_id: "eleven_multilingual_v2",
          output_format: "mp3_44100_128",
          voice_settings: settings,
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

    // Calculate ElevenLabs cost
    const characterCount = script.length;
    const elevenLabsCost = calculateElevenLabsCost(characterCount);

    // Update project with voiceover URL and progress
    const db = getAdminDb();
    const projectRef = db.collection("projects").doc(project_id);

    // Get existing costs
    const projectDoc = await projectRef.get();
    const existingCosts = projectDoc.data()?.costs || {};

    // Calculate new costs
    const newElevenLabsCost = (existingCosts.elevenlabs || 0) + elevenLabsCost;
    const newStep2ElevenLabsCost = (existingCosts.step2?.elevenlabs || 0) + elevenLabsCost;
    const newStep2Total = (existingCosts.step2?.total || 0) + elevenLabsCost;
    const newTotal = (existingCosts.total || 0) + elevenLabsCost;

    await projectRef.update({
      voiceover_url: voiceoverUrl,
      session_id: sessionId,
      current_step: 3,
      status: "voiceover_generated",
      costs: {
        ...existingCosts,
        // Legacy API-level
        elevenlabs: newElevenLabsCost,
        // Step-level
        step2: {
          ...existingCosts.step2,
          elevenlabs: newStep2ElevenLabsCost,
          total: newStep2Total,
        },
        total: newTotal,
      },
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      voiceover_url: voiceoverUrl,
    });
  } catch (error) {
    console.error("Generate voiceover error:", error);
    return NextResponse.json(
      { error: "Failed to generate voiceover", message: error.message },
      { status: 500 }
    );
  }
}
