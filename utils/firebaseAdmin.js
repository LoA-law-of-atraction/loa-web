import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

let adminApp = null;
let adminDb = null;
let adminStorage = null;

/**
 * Initialize Firebase Admin SDK (lazy initialization)
 *
 * For Vercel deployment, set FIREBASE_SERVICE_ACCOUNT_KEY environment variable
 * with the JSON content of your service account key (as a string)
 */
function getAdminApp() {
  if (adminApp) {
    return adminApp;
  }

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  // Option 1: Using service account JSON from environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      );
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      return adminApp;
    } catch (error) {
      console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", error);
    }
  }

  // Option 2: Using individual environment variables
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace escaped newlines in the private key
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    return adminApp;
  }

  throw new Error(
    "Firebase Admin SDK requires either FIREBASE_SERVICE_ACCOUNT_KEY or " +
      "FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables",
  );
}

/**
 * Get Firestore instance (lazy initialization)
 */
function getAdminDb() {
  if (adminDb) {
    return adminDb;
  }
  adminDb = getFirestore(getAdminApp());
  return adminDb;
}

/**
 * Get Storage instance (lazy initialization)
 */
function getAdminStorage() {
  if (adminStorage) {
    return adminStorage;
  }
  adminStorage = getStorage(getAdminApp());
  return adminStorage;
}

export { getAdminApp, getAdminDb, getAdminStorage };
