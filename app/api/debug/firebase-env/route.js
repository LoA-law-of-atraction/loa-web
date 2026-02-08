import { NextResponse } from "next/server";

/**
 * Returns safe Firebase env info for debugging.
 * Only exposes project IDs and config presence – NO secrets.
 */
export async function GET() {
  let adminProjectId = null;
  if (process.env.FIREBASE_PROJECT_ID) {
    adminProjectId = process.env.FIREBASE_PROJECT_ID;
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      adminProjectId = sa.project_id || "(from service account)";
    } catch {
      adminProjectId = "(parse error)";
    }
  }

  return NextResponse.json({
    client: {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "(not set)",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "set" : "not set",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? "set" : "not set",
    },
    admin: {
      projectId: adminProjectId || "(not set)",
      configured: !!(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
        (process.env.FIREBASE_PROJECT_ID &&
          process.env.FIREBASE_CLIENT_EMAIL &&
          process.env.FIREBASE_PRIVATE_KEY)
      ),
    },
    match: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === adminProjectId,
  });
}
