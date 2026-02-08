import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function POST(request) {
  try {
    const { instrument_id } = await request.json();

    if (!instrument_id?.trim()) {
      return NextResponse.json(
        { error: "instrument_id is required" },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const instrumentDoc = await db
      .collection("instruments")
      .doc(instrument_id)
      .get();
    if (!instrumentDoc.exists) {
      return NextResponse.json(
        { error: "Instrument not found" },
        { status: 404 },
      );
    }

    await db.collection("settings").doc("instruments").set(
      {
        default_instrument_id: instrument_id,
        updated_at: new Date().toISOString(),
      },
      { merge: true },
    );

    return NextResponse.json({
      success: true,
      default_instrument_id: instrument_id,
    });
  } catch (error) {
    console.error("Set default instruments error:", error);
    return NextResponse.json(
      { error: "Failed to set default instruments", message: error.message },
      { status: 500 },
    );
  }
}
