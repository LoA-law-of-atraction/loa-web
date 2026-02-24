import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getPrompt } from "@/utils/promptService";
import { calculateClaudeCost } from "@/utils/costCalculator";
import { getAdminDb } from "@/utils/firebaseAdmin";

/**
 * POST /api/quote-videos/extract-quotes
 * Body: { transcript: "...", project_id?: string }
 * Returns: { success, quotes: string[], cost?: number }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
    const project_id = body.project_id || null;
    if (!transcript) {
      return NextResponse.json(
        { success: false, error: "Missing transcript" },
        { status: 400 }
      );
    }

    const prompt = getPrompt("quote/extract-quotes-from-transcript", {
      transcript: transcript.slice(0, 50000),
    });

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const inputTokens = message.usage?.input_tokens ?? 0;
    const outputTokens = message.usage?.output_tokens ?? 0;
    const cost = calculateClaudeCost(inputTokens, outputTokens);

    const textBlock = message.content?.find((b) => b.type === "text");
    const text = (textBlock?.text || "").trim();
    const quotes = text
      .split(/\n+/)
      .map((s) => s.replace(/^[\d.)\-\*]\s*/, "").trim())
      .filter((s) => s.length > 10 && s.length < 300);

    if (project_id && (cost > 0 || quotes.length > 0)) {
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
      quotes: quotes.length > 0 ? quotes : [text.slice(0, 200)],
      cost,
    });
  } catch (error) {
    console.error("Extract quotes error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to extract quotes.",
      },
      { status: 500 }
    );
  }
}
