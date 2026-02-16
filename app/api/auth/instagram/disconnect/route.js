import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

const LOG = (o) => console.log("[Instagram]", JSON.stringify(o));
const INTEGRATIONS_DOC = "instagram";

/**
 * DELETE /api/auth/instagram/disconnect
 * Removes the stored Instagram OAuth token (Firestore integrations/instagram).
 * Use when you get "Invalid OAuth access token" – then reconnect via "Connect Instagram".
 */
export async function DELETE() {
  try {
    LOG({ step: "disconnect", action: "start" });
    const db = getAdminDb();
    const ref = db.collection("integrations").doc(INTEGRATIONS_DOC);
    const snap = await ref.get();
    LOG({ step: "disconnect", doc_existed: snap.exists });
    await ref.delete();
    LOG({ step: "disconnect", outcome: "success" });
    return NextResponse.json({ success: true, message: "Instagram disconnected." });
  } catch (error) {
    LOG({ step: "disconnect", outcome: "error", error: error.message });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
