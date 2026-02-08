import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { count = 10, categories = null } = body;

    // Read prompt from file
    const promptPath = path.join(process.cwd(), "prompts", "topic-generation.txt");
    let promptTemplate = fs.readFileSync(promptPath, "utf-8");

    // Replace count
    let prompt = promptTemplate.replace("{{count}}", count);

    // Replace categories if provided
    if (categories && Array.isArray(categories) && categories.length > 0) {
      prompt = prompt.replace(
        "{{categories}}",
        categories.join(", ")
      );
    } else {
      prompt = prompt.replace(
        "{{categories}}",
        "Money Manifestation, Love & Relationships, Career Success, Life Transformation, Spiritual Growth, Health & Wellness, Mindset Shifts"
      );
    }

    // Generate topics using Claude
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Parse Claude's response
    let content = message.content[0].text;

    // Remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const topics = JSON.parse(content);

    // Save to Firestore
    const db = getAdminDb();
    const batch = db.batch();

    topics.forEach((topicData) => {
      const docRef = db.collection("topics").doc();

      // Handle both single category and categories array from AI
      let categoriesArray = [];
      if (Array.isArray(topicData.categories)) {
        categoriesArray = topicData.categories;
      } else if (topicData.category) {
        categoriesArray = [topicData.category];
      }

      batch.set(docRef, {
        topic: topicData.topic,
        categories: categoriesArray,
        generated: false,
        created_at: new Date().toISOString(),
      });
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      count: topics.length,
      topics,
    });
  } catch (error) {
    console.error("Generate topics error:", error);
    return NextResponse.json(
      { error: "Failed to generate topics", message: error.message },
      { status: 500 }
    );
  }
}
