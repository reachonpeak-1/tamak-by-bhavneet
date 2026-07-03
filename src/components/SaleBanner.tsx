import Link from "next/link";
import { CONTENT_DEFAULTS } from "@/lib/content-defaults";

type Banner = typeof CONTENT_DEFAULTS.announcements.banner;

export default function SaleBanner({ banner }: { banner?: Banner }) {
  if (!banner?.enabled || !banner.text) return null;
  return (
    <div className="sale-banner">
      {banner.href ? <Link href={banner.href}>{banner.text}</Link> : <span>{banner.text}</span>}
    </div>
  );
}
