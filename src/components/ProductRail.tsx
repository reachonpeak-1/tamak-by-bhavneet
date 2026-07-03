import type { Product } from "@/lib/types";
import Rail from "./Rail";
import ProductCard from "./ProductCard";

interface Props {
  id?: string;
  eyebrow: string;
  title: string;
  desc?: string;
  padTop0?: boolean;
  products: Product[];
}

export default function ProductRail({ products, ...rail }: Props) {
  return (
    <Rail {...rail}>
      {products.map((p) => (
        <ProductCard key={p.id} p={p} />
      ))}
    </Rail>
  );
}
