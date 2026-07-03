import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

// Returns the signed-in user's orders. Auth via Firebase ID token in the
// Authorization: Bearer <token> header.
export async function GET(req: Request) {
  const authz = req.headers.get("authorization") || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : "";
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const decoded = await adminAuth().verifyIdToken(token);
    const snap = await adminDb()
      .collection("orders")
      .where("userId", "==", decoded.uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ orders });
  } catch (e) {
    console.error("me/orders error", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
