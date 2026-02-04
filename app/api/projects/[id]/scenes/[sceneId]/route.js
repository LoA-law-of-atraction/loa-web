import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

function clampDurationSeconds(value, fallback = 8) {
  const n = Number(value);
  const numeric = Number.isFinite(n) ? n : fallback;
  return Math.max(1, Math.min(15, Math.round(numeric)));
}

// PATCH - Update scene in subcollection
export async function PATCH(request, { params }) {
  try {
    // Next.js 15: await params before accessing properties
    const { id, sceneId } = await params;

    const db = getAdminDb();
    const sceneRef = db
      .collection("projects")
      .doc(id)
      .collection("scenes")
      .doc(sceneId);

    // Check if scene exists
    const sceneDoc = await sceneRef.get();
    if (!sceneDoc.exists) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    const updates = await request.json();

    // Ensure `duration` is stored as an integer number of seconds.
    if (updates && Object.prototype.hasOwnProperty.call(updates, "duration")) {
      updates.duration = clampDurationSeconds(updates.duration, 8);
    }

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();

    // Update the scene
    await sceneRef.update(updates);

    return NextResponse.json({
      success: true,
      message: "Scene updated successfully",
    });
  } catch (error) {
    console.error("Update scene error:", error);
    return NextResponse.json(
      { error: "Failed to update scene", message: error.message },
      { status: 500 },
    );
  }
}
