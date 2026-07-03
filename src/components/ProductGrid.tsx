import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  gridCols?: number;
}

export default function ProductGrid({ products, gridCols = 3 }: ProductGridProps) {
  return (
    <div className={`grid-prods cols-${gridCols} stagger`}>
      {products.map((p, i) => (
        <ProductCard key={p.id} p={p} priority={i < 4} />
      ))}
    </div>
  );
}
