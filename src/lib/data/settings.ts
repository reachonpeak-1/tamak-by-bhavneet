import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";

export interface Settings {
  storeName: string;
  email: string;
  phone: string;
  whatsapp: string;
  razorpayMode: "test" | "live";
  freeShipThreshold: number; // cart ≥ this → free shipping (0 = always free)
  flatShipping: number; // charged when under threshold
  taxPercent: number; // 0 = inclusive/none
  returnsText: string;
}

// Defaults preserve current behaviour (free shipping, no tax, COD on).
export const SETTINGS_DEFAULTS: Settings = {
  storeName: "तमक by Bhavneet",
  email: "care@tamak.in",
  phone: "+91 95013 70920",
  whatsapp: "",
  razorpayMode: "test",
  freeShipThreshold: 0,
  flatShipping: 0,
  taxPercent: 0,
  returnsText: "Easy 7-day returns on unworn, unwashed items with tags intact.",
};

const fetcher = unstable_cache(
  async (): Promise<Settings> => {
    try {
      const doc = await adminDb().collection("settings").doc("store").get();
      if (doc.exists) return { ...SETTINGS_DEFAULTS, ...(doc.data() as Partial<Settings>) };
    } catch (e) {
      console.error("[settings] read failed, using defaults:", (e as Error).message);
    }
    return SETTINGS_DEFAULTS;
  },
  ["settings:store"],
  { tags: ["settings"], revalidate: 3600 }
);

export const getSettings = cache((): Promise<Settings> => fetcher());
