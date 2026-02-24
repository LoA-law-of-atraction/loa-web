import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getPrompt } from "@/utils/promptService";
import { calculateClaudeCost } from "@/utils/costCalculator";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function POST(request) {
  try {
    const { theme, project_id } = await request.json();

    if (!theme || typeof theme !== "string" || !theme.trim()) {
      return NextResponse.json(
        { error: "Missing or invalid theme" },
        { status: 400 }
      );
    }

    const promptTemplate = getPrompt("quote/motivational-quote", {
      theme: theme.trim(),
    });

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 150,
      messages: [{ role: "user", content: promptTemplate }],
    });

    const textBlock = message.content?.find((b) => b.type === "text");
    const quote = textBlock?.text?.trim() || "";

    if (!quote) {
      return NextResponse.json(
        { error: "No quote generated" },
        { status: 500 }
      );
    }

    const inputTokens = message.usage?.input_tokens ?? 0;
    const outputTokens = message.usage?.output_tokens ?? 0;
    const cost = calculateClaudeCost(inputTokens, outputTokens);

    if (project_id) {
      const db = getAdminDb();
      const ref = db.collection("quote_projects").doc(project_id);
      const doc = await ref.get();
      if (doc.exists) {
        const existing = doc.data()?.costs || {};
        const step1 = existing.step1 || {};
        const newStep1Claude = (step1.claude || 0) + cost;
        const newStep1Total = (step1.total || 0) + cost;
        const newTotal = (existing.total || 0) + cost;
        await ref.update({
          theme: theme.trim(),
          quote_text: quote,
          updated_at: new Date().toISOString(),
          costs: {
            ...existing,
            step1: { ...step1, claude: newStep1Claude, total: newStep1Total },
            total: newTotal,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      quote,
      cost,
    });
  } catch (error) {
    console.error("Generate quote error:", error);
    return NextResponse.json(
      { error: "Failed to generate quote", message: error.message },
      { status: 500 }
    );
  }
}
