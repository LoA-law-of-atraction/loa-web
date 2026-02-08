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
    const { image_url, project_id, character_id, scene_id } =
      await request.json();

    if (!image_url) {
      return NextResponse.json(
        { error: "Missing image_url parameter" },
        { status: 400 },
      );
    }

    const bucket = getAdminStorage().bucket();

    const filePath = extractStorageObjectPathFromUrl(image_url, bucket.name);
    if (!filePath) {
      console.error("Unsupported image URL format:", image_url);
      return NextResponse.json(
        { error: "Unsupported image URL format" },
        { status: 400 },
      );
    }
    console.log(`Deleting image from storage: ${filePath}`);

    const file = bucket.file(filePath);

    // Check if file exists before attempting to delete
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
      console.log(`Successfully deleted: ${filePath}`);
    } else {
      console.warn(`File not found in storage: ${filePath}`);
    }

    // Update character's projects subcollection to remove image reference
    if (character_id && project_id && scene_id) {
      try {
        const db = getAdminDb();
        const characterRef = db.collection("characters").doc(character_id);
        const characterProjectRef = characterRef
          .collection("projects")
          .doc(project_id);

        const characterProjectDoc = await characterProjectRef.get();
        if (characterProjectDoc.exists) {
          const existingImages = characterProjectDoc.data()?.images || [];

          // Remove image for this scene_id
          const updatedImages = existingImages.filter(
            (img) => img.scene_id !== scene_id,
          );

          await characterProjectRef.update({
            images: updatedImages,
            image_count: updatedImages.length,
            updated_at: new Date().toISOString(),
          });

          console.log(
            `Removed image reference for scene ${scene_id} from character ${character_id} project ${project_id}`,
          );
        }
      } catch (characterError) {
        console.error("Error updating character project:", characterError);
        // Don't fail the whole request if character update fails
      }
    }

    // Remove from location's sample_images if this scene was using a location
    if (project_id && scene_id) {
      try {
        const db = getAdminDb();
        const projectRef = db.collection("projects").doc(project_id);
        const projectDoc = await projectRef.get();

        if (projectDoc.exists) {
          let locationId = null;

          // Prefer per-scene selection
          try {
            const sceneDocSnap = await projectRef
              .collection("scenes")
              .doc(String(scene_id))
              .get();
            if (sceneDocSnap.exists) {
              locationId = sceneDocSnap.data()?.location_id || null;
            }
          } catch {}

          // Legacy fallback
          if (!locationId) {
            const locationMapping = projectDoc.data()?.location_mapping || {};
            locationId =
              locationMapping?.[scene_id] ??
              locationMapping?.[String(scene_id)] ??
              null;
          }

          if (locationId) {
            const locationRef = db.collection("locations").doc(locationId);
            const locationDoc = await locationRef.get();

            if (locationDoc.exists) {
              const existingSamples = locationDoc.data()?.sample_images || [];

              // Remove this image from the samples
              const updatedSamples = existingSamples.filter(
                (url) => url !== image_url,
              );

              await locationRef.update({
                sample_images: updatedSamples,
                updated_at: new Date().toISOString(),
              });

              console.log(`Removed image from location ${locationId} samples`);
            }
          }
        }
      } catch (locationError) {
        console.error("Error updating location samples:", locationError);
        // Don't fail the whole request if location update fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Delete image error:", error);
    return NextResponse.json(
      { error: "Failed to delete image", message: error.message },
      { status: 500 },
    );
  }
}
