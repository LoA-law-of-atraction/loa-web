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

    // Calculate cost per character from environment variables
    const planCost = parseFloat(process.env.ELEVENLABS_PLAN_COST || "0");
    const planCredits = parseFloat(process.env.ELEVENLABS_PLAN_CREDITS || "0");
    const costPerChar = planCredits > 0 ? planCost / planCredits : 0;

    // Determine plan name based on character limit
    let planName = userData.subscription?.tier || "Unknown";
    if (characterLimit === 10000) planName = "Free";
    else if (characterLimit === 30000) planName = "Starter";
    else if (characterLimit === 100000) planName = "Creator";
    else if (characterLimit === 500000) planName = "Pro";
    else if (characterLimit === 2000000) planName = "Scale";
    else if (characterLimit >= 11000000) planName = "Business";

    return NextResponse.json({
      success: true,
      subscription: userData.subscription,
      character_count: characterCount,
      character_limit: characterLimit,
      characters_remaining: characterLimit - characterCount,
      can_extend_character_limit: userData.subscription?.can_extend_character_limit || false,
      tier: planName,
      cost_per_char: costPerChar,
      plan_cost: planCost,
      plan_credits: planCredits,
    });
  } catch (error) {
    console.error("ElevenLabs user info error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user info", message: error.message },
      { status: 500 }
    );
  }
}
