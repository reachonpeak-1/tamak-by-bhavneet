import { NextResponse } from "next/server";
import { Readable } from "stream";
import ExcelJS from "exceljs";
import { requireAdmin } from "@/lib/firebase/requireAdmin";
import { adminDb } from "@/lib/firebase/admin";
import { COLUMNS, rowToDraft } from "@/lib/admin/product-sheet";
import { str } from "@/lib/admin/product-input";
import { logAudit } from "@/lib/audit";
import { bumpProducts } from "@/lib/revalidate";

export const runtime = "nodejs";

const MAX_ROWS = 5000;

// Normalise a header cell to a column key: strip a trailing "(...)" note,
// lowercase, and collapse spaces to underscores. "sizes (comma-separated)" → "sizes".
const normHeader = (s: string) =>
  s.split("(")[0].trim().toLowerCase().replace(/\s+/g, "_");

// header text (or column key) → canonical column key
const KEY_BY_HEADER = new Map<string, string>();
for (const c of COLUMNS) {
  KEY_BY_HEADER.set(normHeader(c.header), c.key);
  KEY_BY_HEADER.set(c.key, c.key);
}

type RowResult = { row: number; id: string; action: "updated" | "created" | "error"; message?: string };

// POST multipart { file } (.xlsx or .csv) → upsert products by id.
// Existing rows are merge-updated (photos preserved); blank-id rows create new
// products. Rows whose id doesn't exist are reported as errors, never created.
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form-data" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });

  const name = file.name.toLowerCase();
  const isCsv = name.endsWith(".csv");
  const isXlsx = name.endsWith(".xlsx");
  if (!isCsv && !isXlsx) {
    return NextResponse.json({ error: "Upload a .xlsx or .csv file" }, { status: 400 });
  }

  // ── Parse the spreadsheet ────────────────────────────────────────────────
  let ws: ExcelJS.Worksheet | undefined;
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const wb = new ExcelJS.Workbook();
    if (isCsv) {
      ws = await wb.csv.read(Readable.from(buf));
    } else {
      // exceljs types its own Buffer; cast to satisfy the Node Buffer mismatch.
      await wb.xlsx.load(buf as unknown as Parameters<typeof wb.xlsx.load>[0]);
      ws = wb.worksheets[0];
    }
  } catch {
    return NextResponse.json({ error: "Could not read the file — is it a valid spreadsheet?" }, { status: 400 });
  }
  if (!ws || ws.rowCount < 2) {
    return NextResponse.json({ error: "The sheet has no data rows" }, { status: 400 });
  }

  // Map sheet column index → canonical key using the header row.
  const colKey: Record<number, string> = {};
  ws.getRow(1).eachCell((cell, colNumber) => {
    const key = KEY_BY_HEADER.get(normHeader(String(cell.text ?? cell.value ?? "")));
    if (key) colKey[colNumber] = key;
  });
  if (!Object.values(colKey).includes("id")) {
    return NextResponse.json({ error: "Missing an 'id' column — export the catalog first, then edit that file." }, { status: 400 });
  }

  // Collect non-empty data rows.
  const parsed: { row: number; rec: Record<string, unknown> }[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1 || parsed.length >= MAX_ROWS) return;
    const rec: Record<string, unknown> = {};
    let any = false;
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const key = colKey[colNumber];
      if (!key) return;
      const v = cell.text ?? cell.value ?? "";
      rec[key] = v;
      if (String(v).trim()) any = true;
    });
    if (any) parsed.push({ row: rowNumber, rec });
  });
  if (!parsed.length) return NextResponse.json({ error: "No data rows found" }, { status: 400 });

  // ── Existing product ids + highest numeric suffix (single read) ──────────
  const snap = await adminDb().collection("products").get();
  const existing = new Set(snap.docs.map((d) => d.id));
  let maxNum = snap.docs.reduce((m, d) => Math.max(m, Number(d.id.replace(/\D/g, "")) || 0), 0);

  // ── Plan writes ──────────────────────────────────────────────────────────
  const now = new Date().toISOString();
  const writes: { id: string; data: Record<string, unknown>; merge: boolean }[] = [];
  const results: RowResult[] = [];

  for (const { row, rec } of parsed) {
    const id = str(rec.id);
    const draft = rowToDraft(rec);

    if (id) {
      if (existing.has(id)) {
        writes.push({ id, data: { ...draft, updatedAt: now }, merge: true });
        results.push({ row, id, action: "updated" });
      } else {
        results.push({ row, id, action: "error", message: `id "${id}" not found — nothing updated` });
      }
    } else if (draft.name) {
      const newId = `PROD_${++maxNum}`;
      writes.push({
        id: newId,
        data: { id: newId, ...draft, gallery: [], variants: [], imagePath: null, blurDataURL: "", createdAt: now, updatedAt: now },
        merge: false,
      });
      results.push({ row, id: newId, action: "created" });
    } else {
      results.push({ row, id: "", action: "error", message: "blank id and no name — row skipped" });
    }
  }

  // ── Commit in batches (Firestore limit 500/commit) ───────────────────────
  try {
    for (let i = 0; i < writes.length; i += 400) {
      const batch = adminDb().batch();
      for (const w of writes.slice(i, i + 400)) {
        const ref = adminDb().collection("products").doc(w.id);
        batch.set(ref, w.data, { merge: w.merge });
      }
      await batch.commit();
    }
  } catch (e) {
    console.error("product import error", e);
    return NextResponse.json({ error: "Import failed while saving" }, { status: 500 });
  }

  const updated = results.filter((r) => r.action === "updated").length;
  const created = results.filter((r) => r.action === "created").length;
  const errors = results.filter((r) => r.action === "error").length;

  await logAudit({
    actor: admin.email ?? admin.uid,
    action: "product.import",
    target: { collection: "products", id: `import:${file.name}` },
    after: { updated, created, errors },
  });
  if (updated || created) bumpProducts();

  return NextResponse.json({ ok: true, updated, created, errors, rows: results });
}
