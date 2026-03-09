import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";
import { DEFAULT_AFFIRMATION_TEMPLATES } from "@/data/default-affirmation-templates";

const COLLECTION = "affirmation_templates";

export async function POST() {
  try {
    const db = getAdminDb();
    const batch = db.batch();
    const now = new Date().toISOString();
    const col = db.collection(COLLECTION);
    const existingSnap = await col.get();
    const existingCount = existingSnap.size;

    // Skip if we already have at least as many templates as in the source (avoid duplicates on re-run)
    if (existingCount >= DEFAULT_AFFIRMATION_TEMPLATES.length) {
      return NextResponse.json({
        success: true,
        message: "Default affirmation templates already seeded",
        count: existingCount,
      });
    }

    // Use Firestore auto-generated IDs (no slug_index). Each doc gets id field set to its doc id.
    let added = 0;
    for (let index = 0; index < DEFAULT_AFFIRMATION_TEMPLATES.length; index += 1) {
      const item = DEFAULT_AFFIRMATION_TEMPLATES[index];
      const ref = col.doc(); // auto-generated id
      batch.set(ref, {
        id: ref.id,
        name: item.category,
        content: item.content,
        category: item.category,
        order: index,
        createdAt: now,
        updatedAt: now,
      });
      added += 1;
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Seeded ${added} default affirmation template(s)`,
      count: existingCount + added,
      added,
    });
  } catch (error) {
    console.error("Error seeding default affirmation templates:", error);
    return NextResponse.json(
      { error: "Failed to seed default templates", message: error.message },
      { status: 500 }
    );
  }
}
