import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAdminDb } from "@/utils/firebaseAdmin";
import { getPrompt } from "@/utils/promptService";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function stripBreathingMentions(text) {
  if (!text) return text;

  const withoutBreathing = String(text)
    .replace(/\b(breathing|breathes|breathe|breath)\b/gi, "")
    .replace(/\b(inhale|inhales|inhaling|inhaled)\b/gi, "")
    .replace(/\b(exhale|exhales|exhaling|exhaled)\b/gi, "");

  return withoutBreathing
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

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
      image_prompt,
      scene_index,
      total_scenes,
      project_id,
      action = null,
      camera_movement = null,
      character_motion = null,
      temperature: requestedTemperature,
    } = await request.json();

    if (!scene_id || !voiceover || scene_index === undefined || !total_scenes) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const db = getAdminDb();

    const hydrateSelectionDoc = async (collectionName, selection) => {
      if (!selection?.id) return null;

      // If we already have meaningful guidance, keep it.
      const hasGuidance =
        Boolean(selection?.name) ||
        Boolean(selection?.description) ||
        (Array.isArray(selection?.tags) && selection.tags.length > 0);
      if (hasGuidance) return selection;

      try {
        const doc = await db
          .collection(String(collectionName))
          .doc(String(selection.id))
          .get();
        if (!doc.exists) return selection;
        return { id: doc.id, ...doc.data() };
      } catch {
        return selection;
      }
    };

    // Fetch location from scene doc (best-effort)
    let locationDescription = "";

    // Fetch camera/character/action guidance from scene doc (best-effort)
    let cameraMovementDoc = null;
    let characterMotionDoc = null;
    let actionDoc = null;

    const coerceSelection = (value) => {
      if (!value) return null;
      if (typeof value === "string") return { id: value };
      if (typeof value === "object") {
        if (value.id) return value;
        if (value.movementId) return { id: value.movementId, ...value };
        if (value.motionId) return { id: value.motionId, ...value };
      }
      return null;
    };

    const requestedCameraMovement = coerceSelection(camera_movement);
    const requestedCharacterMotion = coerceSelection(character_motion);

    if (requestedCameraMovement?.id) {
      cameraMovementDoc = await hydrateSelectionDoc(
        "camera_movements",
        requestedCameraMovement,
      );
    }
    if (requestedCharacterMotion?.id) {
      characterMotionDoc = await hydrateSelectionDoc(
        "character_motions",
        requestedCharacterMotion,
      );
    }

    if (project_id) {
      try {
        const projectRef = db.collection("projects").doc(project_id);
        const projectDoc = await projectRef.get();

        if (projectDoc.exists) {
          const currentSceneId = String(scene_id ?? scene_index + 1);

          // Prefer per-scene selection
          let sceneLocationId = null;
          try {
            const sceneDocSnap = await projectRef
              .collection("scenes")
              .doc(String(scene_id))
              .get();
            if (sceneDocSnap.exists) {
              sceneLocationId = sceneDocSnap.data()?.location_id || null;
            }
          } catch (error) {
            console.error("Error fetching scene location:", error);
          }

          const locationMapping = projectDoc.data()?.location_mapping || {};
          const locationId =
            sceneLocationId || locationMapping[currentSceneId] || null;

          if (locationId) {
            const locationDoc = await db
              .collection("locations")
              .doc(locationId)
              .get();

            if (locationDoc.exists) {
              const location = locationDoc.data();
              locationDescription = `Location: ${location.name}\n`;
              locationDescription += `${location.description}\n`;
              if (location.visual_characteristics?.lighting) {
                locationDescription += `Lighting: ${location.visual_characteristics.lighting}\n`;
              }
              if (location.visual_characteristics?.atmosphere) {
                locationDescription += `Atmosphere: ${location.visual_characteristics.atmosphere}\n`;
              }
            }
          }

          // If not explicitly provided, try reading per-scene selections.
          let sceneSelections = null;
          try {
            const sceneDocSnap = await projectRef
              .collection("scenes")
              .doc(String(scene_id))
              .get();
            if (sceneDocSnap.exists) {
              sceneSelections = sceneDocSnap.data() || null;
            }
          } catch (error) {
            console.error("Error fetching scene selections:", error);
          }

          // Action (optional)
          if (!action && sceneSelections?.action_id) {
            try {
              const doc = await db
                .collection("actions")
                .doc(String(sceneSelections.action_id))
                .get();
              if (doc.exists) {
                actionDoc = { id: doc.id, ...doc.data() };
              }
            } catch (error) {
              console.error("Error fetching action:", error);
            }
          }

          // Camera/character movement (optional)
          if (!cameraMovementDoc && sceneSelections?.camera_movement_id) {
            try {
              const doc = await db
                .collection("camera_movements")
                .doc(String(sceneSelections.camera_movement_id))
                .get();
              if (doc.exists) {
                cameraMovementDoc = { id: doc.id, ...doc.data() };
              }
            } catch (error) {
              console.error("Error fetching camera movement:", error);
            }
          }

          if (!characterMotionDoc && sceneSelections?.character_motion_id) {
            try {
              const doc = await db
                .collection("character_motions")
                .doc(String(sceneSelections.character_motion_id))
                .get();
              if (doc.exists) {
                characterMotionDoc = { id: doc.id, ...doc.data() };
              }
            } catch (error) {
              console.error("Error fetching character motion:", error);
            }
          }

          // Legacy fallback: project mappings for Step 4 guidance
          if (!cameraMovementDoc) {
            const cameraMovementMapping =
              projectDoc.data()?.camera_movement_mapping || {};
            const cameraMovementId = cameraMovementMapping[currentSceneId];
            if (cameraMovementId) {
              try {
                const doc = await db
                  .collection("camera_movements")
                  .doc(cameraMovementId)
                  .get();
                if (doc.exists) {
                  cameraMovementDoc = { id: doc.id, ...doc.data() };
                }
              } catch (error) {
                console.error("Error fetching camera movement:", error);
              }
            }
          }

          if (!characterMotionDoc) {
            const characterMotionMapping =
              projectDoc.data()?.character_motion_mapping || {};
            const characterMotionId = characterMotionMapping[currentSceneId];
            if (characterMotionId) {
              try {
                const doc = await db
                  .collection("character_motions")
                  .doc(characterMotionId)
                  .get();
                if (doc.exists) {
                  characterMotionDoc = { id: doc.id, ...doc.data() };
                }
              } catch (error) {
                console.error("Error fetching character motion:", error);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching location:", error);
      }
    }

    if (!locationDescription) {
      locationDescription =
        "Keep the environment consistent with the selected image.";
    }

    // Action guidance (optional)
    let actionGuidance = "";
    const resolvedAction = action || actionDoc;
    if (resolvedAction) {
      actionGuidance = `ACTION/POSE GUIDANCE:\n`;
      if (resolvedAction.name)
        actionGuidance += `Selected Action: ${resolvedAction.name}\n`;
      if (resolvedAction.description)
        actionGuidance += `Description: ${resolvedAction.description}\n`;
      if (resolvedAction.expression)
        actionGuidance += `Expression: ${resolvedAction.expression}\n`;
      actionGuidance +=
        "Use subtle, realistic movement that matches the action and emotion.";
      actionGuidance = `\n\n${actionGuidance}`;
    }

    // Camera movement guidance (optional)
    let cameraMovementGuidance = "";
    if (cameraMovementDoc) {
      cameraMovementGuidance = `CAMERA MOVEMENT GUIDANCE:\n`;
      if (cameraMovementDoc.name)
        cameraMovementGuidance += `Selected Camera Movement: ${cameraMovementDoc.name}\n`;
      if (cameraMovementDoc.description)
        cameraMovementGuidance += `Description: ${cameraMovementDoc.description}\n`;

      // Root rule: the selected camera movement is authoritative.
      // Do not invent additional camera motion beyond what the selected movement describes.
      cameraMovementGuidance +=
        "Follow the selected camera movement EXACTLY. Do NOT add any extra camera movement not described above.";
      cameraMovementGuidance = `\n\n${cameraMovementGuidance}`;
    }

    // Character motion guidance (optional)
    let characterMotionGuidance = "";
    if (characterMotionDoc) {
      characterMotionGuidance = `CHARACTER MOTION GUIDANCE:\n`;
      if (characterMotionDoc.name)
        characterMotionGuidance += `Selected Character Motion: ${characterMotionDoc.name}\n`;
      if (characterMotionDoc.description)
        characterMotionGuidance += `Description: ${characterMotionDoc.description}\n`;

      // Root rule: the selected character motion is authoritative.
      // Do not invent additional character actions beyond what the selected motion describes.
      characterMotionGuidance +=
        "Follow the selected character motion EXACTLY. Do NOT add extra character actions not described above. Avoid lip-sync.";
      characterMotionGuidance = `\n\n${characterMotionGuidance}`;
    }

    const prompt = getPrompt("video-prompt-generation", {
      voiceover,
      image_prompt: image_prompt || "",
      location_description: locationDescription,
      action_guidance: actionGuidance,
      camera_movement_guidance: cameraMovementGuidance,
      character_motion_guidance: characterMotionGuidance,
    });

    const temperature =
      requestedTemperature !== undefined && requestedTemperature !== null
        ? Math.min(1, Math.max(0, Number(requestedTemperature)))
        : 0.8;

    const message = await anthropic.messages.create({
      model: process.env.NEXT_PUBLIC_CLAUDE_MODEL,
      max_tokens: 250,
      temperature,
      messages: [{ role: "user", content: prompt }],
    });

    const motionPromptRaw = (message.content?.[0]?.text || "").trim();
    const motionPrompt = stripBreathingMentions(motionPromptRaw);

    // Calculate cost
    const inputTokens = message.usage.input_tokens;
    const outputTokens = message.usage.output_tokens;
    const cost =
      inputTokens * CLAUDE_PRICING.input + outputTokens * CLAUDE_PRICING.output;

    // Update costs (best-effort)
    if (project_id) {
      try {
        const projectRef = db.collection("projects").doc(project_id);
        const projectDoc = await projectRef.get();
        if (projectDoc.exists) {
          const existingCosts = projectDoc.data()?.costs || {};

          const newClaudeCost = (existingCosts.claude || 0) + cost;
          const newStep4ClaudeCost = (existingCosts.step4?.claude || 0) + cost;
          const newStep4Total = (existingCosts.step4?.total || 0) + cost;
          const newTotal = (existingCosts.total || 0) + cost;

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
      motion_prompt: motionPrompt,
      cost,
    });
  } catch (error) {
    console.error("Generate video prompt error:", error);
    return NextResponse.json(
      { error: "Failed to generate video prompt", message: error.message },
      { status: 500 },
    );
  }
}
