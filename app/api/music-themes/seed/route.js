import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";
import { MUSIC_THEMES_LIBRARY } from "@/data/music-themes-library";

export async function POST() {
  try {
    const db = getAdminDb();
    const batch = db.batch();

    const existingSnapshot = await db.collection("music_themes").get();
    const existingIds = new Set(existingSnapshot.docs.map((doc) => doc.id));

    const newItems = MUSIC_THEMES_LIBRARY.filter(
      (item) => !existingIds.has(item.id),
    );

    if (newItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All music themes already seeded, no new items to add",
        count: existingSnapshot.size,
      });
    }

    for (const item of newItems) {
      const ref = db.collection("music_themes").doc(item.id);
      batch.set(ref, {
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Seeded ${newItems.length} new music theme(s)`,
      count: existingSnapshot.size + newItems.length,
      new_music_themes: newItems.map((i) => i.name),
    });
  } catch (error) {
    console.error("Error seeding music themes:", error);
    return NextResponse.json(
      { error: "Failed to seed music themes", message: error.message },
      { status: 500 },
    );
  }
}
