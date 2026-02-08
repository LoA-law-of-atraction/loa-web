import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function GET(_request, { params }) {
  try {
    const resolvedParams = await params;
    const instrumentId = resolvedParams.instrumentId;
    const db = getAdminDb();

    const doc = await db.collection("instruments").doc(instrumentId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      instrument: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error("Error fetching instrument:", error);
    return NextResponse.json(
      { error: "Failed to fetch instrument", message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const resolvedParams = await params;
    const instrumentId = resolvedParams.instrumentId;
    const updates = await request.json();
    const db = getAdminDb();

    const ref = db.collection("instruments").doc(instrumentId);
    const doc = await ref.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const validRoles = ["primary", "secondary", "conditional", "forbidden"];
    const sanitized = { ...updates };
    if (sanitized.role && !validRoles.includes(sanitized.role)) {
      delete sanitized.role;
    }
    if (typeof sanitized.order === "number") {
      sanitized.order = sanitized.order;
    } else if (typeof sanitized.order === "string" && sanitized.order !== "") {
      sanitized.order = Number(sanitized.order) || 999;
    }

    await ref.update({
      ...sanitized,
      updated_at: new Date().toISOString(),
    });

    const updated = await ref.get();
    return NextResponse.json({
      success: true,
      instrument: { id: updated.id, ...updated.data() },
    });
  } catch (error) {
    console.error("Error updating instrument:", error);
    return NextResponse.json(
      { error: "Failed to update instrument", message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const resolvedParams = await params;
    const instrumentId = resolvedParams.instrumentId;
    const db = getAdminDb();

    await db.collection("instruments").doc(instrumentId).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting instrument:", error);
    return NextResponse.json(
      { error: "Failed to delete instrument", message: error.message },
      { status: 500 }
    );
  }
}
