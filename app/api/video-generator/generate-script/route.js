import { NextResponse } from "next/server";
import { getPrompt } from "@/utils/promptService";
import { getAdminDb } from "@/utils/firebaseAdmin";
import { calculateClaudeCost } from "@/utils/costCalculator";

export async function POST(request) {
  try {
    const { project_id, topic, selected_character, categories = [], scene_count = 4, location_count = null } = await request.json();

    if (!project_id || !topic || !selected_character) {
      return NextResponse.json(
        { error: "Missing project_id, topic, or character" },
        { status: 400 }
      );
    }

    // Calculate duration and character limits
    const totalSeconds = scene_count * 8;
    // Use 12 chars/sec to account for natural speaking pace + pauses
    // This ensures voiceover fits within video duration
    const maxCharacters = Math.floor(totalSeconds * 12);
    const minCharacters = Math.floor(maxCharacters * 0.85); // Minimum 85% of max

    const db = getAdminDb();

    // Fetch selected locations for this project
    const projectRef = db.collection("projects").doc(project_id);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const locationMapping = projectDoc.data()?.location_mapping || {};
    let locationsContext = "";

    if (Object.keys(locationMapping).length > 0) {
      console.log("Using pre-selected locations from project");

      // Fetch location details
      const locationIds = [...new Set(Object.values(locationMapping))];
      const locationsData = {};

      for (const locationId of locationIds) {
        const locationDoc = await db.collection("locations").doc(locationId).get();
        if (locationDoc.exists) {
          locationsData[locationId] = locationDoc.data();
        }
      }

      // Build location context for prompt
      const locationsByIndex = {};
      for (const [sceneId, locationId] of Object.entries(locationMapping)) {
        if (!locationsByIndex[locationId]) {
          locationsByIndex[locationId] = [];
        }
        locationsByIndex[locationId].push(sceneId);
      }

      locationsContext = "SELECTED LOCATIONS:\n\n";
      let locationIndex = 1;
      for (const [locationId, sceneIds] of Object.entries(locationsByIndex)) {
        const location = locationsData[locationId];
        if (location) {
          locationsContext += `Location ${locationIndex} (Scenes ${sceneIds.join(", ")}):\n`;
          locationsContext += `Name: ${location.name}\n`;
          locationsContext += `Type: ${location.type}\n`;
          locationsContext += `Description: ${location.description}\n`;
          locationsContext += `Lighting: ${location.visual_characteristics.lighting}\n`;
          locationsContext += `Atmosphere: ${location.visual_characteristics.atmosphere}\n\n`;
          locationIndex++;
        }
      }
    }

    // Load prompt template and fill variables
    const prompt = getPrompt("video-script", {
      topic,
      selected_character: JSON.stringify(selected_character, null, 2),
      scene_count: scene_count,
      total_seconds: totalSeconds,
      max_characters: maxCharacters,
      min_characters: minCharacters,
      location_count: location_count === null ? scene_count : location_count,
      location_mode: location_count === null ? "all_different" : "grouped",
      locations_context: locationsContext,
    });

    // Call Claude API
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.NEXT_PUBLIC_CLAUDE_MODEL,
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      throw new Error(`Claude API error: ${errorText}`);
    }

    const claudeResult = await claudeResponse.json();
    const scriptText = claudeResult.content[0].text;

    // Calculate Claude API cost
    const inputTokens = claudeResult.usage?.input_tokens || 0;
    const outputTokens = claudeResult.usage?.output_tokens || 0;
    const claudeCost = calculateClaudeCost(inputTokens, outputTokens);

    // Extract JSON from Claude's response
    const jsonMatch = scriptText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from Claude response");
    }

    const scriptData = JSON.parse(jsonMatch[0]);

    // Validate script length
    const scriptLength = scriptData.script?.length || 0;
    if (scriptLength < minCharacters) {
      throw new Error(
        `Script too short: ${scriptLength} characters (minimum ${minCharacters} required for ${scene_count} scenes). The voiceover must fill the full ${totalSeconds}-second video duration.`
      );
    }
    if (scriptLength > maxCharacters) {
      console.warn(
        `Script exceeds character limit: ${scriptLength} > ${maxCharacters} (${scene_count} scenes × 8s)`
      );
    }

    // Update project in Firestore
    // Get existing costs
    const existingCosts = projectDoc.data()?.costs || {};

    // Calculate new costs
    const newClaudeCost = (existingCosts.claude || 0) + claudeCost;
    const newStep1ClaudeCost = (existingCosts.step1?.claude || 0) + claudeCost;
    const newStep1Total = (existingCosts.step1?.total || 0) + claudeCost;
    const newTotal = (existingCosts.total || 0) + claudeCost;

    // Update main project document
    await projectRef.update({
      topic,
      categories,
      scene_count,
      character: {
        character_id: selected_character.character_id,
        name: selected_character.name,
        gender: selected_character.gender,
        age: selected_character.age,
        voice_id: selected_character.voice_id,
      },
      script: scriptData.script,
      status: "script_generated",
      current_step: 2,
      costs: {
        ...existingCosts,
        // Legacy API-level
        claude: newClaudeCost,
        // Step-level
        step1: {
          ...existingCosts.step1,
          claude: newStep1ClaudeCost,
          total: newStep1Total,
        },
        total: newTotal,
      },
      updated_at: new Date().toISOString(),
    });

    // Track project usage in character's projects subcollection
    const characterRef = db.collection("characters").doc(selected_character.character_id);
    const characterProjectRef = characterRef.collection("projects").doc(project_id);

    await characterProjectRef.set({
      project_id,
      project_name: projectDoc.data()?.project_name || "Untitled Project",
      topic,
      scene_count,
      status: "script_generated",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { merge: true });

    // Save scenes as subcollection
    const scenesCollection = projectRef.collection("scenes");
    const batch = db.batch();

    scriptData.scenes.forEach((scene) => {
      const sceneRef = scenesCollection.doc(scene.id.toString());
      batch.set(sceneRef, scene);
    });

    await batch.commit();

    // Mark topic as used (find by topic text and update)
    const topicsSnapshot = await db
      .collection("topics")
      .where("topic", "==", topic)
      .limit(1)
      .get();

    if (!topicsSnapshot.empty) {
      const topicDoc = topicsSnapshot.docs[0];
      const currentData = topicDoc.data();
      await topicDoc.ref.update({
        generated: true,
        used_count: (currentData.used_count || 0) + 1,
        last_used_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      data: scriptData,
      project_id: project_id,
    });
  } catch (error) {
    console.error("Generate script error:", error);
    return NextResponse.json(
      { error: "Failed to generate script", message: error.message },
      { status: 500 }
    );
  }
}
