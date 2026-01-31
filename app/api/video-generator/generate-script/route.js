import { NextResponse } from "next/server";
import { getPrompt } from "@/utils/promptService";
import { getAdminDb } from "@/utils/firebaseAdmin";
import { calculateClaudeCost } from "@/utils/costCalculator";

export async function POST(request) {
  try {
    const { project_id, topic, selected_character, categories = [], scene_count = 4 } = await request.json();

    if (!project_id || !topic || !selected_character) {
      return NextResponse.json(
        { error: "Missing project_id, topic, or character" },
        { status: 400 }
      );
    }

    // Load prompt template and fill variables
    const prompt = getPrompt("video-script", {
      topic,
      selected_character: JSON.stringify(selected_character, null, 2),
      scene_count: scene_count,
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
        model: process.env.CLAUDE_MODEL,
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

    // Update project in Firestore
    const db = getAdminDb();
    const projectRef = db.collection("projects").doc(project_id);

    // Check if project exists
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Get existing costs
    const projectDoc = await projectRef.get();
    const existingCosts = projectDoc.data()?.costs || {};

    // Calculate new costs
    const newClaudeCost = (existingCosts.claude || 0) + claudeCost;
    const newStep2ClaudeCost = (existingCosts.step2?.claude || 0) + claudeCost;
    const newStep2Total = (existingCosts.step2?.total || 0) + claudeCost;
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
        step2: {
          ...existingCosts.step2,
          claude: newStep2ClaudeCost,
          total: newStep2Total,
        },
        total: newTotal,
      },
      updated_at: new Date().toISOString(),
    });

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
