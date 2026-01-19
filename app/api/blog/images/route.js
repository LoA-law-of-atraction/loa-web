import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { storage } from "@/utils/firebase";

// Verify admin authentication
function verifyAuth() {
  const cookieStore = cookies();
  const authCookie = cookieStore.get("admin_session");
  return authCookie && authCookie.value && authCookie.value.length === 64;
}

export async function GET(request) {
  try {
    // Verify authentication
    if (!verifyAuth()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // List all images in the blog folder
    const blogRef = ref(storage, "blog");
    const result = await listAll(blogRef);

    // Get download URLs for all images
    const images = await Promise.all(
      result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return {
          name: itemRef.name,
          path: itemRef.fullPath,
          url,
        };
      }),
    );

    // Sort by name (newest first since names have timestamps)
    images.sort((a, b) => b.name.localeCompare(a.name));

    return NextResponse.json({ images }, { status: 200 });
  } catch (error) {
    console.error("Error listing images:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list images" },
      { status: 500 },
    );
  }
}
