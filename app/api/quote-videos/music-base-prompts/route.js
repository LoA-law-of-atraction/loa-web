import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

const COLLECTION = "music_base_prompts";

/** In-code fallback when a base is missing in Firebase (e.g. empty collection). */
const FALLBACK_PROMPT =
  "Gentle instrumental background for short quote video. Soft pads, no drums, no vocals. Loopable.";

function humanize(id) {
  return id
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

/** Normalize sample_music from doc: array of { url, id } or legacy single sample_music_url/sample_music_id. */
function normalizeSampleMusic(d) {
  if (Array.isArray(d.sample_music) && d.sample_music.length > 0) {
    return d.sample_music.filter((s) => s && typeof s.url === "string").slice(0, 20);
  }
  if (d.sample_music_url && typeof d.sample_music_url === "string") {
    return [{ url: d.sample_music_url, id: d.sample_music_id || "" }];
  }
  return [];
}

/** GET - Return the list of music base prompts from Firebase. When empty, returns one synthetic "default" so the UI has an option. */
export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection(COLLECTION).get();

    let bases =
      snapshot.empty
        ? [{ id: "default", name: "Default", prompt: FALLBACK_PROMPT, sample_music: [] }]
        : snapshot.docs.map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              name: d.name || humanize(doc.id),
              prompt: d.prompt || "",
              sample_music: normalizeSampleMusic(d),
            };
          });
    // Ensure default is first
    const defaultIdx = bases.findIndex((b) => b.id === "default");
    if (defaultIdx > 0) {
      const [defaultBase] = bases.splice(defaultIdx, 1);
      bases.unshift(defaultBase);
    }

    return NextResponse.json({
      success: true,
      bases,
    });
  } catch (error) {
    console.error("Quote-videos music-base-prompts error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to list base prompts" },
      { status: 500 }
    );
  }
}

/** POST - Create a new music base prompt. Body: { id, name, prompt }. id = slug (lowercase, hyphens). */
export async function POST(request) {
  try {
    const body = await request.json();
    let { id, name, prompt } = body;
    id = typeof id === "string" ? id.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") : "";
    name = typeof name === "string" ? name.trim() : (id ? id.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ") : "");
    prompt = typeof prompt === "string" ? prompt.trim() : "";

    if (!id) {
      return NextResponse.json({ success: false, error: "id is required (slug, e.g. uplifting)" }, { status: 400 });
    }
    if (id === "default") {
      return NextResponse.json({ success: false, error: "Cannot create a base with id 'default'" }, { status: 400 });
    }
    if (!prompt) {
      return NextResponse.json({ success: false, error: "prompt is required" }, { status: 400 });
    }

    const db = getAdminDb();
    const ref = db.collection(COLLECTION).doc(id);
    const existing = await ref.get();
    if (existing.exists) {
      return NextResponse.json({ success: false, error: "A base with this id already exists" }, { status: 409 });
    }

    await ref.set({
      name: name || id,
      prompt,
      sample_music: [],
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      base: { id, name: name || id, prompt, sample_music: [] },
    });
  } catch (error) {
    console.error("Quote-videos music-base-prompts POST error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create base prompt" },
      { status: 500 }
    );
  }
}
