import { NextResponse } from "next/server";
import { getAdminStorage } from "@/utils/firebaseAdmin";

const GRAINS_PREFIX = "grains/";
const GRAIN_EXT = /\.(mp4|mov|webm|png|jpg|jpeg|gif|webp)(\?|$)/i;
const SIGNED_URL_EXPIRY_DAYS = 7;

/** List grain files from Firebase Storage (prefix grains/) and return name + download URL for each. */
export async function GET() {
  try {
    const bucket = getAdminStorage().bucket();
    const [files] = await bucket.getFiles({ prefix: GRAINS_PREFIX });
    const items = [];
    const expiresMs = Date.now() + SIGNED_URL_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    for (const file of files) {
      if (!file.name || file.name === GRAINS_PREFIX) continue;
      const baseName = file.name.replace(GRAINS_PREFIX, "").replace(/^.*\//, "");
      if (!GRAIN_EXT.test(baseName)) continue;

      let url;
      try {
        const [meta] = await file.getMetadata().catch(() => [null]);
        const token = meta?.metadata?.firebaseStorageDownloadTokens;
        if (token) {
          url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${token}`;
        } else {
          const [signedUrl] = await file.getSignedUrl({
            version: "v4",
            action: "read",
            expires: expiresMs,
          });
          url = signedUrl;
        }
      } catch (e) {
        console.warn("[grains-list] Skip file (no URL):", file.name, e?.message);
        continue;
      }
      items.push({ name: baseName, url });
    }

    items.sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ files: items });
  } catch (err) {
    console.error("[grains-list]", err);
    return NextResponse.json(
      { error: "Failed to list grains from storage", message: err?.message },
      { status: 500 }
    );
  }
}
