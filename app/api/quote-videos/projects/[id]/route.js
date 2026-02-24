import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

const COLLECTION = "quote_projects";

/** GET - Get one quote project (same as Character Shorts: project doc + scenes subcollection) */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const db = getAdminDb();
    const projectRef = db.collection(COLLECTION).doc(id);
    const doc = await projectRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectData = doc.data() || {};
    // Load scenes subcollection (same structure as projects/{id}/scenes)
    const scenesSnapshot = await projectRef.collection("scenes").get();
    const scenes = scenesSnapshot.docs.map((sceneDoc) => {
      const d = sceneDoc.data() || {};
      return { id: sceneDoc.id, ...d };
    });
    // Sort by creation order (created_at), then by label "Scene N", then by id for stable order
    scenes.sort((a, b) => {
      const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (aCreated !== bCreated) return aCreated - bCreated;
      const aNum = (a.label || "").match(/Scene\s*(\d+)/i)?.[1];
      const bNum = (b.label || "").match(/Scene\s*(\d+)/i)?.[1];
      if (aNum != null && bNum != null) return Number(aNum) - Number(bNum);
      const aId = a.id != null ? String(a.id) : "";
      const bId = b.id != null ? String(b.id) : "";
      return aId.localeCompare(bId, undefined, { numeric: true });
    });

    return NextResponse.json({
      success: true,
      project: { id: doc.id, ...projectData, scenes },
    });
  } catch (error) {
    console.error("Quote project get error:", error);
    return NextResponse.json(
      { error: "Failed to get project", message: error.message },
      { status: 500 }
    );
  }
}

/** PATCH - Update quote project */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const db = getAdminDb();
    const ref = db.collection(COLLECTION).doc(id);

    const doc = await ref.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const updates = await request.json();
    // Scene data lives in quote_projects/{id}/scenes/{sceneId} subcollection (same as Character Shorts). Do not write "scenes" on project.
    const allowed = [
      "name",
      "theme",
      "quote_text",
      "quote_list",
      "animation_video_url",
      "animation_video_history",
      "music_url",
      "background_music_id",
      "background_music_prompt",
      "music_prompt",
      "music_negative_prompt",
      "music_base_id",
      "duration_seconds",
      "youtube_transcript_url",
      "youtube_transcript",
      "background_image_url",
      "background_image_history",
      "reference_image_url",
      "image_prompt_used",
      "reference_image_history",
      "current_step",
      "text_to_image_model",
      "timeline_settings",
      "grain_overlay_url",
      "grain_opacity",
    ];
    const filtered = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        filtered[key] = updates[key];
      }
    }
    filtered.updated_at = new Date().toISOString();

    await ref.update(filtered);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Quote project update error:", error);
    return NextResponse.json(
      { error: "Failed to update project", message: error.message },
      { status: 500 }
    );
  }
}

/** DELETE - Delete quote project and its scenes subcollection (same as Character Shorts) */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const db = getAdminDb();
    const ref = db.collection(COLLECTION).doc(id);

    const doc = await ref.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const scenesCol = ref.collection("scenes");
    const scenesSnap = await scenesCol.get();
    const batch = db.batch();
    scenesSnap.docs.forEach((d) => batch.delete(d.ref));
    if (!scenesSnap.empty) await batch.commit();
    await ref.delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Quote project delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete project", message: error.message },
      { status: 500 }
    );
  }
}
