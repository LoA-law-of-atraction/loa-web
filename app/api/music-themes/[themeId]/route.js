import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function GET(_request, { params }) {
  try {
    const resolvedParams = await params;
    const themeId = resolvedParams.themeId;
    const db = getAdminDb();

    const doc = await db.collection("music_themes").doc(themeId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      music_theme: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error("Error fetching music theme:", error);
    return NextResponse.json(
      { error: "Failed to fetch music theme", message: error.message },
      { status: 500 },
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const resolvedParams = await params;
    const themeId = resolvedParams.themeId;
    const updates = await request.json();
    const db = getAdminDb();

    const ref = db.collection("music_themes").doc(themeId);
    const doc = await ref.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await ref.update({
      ...updates,
      updated_at: new Date().toISOString(),
    });

    const updated = await ref.get();
    return NextResponse.json({
      success: true,
      music_theme: { id: updated.id, ...updated.data() },
    });
  } catch (error) {
    console.error("Error updating music theme:", error);
    return NextResponse.json(
      { error: "Failed to update music theme", message: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const resolvedParams = await params;
    const themeId = resolvedParams.themeId;
    const db = getAdminDb();

    await db.collection("music_themes").doc(themeId).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting music theme:", error);
    return NextResponse.json(
      { error: "Failed to delete music theme", message: error.message },
      { status: 500 },
    );
  }
}
