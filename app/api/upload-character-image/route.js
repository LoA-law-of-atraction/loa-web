import { NextResponse } from "next/server";
import { getAdminStorage } from "@/utils/firebaseAdmin";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const gender = formData.get("gender") || "other";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split(".").pop();
    const filename = `${timestamp}-${randomString}.${extension}`;

    // Determine storage path based on gender
    const storagePath = `characters/${gender}/${filename}`;

    // Upload to Firebase Storage
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const fileRef = bucket.file(storagePath);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Make file publicly accessible
    await fileRef.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: storagePath,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image", message: error.message },
      { status: 500 }
    );
  }
}
