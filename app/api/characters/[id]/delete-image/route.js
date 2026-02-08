import { NextResponse } from "next/server";
import { getAdminStorage, getAdminDb } from "@/utils/firebaseAdmin";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Missing image URL" },
        { status: 400 }
      );
    }

    const bucket = getAdminStorage().bucket();
    const db = getAdminDb();

    // Extract the file path from the URL
    // URL format: https://storage.googleapis.com/{bucket_name}/{path}
    const urlParts = imageUrl.split(`${bucket.name}/`);
    if (urlParts.length < 2) {
      return NextResponse.json(
        { error: "Invalid image URL format" },
        { status: 400 }
      );
    }

    const filePath = urlParts[1];

    // Delete the file from storage
    try {
      const file = bucket.file(filePath);
      await file.delete();
    } catch (storageError) {
      console.error("Storage deletion error:", storageError);
      // Continue even if storage deletion fails (file might not exist)
    }

    // Update character document to remove the image URL
    const characterRef = db.collection("characters").doc(id);
    const characterDoc = await characterRef.get();

    if (!characterDoc.exists) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    const currentImageUrls = characterDoc.data().image_urls || [];
    const updatedImageUrls = currentImageUrls.filter(url => url !== imageUrl);

    await characterRef.update({
      image_urls: updatedImageUrls,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Delete image error:", error);
    return NextResponse.json(
      { error: "Failed to delete image", message: error.message },
      { status: 500 }
    );
  }
}
