import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function GET() {
  try {
    const db = getAdminDb();
    const [instrumentsSnapshot, settingsDoc] = await Promise.all([
      db.collection("instruments").get(),
      db.collection("settings").doc("instruments").get(),
    ]);

    const instruments = instrumentsSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    const default_instrument_id = settingsDoc.exists
      ? settingsDoc.data()?.default_instrument_id || null
      : null;

    return NextResponse.json({
      success: true,
      instruments,
      default_instrument_id,
    });
  } catch (error) {
    console.error("Error fetching instruments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch instruments", message: error.message },
      { status: 500 }
    );
  }
}
