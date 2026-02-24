import { NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/utils/firebaseAdmin";

const COLLECTION = "quote_projects";

/**
 * POST /api/quote-videos/delete-reference-image
 * Body: { project_id: string, url: string }
 * Removes the image from the project's reference_image_history and deletes the file from Firebase Storage.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const projectId = body.project_id || "";
    const urlToRemove = typeof body.url === "string" ? body.url.trim() : "";

    if (!projectId || !urlToRemove) {
      return NextResponse.json(
        { success: false, error: "Missing project_id or url" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const ref = db.collection(COLLECTION).doc(projectId);
    const doc = await ref.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const data = doc.data();
    const history = Array.isArray(data.reference_image_history) ? data.reference_image_history : [];
    let storagePathToDelete = null;
    const newHistory = history.filter((entry) => {
      const url = typeof entry === "string" ? entry : entry?.url;
      if (url === urlToRemove) {
        if (entry && typeof entry === "object" && entry.path) {
          storagePathToDelete = entry.path;
        }
        return false;
      }
      return true;
    });

    if (newHistory.length === history.length) {
      return NextResponse.json(
        { success: false, error: "Image not found in gallery" },
        { status: 404 }
      );
    }

    if (!storagePathToDelete) {
      const bucket = getAdminStorage().bucket();
      const bucketName = bucket.name;
      const storageOrigin = `https://storage.googleapis.com/${bucketName}/`;
      if (urlToRemove.startsWith(storageOrigin)) {
        storagePathToDelete = decodeURIComponent(urlToRemove.slice(storageOrigin.length).split("?")[0]);
      }
    }

    if (storagePathToDelete) {
      try {
        const bucket = getAdminStorage().bucket();
        const fileRef = bucket.file(storagePathToDelete);
        await fileRef.delete();
      } catch (err) {
        console.error("Storage delete error (continuing with history update):", err.message);
      }
    }

    const updatedReferenceUrl =
      data.reference_image_url === urlToRemove
        ? (newHistory.length > 0 ? (typeof newHistory[newHistory.length - 1] === "string" ? newHistory[newHistory.length - 1] : newHistory[newHistory.length - 1]?.url) : "")
        : data.reference_image_url;

    await ref.update({
      updated_at: new Date().toISOString(),
      reference_image_url: updatedReferenceUrl || null,
      reference_image_history: newHistory,
    });

    return NextResponse.json({
      success: true,
      reference_image_url: updatedReferenceUrl || null,
    });
  } catch (error) {
    console.error("Delete reference image error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete image" },
      { status: 500 }
    );
  }
}
