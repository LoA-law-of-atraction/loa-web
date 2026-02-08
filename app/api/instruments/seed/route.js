import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";
import { INSTRUMENTS_LIBRARY } from "@/data/instruments-library";

export async function POST() {
  try {
    const db = getAdminDb();
    const batch = db.batch();

    const existingSnapshot = await db.collection("instruments").get();
    const existingIds = new Set(existingSnapshot.docs.map((doc) => doc.id));

    const newItems = INSTRUMENTS_LIBRARY.filter(
      (item) => !existingIds.has(item.id)
    );

    if (newItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All instruments already seeded, no new items to add",
        count: existingSnapshot.size,
      });
    }

    for (const item of newItems) {
      const ref = db.collection("instruments").doc(item.id);
      batch.set(ref, {
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Seeded ${newItems.length} new instrument(s)`,
      count: existingSnapshot.size + newItems.length,
      new_instruments: newItems.map((i) => i.name),
    });
  } catch (error) {
    console.error("Error seeding instruments:", error);
    return NextResponse.json(
      { error: "Failed to seed instruments", message: error.message },
      { status: 500 }
    );
  }
}
