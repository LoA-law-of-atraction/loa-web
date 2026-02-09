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

    const db = getAdminDb();

    // Load character from Firestore characters collection (source of truth for voice_id and name)
    const characterId = character.character_id || character.id;
    let resolvedCharacter = character;

    if (characterId) {
      const charDoc = await db.collection("characters").doc(characterId).get();
      if (charDoc.exists) {
        const charData = charDoc.data();
        resolvedCharacter = {
          character_id: charDoc.id,
          id: charDoc.id,
          name: charData.name || character.name,
          voice_id: charData.voice_id || character.voice_id,
          image_urls: charData.image_urls || character.image_urls,
          ...charData,
        };
      }
    }

    if (!resolvedCharacter.voice_id) {
      return NextResponse.json(
        { error: "Character has no voice_id. Set it in the Characters page." },
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

    const projectRef = db.collection("projects").doc(project_id);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectData = projectDoc.data() || {};
    const sessionId = projectData.session_id || `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Convert pause markers to SSML break tags
    // Supports: [pause:1s], [pause:500ms], [pause]
    let processedScript = script;

    // Replace [pause:Xs] or [pause:Xms] with SSML break tags
    processedScript = processedScript.replace(/\[pause:(\d+(?:\.\d+)?)(s|ms)\]/gi, '<break time="$1$2"/>');

    // Replace simple [pause] with 1 second break
    processedScript = processedScript.replace(/\[pause\]/gi, '<break time="1s"/>');

    // Generate voiceover with ElevenLabs (use voice_id from characters collection)
    console.log("Generating voiceover...");
    const voiceoverResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${resolvedCharacter.voice_id}`,
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

    // Upload voiceover to Cloud Storage (unique file per generation)
    const voiceoverBuffer = await voiceoverResponse.arrayBuffer();
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const voiceoverFileName = `voiceovers/${sessionId}_${uniqueId}.mp3`;
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

    // Store in voiceovers collection (like music)
    const voiceoverMetadata = {
      voiceover_url: voiceoverUrl,
      storage_path: voiceoverFileName,
      project_id,
      session_id: sessionId,
      character_id: resolvedCharacter.character_id || resolvedCharacter.id || null,
      character_name: resolvedCharacter.name || null,
      script_length: characterCount,
      cost: elevenLabsCost,
      voice_settings: settings,
      timestamp: new Date().toISOString(),
    };

    const voiceoverRef = await db.collection("voiceovers").add(voiceoverMetadata);

    // Update project costs and auto-select this voiceover
    const existingCosts = projectData.costs || {};
    const newElevenLabsCost = (existingCosts.elevenlabs || 0) + elevenLabsCost;
    const newStep2ElevenLabsCost = (existingCosts.step2?.elevenlabs || 0) + elevenLabsCost;
    const newStep2Total = (existingCosts.step2?.total || 0) + elevenLabsCost;
    const newTotal = (existingCosts.total || 0) + elevenLabsCost;

    await projectRef.update({
      voiceover_id: voiceoverRef.id,
      voiceover_url: voiceoverUrl,
      session_id: sessionId,
      current_step: 3,
      status: "voiceover_generated",
      costs: {
        ...existingCosts,
        elevenlabs: newElevenLabsCost,
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
      voiceover_id: voiceoverRef.id,
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
