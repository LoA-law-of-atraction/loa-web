import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function POST(request) {
  try {
    const { theme_id } = await request.json();

    if (!theme_id?.trim()) {
      return NextResponse.json(
        { error: "theme_id is required" },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const themeDoc = await db.collection("music_themes").doc(theme_id).get();
    if (!themeDoc.exists) {
      return NextResponse.json(
        { error: "Theme not found" },
        { status: 404 },
      );
    }

    await db.collection("settings").doc("music").set(
      { default_theme_id: theme_id, updated_at: new Date().toISOString() },
      { merge: true },
    );

    return NextResponse.json({
      success: true,
      default_theme_id: theme_id,
    });
  } catch (error) {
    console.error("Set default theme error:", error);
    return NextResponse.json(
      { error: "Failed to set default theme", message: error.message },
      { status: 500 },
    );
  }
}
