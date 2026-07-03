// Firebase Admin SDK (server only). Used by API routes for trusted writes:
// creating orders, verifying payments, decrementing stock, admin checks.
import "server-only";
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

let adminApp: App | null = null;
let firestore: Firestore | null = null;

function getAdminApp(): App {
  const { FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY } = process.env;
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!FIREBASE_ADMIN_PROJECT_ID || !FIREBASE_ADMIN_CLIENT_EMAIL || !FIREBASE_ADMIN_PRIVATE_KEY) {
    throw new Error("Firebase Admin not configured — set FIREBASE_ADMIN_* env vars.");
  }
  if (!adminApp) {
    adminApp = getApps().length
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId: FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
          }),
          storageBucket,
        });
  }
  return adminApp;
}

export const adminDb = () => {
  if (!firestore) {
    firestore = getFirestore(getAdminApp());
    // Cart lines carry optional size/color that are `undefined` when unset; Firestore
    // rejects undefined values, so skip them instead of failing the whole order write.
    // Guarded: settings() can only run before the instance is first used (e.g. across
    // dev HMR the underlying instance may already exist) — ignore if already set.
    try {
      firestore.settings({ ignoreUndefinedProperties: true });
    } catch {}
  }
  return firestore;
};
export const adminAuth = () => getAuth(getAdminApp());
export const adminStorage = () => getStorage(getAdminApp());
