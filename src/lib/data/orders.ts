import "server-only";
import { adminDb } from "@/lib/firebase/admin";

export interface OrderLine {
  id: string;
  name: string;
  size?: string;
  color?: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderCustomer {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  pincode?: string;
}

export type OrderStatus =
  | "cod_pending"
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "paid";

export interface Order {
  id: string;
  status: OrderStatus | string;
  method?: string; // "cod" | undefined (razorpay)
  amount: number; // paise
  subtotal: number; // rupees
  currency: string;
  lines: OrderLine[];
  customer?: OrderCustomer | null;
  userId?: string | null;
  createdAt: string; // ISO
  paymentId?: string;
  orderId?: string;
  tracking?: string;
  paidAt?: string;
  coupon?: string;
  discount?: number;
  statusHistory?: { status: string; at: string; by?: string }[];
}

// Orders are read fresh (not cached) — the admin needs live data.
export async function getOrders(opts: { limit?: number } = {}): Promise<Order[]> {
  const snap = await adminDb()
    .collection("orders")
    .orderBy("createdAt", "desc")
    .limit(opts.limit ?? 500)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) }));
}

export async function getOrder(id: string): Promise<Order | null> {
  const doc = await adminDb().collection("orders").doc(id).get();
  return doc.exists ? ({ id: doc.id, ...(doc.data() as Omit<Order, "id">) }) : null;
}

/** Statuses that count as realised revenue (not cancelled/refunded). */
export const REVENUE_STATUSES = new Set(["paid", "confirmed", "packed", "shipped", "delivered"]);
export const isPaid = (o: Order) =>
  o.method !== "cod" ? true : ["confirmed", "packed", "shipped", "delivered"].includes(o.status) || !!o.paidAt;
