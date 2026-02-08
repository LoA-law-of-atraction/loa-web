import { NextResponse } from "next/server";
import { getAdminStorage, getAdminDb } from "@/utils/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

function extractStorageObjectPathFromUrl(url, bucketName) {
  if (!url) return null;

  // https://storage.googleapis.com/{bucket}/{path}
  const gcsMatch = String(url).match(
    new RegExp(`^https://storage\\.googleapis\\.com/${bucketName}/(.+)$`),
  );
  if (gcsMatch?.[1]) return decodeURIComponent(gcsMatch[1]);

  // https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?...
  const fbMatch = String(url).match(
    new RegExp(
      `^https://firebasestorage\\.googleapis\\.com/v0/b/${bucketName}/o/(.+?)(\\?|$)`,
    ),
  );
  if (fbMatch?.[1]) return decodeURIComponent(fbMatch[1]);

  return null;
}

export async function POST(request) {
  try {
    const { video_url, project_id, scene_id } = await request.json();

    if (!video_url) {
      return NextResponse.json(
        { error: "Missing video_url parameter" },
        { status: 400 },
      );
    }

    const bucket = getAdminStorage().bucket();

    const filePath = extractStorageObjectPathFromUrl(video_url, bucket.name);
    if (!filePath) {
      console.error("Unsupported video URL format:", video_url);
      return NextResponse.json(
        { error: "Unsupported video URL format" },
        { status: 400 },
      );
    }

    const file = bucket.file(filePath);

    try {
      const [exists] = await file.exists();
      if (exists) {
        await file.delete();
        console.log(`Deleted video from storage: ${filePath}`);
      } else {
        console.warn(`Video not found in storage: ${filePath}`);
      }
    } catch (storageError) {
      console.error("Error deleting video from storage:", storageError);
      return NextResponse.json(
        { error: "Failed to delete video from storage" },
        { status: 500 },
      );
    }

    // Best-effort: remove from library sample_videos based on the scene's selections
    if (project_id && scene_id) {
      try {
        const db = getAdminDb();
        const projectRef = db.collection("projects").doc(String(project_id));
        const sceneRef = projectRef.collection("scenes").doc(String(scene_id));

        const sceneSnap = await sceneRef.get();
        if (sceneSnap.exists) {
          const sceneData = sceneSnap.data() || {};
          const actionId = sceneData.action_id || null;
          const cameraMovementId = sceneData.camera_movement_id || null;
          const characterMotionId = sceneData.character_motion_id || null;

          const batch = db.batch();
          const nowIso = new Date().toISOString();
          const updatePayload = {
            sample_videos: FieldValue.arrayRemove(video_url),
            updated_at: nowIso,
          };

          if (actionId) {
            batch.set(
              db.collection("actions").doc(String(actionId)),
              updatePayload,
              { merge: true },
            );
          }

          if (cameraMovementId) {
            batch.set(
              db.collection("camera_movements").doc(String(cameraMovementId)),
              updatePayload,
              { merge: true },
            );
          }

          if (characterMotionId) {
            batch.set(
              db.collection("character_motions").doc(String(characterMotionId)),
              updatePayload,
              { merge: true },
            );
          }

          await batch.commit();
        }
      } catch (libraryError) {
        console.error(
          "Error removing video from library sample_videos:",
          libraryError,
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    console.error("Delete video error:", error);
    return NextResponse.json(
      { error: "Failed to delete video", message: error.message },
      { status: 500 },
    );
  }
}
