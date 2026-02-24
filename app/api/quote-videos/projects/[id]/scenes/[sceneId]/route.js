import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

const COLLECTION = "quote_projects";

/** GET - Read one scene (same as Character Shorts projects/[id]/scenes/[sceneId]) */
export async function GET(_request, { params }) {
  try {
    const { id: projectId, sceneId } = await params;
    const db = getAdminDb();
    const sceneRef = db
      .collection(COLLECTION)
      .doc(projectId)
      .collection("scenes")
      .doc(sceneId);

    const sceneDoc = await sceneRef.get();
    if (!sceneDoc.exists) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      scene: { id: sceneDoc.id, ...sceneDoc.data() },
    });
  } catch (error) {
    console.error("Quote get scene error:", error);
    return NextResponse.json(
      { error: "Failed to get scene", message: error.message },
      { status: 500 }
    );
  }
}

/** PATCH - Update one scene (same as Character Shorts: update scene doc in subcollection) */
export async function PATCH(request, { params }) {
  try {
    const { id: projectId, sceneId } = await params;
    const db = getAdminDb();
    const sceneRef = db
      .collection(COLLECTION)
      .doc(projectId)
      .collection("scenes")
      .doc(sceneId);

    const sceneDoc = await sceneRef.get();
    if (!sceneDoc.exists) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    const updates = await request.json();
    const allowed = [
      "label",
      "reference_image_url",
      "image_prompt",
      "image_urls",
      "image_prompts",
      "selected_image_index",
      "image_metadata",
      "duration",
      "selected_video_url",
      "video_urls",
      "motion_prompt",
      "video_negative_prompt",
    ];
    const filtered = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        filtered[key] = updates[key];
      }
    }
    filtered.updated_at = new Date().toISOString();

    await sceneRef.update(filtered);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Quote update scene error:", error);
    return NextResponse.json(
      { error: "Failed to update scene", message: error.message },
      { status: 500 }
    );
  }
}
