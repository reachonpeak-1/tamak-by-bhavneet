"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CartLine } from "@/lib/types";

interface StoreCtx {
  cart: CartLine[];
  bagCount: number;
  wishlist: string[];
  savedCount: number;
  addToBag: (line: Omit<CartLine, "qty"> & { qty?: number }) => void;
  removeFromBag: (id: string, size?: string, color?: string) => void;
  setQty: (id: string, size: string | undefined, qty: number, color?: string) => void;
  clearCart: () => void;
  toggleWish: (id: string) => void;
  isWished: (id: string) => boolean;
  toast: (msg: string) => void;
  toastMsg: string | null;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
}

const Ctx = createContext<StoreCtx | null>(null);
const CART_KEY = "tamak.cart";
const WISH_KEY = "tamak.wish";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // hydrate from localStorage (client-only; cannot run during SSR)
  useEffect(() => {
    try {
      const c = localStorage.getItem(CART_KEY);
      const w = localStorage.getItem(WISH_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (c) setCart(JSON.parse(c));
      if (w) setWishlist(JSON.parse(w));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart]);
  useEffect(() => {
    try {
      localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 1900);
  }, []);

  const addToBag: StoreCtx["addToBag"] = useCallback(
    (line) => {
      setCart((prev) => {
        const i = prev.findIndex((l) => l.id === line.id && l.size === line.size && l.color === line.color);
        if (i >= 0) {
          const next = [...prev];
          next[i] = { ...next[i], qty: next[i].qty + (line.qty ?? 1) };
          return next;
        }
        return [...prev, { ...line, qty: line.qty ?? 1 }];
      });
    },
    []
  );

  const removeFromBag = useCallback((id: string, size?: string, color?: string) => {
    setCart((prev) => prev.filter((l) => !(l.id === id && l.size === size && l.color === color)));
  }, []);

  const setQty = useCallback((id: string, size: string | undefined, qty: number, color?: string) => {
    setCart((prev) =>
      prev
        .map((l) => (l.id === id && l.size === size && l.color === color ? { ...l, qty: Math.max(0, qty) } : l))
        .filter((l) => l.qty > 0)
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWish = useCallback((id: string) => {
    setWishlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const isWished = useCallback((id: string) => wishlist.includes(id), [wishlist]);

  const value = useMemo<StoreCtx>(
    () => ({
      cart,
      bagCount: cart.reduce((n, l) => n + l.qty, 0),
      wishlist,
      savedCount: wishlist.length,
      addToBag,
      removeFromBag,
      setQty,
      clearCart,
      toggleWish,
      isWished,
      toast,
      toastMsg,
      menuOpen,
      setMenuOpen,
    }),
    [cart, wishlist, addToBag, removeFromBag, setQty, clearCart, toggleWish, isWished, toast, toastMsg, menuOpen]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore must be used within StoreProvider");
  return c;
}
