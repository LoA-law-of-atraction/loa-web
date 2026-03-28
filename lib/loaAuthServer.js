import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/utils/firebaseAdmin";

/**
 * @param {Request} request
 * @returns {Promise<{ uid: string } | null>}
 */
export async function getUidFromAuthHeader(request) {
  const authHeader = request.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const idToken = match ? match[1].trim() : "";
  if (!idToken) return null;
  try {
    const authAdmin = getAuth(getAdminApp());
    const decoded = await authAdmin.verifyIdToken(idToken);
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}
