import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function GET(_request, { params }) {
  try {
    const { movementId } = params;
    const db = getAdminDb();

    const doc = await db.collection("camera_movements").doc(movementId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      camera_movement: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error("Error fetching camera movement:", error);
    return NextResponse.json(
      { error: "Failed to fetch camera movement", message: error.message },
      { status: 500 },
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { movementId } = params;
    const updates = await request.json();
    const db = getAdminDb();

    const ref = db.collection("camera_movements").doc(movementId);
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
      camera_movement: { id: updated.id, ...updated.data() },
    });
  } catch (error) {
    console.error("Error updating camera movement:", error);
    return NextResponse.json(
      { error: "Failed to update camera movement", message: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { movementId } = params;
    const db = getAdminDb();

    await db.collection("camera_movements").doc(movementId).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting camera movement:", error);
    return NextResponse.json(
      { error: "Failed to delete camera movement", message: error.message },
      { status: 500 },
    );
  }
}
