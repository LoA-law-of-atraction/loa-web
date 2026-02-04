import { NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/utils/firebaseAdmin";

function clampDurationSeconds(value, fallback = 8) {
  const n = Number(value);
  const numeric = Number.isFinite(n) ? n : fallback;
  return Math.max(1, Math.min(15, Math.round(numeric)));
}

// GET single project with scenes
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const db = getAdminDb();
    const projectDoc = await db
      .collection("projects")
      .doc(resolvedParams.id)
      .get();

    if (!projectDoc.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get scenes subcollection
    const scenesSnapshot = await db
      .collection("projects")
      .doc(resolvedParams.id)
      .collection("scenes")
      .get();

    const scenes = scenesSnapshot.docs.map((doc) => {
      const data = doc.data() || {};
      const next = { ...data };
      if (Object.prototype.hasOwnProperty.call(next, "duration")) {
        next.duration = clampDurationSeconds(next.duration, 8);
      }
      return next;
    });

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
      { status: 500 },
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
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const updates = await request.json();

    // Firestore does not allow nested arrays. If a client sends legacy
    // `scene_group` like [[1,2],[3]], convert to an array of objects:
    // [{ scene_ids: [1,2] }, { scene_ids: [3] }]
    if (
      updates &&
      Object.prototype.hasOwnProperty.call(updates, "scene_group")
    ) {
      const raw = updates.scene_group;
      if (Array.isArray(raw)) {
        const asObjects = raw
          .map((g) => {
            if (Array.isArray(g)) return { scene_ids: g };
            if (g && typeof g === "object") {
              if (Array.isArray(g.scene_ids)) return { scene_ids: g.scene_ids };
              if (Array.isArray(g.sceneIds)) return { scene_ids: g.sceneIds };
              if (Array.isArray(g.ids)) return { scene_ids: g.ids };
            }
            if (typeof g === "number") return { scene_ids: [g] };
            return null;
          })
          .filter(Boolean);

        updates.scene_group = asObjects;
      } else if (raw == null) {
        // allow clearing
        updates.scene_group = [];
      }
    }

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
      { status: 500 },
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
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectData = projectDoc.data() || {};

    // Helper: delete all documents in a collection in batches
    const deleteCollectionInBatches = async (
      collectionRef,
      batchSize = 300,
    ) => {
      while (true) {
        const snapshot = await collectionRef.limit(batchSize).get();
        if (snapshot.empty) break;
        const batch = db.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }
    };

    // Delete all subcollections under the project document (scenes, etc.)
    const subcollections = await projectRef.listCollections();
    for (const col of subcollections) {
      await deleteCollectionInBatches(col);
    }

    // Delete related tracking doc under character, if present
    const characterId = projectData?.character?.character_id;
    if (characterId) {
      await db
        .collection("characters")
        .doc(String(characterId))
        .collection("projects")
        .doc(resolvedParams.id)
        .delete()
        .catch(() => {});
    }

    // Delete related video session doc, if present
    const sessionId = projectData?.session_id;
    if (sessionId) {
      await db
        .collection("video_sessions")
        .doc(String(sessionId))
        .delete()
        .catch(() => {});
    }

    // Delete related storage files (images/videos) under the project prefix
    if (characterId) {
      try {
        const bucket = getAdminStorage().bucket();
        await bucket.deleteFiles({
          prefix: `characters/${String(characterId)}/projects/${resolvedParams.id}/`,
        });
      } catch (err) {
        console.warn("Delete project: failed to delete storage files", err);
      }
    }

    // Finally delete the project document
    await projectRef.delete();

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { error: "Failed to delete project", message: error.message },
      { status: 500 },
    );
  }
}
