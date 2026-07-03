import type { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/data/products";
import { listCategories } from "@/lib/data/categories";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tamak.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [allProducts, categories] = await Promise.all([getAllProducts(), listCategories()]);
  const staticRoutes = [
    "", "/shop", "/wishlist", "/account",
    "/about", "/contact", "/size-guide", "/shipping", "/returns", "/privacy", "/terms",
  ].map((p) => ({
    url: `${SITE}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  const cats = categories.map((c) => ({
    url: `${SITE}/shop?cat=${encodeURIComponent(c.name)}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));
  const products = allProducts.map((p) => ({
    url: `${SITE}/product/${p.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  return [...staticRoutes, ...cats, ...products];
}
