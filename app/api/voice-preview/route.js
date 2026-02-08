import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { voice_id, text } = await request.json();

    if (!voice_id) {
      return NextResponse.json(
        { error: "voice_id is required" },
        { status: 400 }
      );
    }

    const sampleText = text || "Hello! This is a preview of my voice.";

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: sampleText,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("ElevenLabs API error:", error);
      return NextResponse.json(
        { error: "Failed to generate voice preview" },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Voice preview error:", error);
    return NextResponse.json(
      { error: "Failed to generate voice preview", message: error.message },
      { status: 500 }
    );
  }
}
