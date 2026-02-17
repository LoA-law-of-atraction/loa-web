/**
 * Copy selected Firestore collections from loa-dev to loa-prod.
 * Usage: node scripts/copy-firestore-dev-to-prod.js
 *
 * Loads dev credentials from .env and prod credentials from .env.prod.
 * Requires: npm install dotenv firebase-admin (firebase-admin is in the app deps)
 *
 * Edit COLLECTIONS below to choose which top-level collections to copy.
 * Subcollections (e.g. projects/{id}/scenes) are NOT copied; use gcloud export/import for full clone.
 */

const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const COLLECTIONS = [
  // DO NOT copy "integrations" – Instagram tokens are app-specific. Prod must connect via OAuth.
  "video_sessions",
  "projects",
  "characters",
  "voiceovers",
  "music",
  "locations",
  "topics",
  "topic_categories",
  "music_themes",
  "instruments",
  "settings",
  "actions",
  "camera_movements",
  "character_motions",
];

function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const out = {};
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) {
      const key = m[1].trim();
      let val = m[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1).replace(/\\n/g, "\n");
      else if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      out[key] = val;
    }
  }
  return out;
}

async function main() {
  const admin = require("firebase-admin");

  const envPath = path.join(__dirname, "..", ".env");
  const envProdPath = path.join(__dirname, "..", ".env.prod");

  const env = parseEnvFile(envPath);
  const envProd = parseEnvFile(envProdPath);

  const devProjectId = env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const prodProjectId = envProd.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROD_PROJECT_ID;

  if (!devProjectId || !prodProjectId) {
    console.error("Missing FIREBASE_PROJECT_ID in .env or FIREBASE_PROJECT_ID in .env.prod");
    process.exit(1);
  }

  const devKey = {
    projectId: devProjectId,
    clientEmail: env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  };
  const prodKey = {
    projectId: prodProjectId,
    clientEmail: envProd.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_PROD_CLIENT_EMAIL,
    privateKey: (envProd.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PROD_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  };

  if (!devKey.clientEmail || !devKey.privateKey || !prodKey.clientEmail || !prodKey.privateKey) {
    console.error("Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY in .env or .env.prod");
    process.exit(1);
  }

  const devApp = admin.initializeApp(
    { credential: admin.credential.cert(devKey) },
    "dev"
  );
  const prodApp = admin.initializeApp(
    { credential: admin.credential.cert(prodKey) },
    "prod"
  );

  const devDb = devApp.firestore();
  const prodDb = prodApp.firestore();

  console.log(`Copying from ${devProjectId} → ${prodProjectId}`);
  console.log("Collections:", COLLECTIONS.join(", "));

  const BATCH_SIZE = 500;

  for (const collName of COLLECTIONS) {
    const snap = await devDb.collection(collName).get();
    if (snap.empty) {
      console.log(`  [${collName}] (empty, skip)`);
      continue;
    }
    const docs = snap.docs;
    let total = 0;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = prodDb.batch();
      const chunk = docs.slice(i, i + BATCH_SIZE);
      chunk.forEach((doc) => {
        const ref = prodDb.collection(collName).doc(doc.id);
        batch.set(ref, doc.data(), { merge: true });
      });
      await batch.commit();
      total += chunk.length;
    }
    console.log(`  [${collName}] ${total} docs`);
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
