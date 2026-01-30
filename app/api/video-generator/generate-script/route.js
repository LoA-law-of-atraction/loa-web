import { NextResponse } from "next/server";
import { getPrompt } from "@/utils/promptService";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function POST(request) {
  try {
    const { topic, selected_character, categories = [] } = await request.json();

    if (!topic || !selected_character) {
      return NextResponse.json(
        { error: "Missing topic or character" },
        { status: 400 }
      );
    }

    // Load prompt template and fill variables
    const prompt = getPrompt("video-script", {
      topic,
      selected_character: JSON.stringify(selected_character, null, 2),
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
        model: "claude-sonnet-4-20250514",
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

    // Extract JSON from Claude's response
    const jsonMatch = scriptText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from Claude response");
    }

    const scriptData = JSON.parse(jsonMatch[0]);

    // Save script to Firestore
    const db = getAdminDb();
    const scriptRef = db.collection("scripts").doc();

    // Save main script document
    await scriptRef.set({
      topic,
      categories,
      character: {
        character_id: selected_character.character_id,
        name: selected_character.name,
        gender: selected_character.gender,
        age: selected_character.age,
        voice_id: selected_character.voice_id,
      },
      script: scriptData.script,
      created_at: new Date().toISOString(),
    });

    // Save scenes as subcollection
    const scenesCollection = scriptRef.collection("scenes");
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
      script_id: scriptRef.id,
    });
  } catch (error) {
    console.error("Generate script error:", error);
    return NextResponse.json(
      { error: "Failed to generate script", message: error.message },
      { status: 500 }
    );
  }
}
