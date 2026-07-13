export type Motif = "paisley" | "mandala";
export type Panel = "p-maroon" | "p-teal" | "p-mustard" | "p-plum" | "p-indigo" | "p-terra";
export type Tone = "m-gold" | "m-cream";

export interface GalleryImage {
  /** Storage object path, e.g. "products/PROD_1/1.jpg" */
  path: string;
  blurDataURL: string;
  /** full delivery URL, computed at runtime from the storage bucket */
  url?: string;
  /** Optimized WebP variants — generated at upload time by Sharp */
  thumbUrl?: string;   // 150px wide
  mediumUrl?: string;  // 600px wide
  fullUrl?: string;    // 1200px wide
  /** Original image dimensions — stored at upload time for correct <Image> width/height */
  originalWidth?: number | null;
  originalHeight?: number | null;
  /** File metadata stored in mediaLibrary */
  fileSizeBytes?: number;
  originalFileName?: string;
  uploadedAt?: string | null;
  uploadedBy?: string;
}

/** A purchasable colour variant: its own stock and (optionally) its own images. */
export interface Variant {
  name: string;
  /** hex colour for the swatch, e.g. "#800000" */
  hex: string;
  stock: number;
  gallery: GalleryImage[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  /** fabric / short descriptor line, e.g. "Cotton · Floral embroidery" */
  fabric: string;
  price: number;
  oldPrice?: number;
  tag?: string;
  category: string;
  subcategory: string;
  color: string;
  gender: string;
  description: string;
  keywords: string;
  sizes: string[];
  stock: number;
  rating: number;
  reviews: number;
  swatches: string[];
  panel: Panel;
  motif: Motif;
  tone: Tone;
  /** primary image */
  imagePath?: string;
  blurDataURL?: string;
  /** resolved primary image URL (undefined until images are uploaded) */
  image?: string;
  gallery: GalleryImage[];
  /** colour variants; empty for single-colour products (legacy `color`/`swatches`). */
  variants: Variant[];
  /** Whether this product is visible to customers on the storefront; defaults to true */
  active?: boolean;
}

export interface CartLine {
  id: string;
  name: string;
  price: number;
  qty: number;
  size?: string;
  /** selected colour variant name, if the product has variants */
  color?: string;
  image?: string;
}
