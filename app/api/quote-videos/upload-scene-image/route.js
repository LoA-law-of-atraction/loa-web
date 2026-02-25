import { NextResponse } from "next/server";
import { getAdminStorage } from "@/utils/firebaseAdmin";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 10;

/**
 * POST /api/quote-videos/upload-scene-image
 * FormData: file (image), project_id (required)
 * Uploads to Firebase Storage under quote-videos/{project_id}/uploaded/.
 * Returns { success, url, path }.
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const projectId = formData.get("project_id");
    if (!projectId || typeof projectId !== "string" || !projectId.trim()) {
      return NextResponse.json(
        { success: false, error: "Missing project_id" },
        { status: 400 }
      );
    }

    if (!file || typeof file.name === "undefined") {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const sizeMB = buffer.length / (1024 * 1024);
    if (sizeMB > MAX_SIZE_MB) {
      return NextResponse.json(
        { success: false, error: `File too large (max ${MAX_SIZE_MB}MB)` },
        { status: 400 }
      );
    }

    const type = file.type || "image/jpeg";
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." },
        { status: 400 }
      );
    }

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const safeExt = ["jpeg", "jpg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${safeExt}`;
    const storagePath = `quote-videos/${projectId.trim()}/uploaded/${filename}`;

    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const fileRef = bucket.file(storagePath);

    await fileRef.save(buffer, {
      metadata: { contentType: type },
    });

    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: storagePath,
    });
  } catch (error) {
    console.error("Upload scene image error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}
