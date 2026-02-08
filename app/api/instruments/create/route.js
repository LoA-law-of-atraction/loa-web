import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.name?.trim() || !body.role) {
      return NextResponse.json(
        { error: "Missing required fields: name and role" },
        { status: 400 }
      );
    }

    const id =
      body.id?.trim() ||
      body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

    const db = getAdminDb();
    const existing = await db.collection("instruments").doc(id).get();
    if (existing.exists) {
      return NextResponse.json(
        { error: "Instrument with this id already exists" },
        { status: 409 }
      );
    }

    const validRoles = ["primary", "secondary", "conditional", "forbidden"];
    const role = validRoles.includes(body.role) ? body.role : "forbidden";

    const newDoc = {
      id,
      name: body.name.trim(),
      role,
      description: body.description || "",
      use_for: body.use_for || "",
      behavior: body.behavior || "",
      rules: body.rules || "",
      order: Number.isFinite(Number(body.order)) ? Number(body.order) : 999,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.collection("instruments").doc(id).set(newDoc);

    return NextResponse.json({
      success: true,
      instrument: newDoc,
      message: "Instrument created successfully",
    });
  } catch (error) {
    console.error("Error creating instrument:", error);
    return NextResponse.json(
      { error: "Failed to create instrument", message: error.message },
      { status: 500 }
    );
  }
}
