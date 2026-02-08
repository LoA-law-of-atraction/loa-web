import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";
import { CAMERA_MOVEMENTS_LIBRARY } from "@/data/camera-movements-library";

export async function POST() {
  try {
    const db = getAdminDb();
    const batch = db.batch();

    const existingSnapshot = await db.collection("camera_movements").get();
    const existingIds = new Set(existingSnapshot.docs.map((doc) => doc.id));

    const newItems = CAMERA_MOVEMENTS_LIBRARY.filter(
      (item) => !existingIds.has(item.id),
    );

    if (newItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All camera movements already seeded, no new items to add",
        count: existingSnapshot.size,
      });
    }

    for (const item of newItems) {
      const ref = db.collection("camera_movements").doc(item.id);
      batch.set(ref, {
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Seeded ${newItems.length} new camera movement(s)`,
      count: existingSnapshot.size + newItems.length,
      new_camera_movements: newItems.map((i) => i.name),
    });
  } catch (error) {
    console.error("Error seeding camera movements:", error);
    return NextResponse.json(
      { error: "Failed to seed camera movements", message: error.message },
      { status: 500 },
    );
  }
}
