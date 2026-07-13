// Server-side authoritative pricing. NEVER trust prices from the client —
// recompute from the Supabase catalog and settings on every order/verify.
import "server-only";
import { getAllProducts } from "@/lib/data/products";
import { getSettings } from "@/lib/data/settings";

export interface CartItemInput {
  id: string;
  size?: string;
  color?: string;
  qty: number;
}

export interface PricedLine {
  id: string;
  name: string;
  size?: string;
  color?: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PricedCart {
  lines: PricedLine[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  amountPaise: number;
}

export async function priceCart(items: CartItemInput[]): Promise<PricedCart> {
  if (!Array.isArray(items) || items.length === 0) throw new Error("Empty cart");
  if (items.length > 100) throw new Error("Too many items");
  const priceMap = new Map((await getAllProducts()).map((p) => [p.id, p]));
  const lines: PricedLine[] = [];
  for (const it of items) {
    const p = priceMap.get(it.id);
    if (!p) throw new Error(`Unknown product: ${it.id}`);
    if (p.active === false) throw new Error(`${p.name} is no longer available`);
    const qty = Math.max(1, Math.min(20, Math.floor(Number(it.qty) || 1)));
    // Stock check — prefer the selected variant's stock, else the product total.
    const variant = it.color ? p.variants?.find((v) => v.name === it.color || v.hex === it.color) : undefined;
    const available = variant ? variant.stock : p.stock;
    if (typeof available === "number" && qty > available) {
      throw new Error(available <= 0 ? `${p.name} is out of stock` : `${p.name} — only ${available} left`);
    }
    // Omit size/color when unset — Firestore rejects `undefined` field values.
    lines.push({
      id: p.id,
      name: p.name,
      qty,
      unitPrice: p.price,
      lineTotal: p.price * qty,
      ...(it.size !== undefined ? { size: it.size } : {}),
      ...(it.color !== undefined ? { color: it.color } : {}),
    });
  }
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);

  const settings = await getSettings();

  const shipping = subtotal >= (settings.freeShipThreshold || 0) ? 0 : settings.flatShipping || 0;
  const tax = settings.taxPercent ? Math.round((subtotal * settings.taxPercent) / 100) : 0;
  const total = subtotal + shipping + tax;

  return { lines, subtotal, shipping, tax, total, amountPaise: total * 100 };
}
