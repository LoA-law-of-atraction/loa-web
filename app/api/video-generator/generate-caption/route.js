import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getPrompt } from "@/utils/promptService";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const PLATFORM_INSTRUCTIONS = {
  instagram: `
INSTAGRAM REELS SEO:
- First 125 characters: Front-load your main keyword/target search term. Google and Instagram index this. Think: what would users search for?
- Caption: 2–4 engaging sentences. Include a clear call-to-action (e.g. Save this, Share with someone who needs it, Follow for more).
- Hashtags: Add 5–7 relevant hashtags at the END. Target niche hashtags (avoid millions of posts). Mix: 2–3 broad (e.g. #lawofattraction #manifestation) + 3–4 niche (e.g. #manifestationtips #mindsetcoach).
- Max 2200 characters total.
- No hashtags in the first 125 chars – save them for the end.`,
  youtube: `
YOUTUBE SHORTS SEO:
- First line (title): Put your primary keyword in the first 30 characters. Literal, descriptive, under 60 chars. Example: "How to Manifest Your Dream Job | Law of Attraction"
- Line 2: Blank line.
- Lines 3–4 (first 2 sentences): Include primary and secondary keywords naturally. This is what YouTube indexes for search.
- Rest: Expand with value, CTA, channel info. Max 5000 chars.
- Tags/hashtags: Add 3–5 comma-separated tags at the very end on their own line, e.g. "#shorts #lawofattraction #manifestation #mindset #motivation"`,
  tiktok: `
TIKTOK SEO:
- First 100 characters: Place your primary keyword and hook here. This drives search visibility.
- Caption: Short and punchy (1–3 sentences). Create curiosity or urgency.
- Hashtags: Add 3–5 at the END. Mix: 1–2 trending (#fyp #foryou #viral) + 2–3 niche (#lawofattraction #manifestation #mindset).
- Keep total concise – TikTok favors snappy captions.`,
};

export async function POST(request) {
  try {
    const { topic, script, platform } = await request.json();

    const topicStr = String(topic || "").trim();
    const scriptStr = String(script || "").trim();
    const platformKey = ["instagram", "youtube", "tiktok"].includes(String(platform || "").toLowerCase())
      ? String(platform).toLowerCase()
      : "instagram";

    if (!scriptStr) {
      return NextResponse.json(
        { error: "Script is required to generate caption" },
        { status: 400 }
      );
    }

    const prompt = getPrompt("social-caption", {
      platform: platformKey.charAt(0).toUpperCase() + platformKey.slice(1),
      topic: topicStr || "(no topic)",
      script: scriptStr,
      platform_instructions: PLATFORM_INSTRUCTIONS[platformKey],
    });

    const message = await anthropic.messages.create({
      model: process.env.NEXT_PUBLIC_CLAUDE_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const caption = (message.content?.[0]?.text || "").trim();

    return NextResponse.json({
      success: true,
      caption,
    });
  } catch (error) {
    console.error("Generate caption error:", error);
    return NextResponse.json(
      { error: "Failed to generate caption", message: error.message },
      { status: 500 }
    );
  }
}
