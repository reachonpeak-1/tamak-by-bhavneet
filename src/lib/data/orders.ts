import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/data/order-status";

export { ORDER_STATUSES };
export type { OrderStatus };

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

export interface Order {
  id: string;
  status: OrderStatus | string;
  method?: string; // "cod" | undefined (razorpay)
  amount: number; // paise
  subtotal: number; // rupees
  shipping?: number; // rupees
  tax?: number; // rupees
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
  /** Internal admin-only note — never shown to the customer. */
  notes?: string;
  /** Product ids whose stock decrement failed after a captured payment. */
  needsRestock?: string[];
  statusHistory?: { status: string; at: string; by?: string }[];
}

// Orders are read fresh (not cached) — the admin needs live data.
export async function getOrders(opts: { limit?: number } = {}): Promise<Order[]> {
  const { data, error } = await supabaseAdmin()
    .from("orders")
    .select("id,data")
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 500);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ ...(r.data as Omit<Order, "id">), id: r.id }));
}

export async function getOrder(id: string): Promise<Order | null> {
  const { data, error } = await supabaseAdmin()
    .from("orders")
    .select("id,data")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? { ...(data.data as Omit<Order, "id">), id: data.id } : null;
}

/** Statuses that count as realised revenue (not cancelled/refunded). */
export const REVENUE_STATUSES = new Set(["paid", "confirmed", "packed", "shipped", "delivered"]);
export const isPaid = (o: Order) =>
  o.method !== "cod" ? true : ["confirmed", "packed", "shipped", "delivered"].includes(o.status) || !!o.paidAt;
