import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

// GET single project with scenes
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const db = getAdminDb();
    const projectDoc = await db.collection("projects").doc(resolvedParams.id).get();

    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Get scenes subcollection
    const scenesSnapshot = await db
      .collection("projects")
      .doc(resolvedParams.id)
      .collection("scenes")
      .get();

    const scenes = scenesSnapshot.docs.map((doc) => ({
      ...doc.data(),
    }));

    // Sort scenes by id
    scenes.sort((a, b) => a.id - b.id);

    const scriptData = {
      script: projectDoc.data().script,
      scenes,
    };

    return NextResponse.json({
      success: true,
      project: {
        id: projectDoc.id,
        ...projectDoc.data(),
      },
      scriptData,
    });
  } catch (error) {
    console.error("Get project error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project", message: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update project
export async function PATCH(request, { params }) {
  try {
    const resolvedParams = await params;
    const db = getAdminDb();
    const projectRef = db.collection("projects").doc(resolvedParams.id);

    // Check if project exists
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const updates = await request.json();

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();

    // Update the project
    await projectRef.update(updates);

    return NextResponse.json({
      success: true,
      message: "Project updated successfully",
    });
  } catch (error) {
    console.error("Update project error:", error);
    return NextResponse.json(
      { error: "Failed to update project", message: error.message },
      { status: 500 }
    );
  }
}

// DELETE project and its scenes
export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const db = getAdminDb();
    const projectRef = db.collection("projects").doc(resolvedParams.id);

    // Check if project exists
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Delete all scenes in subcollection
    const scenesSnapshot = await projectRef.collection("scenes").get();
    const batch = db.batch();

    scenesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete the project document
    batch.delete(projectRef);

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: "Project and scenes deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { error: "Failed to delete project", message: error.message },
      { status: 500 }
    );
  }
}
