import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAdminDb } from "@/utils/firebaseAdmin";
import { getPrompt } from "@/utils/promptService";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Pricing for Claude 3.5 Sonnet (20241022)
const CLAUDE_PRICING = {
  input: 3.0 / 1_000_000, // $3.00 per million input tokens
  output: 15.0 / 1_000_000, // $15.00 per million output tokens
};

export async function POST(request) {
  try {
    const {
      scene_id,
      voiceover,
      scene_index,
      total_scenes,
      project_id,
      location_count = null,
      action = null,
    } = await request.json();

    if (!scene_id || !voiceover || scene_index === undefined || !total_scenes) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    console.log("=== REGENERATE IMAGE PROMPT ===");
    console.log("Scene ID:", scene_id);
    console.log("Action:", action ? action.name : "None selected");
    if (action) {
      console.log("Action pose variations:", action.pose_variations);
      console.log("Action expression:", action.expression);
    }
    console.log("==============================");

    // Fetch location from per-scene `location_id` (preferred)
    const db = getAdminDb();
    let locationDescription = "";
    let groupInstruction = "NEW";
    let consistencyInstruction = "Introduce a new setting";

    if (project_id) {
      try {
        const projectRef = db.collection("projects").doc(project_id);
        const projectDoc = await projectRef.get();

        if (projectDoc.exists) {
          const locationMapping = projectDoc.data()?.location_mapping || {};

          const currentSceneId = String(scene_id ?? scene_index + 1);
          const prevSceneId = scene_index > 0 ? String(scene_index) : null;

          let locationId = null;
          let prevLocationId = null;

          // Prefer per-scene selection
          try {
            const currentSceneDoc = await projectRef
              .collection("scenes")
              .doc(String(scene_id))
              .get();
            if (currentSceneDoc.exists) {
              locationId = currentSceneDoc.data()?.location_id || null;
            }

            if (prevSceneId) {
              const prevSceneDoc = await projectRef
                .collection("scenes")
                .doc(String(prevSceneId))
                .get();
              if (prevSceneDoc.exists) {
                prevLocationId = prevSceneDoc.data()?.location_id || null;
              }
            }
          } catch (error) {
            console.error("Error fetching scene locations:", error);
          }

          // Legacy fallback
          if (!locationId) locationId = locationMapping[currentSceneId];
          if (!prevLocationId && prevSceneId)
            prevLocationId = locationMapping[prevSceneId];

          if (locationId) {
            // Fetch location details
            const locationDoc = await db
              .collection("locations")
              .doc(locationId)
              .get();

            if (locationDoc.exists) {
              const location = locationDoc.data();
              locationDescription = `Location: ${location.name}\n`;
              locationDescription += `${location.description}\n`;
              locationDescription += `Lighting: ${location.visual_characteristics.lighting}\n`;
              locationDescription += `Atmosphere: ${location.visual_characteristics.atmosphere}\n`;

              // Check if previous scene used same location
              if (scene_index > 0 && prevLocationId === locationId) {
                groupInstruction = "SAME";
                consistencyInstruction =
                  "Keep EXACT same environment, time, and lighting as the previous scene. Only change the character's pose/expression.";
              }

              console.log(
                `Using location ${location.name} for scene ${currentSceneId}`,
              );
            }
          }
        }
      } catch (locationError) {
        console.error("Error fetching location:", locationError);
        // Continue with generic location description
      }
    }

    // Fallback if no location found
    if (!locationDescription) {
      locationDescription =
        "Blade Runner-style gritty urban environment at night with neon lighting";
    }

    // Prepare action-specific pose guidance
    let actionGuidance = "";
    if (action) {
      actionGuidance = `\n\nACTION/POSE GUIDANCE:\n`;
      actionGuidance += `Selected Action: ${action.name}\n`;
      actionGuidance += `Description: ${action.description}\n`;
      if (action.pose_variations && action.pose_variations.length > 0) {
        actionGuidance += `Suggested Poses:\n`;
        action.pose_variations.forEach((pose, idx) => {
          actionGuidance += `- ${pose}\n`;
        });
      }
      if (action.expression) {
        actionGuidance += `Expression: ${action.expression}\n`;
      }
      actionGuidance += `\nUse one of the suggested poses above that best matches the voiceover emotion.`;
    }

    // Load Grok-specific prompt template (simplified for image editing)
    const prompt = getPrompt("regenerate-image-prompt-grok", {
      voiceover,
      group_instruction: groupInstruction,
      consistency_instruction: consistencyInstruction,
      location_description: locationDescription,
      action_guidance: actionGuidance,
    });

    const message = await anthropic.messages.create({
      model: process.env.NEXT_PUBLIC_CLAUDE_MODEL,
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const imagePrompt = message.content[0].text.trim();

    // Calculate cost based on token usage
    const inputTokens = message.usage.input_tokens;
    const outputTokens = message.usage.output_tokens;
    const cost =
      inputTokens * CLAUDE_PRICING.input + outputTokens * CLAUDE_PRICING.output;

    console.log(
      `Claude API usage: ${inputTokens} input tokens, ${outputTokens} output tokens = $${cost.toFixed(6)}`,
    );

    // Update project costs if project_id is provided
    if (project_id) {
      try {
        const projectRef = db.collection("projects").doc(project_id);
        const projectDoc = await projectRef.get();

        if (projectDoc.exists) {
          const existingCosts = projectDoc.data()?.costs || {};

          // Calculate new costs
          const newClaudeCost = (existingCosts.claude || 0) + cost;
          const newStep3ClaudeCost = (existingCosts.step3?.claude || 0) + cost;
          const newStep3Total = (existingCosts.step3?.total || 0) + cost;
          const newTotal = (existingCosts.total || 0) + cost;

          await projectRef.update({
            costs: {
              ...existingCosts,
              // API-level
              claude: newClaudeCost,
              // Step-level
              step3: {
                ...existingCosts.step3,
                claude: newStep3ClaudeCost,
                total: newStep3Total,
              },
              total: newTotal,
            },
            updated_at: new Date().toISOString(),
          });

          console.log(
            `Updated costs for project ${project_id}: Claude $${newClaudeCost.toFixed(6)}`,
          );
        }
      } catch (costError) {
        console.error(
          `Error updating costs for project ${project_id}:`,
          costError,
        );
        // Don't fail the whole request if cost tracking fails
      }
    }

    return NextResponse.json({
      success: true,
      image_prompt: imagePrompt,
      cost: cost,
    });
  } catch (error) {
    console.error("Regenerate image prompt error:", error);
    return NextResponse.json(
      { error: "Failed to regenerate image prompt", message: error.message },
      { status: 500 },
    );
  }
}
