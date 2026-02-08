import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";
import { CHARACTER_MOTIONS_LIBRARY } from "@/data/character-motions-library";

export async function POST() {
  try {
    const db = getAdminDb();
    const batch = db.batch();

    const existingSnapshot = await db.collection("character_motions").get();
    const existingIds = new Set(existingSnapshot.docs.map((doc) => doc.id));

    const newItems = CHARACTER_MOTIONS_LIBRARY.filter(
      (item) => !existingIds.has(item.id),
    );

    if (newItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All character motions already seeded, no new items to add",
        count: existingSnapshot.size,
      });
    }

    for (const item of newItems) {
      const ref = db.collection("character_motions").doc(item.id);
      batch.set(ref, {
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Seeded ${newItems.length} new character motion(s)`,
      count: existingSnapshot.size + newItems.length,
      new_character_motions: newItems.map((i) => i.name),
    });
  } catch (error) {
    console.error("Error seeding character motions:", error);
    return NextResponse.json(
      { error: "Failed to seed character motions", message: error.message },
      { status: 500 },
    );
  }
}
