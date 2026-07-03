// Grant the `admin` custom claim to a user (so they can use /admin).
//
// Usage:  node scripts/set-admin.mjs you@email.com
//   or:   node scripts/set-admin.mjs <uid>
//
// Env: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: node scripts/set-admin.mjs <email|uid>");
  process.exit(1);
}

const { FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY } = process.env;
if (!FIREBASE_ADMIN_PROJECT_ID || !FIREBASE_ADMIN_CLIENT_EMAIL || !FIREBASE_ADMIN_PRIVATE_KEY) {
  console.error("Missing FIREBASE_ADMIN_* env vars.");
  process.exit(1);
}

initializeApp({
  credential: cert({
    projectId: FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const auth = getAuth();
const user = arg.includes("@") ? await auth.getUserByEmail(arg) : await auth.getUser(arg);
await auth.setCustomUserClaims(user.uid, { admin: true });
console.log(`✓ ${user.email || user.uid} is now an admin. They must sign out & back in for it to take effect.`);
