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
    const { music_id } = await request.json();

    if (!music_id?.trim()) {
      return NextResponse.json(
        { error: "Missing music_id parameter" },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const musicRef = db.collection("music").doc(music_id);
    const musicDoc = await musicRef.get();

    if (!musicDoc.exists) {
      return NextResponse.json(
        { error: "Music not found" },
        { status: 404 },
      );
    }

    const musicData = musicDoc.data() || {};
    const project_id = musicData.project_id || null;
    const music_url = musicData.music_url || null;
    const storage_path = musicData.storage_path || null;

    const bucket = getAdminStorage().bucket();

    // Delete from Firebase Storage
    let filePath = storage_path;
    if (!filePath && music_url) {
      filePath = extractStorageObjectPathFromUrl(music_url, bucket.name);
    }

    if (filePath) {
      try {
        const file = bucket.file(filePath);
        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
          console.log(`Deleted music from storage: ${filePath}`);
        } else {
          console.warn(`Music file not found in storage: ${filePath}`);
        }
      } catch (storageError) {
        console.error("Error deleting music from storage:", storageError);
        return NextResponse.json(
          { error: "Failed to delete music from storage" },
          { status: 500 },
        );
      }
    } else {
      console.warn("No storage_path or extractable path for music:", music_id);
    }

    // Delete the music document from Firestore
    await musicRef.delete();

    // If this music was the selected background for the project, clear it
    if (project_id) {
      try {
        const projectRef = db.collection("projects").doc(project_id);
        const projectDoc = await projectRef.get();
        if (projectDoc.exists) {
          const data = projectDoc.data() || {};
          if (data.background_music_url === music_url || data.background_music_id === music_id) {
            await projectRef.update({
              background_music_id: null,
              background_music_url: null,
              background_music_prompt: "",
              updated_at: new Date().toISOString(),
            });
          }
        }

        // Also update video_sessions if session_id exists
        const session_id = musicData.session_id;
        if (session_id) {
          const sessionRef = db.collection("video_sessions").doc(String(session_id));
          const sessionDoc = await sessionRef.get();
          if (sessionDoc.exists) {
            const sessionData = sessionDoc.data() || {};
            if (sessionData.background_music_url === music_url) {
              await sessionRef.update({
                background_music_url: null,
                background_music_prompt: null,
                updated_at: new Date().toISOString(),
              });
            }
          }
        }
      } catch (projectError) {
        console.warn("Error clearing project/session background music:", projectError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Music deleted successfully",
    });
  } catch (error) {
    console.error("Delete music error:", error);
    return NextResponse.json(
      { error: "Failed to delete music", message: error.message },
      { status: 500 },
    );
  }
}
