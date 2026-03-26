import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp, getAdminDb, getAdminStorage } from "@/utils/firebaseAdmin";

export const runtime = "nodejs";

async function deleteStoragePrefix(prefix) {
  const bucket = getAdminStorage().bucket();
  const [files] = await bucket.getFiles({ prefix });
  if (!files.length) return;
  await Promise.allSettled(files.map((file) => file.delete()));
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const idToken = typeof body.idToken === "string" ? body.idToken : "";
    const confirmation = typeof body.confirmation === "string" ? body.confirmation : "";

    if (!idToken) {
      return NextResponse.json({ error: "Missing auth token." }, { status: 401 });
    }

    if (confirmation !== "DELETE") {
      return NextResponse.json(
        { error: "Confirmation text mismatch. Type DELETE to continue." },
        { status: 400 },
      );
    }

    const authAdmin = getAuth(getAdminApp());
    const decoded = await authAdmin.verifyIdToken(idToken);
    const uid = decoded.uid;

    const adminDb = getAdminDb();
    await adminDb.recursiveDelete(adminDb.doc(`users/${uid}`));
    await deleteStoragePrefix(`users/${uid}/`);
    await authAdmin.deleteUser(uid);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[account-delete] Failed deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account. Please try again." },
      { status: 500 },
    );
  }
}
