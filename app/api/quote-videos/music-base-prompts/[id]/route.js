import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

const COLLECTION = "music_base_prompts";

function normalizeSampleMusic(d) {
  if (Array.isArray(d.sample_music) && d.sample_music.length > 0) {
    return d.sample_music.filter((s) => s && typeof s.url === "string").slice(0, 20);
  }
  if (d.sample_music_url && typeof d.sample_music_url === "string") {
    return [{ url: d.sample_music_url, id: d.sample_music_id || "" }];
  }
  return [];
}

/** PATCH - Update a music base prompt. Body: { name?, prompt? } */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "id required" }, { status: 400 });
    }

    const db = getAdminDb();
    const ref = db.collection(COLLECTION).doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, error: "Base prompt not found" }, { status: 404 });
    }

    const body = await request.json();
    const updates = {};
    if (typeof body.name === "string") updates.name = body.name.trim();
    if (typeof body.prompt === "string") updates.prompt = body.prompt.trim();
    updates.updated_at = new Date().toISOString();

    if (Object.keys(updates).length <= 1) {
      return NextResponse.json({ success: true, base: { id, ...doc.data() } });
    }

    await ref.update(updates);
    const updated = await ref.get();
    const d = updated.data();
    return NextResponse.json({
      success: true,
      base: {
        id: updated.id,
        name: d.name,
        prompt: d.prompt,
        sample_music: normalizeSampleMusic(d),
      },
    });
  } catch (error) {
    console.error("Quote-videos music-base-prompts PATCH error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update" },
      { status: 500 }
    );
  }
}

/** DELETE - Delete a music base prompt. Cannot delete "default". */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "id required" }, { status: 400 });
    }
    if (id === "default") {
      return NextResponse.json({ success: false, error: "Cannot delete the default base prompt" }, { status: 400 });
    }

    const db = getAdminDb();
    const ref = db.collection(COLLECTION).doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, error: "Base prompt not found" }, { status: 404 });
    }

    await ref.delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Quote-videos music-base-prompts DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete" },
      { status: 500 }
    );
  }
}
