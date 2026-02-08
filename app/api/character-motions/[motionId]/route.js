import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function GET(_request, { params }) {
  try {
    const { motionId } = params;
    const db = getAdminDb();

    const doc = await db.collection("character_motions").doc(motionId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      character_motion: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error("Error fetching character motion:", error);
    return NextResponse.json(
      { error: "Failed to fetch character motion", message: error.message },
      { status: 500 },
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { motionId } = params;
    const updates = await request.json();
    const db = getAdminDb();

    const ref = db.collection("character_motions").doc(motionId);
    const doc = await ref.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await ref.update({
      ...updates,
      updated_at: new Date().toISOString(),
    });

    const updated = await ref.get();
    return NextResponse.json({
      success: true,
      character_motion: { id: updated.id, ...updated.data() },
    });
  } catch (error) {
    console.error("Error updating character motion:", error);
    return NextResponse.json(
      { error: "Failed to update character motion", message: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { motionId } = params;
    const db = getAdminDb();

    await db.collection("character_motions").doc(motionId).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting character motion:", error);
    return NextResponse.json(
      { error: "Failed to delete character motion", message: error.message },
      { status: 500 },
    );
  }
}
