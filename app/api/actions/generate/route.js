import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const { count = 1, keywords = null } = await request.json();

    if (!keywords || !keywords.trim()) {
      return NextResponse.json(
        { error: "Keywords are required" },
        { status: 400 }
      );
    }

    console.log(`Generating ${count} action(s) with keywords: ${keywords}...`);

    const keywordsList = keywords.split(',').map(k => k.trim()).filter(k => k);

    const prompt = `Generate ${count} character action/pose definitions for a "SOFT DYSTOPIA" / "HUMAN SCI-FI" video project.

KEYWORDS TO INCORPORATE: ${keywordsList.join(', ')}

AESTHETIC CONCEPT: "SOFT DYSTOPIA" / "HUMAN SCI-FI"
🌌 DYSTOPIAN world: overwhelming megacity, rain-soaked, nighttime, industrial tech everywhere
🫶 WARM soul: intimate human moments, analog nostalgia, quiet hope within harsh world
🕯️ EMOTIONAL CONTRAST: "Cold world, warm soul" - this is CRITICAL

VISUAL CONTEXT FOR ACTIONS:
- Future imagined from the past: analog tech, CRT glow, retro-future aesthetic
- Film grain, VHS texture, slight bloom, atmospheric particles
- NOT sterile modern sci-fi - 80s/90s vision of dystopian future
- Dystopian scale but human intimacy

COLOR AWARENESS (80% cold / 20% warm):
Actions should work with COLD BASE environments (deep navy, charcoal, oil-black, rainy blues) but feature WARM ACCENTS on character (amber, soft orange, tungsten light on face, muted gold)

LIGHTING CONTEXT:
- Warm tungsten/amber light typically on character's face
- Diffused neon through rain/fog in background
- "The world is harsh, but you're safe here"

ACTION REQUIREMENTS:
- Contemplative, lonely, quiet moments (NOT action-packed)
- Static poses (no motion verbs - character is still/paused)
- Focus on CHARACTER BODY POSITION, GESTURES, and FACIAL EXPRESSIONS only
- Retro-tech interaction when applicable (how character interacts with CRT monitors, analog devices, rotary phones)
- Expressions capturing both the harshness of the world and warmth of humanity

CRITICAL - DO NOT INCLUDE LOCATION/ENVIRONMENT DESCRIPTIONS:
❌ NO location details (don't mention: streets, buildings, rooms, rain, fog, etc.)
❌ NO environmental lighting (don't describe: neon lights, city lights, ambient lighting)
❌ NO scene setting or backdrop descriptions
✅ YES character pose and body position (standing, sitting, leaning, etc.)
✅ YES hand placement and gestures (hands in pockets, touching face, etc.)
✅ YES facial expressions and gaze direction (looking down, distant stare, etc.)
✅ YES lighting ON the character's face/body (warm glow on face, side-lit, etc.)

Each action should include:
1. A clear, descriptive name (2-4 words)
2. A detailed description focusing ONLY on character pose, gesture, and emotional state - NO location/environment details
3. 4 pose variations with specific details about body position, hand placement, facial expression, and how light falls on the character
4. An expression description capturing "cold world, warm soul" emotional contrast
5. 3-5 relevant tags

IMPORTANT: Generate DIVERSE actions that are DIFFERENT from each other. Each should explore different aspects of the keywords and emotional range. Remember: describe ONLY what the CHARACTER is doing, NOT where they are.

Return ONLY a JSON array with this exact structure:
[
  {
    "id": "action_name_in_snake_case",
    "name": "Action Name",
    "description": "Detailed description emphasizing emotional quality and dystopian context",
    "pose_variations": [
      "specific pose variation 1 with body position, hand placement, expression, lighting context",
      "specific pose variation 2 with body position, hand placement, expression, lighting context",
      "specific pose variation 3 with body position, hand placement, expression, lighting context",
      "specific pose variation 4 with body position, hand placement, expression, lighting context"
    ],
    "expression": "emotional quality capturing both dystopian isolation and human warmth",
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
  }
]

Generate exactly ${count} action(s). Ensure IDs are unique and descriptive.`;

    const message = await anthropic.messages.create({
      model: process.env.NEXT_PUBLIC_CLAUDE_MODEL,
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].text.trim();

    // Calculate cost
    const inputTokens = message.usage.input_tokens;
    const outputTokens = message.usage.output_tokens;
    const inputCostPerMillion = 3.00;
    const outputCostPerMillion = 15.00;
    const inputCost = (inputTokens / 1_000_000) * inputCostPerMillion;
    const outputCost = (outputTokens / 1_000_000) * outputCostPerMillion;
    const totalCost = inputCost + outputCost;

    console.log(`Action generation cost: $${totalCost.toFixed(4)} (${inputTokens} input + ${outputTokens} output tokens)`);

    // Extract JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from Claude response");
    }

    const generatedActions = JSON.parse(jsonMatch[0]);

    // Save to Firestore
    const db = getAdminDb();
    const batch = db.batch();
    const savedActions = [];

    for (const action of generatedActions) {
      // Ensure unique ID
      let actionId = action.id;
      const actionRef = db.collection("actions").doc(actionId);

      // Check if exists
      const existingDoc = await actionRef.get();
      if (existingDoc.exists) {
        // Append timestamp to make it unique
        actionId = `${actionId}_${Date.now()}`;
        action.id = actionId;
      }

      const finalActionRef = db.collection("actions").doc(actionId);

      batch.set(finalActionRef, {
        ...action,
        generated_by_ai: true,
        generation_keywords: keywordsList,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      savedActions.push({ ...action, id: actionId });
    }

    await batch.commit();

    console.log(`Successfully generated and saved ${savedActions.length} action(s)`);

    return NextResponse.json({
      success: true,
      actions: savedActions,
      count: savedActions.length,
      cost: totalCost,
    });
  } catch (error) {
    console.error("Generate actions error:", error);
    return NextResponse.json(
      { error: "Failed to generate actions", message: error.message },
      { status: 500 }
    );
  }
}
