import { NextResponse } from "next/server";
import { getAdminStorage, getAdminDb } from "@/utils/firebaseAdmin";

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
    const { voiceover_id } = await request.json();

    if (!voiceover_id?.trim()) {
      return NextResponse.json(
        { error: "Missing voiceover_id parameter" },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const voiceoverRef = db.collection("voiceovers").doc(voiceover_id);
    const voiceoverDoc = await voiceoverRef.get();

    if (!voiceoverDoc.exists) {
      return NextResponse.json(
        { error: "Voiceover not found" },
        { status: 404 },
      );
    }

    const voiceoverData = voiceoverDoc.data() || {};
    const project_id = voiceoverData.project_id || null;
    const voiceover_url = voiceoverData.voiceover_url || null;
    const storage_path = voiceoverData.storage_path || null;

    const bucket = getAdminStorage().bucket();

    // Delete from Firebase Storage
    let filePath = storage_path;
    if (!filePath && voiceover_url) {
      filePath = extractStorageObjectPathFromUrl(voiceover_url, bucket.name);
    }

    if (filePath) {
      try {
        const file = bucket.file(filePath);
        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
          console.log(`Deleted voiceover from storage: ${filePath}`);
        } else {
          console.warn(`Voiceover file not found in storage: ${filePath}`);
        }
      } catch (storageError) {
        console.error("Error deleting voiceover from storage:", storageError);
        return NextResponse.json(
          { error: "Failed to delete voiceover from storage" },
          { status: 500 },
        );
      }
    } else {
      console.warn("No storage_path or extractable path for voiceover:", voiceover_id);
    }

    // Delete the voiceover document from Firestore
    await voiceoverRef.delete();

    // If this voiceover was the selected one for the project, clear it
    if (project_id) {
      try {
        const projectRef = db.collection("projects").doc(project_id);
        const projectDoc = await projectRef.get();
        if (projectDoc.exists) {
          const data = projectDoc.data() || {};
          if (data.voiceover_url === voiceover_url || data.voiceover_id === voiceover_id) {
            await projectRef.update({
              voiceover_id: null,
              voiceover_url: null,
              updated_at: new Date().toISOString(),
            });
          }
        }
      } catch (projectError) {
        console.warn("Error clearing project voiceover:", projectError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Voiceover deleted successfully",
    });
  } catch (error) {
    console.error("Delete voiceover error:", error);
    return NextResponse.json(
      { error: "Failed to delete voiceover", message: error.message },
      { status: 500 },
    );
  }
}
