/**
 * Upload grain files from public/grains to Firebase Storage (bucket path grains/).
 * Usage:
 *   node scripts/upload-grains-to-storage.js         # dev (uses .env)
 *   node scripts/upload-grains-to-storage.js --prod  # prod (uses .env.prod)
 *
 * Requires: .env (or .env.prod for --prod) with Firebase Admin credentials and
 * NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET. Run from project root.
 * Creates stable download URLs via firebaseStorageDownloadTokens.
 */

const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const isProd = process.argv.includes("--prod");
const rootDir = path.join(__dirname, "..");
const envPath = path.join(rootDir, isProd ? ".env.prod" : ".env");

if (isProd && !fs.existsSync(envPath)) {
  console.error(".env.prod not found. Create it with prod Firebase credentials.");
  process.exit(1);
}
require("dotenv").config({ path: envPath });
if (isProd) console.log("Using .env.prod (production).");

const GRAIN_EXT = /\.(mp4|mov|webm|png|jpg|jpeg|gif|webp)$/i;

async function main() {
  const publicGrains = path.join(rootDir, "public", "grains");
  if (!fs.existsSync(publicGrains)) {
    console.log("public/grains not found. Create it and add grain files, then run again.");
    process.exit(1);
  }

  const { initializeApp, cert, getApps } = require("firebase-admin/app");
  const { getStorage } = require("firebase-admin/storage");

  if (getApps().length === 0) {
    const bucketId = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const hasIndividual =
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY;
    let useServiceAccount = false;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        if (serviceAccount.project_id && serviceAccount.client_email && serviceAccount.private_key) {
          useServiceAccount = true;
          initializeApp({
            credential: cert(serviceAccount),
            storageBucket: bucketId,
          });
        }
      } catch (_) {
        // JSON often broken when key is multi-line in .env; use individual vars if present
      }
    }
    if (!useServiceAccount) {
      if (hasIndividual) {
        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          }),
          storageBucket: bucketId,
        });
      } else {
        console.error(
          "Missing Firebase Admin credentials. In .env.prod use either:\n" +
            "  FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY (one line each),\n" +
            "  or FIREBASE_SERVICE_ACCOUNT_KEY as a single-line JSON string (no line breaks)."
        );
        process.exit(1);
      }
    }
  }

  const bucket = getStorage().bucket();
  const bucketName = bucket.name;
  if (isProd) console.log(`Uploading to prod bucket: ${bucketName}`);
  const entries = fs.readdirSync(publicGrains, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile() && GRAIN_EXT.test(e.name));

  if (files.length === 0) {
    console.log("No grain files (mp4, mov, webm, png, jpg, etc.) in public/grains.");
    process.exit(0);
  }

  const mime = (name) => {
    if (/\.(mp4|mov|webm)$/i.test(name)) return "video/mp4";
    if (/\.(png|webp)$/i.test(name)) return "image/png";
    if (/\.(jpg|jpeg)$/i.test(name)) return "image/jpeg";
    if (/\.gif$/i.test(name)) return "image/gif";
    return "application/octet-stream";
  };

  for (const e of files) {
    const localPath = path.join(publicGrains, e.name);
    const storagePath = `grains/${e.name}`;
    const token = uuidv4();
    const file = bucket.file(storagePath);
    await file.save(fs.readFileSync(localPath), {
      metadata: {
        contentType: mime(e.name),
        metadata: {
          firebaseStorageDownloadTokens: token,
        },
      },
    });
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
    console.log(`Uploaded grains/${e.name} -> ${url}`);
  }

  console.log(`Done. ${files.length} file(s) in Storage under grains/. You can remove public/grains if you no longer need local copies.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
