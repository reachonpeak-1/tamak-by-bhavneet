import "server-only";
import { adminAuth } from "./admin";

// Verifies a Firebase ID token from the Authorization header and requires the
// `admin` custom claim. Returns the decoded token, or null if not authorized.
export async function requireAdmin(req: Request) {
  const authz = req.headers.get("authorization") || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : "";
  if (!token) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    if (decoded.admin !== true) return null;
    return decoded;
  } catch {
    return null;
  }
}
