import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/firebase/requireAdmin";
import { adminDb } from "@/lib/firebase/admin";
import { logAudit } from "@/lib/audit";
import { bumpContent } from "@/lib/revalidate";
import { CONTENT_DEFAULTS, type ContentSection } from "@/lib/content-defaults";

export const runtime = "nodejs";

const isSection = (s: string): s is ContentSection => s in CONTENT_DEFAULTS;

// GET → current content (with defaults merged). PUT → replace the section doc.
export async function GET(req: Request, { params }: { params: Promise<{ section: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { section } = await params;
  if (!isSection(section)) return NextResponse.json({ error: "Unknown section" }, { status: 404 });
  const doc = await adminDb().collection("content").doc(section).get();
  return NextResponse.json({ data: { ...CONTENT_DEFAULTS[section], ...(doc.exists ? doc.data() : {}) } });
}

export async function PUT(req: Request, { params }: { params: Promise<{ section: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { section } = await params;
  if (!isSection(section)) return NextResponse.json({ error: "Unknown section" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const ref = adminDb().collection("content").doc(section);
    const before = (await ref.get()).data() ?? null;
    await ref.set({ ...body, updatedAt: new Date().toISOString() });
    await logAudit({ actor: admin.email ?? admin.uid, action: "content.save", target: { collection: "content", id: section }, before, after: body });
    bumpContent(section);
    revalidatePath("/", "layout"); // footer/nav/announcements live in the layout
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("content save error", e);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
