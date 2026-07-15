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

export const ORDER_STATUSES: OrderStatus[] = [
  "cod_pending",
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
  "paid",
];
