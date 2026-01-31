import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

// PATCH - Update scene in subcollection
export async function PATCH(request, { params }) {
  try {
    const db = getAdminDb();
    const sceneRef = db
      .collection("projects")
      .doc(params.id)
      .collection("scenes")
      .doc(params.sceneId);

    // Check if scene exists
    const sceneDoc = await sceneRef.get();
    if (!sceneDoc.exists) {
      return NextResponse.json(
        { error: "Scene not found" },
        { status: 404 }
      );
    }

    const updates = await request.json();

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
      { status: 500 }
    );
  }
}
