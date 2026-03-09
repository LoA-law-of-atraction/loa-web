import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

const COLLECTION = "affirmation_templates";

export async function PATCH(request, { params }) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Template id required" }, { status: 400 });
    }
    const body = await request.json();
    const { name, content, category, order } = body;

    const db = getAdminDb();
    const ref = db.collection(COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const update = { id, updatedAt: new Date().toISOString() };
    if (typeof name === "string") update.name = name;
    if (typeof content === "string") update.content = content;
    if (typeof category === "string") update.category = category;
    if (typeof order === "number") update.order = order;

    await ref.update(update);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error updating default template:", error);
    return NextResponse.json(
      { error: "Failed to update template", message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Template id required" }, { status: 400 });
    }

    const db = getAdminDb();
    const ref = db.collection(COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    await ref.delete();

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error deleting default template:", error);
    return NextResponse.json(
      { error: "Failed to delete template", message: error.message },
      { status: 500 }
    );
  }
}
