import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

const COLLECTION = "music_base_prompts";
const FALLBACK_PROMPT =
  "Gentle instrumental background for short quote video. Soft pads, no drums, no vocals. Loopable.";

/** GET - Return the base music prompt used when the user leaves the field empty. Reads from Firebase. */
export async function GET() {
  try {
    const db = getAdminDb();
    const doc = await db.collection(COLLECTION).doc("default").get();
    const default_prompt =
      doc.exists && doc.data()?.prompt ? doc.data().prompt.trim() : FALLBACK_PROMPT;
    return NextResponse.json({ success: true, default_prompt });
  } catch (error) {
    console.error("Quote-videos music-default error:", error);
    return NextResponse.json({ success: true, default_prompt: FALLBACK_PROMPT }, { status: 200 });
  }
}
