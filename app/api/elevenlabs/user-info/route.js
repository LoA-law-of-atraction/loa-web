import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("https://api.elevenlabs.io/v1/user", {
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const userData = await response.json();

    console.log("ElevenLabs user data:", userData);

    // Character count is in subscription object
    const characterCount = userData.subscription?.character_count || 0;
    const characterLimit = userData.subscription?.character_limit || 0;

    return NextResponse.json({
      success: true,
      subscription: userData.subscription,
      character_count: characterCount,
      character_limit: characterLimit,
      characters_remaining: characterLimit - characterCount,
      can_extend_character_limit: userData.subscription?.can_extend_character_limit || false,
      tier: userData.subscription?.tier || 'unknown',
    });
  } catch (error) {
    console.error("ElevenLabs user info error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user info", message: error.message },
      { status: 500 }
    );
  }
}
