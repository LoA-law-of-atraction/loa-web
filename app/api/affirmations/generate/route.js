import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a manifestation and Law of Attraction coach. Given a user's intention or desire (what they want to manifest), you generate one short, powerful affirmation.

Rules:
- Write the affirmation as if the user has ALREADY manifested it. Use present tense only: "I am...", "I have...", "I attract...", "I live...". It must sound like a current reality, not a future wish.
- No future tense or hoping: avoid "I will", "I want to", "I am going to". The affirmation should feel like a statement of fact about the present.
- Honor the user's specific desire: if they mention specific traits, a type of person, or a situation (e.g. "blonde Ukrainian wife", "dream job in Paris", "healthy at 80"), reflect those specifics in the affirmation in present tense. Do not replace them with generic phrases like "my ideal partner" or "my dream life"—keep their words where natural (e.g. "I am with my beloved blonde Ukrainian wife" or "I have a loving marriage with my blonde Ukrainian wife").
- Output exactly one affirmation: 1-2 sentences, first person.
- Keep it concise (under 20 words when possible) so it fits on a pause screen.
- Use positive, present-tense language as if it's already true.
- Align with Law of Attraction: focus on the feeling and state, not the lack—but keep the user's specific description when they give it.
- Return ONLY valid JSON: { "affirmation": "...", "category": "..." }.
- category: one short word or phrase (e.g. "Abundance", "Love", "Health", "Career", "Peace", "Relationship").`;

export async function POST(request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI service is not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const manifestInput = typeof body.manifestInput === "string" ? body.manifestInput.trim() : "";
    const systemPromptFromClient = typeof body.systemPrompt === "string" ? body.systemPrompt.trim() : null;

    if (!manifestInput) {
      return NextResponse.json(
        { error: "manifestInput is required" },
        { status: 400 }
      );
    }

    const userMessage = `What I want to manifest: ${manifestInput}\n\nGenerate one short affirmation and a category. Return only JSON: { "affirmation": "...", "category": "..." }`;

    const systemMessage = systemPromptFromClient || SYSTEM_PROMPT;

    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929",
      max_tokens: 256,
      system: systemMessage,
      messages: [{ role: "user", content: userMessage }],
    });

    let content = message.content[0].text;
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(content);

    const affirmation = typeof parsed.affirmation === "string" ? parsed.affirmation.trim() : "";
    const category = typeof parsed.category === "string" ? parsed.category.trim() : "";

    if (!affirmation) {
      return NextResponse.json(
        { error: "AI did not return a valid affirmation" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      affirmation,
      category: category || "Manifestation",
      prompt: userMessage,
    });
  } catch (error) {
    console.error("Affirmation generate error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate affirmation",
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
