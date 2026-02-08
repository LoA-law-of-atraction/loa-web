import { NextResponse } from "next/server";
import { getAdminStorage } from "@/utils/firebaseAdmin";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { sourceUrl } = await request.json();

    if (!sourceUrl) {
      return NextResponse.json(
        { error: "Missing source URL" },
        { status: 400 }
      );
    }

    const bucket = getAdminStorage().bucket();

    // Extract the source path from the URL
    // URL format: https://storage.googleapis.com/{bucket_name}/{path}
    const urlParts = sourceUrl.split(`${bucket.name}/`);
    if (urlParts.length < 2) {
      return NextResponse.json(
        { error: "Invalid source URL format" },
        { status: 400 }
      );
    }

    const sourcePath = urlParts[1];

    // Generate destination path: characters/{character_id}/{timestamp}_{filename}
    const sourceFileName = sourcePath.split('/').pop();
    const timestamp = Date.now();
    const destinationPath = `characters/${id}/${timestamp}_${sourceFileName}`;

    // Copy the file
    const sourceFile = bucket.file(sourcePath);
    const destinationFile = bucket.file(destinationPath);

    await sourceFile.copy(destinationFile);
    await destinationFile.makePublic();

    const newImageUrl = `https://storage.googleapis.com/${bucket.name}/${destinationPath}`;

    // Update character document to add the new image URL
    const db = getAdminDb();
    const characterRef = db.collection("characters").doc(id);
    const characterDoc = await characterRef.get();

    if (!characterDoc.exists) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    const currentImageUrls = characterDoc.data().image_urls || [];
    const updatedImageUrls = [...currentImageUrls, newImageUrl];

    await characterRef.update({
      image_urls: updatedImageUrls,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      imageUrl: newImageUrl,
      message: "Image copied successfully",
    });
  } catch (error) {
    console.error("Copy image error:", error);
    return NextResponse.json(
      { error: "Failed to copy image", message: error.message },
      { status: 500 }
    );
  }
}
