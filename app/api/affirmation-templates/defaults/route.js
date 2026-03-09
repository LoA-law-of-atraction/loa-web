import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

const COLLECTION = "affirmation_templates";

/**
 * GET default affirmation templates (root collection).
 * Uses Admin SDK so it works even when client Firestore rules
 * don't allow read on affirmation_templates.
 */
export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection(COLLECTION).get();
    const list = snap.docs
      .map((d) => {
        const raw = d.data();
        return {
          id: raw.id || d.id,
          name: raw.name || "",
          content: raw.content || "",
          category: raw.category || "",
          order: raw.order ?? 0,
        };
      })
      .sort((a, b) => a.order - b.order);

    return NextResponse.json(list);
  } catch (error) {
    console.error("Error fetching default affirmation templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch default templates", message: error.message },
      { status: 500 }
    );
  }
}

const BATCH_SIZE = 500;

/**
 * DELETE all default affirmation templates (root collection).
 * Use to clear old docs before re-seeding with auto-generated ids.
 */
export async function DELETE() {
  try {
    const db = getAdminDb();
    const col = db.collection(COLLECTION);
    const snap = await col.get();
    const docs = snap.docs;
    if (docs.length === 0) {
      return NextResponse.json({ success: true, deleted: 0, message: "No templates to delete" });
    }
    let deleted = 0;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = docs.slice(i, i + BATCH_SIZE);
      chunk.forEach((d) => {
        batch.delete(d.ref);
        deleted += 1;
      });
      await batch.commit();
    }
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error("Error deleting default affirmation templates:", error);
    return NextResponse.json(
      { error: "Failed to delete default templates", message: error.message },
      { status: 500 }
    );
  }
}
