import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function GET() {
  try {
    const db = getAdminDb();
    const [themesSnapshot, settingsDoc] = await Promise.all([
      db.collection("music_themes").get(),
      db.collection("settings").doc("music").get(),
    ]);

    const music_themes = themesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const default_theme_id = settingsDoc.exists
      ? settingsDoc.data()?.default_theme_id || null
      : null;

    return NextResponse.json({
      success: true,
      music_themes,
      default_theme_id,
    });
  } catch (error) {
    console.error("Error fetching music themes:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch music themes",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
