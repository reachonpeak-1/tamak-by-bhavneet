import { getAllProducts } from "@/lib/data/products";
import { listCampaigns } from "@/lib/data/campaigns";
import { countSubscribers } from "@/lib/data/subscribers";
import NewsletterComposer from "@/components/admin/NewsletterComposer";

export const dynamic = "force-dynamic";

export default async function NewsletterPage() {
  const [products, campaigns, counts] = await Promise.all([
    getAllProducts(),
    listCampaigns(),
    countSubscribers(),
  ]);
  const slim = products.map((p) => ({ id: p.id, name: p.name, image: p.image ?? null, price: p.price, tag: p.tag ?? null }));

  return (
    <>
      <div className="adm-list-head">
        <div>
          <span className="adm-eyebrow">Marketing</span>
          <h1 className="adm-h">Newsletter</h1>
          <p className="adm-sub">Compose and send broadcast emails to your {counts.active} active subscribers.</p>
        </div>
      </div>
      <NewsletterComposer products={slim} campaigns={campaigns} counts={counts} />
    </>
  );
}
