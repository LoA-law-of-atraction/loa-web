import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const {
      count = 1,
      keywords = null,
      project_id = null,
    } = await request.json();

    if (!keywords || !keywords.trim()) {
      return NextResponse.json(
        { error: "Keywords are required" },
        { status: 400 },
      );
    }

    const keywordsList = keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const prompt = `Generate ${count} character motion definitions for a \"SOFT DYSTOPIA\" / \"HUMAN SCI-FI\" video project.

KEYWORDS TO INCORPORATE: ${keywordsList.join(", ")}

AESTHETIC: Cold world, warm soul. Retro-future. Quiet, intimate, hopeful.

CHARACTER MOTION REQUIREMENTS:
- Motions should be subtle and realistic (micro-movements).
- Describe ONLY the character movement (body/face/hands), not camera.
- No location/environment descriptions.
- Avoid chaotic / action-heavy motion.
- Should work well in short vertical clips (9:16).

Each character motion should include:
1) name (2–5 words)
2) description (1–3 sentences)
3) 3–6 tags

Return ONLY a JSON array with this exact structure:
[
  {
    "id": "motion_name_in_snake_case",
    "name": "Motion Name",
    "description": "Short description of character motion",
    "tags": ["tag1", "tag2", "tag3"]
  }
]

Generate exactly ${count} motion(s). Ensure IDs are unique and descriptive.`;

    const message = await anthropic.messages.create({
      model: process.env.NEXT_PUBLIC_CLAUDE_MODEL,
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content?.[0]?.text?.trim() || "";

    const inputTokens = message.usage.input_tokens;
    const outputTokens = message.usage.output_tokens;
    const inputCostPerMillion = 3.0;
    const outputCostPerMillion = 15.0;
    const totalCost =
      (inputTokens / 1_000_000) * inputCostPerMillion +
      (outputTokens / 1_000_000) * outputCostPerMillion;

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from Claude response");
    }

    const generatedMotions = JSON.parse(jsonMatch[0]);

    const db = getAdminDb();
    const batch = db.batch();
    const savedMotions = [];

    for (const motion of generatedMotions) {
      let motionId = motion.id;
      const motionRef = db.collection("character_motions").doc(motionId);
      const existingDoc = await motionRef.get();
      if (existingDoc.exists) {
        motionId = `${motionId}_${Date.now()}`;
        motion.id = motionId;
      }

      const finalRef = db.collection("character_motions").doc(motionId);
      batch.set(finalRef, {
        ...motion,
        generated_by_ai: true,
        generation_keywords: keywordsList,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      savedMotions.push({ ...motion, id: motionId });
    }

    await batch.commit();

    // Update costs (best-effort)
    if (project_id) {
      try {
        const projectRef = db.collection("projects").doc(project_id);
        const projectDoc = await projectRef.get();
        if (projectDoc.exists) {
          const existingCosts = projectDoc.data()?.costs || {};

          const newClaudeCost = (existingCosts.claude || 0) + totalCost;
          const newStep4ClaudeCost =
            (existingCosts.step4?.claude || 0) + totalCost;
          const newStep4Total = (existingCosts.step4?.total || 0) + totalCost;
          const newTotal = (existingCosts.total || 0) + totalCost;

          await projectRef.update({
            costs: {
              ...existingCosts,
              // API-level
              claude: newClaudeCost,
              // Step-level
              step4: {
                ...existingCosts.step4,
                claude: newStep4ClaudeCost,
                total: newStep4Total,
              },
              total: newTotal,
            },
            updated_at: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error("Error updating costs:", error);
      }
    }

    return NextResponse.json({
      success: true,
      character_motions: savedMotions,
      count: savedMotions.length,
      cost: totalCost,
    });
  } catch (error) {
    console.error("Generate character motions error:", error);
    return NextResponse.json(
      { error: "Failed to generate character motions", message: error.message },
      { status: 500 },
    );
  }
}
